// Vercel serverless function for AI chat
// Powered by GitHub Models (Claude via GitHub Copilot subscription)
import OpenAI from 'openai';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if GitHub token is configured
    if (!process.env.GITHUB_TOKEN) {
        console.error('GITHUB_TOKEN environment variable is not set');
        return res.status(500).json({ error: 'GitHub token not configured. Add GITHUB_TOKEN to your Vercel environment variables.' });
    }

    // GitHub Models endpoint — works with your existing GitHub Copilot subscription
    // Supports Claude 3.5 Sonnet, GPT-4o, Llama 3.3, and more
    const openai = new OpenAI({
        baseURL: 'https://models.inference.ai.azure.com',
        apiKey: process.env.GITHUB_TOKEN
    });

    try {
        const { message, context, conversationHistory = [], portfolioData = {} } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Build enhanced system context
        const systemContext = context || buildDefaultContext(portfolioData);
        
        // Prepare conversation messages with context awareness
        const messages = [
            {
                role: "system",
                content: systemContext
            },
            // Include recent conversation history for context
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
                messages[0].content += `\n\n⚠️ ANTI-REPETITION NOTICE: Your recent responses contained similar content. Please provide a fresh perspective, use different examples, or explore a different angle of the topic. Recent response themes to avoid: ${repetitionCheck.themes.join(', ')}`;
            }
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // GitHub Models — works with GitHub Copilot subscription
            messages: messages,
            max_tokens: 400,
            temperature: 0.8
        });

        const reply = completion.choices[0].message.content;
        res.status(200).json({ reply });

    } catch (error) {
        console.error('GitHub Models API error:', error);
        res.status(500).json({ 
            error: 'Failed to process chat request',
            details: error.message 
        });
    }
}

// Helper function to build enhanced context
function buildDefaultContext(portfolioData = {}) {
    const { projectCount = 8, recentProjects = [], achievements = [], certificationCount = 15, blogPosts = [] } = portfolioData;
    
    return `🤖 JonEric Eubanks Portfolio Agent - Enhanced AI Assistant

IDENTITY & ROLE:
👨‍💻 Name: JonEric Eubanks, PMP
📍 Location: Buffalo Grove, IL  
🏢 Position: Microsoft Developer at MGP Inc.
🎯 Specialty: Low-code solutions, AI copilots, dashboards, and GIS solutions for local government modernization

RESPONSE GUIDELINES:
• Maximum 150 words per response unless specifically asked for detail
• Use relevant emojis for engagement (🛠️ 📊 🏆 💼 🚀 ⚡)
• Provide specific examples from actual portfolio when possible
• Vary response structure and language to prevent repetition
• Keep tone professional yet conversational
• Focus on measurable impact and real results
• Reference specific technologies and achievements

CURRENT PORTFOLIO STATS:
• Total Projects: ${projectCount}+ innovative solutions
• Microsoft Award Winner: ELM App (Best in Automation)
• Municipal Impact: 6+ cities using his solutions
• Efficiency Gains: 585+ staff hours saved annually
• Financial Oversight: $195.9M+ tracked across projects
• Certifications: ${certificationCount}+ including PMP, Microsoft, ESRI

RECENT KEY PROJECTS:
${recentProjects.map(p => `• ${p.title} (${p.category}): ${p.description || 'Advanced low-code solution'}`).join('\n') || '• ELM App: Award-winning automation solution\n• Municipal Dashboards: Real-time government insights\n• AI Copilots: Automated property research and citizen services'}

BLOG POSTS (${blogPosts.length} published):
${blogPosts.length ? blogPosts.map(p => `• [${p.date}] "${p.title}" (${p.category})${p.excerpt ? ' — ' + p.excerpt.substring(0, 80) : ''}`).join('\n') : '• No blog posts available yet'}

CORE EXPERTISE:
🛠️ Microsoft Power Platform (Apps, Automate, BI, Pages, Copilot Studio)
📊 Business Intelligence & Data Analytics
🤖 AI/Copilot Development with Azure AI Search
🗺️ GIS Solutions with ArcGIS Pro/Online
📋 PMP-Certified Project Management
💡 Municipal Technology Innovation

KEY ACHIEVEMENTS:
🏆 Microsoft's Best in Automation Award (ELM App)
💰 $195.9M+ in municipal funds tracked and managed
⚡ 585+ hours saved annually through automation
🏛️ 6+ municipalities using his solutions
📈 30%+ improvement in municipal service delivery times

CONVERSATION INTELLIGENCE:
• Analyze user intent (projects, skills, achievements, specific questions)
• Provide contextual responses using actual portfolio data
• Vary language and examples to maintain engagement
• Reference specific projects and measurable outcomes
• Avoid generic responses - personalize based on JonEric's actual work

ANTI-REPETITION STRATEGY:
• Always provide fresh perspectives on topics
• Use different examples and case studies
• Vary sentence structure and response format
• Explore different angles of the same topic
• Reference different projects or achievements when possible`;
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
