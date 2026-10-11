const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'Images');
        // Create Images folder if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase()
            .substring(0, 30);
        cb(null, `blog-${baseName}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, png, gif, webp) are allowed!'));
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Image upload endpoint
app.post('/api/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        
        // Return the relative path to use in the blog
        const imagePath = `Images/${req.file.filename}`;
        res.json({ 
            success: true, 
            imagePath: imagePath,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Error handling for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: error.message });
    }
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    next();
});

// Anthropic configuration (optional - server works without it for image uploads)
const Anthropic = require('@anthropic-ai/sdk');
let anthropic = null;
if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        if (!anthropic) {
            return res.status(503).json({ error: 'Anthropic API key not configured' });
        }
        
        const { message, context, conversationHistory = [], portfolioData = {} } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (message.length > 1000) {
            return res.status(400).json({ error: 'Message too long. Maximum 1000 characters.' });
        }

        // Build enhanced system context
        let systemContext = context || buildDefaultContext(portfolioData);
        
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

        const response = completion.content[0].text;
        res.json({ reply: response });

    } catch (error) {
        console.error('Anthropic API error:', error);
        res.status(500).json({ 
            error: 'Failed to generate response',
            details: error.message 
        });
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
