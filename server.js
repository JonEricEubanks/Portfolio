const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// OpenAI configuration
const { OpenAI } = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
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
            model: "gpt-4o-mini", // Updated to more capable model
            messages: messages,
            max_tokens: 400, // Increased for more detailed responses
            temperature: 0.8, // Slightly increased for more variation
            presence_penalty: 0.6, // Discourage repetition
            frequency_penalty: 0.3 // Further discourage repetition
        });

        const response = completion.choices[0].message.content;
        res.json({ reply: response });

    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ 
            error: 'Failed to generate response',
            details: error.message 
        });
    }
});

// Helper function to build enhanced context
function buildDefaultContext(portfolioData = {}) {
    const { projectCount = 8, recentProjects = [], achievements = [], certificationCount = 15 } = portfolioData;
    
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
• Financial Oversight: $73M+ tracked across projects
• Certifications: ${certificationCount}+ including PMP, Microsoft, ESRI

RECENT KEY PROJECTS:
${recentProjects.map(p => `• ${p.title} (${p.category}): ${p.description || 'Advanced low-code solution'}`).join('\n') || '• ELM App: Award-winning automation solution\n• Municipal Dashboards: Real-time government insights\n• AI Copilots: Automated property research and citizen services'}

CORE EXPERTISE:
🛠️ Microsoft Power Platform (Apps, Automate, BI, Pages, Copilot Studio)
📊 Business Intelligence & Data Analytics
🤖 AI/Copilot Development with Azure AI Search
🗺️ GIS Solutions with ArcGIS Pro/Online
📋 PMP-Certified Project Management
💡 Municipal Technology Innovation

KEY ACHIEVEMENTS:
🏆 Microsoft's Best in Automation Award (ELM App)
💰 $73M+ in municipal funds tracked and managed
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
