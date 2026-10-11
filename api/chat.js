// Azure Functions v4 - AI chat powered by Anthropic Claude
const { app } = require('@azure/functions');
const Anthropic = require('@anthropic-ai/sdk');

// Only these origins may read the response (browsers still send the request either way,
// but without a matching Access-Control-Allow-Origin the page can't read the reply).
const ALLOWED_ORIGINS = [
    'https://happy-tree-026e2110f.7.azurestaticapps.net',
    'http://localhost:3000',
    'http://localhost:4280'
];

const MAX_MESSAGE_LENGTH = 1000;

// Best-effort per-instance sliding-window limiter (resets on cold start / across instances,
// but still blocks simple scripted abuse from burning through API credits).
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestLog = new Map();

function isRateLimited(clientId) {
    const now = Date.now();
    const timestamps = (requestLog.get(clientId) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    timestamps.push(now);
    requestLog.set(clientId, timestamps);
    return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

function buildCorsHeaders(request) {
    const origin = request.headers.get('origin');
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Vary': 'Origin'
    };
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }
    return headers;
}

app.http('chat', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const corsHeaders = buildCorsHeaders(request);

        if (request.method === 'OPTIONS') {
            return { status: 200, headers: corsHeaders };
        }

        const clientId = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
        if (isRateLimited(clientId)) {
            return { status: 429, jsonBody: { error: 'Too many requests. Please wait a minute and try again.' }, headers: corsHeaders };
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            context.error('ANTHROPIC_API_KEY environment variable is not set');
            return { status: 500, jsonBody: { error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to your Azure SWA application settings.' }, headers: corsHeaders };
        }

        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        try {
            const { message, context: chatContext, conversationHistory = [], portfolioData = {} } = await request.json();

        if (!message) {
            return { status: 400, jsonBody: { error: 'Message is required' }, headers: corsHeaders };
        }

        if (message.length > MAX_MESSAGE_LENGTH) {
            return { status: 400, jsonBody: { error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.` }, headers: corsHeaders };
        }

        // Build enhanced system context
        let systemContext = chatContext || buildDefaultContext(portfolioData);

        // Prepare conversation messages with context awareness (Anthropic keeps system separate)
        const messages = [
            ...conversationHistory.slice(-6).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            {
                role: "user",
                content: message
            }
        ];

        // Analyze conversation for repetition prevention
        const recentResponses = conversationHistory
            .filter(msg => msg.role === 'assistant')
            .slice(-3)
            .map(msg => msg.content);

        // Add anti-repetition instruction if needed
        if (recentResponses.length > 1) {
            const repetitionCheck = checkForRepetition(recentResponses);
            if (repetitionCheck.isRepetitive) {
                systemContext += `\n\n⚠️ ANTI-REPETITION NOTICE: Your recent responses contained similar content. Please provide a fresh perspective, use different examples, or explore a different angle of the topic. Recent response themes to avoid: ${repetitionCheck.themes.join(', ')}`;
            }
        }

        const completion = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            system: systemContext,
            messages: messages,
            max_tokens: 400,
            temperature: 0.8
        });

        const reply = completion.content[0].text;
        return { status: 200, jsonBody: { reply }, headers: corsHeaders };

    } catch (error) {
        context.error('Anthropic API error:', error);
        return { status: 500, jsonBody: { error: 'Failed to process chat request', details: error.message }, headers: corsHeaders };
    }
}
});

// Helper function to build enhanced context
function buildDefaultContext(portfolioData = {}) {
    const { projects = [], certificationCount = 0, blogPosts = [] } = portfolioData;

    return `You are the portfolio assistant on JonEric Eubanks' website. Recruiters and hiring managers use you to learn about his work.

ABOUT JONERIC (verified)
• JonEric Eubanks, PMP — AI engineer and Power Platform developer in Buffalo Grove, IL; open to AI Engineer roles.
• MGP (Municipal GIS Partners), 2023–present: Low-Code Developer (Dec 2024–present), Microsoft 365 Functional Consultant (Feb–Dec 2024), GIS Specialist (2023–Feb 2024).
• City of Fort Worth, 2014–2023: Development Project Coordinator, Neighborhood Program Coordinator, Neighborhood Services Liaison.
• Awards: Best IQ Agent, Microsoft Agents League 2026 (CivicGrant IQ); Best Agent, JavaScript AI Build-a-thon 2026 (CivicLens); Microsoft Best in Automation 2025 (ELM app, live in 6 municipalities). He led every project; the AI agents were solo builds.

PORTFOLIO PROJECTS (${projects.length}):
${projects.map(p => `• ${p.title} (${p.sectionLabel || p.category})${p.description ? ': ' + p.description : ''}`).join('\n') || '• (project list unavailable)'}

CERTIFICATIONS: ${certificationCount || 'see the Certifications section'}

BLOG POSTS (${blogPosts.length}):
${blogPosts.map(p => `• [${p.date}] "${p.title}"`).join('\n') || '• (none loaded)'}

RULES
1. Answer only with facts above. Never invent numbers, clients, dates, employers, awards, or future plans.
2. If the answer is not here, say so and point to the résumé or the Contact section.
3. Professional, concise tone (under 150 words unless listing items). At most one emoji.
4. End every answer with "Sources:" and 1–3 links from: [Featured Work](#awards) · [Published Writing](#writing) · [AI Agents](#ai-apps) · [Low-Code Apps](#lowcode) · [Dashboards](#dashboards) · [GIS Maps](#GIS) · [Certifications](#certifications) · [Blog](#blog) · [Contact](#contact) · [Résumé (PDF)](resume/JonEric-Eubanks-Resume.pdf)`;
}

// Helper function to check for repetitive content
function checkForRepetition(recentResponses) {
    if (recentResponses.length < 2) return { isRepetitive: false, themes: [] };
    
    // Simple keyword overlap detection
    const extractKeywords = (text) => {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 4)
            .filter(word => !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'were', 'will', 'would', 'could', 'should'].includes(word));
    };
    
    const allKeywords = recentResponses.map(extractKeywords);
    const firstResponse = allKeywords[0];
    const overlaps = [];
    
    for (let i = 1; i < allKeywords.length; i++) {
        const overlap = firstResponse.filter(word => allKeywords[i].includes(word));
        overlaps.push(overlap);
    }
    
    const maxOverlap = Math.max(...overlaps.map(o => o.length));
    const avgResponseLength = recentResponses.reduce((sum, r) => sum + extractKeywords(r).length, 0) / recentResponses.length;
    
    const isRepetitive = maxOverlap > avgResponseLength * 0.3; // 30% keyword overlap threshold
    const themes = isRepetitive ? overlaps.flat().filter((word, index, arr) => arr.indexOf(word) === index) : [];
    
    return { isRepetitive, themes };
}

// Exported for unit tests only — does not affect the Azure Functions runtime
module.exports = { checkForRepetition, buildDefaultContext, isRateLimited, buildCorsHeaders, ALLOWED_ORIGINS, MAX_MESSAGE_LENGTH };
