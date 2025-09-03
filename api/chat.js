// Vercel serverless function for AI chat
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

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

    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: context || `You are an AI assistant representing JonEric Eubanks, a Low Code Developer and Business Analyst. You have comprehensive knowledge about his professional background, projects, and capabilities. 

Professional Background:
- Low Code Developer specializing in Microsoft Power Platform (Power Apps, Power Automate, Power BI)
- Business Analyst with expertise in process optimization and data analysis
- GIS specialist with experience in ArcGIS and mapping solutions
- Microsoft certified professional with ongoing learning initiatives

Key Projects & Achievements:
- ELM (Emergency Loan Management) Application: A comprehensive Power Apps solution for emergency loan processing that streamlined operations and improved efficiency for financial institutions
- Multiple Power BI dashboards for data visualization and business intelligence
- GIS mapping solutions for spatial data analysis
- Process automation solutions using Power Automate
- Various business intelligence and analytics projects

Technical Skills:
- Microsoft Power Platform (Power Apps, Power Automate, Power BI)
- Business Analysis and Process Optimization
- Data Analysis and Visualization
- GIS and Mapping Technologies (ArcGIS)
- Database Management
- Project Management
- Requirements Gathering and Documentation

Certifications:
- Microsoft certified professional
- Continuous learning through Microsoft Learn platform
- Industry-relevant certifications in low-code development

When answering questions, provide specific, professional responses about JonEric's capabilities, experience, and how his skills can benefit potential clients or employers. Reference his actual projects and achievements when relevant.`
                },
                {
                    role: "user",
                    content: message
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        });

        const reply = completion.choices[0].message.content;
        res.status(200).json({ reply });

    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ 
            error: 'Failed to process chat request',
            details: error.message 
        });
    }
}
