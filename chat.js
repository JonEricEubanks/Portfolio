// Chat Toggle Functionality
function toggleChat() {
    const chatContainer = document.getElementById('chat-sidebar');
    chatContainer.classList.toggle('open');
}

class JonEricChatBot {
    constructor() {
        this.messagesContainer = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-button');
        this.chatStatus = document.getElementById('chat-status');
        this.conversationHistory = [];
        this.responseVariations = new Map();
        this.usedResponseSets = new Map(); // Track used responses to prevent repetition
        this.conversationContext = { // Track conversation themes and topics
            discussedTopics: new Set(),
            recentIntents: [],
            userPreferences: {},
            conversationDepth: 0
        };
        
        this.initializeEventListeners();
        this.contextPrompt = this.buildContextPrompt();
        this.portfolioData = this.extractPortfolioData();
        this.initializeResponseVariations();
    }

    extractPortfolioData() {
        // Extract dynamic data from the actual HTML
        const data = {
            projects: [],
            certifications: [],
            achievements: [],
            skills: [],
            testimonials: []
        };

        // Extract project data from modal triggers
        document.querySelectorAll('.modal-trigger').forEach(trigger => {
            const title = trigger.getAttribute('data-modal-title');
            const descriptions = trigger.getAttribute('data-modal-descriptions');
            const slideshow = trigger.getAttribute('data-modal-slideshow');
            
            if (title && descriptions) {
                data.projects.push({
                    title: title,
                    descriptions: descriptions.split('||'),
                    hasSlideshow: !!slideshow,
                    category: this.categorizeProject(title)
                });
            }
        });

        // Extract certifications
        document.querySelectorAll('.certification-item').forEach(cert => {
            const title = cert.querySelector('h3')?.textContent;
            const org = cert.querySelector('.certification-org')?.textContent;
            if (title) {
                data.certifications.push({ title, organization: org });
            }
        });

        // Extract testimonial
        const testimonialContent = document.querySelector('.testimonial-content')?.textContent;
        if (testimonialContent) {
            data.testimonials.push(testimonialContent);
        }

        // Extract achievements from hero section
        document.querySelectorAll('.stats-card').forEach(stat => {
            const value = stat.querySelector('h3')?.textContent;
            const label = stat.querySelector('p')?.textContent;
            if (value && label) {
                data.achievements.push({ value, label });
            }
        });

        // Extract award information
        const awardBadge = document.querySelector('.elm-title-text')?.textContent;
        const awardSubtitle = document.querySelector('.elm-subtitle')?.textContent;
        if (awardBadge && awardSubtitle) {
            data.achievements.push({
                award: awardBadge,
                description: awardSubtitle
            });
        }

        return data;
    }

    categorizeProject(title) {
        const lowTitle = title.toLowerCase();
        if (lowTitle.includes('dashboard') || lowTitle.includes('power bi')) return 'dashboard';
        if (lowTitle.includes('app') || lowTitle.includes('power apps')) return 'app';
        if (lowTitle.includes('gis') || lowTitle.includes('map')) return 'gis';
        if (lowTitle.includes('agent') || lowTitle.includes('ai') || lowTitle.includes('copilot')) return 'ai';
        if (lowTitle.includes('sharepoint') || lowTitle.includes('intranet')) return 'sharepoint';
        return 'other';
    }

    initializeResponseVariations() {
        this.responseVariations.set('greeting', [
            "👋 Hi! I'm JonEric's AI assistant. I can tell you about his Microsoft Award-winning projects, Power Platform expertise, and municipal solutions. What interests you?",
            "🤖 Hello! I specialize in JonEric's work - from the award-winning ELM app to Power BI dashboards and AI copilots. What would you like to explore?",
            "👨‍💻 Welcome! Ask me about JonEric's 8+ innovative solutions, including his Microsoft-recognized automation work and $73M+ in tracked municipal funds!",
            "🚀 Greetings! Ready to learn about JonEric's municipal technology innovations? I can share details about his Power Platform mastery and real-world impact!"
        ]);

        this.responseVariations.set('projects_overview', [
            `🛠️ JonEric has built ${this.portfolioData.projects.length}+ award-winning solutions!\n\n**Highlights:**\n• ELM App → Microsoft's Best in Automation Award\n• Municipal Dashboards → $73M+ funds tracked\n• AI Copilots → 3,600+ automated queries\n• Power Apps → 585+ hours saved annually\n\n🏆 Used across 6+ municipalities from Illinois to Texas!`,
            
            `📊 His portfolio demonstrates real municipal impact:\n\n**Key Projects:**\n• Employment Lifecycle Management (Microsoft Award Winner)\n• Project 25 Dashboard → $7.2M construction oversight  \n• Rental Aid Dashboard → $53M community aid tracking\n• LISA AI Agent → Automated property research\n\n⚡ Each solution delivers measurable efficiency gains!`,
            
            `🚀 JonEric's ${this.portfolioData.projects.length} projects span the complete government tech stack:\n\n**Power Platform Solutions:**\n• Apps: HR automation, service requests, licensing\n• Dashboards: Budget tracking, KPIs, aid distribution\n• AI: Copilot Studio agents for citizen services\n• Integration: SharePoint, Teams, Azure AI Search\n\n💡 Transforming how cities serve their communities!`,
            
            `� Municipal technology excellence across multiple domains:\n\n**Impact Areas:**\n• Human Resources → 400+ hours saved (ELM App)\n• Financial Oversight → $73M+ tracked accurately\n• Citizen Services → 30% faster response times\n• Data Analytics → Real-time decision support\n\n🌟 Proven scalability from small towns to major cities!`
        ]);

        this.responseVariations.set('skills_overview', [
            "🛠️ JonEric brings certified expertise across the Microsoft ecosystem!\n\n**Core Specializations:**\n• Power Platform (Apps, BI, Automate, Copilot Studio)\n• Microsoft 365 (SharePoint, Teams, Entra ID)\n• Azure AI Search & GIS (ArcGIS Pro/Online)\n• PMP Project Management\n\n📜 15+ certifications including Microsoft, ESRI, and Google credentials!",
            
            "⚡ Full-stack low-code development with government focus!\n\n**Technical Expertise:**\n• Power Apps → Municipal automation solutions\n• Power BI → Financial and operational dashboards  \n• Power Automate → Workflow optimization\n• Copilot Studio → AI agent development\n• ArcGIS → Spatial analysis and mapping\n\n🎯 Skills proven across 6+ municipalities with measurable ROI!",
            
            "🚀 Technology mastery spanning development to deployment!\n\n**Platform Proficiency:**\n• Microsoft Power Platform (certified)\n• Business Intelligence & Analytics\n• AI/Copilot Development\n• Geographic Information Systems\n• Agile Project Management (PMP)\n\n💼 Each skill directly contributes to government innovation and efficiency!"
        ]);

        this.responseVariations.set('achievements', [
            `🏆 Recognition that speaks to real impact!\n\n**Top Achievements:**\n• Microsoft's Best in Automation Award (ELM App)\n• Official Microsoft case study published\n• $73M+ in municipal funds tracked and managed\n• 585+ staff hours saved annually through automation\n• 6+ cities using his solutions across multiple states`,
            
            `⭐ Awards backed by measurable municipal results!\n\n**Key Accomplishments:**\n• Microsoft Award Winner → ELM automation solution\n• Efficiency Expert → 30% faster municipal response times\n• Financial Steward → $73M+ in accurate fund tracking\n• Innovation Leader → AI copilots serving thousands of citizens`,
            
            `📈 Excellence recognized at the highest levels!\n\n**Impact Portfolio:**\n• Microsoft's Best in Automation (official case study)\n• Government Efficiency → 585+ hours saved per year\n• Financial Accuracy → $73M+ managed across programs\n• Scalable Solutions → Deployed in Illinois and Texas`,
            
            `🌟 Professional recognition meets community impact!\n\n**Achievement Highlights:**\n• Microsoft Award for ELM App innovation\n• Municipal Technology Leader (6+ city deployments)\n• Automation Expert (400+ hours saved in HR alone)\n• Data Steward ($73M+ tracked with 99%+ accuracy)`
        ]);
    }

    getProjectsByCategory(category) {
        return this.portfolioData.projects.filter(p => p.category === category);
    }

    getVariedResponse(key, context = {}) {
        const variations = this.responseVariations.get(key) || [];
        if (variations.length === 0) return null;

        // Track what we've used recently
        if (!this.usedVariations) this.usedVariations = new Map();
        const used = this.usedVariations.get(key) || [];
        
        // Find unused variations
        const unused = variations.filter((_, index) => !used.includes(index));
        const availableVariations = unused.length > 0 ? unused : variations;
        
        // Select random variation
        const selectedIndex = Math.floor(Math.random() * availableVariations.length);
        const selectedVariation = availableVariations[selectedIndex];
        
        // Track usage
        const originalIndex = variations.indexOf(selectedVariation);
        used.push(originalIndex);
        if (used.length > variations.length - 1) used.shift(); // Keep only recent uses
        this.usedVariations.set(key, used);
        
        return selectedVariation;
    }

    buildContextPrompt() {
        const projectsData = this.portfolioData.projects.map(p => 
            `${p.title}: ${p.descriptions[0]?.substring(0, 100)}...`
        ).join('\n');

        const certificationsData = this.portfolioData.certifications.map(c => 
            `${c.title}${c.organization ? ` (${c.organization})` : ''}`
        ).join('\n');

        return `🤖 JonEric Eubanks Portfolio Agent - Enhanced with Live Data

CURRENT PORTFOLIO PROJECTS:
${projectsData}

CERTIFICATIONS:
${certificationsData}

ACHIEVEMENTS FROM PORTFOLIO:
${this.portfolioData.achievements.map(a => a.award || `${a.value} ${a.label}`).join('\n')}

TESTIMONIAL:
${this.portfolioData.testimonials[0] || 'Client testimonials available in portfolio'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👨‍💻 Identity: JonEric Eubanks, PMP
📍 Location: Buffalo Grove, IL  
🏢 Role: Microsoft Developer at MGP
🎯 Mission: Delivering low-code solutions that modernize local government

📋 Response Guidelines:
• Maximum 150 words per response
• Use emojis for engagement (🛠️ 📊 🏆 💼 🚀)
• Reference actual portfolio data when possible
• Vary responses to avoid repetition
• Keep tone professional yet conversational
• Highlight measurable impact and real results

🔍 Conversation Intelligence:
• Analyze user intent and provide contextual responses
• Reference specific projects when relevant
• Use portfolio data to give accurate, current information
• Avoid generic responses - personalize based on actual content

🛠️ Core Expertise:
• Microsoft Power Platform (Apps, Automate, BI, Pages, Copilot Studio)
• Microsoft 365 ecosystem
• AI/Copilot development with Azure AI Search
• GIS solutions with ArcGIS
• PMP-certified project management
• Data analytics and visualization

Response Strategy:
1. Detect user intent (projects, skills, achievements, specific questions)
2. Use live portfolio data for accurate answers
3. Vary response style to maintain engagement
4. Reference specific examples when relevant
5. Keep responses concise but informative`;
    }

    analyzeUserIntent(message) {
        const lowMessage = message.toLowerCase();
        const intent = { type: 'general', confidence: 0.5, keywords: [], context: {} };
        
        // Enhanced greeting detection
        if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening))/i.test(message.trim())) {
            intent.type = 'greeting';
            intent.confidence = 0.95;
            return intent;
        }
        
        // Project-related queries with specific detection
        const projectKeywords = ['project', 'work', 'built', 'app', 'application', 'solution', 'system'];
        const projectMatches = projectKeywords.filter(keyword => lowMessage.includes(keyword));
        if (projectMatches.length > 0) {
            intent.type = 'projects';
            intent.confidence = 0.8 + (projectMatches.length * 0.05);
            intent.keywords = projectMatches;
            
            // Detect specific project types
            if (lowMessage.includes('elm') || lowMessage.includes('employment')) {
                intent.context.specificProject = 'elm';
                intent.confidence = 0.9;
            } else if (lowMessage.includes('dashboard') || lowMessage.includes('power bi')) {
                intent.context.projectType = 'dashboard';
            } else if (lowMessage.includes('gis') || lowMessage.includes('map') || lowMessage.includes('spatial')) {
                intent.context.projectType = 'gis';
            } else if (lowMessage.includes('ai') || lowMessage.includes('copilot') || lowMessage.includes('agent')) {
                intent.context.projectType = 'ai';
            }
        }
        
        // Skills/expertise queries with depth detection
        const skillKeywords = ['skill', 'expertise', 'experience', 'technology', 'platform', 'certification', 'qualified'];
        const skillMatches = skillKeywords.filter(keyword => lowMessage.includes(keyword));
        if (skillMatches.length > 0) {
            intent.type = 'skills';
            intent.confidence = 0.8 + (skillMatches.length * 0.05);
            intent.keywords = skillMatches;
            
            // Detect specific skill areas
            if (lowMessage.includes('power') || lowMessage.includes('microsoft')) {
                intent.context.skillArea = 'microsoft';
            } else if (lowMessage.includes('gis') || lowMessage.includes('arcgis')) {
                intent.context.skillArea = 'gis';
            } else if (lowMessage.includes('data') || lowMessage.includes('analytics')) {
                intent.context.skillArea = 'data';
            } else if (lowMessage.includes('project') && lowMessage.includes('management')) {
                intent.context.skillArea = 'pm';
            }
        }
        
        // Achievement/award queries
        const achievementKeywords = ['award', 'achievement', 'recognition', 'accomplishment', 'success', 'impact', 'result'];
        const achievementMatches = achievementKeywords.filter(keyword => lowMessage.includes(keyword));
        if (achievementMatches.length > 0) {
            intent.type = 'achievements';
            intent.confidence = 0.85;
            intent.keywords = achievementMatches;
        }
        
        // Municipal/government context detection
        if (lowMessage.includes('government') || lowMessage.includes('municipal') || lowMessage.includes('city') || lowMessage.includes('public')) {
            intent.context.domain = 'government';
            intent.confidence = Math.min(intent.confidence + 0.1, 0.95);
        }
        
        // Question type detection
        if (message.includes('?')) {
            intent.context.isQuestion = true;
            if (lowMessage.startsWith('what') || lowMessage.startsWith('which')) {
                intent.context.questionType = 'what';
            } else if (lowMessage.startsWith('how')) {
                intent.context.questionType = 'how';
            } else if (lowMessage.startsWith('why')) {
                intent.context.questionType = 'why';
            } else if (lowMessage.startsWith('when')) {
                intent.context.questionType = 'when';
            } else if (lowMessage.startsWith('where')) {
                intent.context.questionType = 'where';
            }
        }
        
        // Detect comparison or evaluation queries
        if (lowMessage.includes('compare') || lowMessage.includes('versus') || lowMessage.includes('vs') || lowMessage.includes('better')) {
            intent.context.isComparison = true;
        }
        
        // Detect specific entity mentions
        const specificEntities = ['buffalo grove', 'mgp', 'microsoft', 'power platform', 'azure', 'sharepoint'];
        intent.context.entities = specificEntities.filter(entity => lowMessage.includes(entity));
        
        return intent;
    }

    generateContextualResponse(userMessage, intent) {
        // Enhanced contextual response generation based on intent analysis
        
        if (intent.type === 'greeting') {
            return this.getVariedResponse('greeting');
        }
        
        if (intent.type === 'projects') {
            // Check for specific project context
            if (intent.context.specificProject === 'elm') {
                return this.getELMProjectResponse();
            } else if (intent.context.projectType) {
                return this.getProjectTypeResponse(intent.context.projectType);
            } else {
                // General projects overview with variation
                const variedResponse = this.getVariedResponse('projects_overview');
                if (variedResponse) return variedResponse;
            }
        }
        
        if (intent.type === 'skills') {
            if (intent.context.skillArea) {
                return this.getSkillAreaResponse(intent.context.skillArea);
            } else {
                return this.getVariedResponse('skills_overview');
            }
        }
        
        if (intent.type === 'achievements') {
            const variedResponse = this.getVariedResponse('achievements');
            if (variedResponse) return variedResponse;
        }
        
        // Handle specific project queries with keyword matching
        if (intent.type === 'specific_project' && intent.keyword) {
            const relevantProjects = this.portfolioData.projects.filter(p => 
                p.title.toLowerCase().includes(intent.keyword) ||
                p.descriptions.some(d => d.toLowerCase().includes(intent.keyword))
            );
            
            if (relevantProjects.length > 0) {
                return this.generateProjectResponse(relevantProjects[0], intent.keyword);
            }
        }
        
        // Handle government/municipal context
        if (intent.context.domain === 'government') {
            return this.getMunicipalResponse();
        }
        
        // Handle comparison queries
        if (intent.context.isComparison) {
            return this.getComparisonResponse(userMessage);
        }
        
        return null; // Fall back to AI API
    }

    getELMProjectResponse() {
        const responses = [
            "🏆 The ELM (Employment Lifecycle Management) App is JonEric's crown jewel! \n\n**Key Impact:**\n• Won Microsoft's Best in Automation Award\n• Official Microsoft case study published\n• Deployed across 6+ municipalities\n• Saves 400+ hours annually in onboarding/offboarding\n\n🛠️ Built with Power Apps, it unified HR workflows across departments and transformed how cities manage employee lifecycles.",
            
            "⭐ Great question about ELM! This award-winning solution revolutionized municipal HR:\n\n**The Challenge:** Manual onboarding/offboarding across multiple departments\n**The Solution:** Unified Power Apps workflow\n**The Result:** 400+ hours saved, Microsoft recognition, 6+ city deployments\n\n🚀 It's a perfect example of how low-code can deliver enterprise-level impact.",
            
            "💡 The ELM App showcases JonEric's municipal innovation expertise!\n\n**Technical Highlights:**\n• Power Apps front-end with SharePoint backend\n• Automated approval workflows\n• Cross-department integration\n• Real-time status tracking\n\n🏛️ Used by cities from Illinois to Texas, proving scalable government solutions work!"
        ];
        
        return this.selectUnusedResponse('elm_responses', responses);
    }

    getProjectTypeResponse(type) {
        const responses = {
            dashboard: [
                "📊 JonEric's dashboard expertise shines through Power BI solutions!\n\n**Featured Dashboards:**\n• Project 25 Dashboard → $7.2M construction oversight\n• Rental Aid Dashboard → $53M community aid tracking\n• Municipal KPI Dashboards → Real-time city metrics\n\n⚡ These aren't just charts - they're decision-making tools that guide million-dollar municipal investments.",
                
                "🎯 His dashboard portfolio spans from financial oversight to operational excellence:\n\n• **Budget Tracking:** Real-time fund allocation and spending\n• **Project Management:** Construction change orders and timelines\n• **Community Services:** Aid distribution and impact metrics\n\n📈 Each dashboard delivers actionable insights that improve municipal decision-making."
            ],
            gis: [
                "🗺️ JonEric's GIS expertise combines spatial analysis with municipal needs!\n\n**GIS Solutions:**\n• Property research automation with AI\n• Municipal asset mapping\n• Service area optimization\n• Land use analysis\n\n🛠️ Using ArcGIS Pro/Online, he creates solutions that help cities understand their geography and optimize services.",
                
                "📍 His spatial analytics work includes:\n\n• **LISA Agent:** AI-powered land information research\n• **Municipal Mapping:** Asset and infrastructure visualization\n• **Service Optimization:** Route planning and coverage analysis\n\n🚀 Combining GIS with Power Platform creates powerful municipal tools."
            ],
            ai: [
                "🤖 JonEric's AI solutions are transforming municipal services!\n\n**AI Projects:**\n• LISA (Land Info Service Agent) → Automated property research\n• Ordinance Research Copilots → Instant policy lookup\n• CRM Integration Agents → 3,600+ automated queries\n\n⚡ Built with Copilot Studio and Azure AI Search, these agents scale government capabilities.",
                
                "💡 His AI approach focuses on practical municipal applications:\n\n• **Citizens:** Faster service through automated responses\n• **Staff:** Reduced research time with AI assistance\n• **Government:** Improved efficiency and transparency\n\n🛠️ Each AI solution addresses real government pain points with measurable results."
            ]
        };
        
        const typeResponses = responses[type] || [];
        return this.selectUnusedResponse(`${type}_responses`, typeResponses);
    }

    getSkillAreaResponse(area) {
        const responses = {
            microsoft: [
                "🛠️ JonEric's Microsoft expertise is comprehensive and certified!\n\n**Power Platform Mastery:**\n• Power Apps → Municipal automation solutions\n• Power BI → Financial and operational dashboards\n• Power Automate → Workflow optimization\n• Copilot Studio → AI agent development\n\n📜 Microsoft certified with hands-on experience across the entire ecosystem.",
                
                "⚡ His Microsoft 365 integration skills create seamless workflows:\n\n• **SharePoint:** Backend for municipal apps\n• **Teams:** Collaborative government workspace\n• **Entra ID:** Secure identity management\n• **Azure AI Search:** Intelligent content discovery\n\n🚀 This deep ecosystem knowledge enables end-to-end solutions."
            ],
            gis: [
                "📍 ESRI-certified GIS expertise with municipal focus!\n\n**ArcGIS Capabilities:**\n• Pro → Advanced spatial analysis\n• Online → Web-based mapping solutions\n• ModelBuilder → Automated geoprocessing\n• LiDAR → Surface modeling and analysis\n\n🗺️ Multiple ESRI certifications back real-world municipal mapping projects.",
                
                "🛰️ His spatial analytics combine traditional GIS with modern integration:\n\n• **Data Integration:** Connecting GIS with Power Platform\n• **Automation:** ModelBuilder workflows for efficiency\n• **Visualization:** Maps that tell municipal stories\n• **Analysis:** Data-driven spatial decision making\n\n📊 Geography meets technology for smarter government."
            ],
            pm: [
                "📋 PMP-certified project management with government expertise!\n\n**Methodologies:**\n• PMP → Traditional project management\n• Agile → Iterative development approach\n• Lean Six Sigma → Process optimization\n• Change Management → Stakeholder engagement\n\n🎯 Successfully managing complex municipal technology initiatives from concept to deployment."
            ]
        };
        
        const areaResponses = responses[area] || [];
        return this.selectUnusedResponse(`${area}_skill_responses`, areaResponses);
    }

    getMunicipalResponse() {
        const responses = [
            "🏛️ JonEric specializes in municipal technology that delivers real government impact!\n\n**Cities Served:** Buffalo Grove, Glencoe, Brookfield, Lincolnshire, Fort Worth\n**Focus Areas:** HR automation, financial oversight, citizen services\n**Measurable Results:** 585+ hours saved, $73M+ tracked, 30% faster response times\n\n💡 His solutions address the unique challenges of local government operations.",
            
            "🌟 Municipal technology with proven ROI across multiple cities!\n\n**Government Expertise:**\n• Employment lifecycle management\n• Budget and aid tracking\n• Citizen service automation\n• Compliance and reporting\n\n📈 Each solution improves efficiency, transparency, and service delivery for real communities."
        ];
        
        return this.selectUnusedResponse('municipal_responses', responses);
    }

    generateProjectResponse(project, keyword) {
        return `🎯 Great question about ${keyword}! 

**${project.title}**
${project.descriptions[0]?.substring(0, 150)}...

${project.hasSlideshow ? '📷 This project includes detailed screenshots and walkthroughs in the portfolio.' : ''}
${project.category === 'ai' ? '🤖 This AI solution demonstrates JonEric\'s innovative approach to automation.' : ''}
${project.category === 'dashboard' ? '📊 This dashboard provides real-time insights for data-driven decisions.' : ''}

Want to explore any specific aspect of this ${project.category} solution?`;
    }

    selectUnusedResponse(key, responses) {
        if (!this.usedResponseSets) this.usedResponseSets = new Map();
        
        const used = this.usedResponseSets.get(key) || [];
        const unused = responses.filter((_, index) => !used.includes(index));
        const available = unused.length > 0 ? unused : responses;
        
        const selectedIndex = Math.floor(Math.random() * available.length);
        const selected = available[selectedIndex];
        const originalIndex = responses.indexOf(selected);
        
        used.push(originalIndex);
        if (used.length >= responses.length) used.shift();
        this.usedResponseSets.set(key, used);
        
        return selected;
    }

    initializeEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enter key in input
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Auto-resize input
        this.chatInput.addEventListener('input', () => {
            this.sendButton.disabled = !this.chatInput.value.trim();
        });
    }

    buildContextPrompt() {
        return `🤖 JonEric Eubanks Portfolio Agent Instructions

Identity
👨‍💻 Name: JonEric Eubanks, PMP
📍 Location: Buffalo Grove, IL
🏢 Role: Microsoft Developer at MGP
🎯 Focus: Delivering low-code apps, AI copilots, dashboards, and GIS solutions that improve efficiency, transparency, and service delivery for local government.

📋 Response Rules

Maximum 150 words per response

Always use emojis for clarity + engagement (🛠️ 📊 🏆 💼 🚀)

Format with bullets when listing

Keep tone friendly, professional, and impactful

Highlight numbers, awards, and measurable results (time saved, funds tracked, service improvements)

Use visual separators (━━━━━━━━━━) for readability

🛠️ Skills & Expertise

Microsoft Power Platform
• Power Apps • Power Automate • Power BI • Power Pages • Copilot Studio

Microsoft 365 Ecosystem
• SharePoint • Teams • Entra ID • Office Suite (Excel, Word, PPT, Outlook, OneNote)

Data & Programming
• SQL • HTML • CSS • Python • C++ • G-Code • BigQuery

GIS Tools
• ArcGIS Pro • ArcGIS Online • ModelBuilder

Methodologies
• PMP-certified project management • Lean Six Sigma • Agile

Other Tools
• Smartsheet dashboards • Azure AI Search

🏆 Career Highlights

• Employment Lifecycle Management (ELM) App → Won Microsoft’s Best in Automation award; official case study published.
• Municipal apps + dashboards for Buffalo Grove, Glencoe, Brookfield, Lincolnshire, Fort Worth.
• Efficiency gains: 400+ hrs saved with onboarding automation, 60+ hrs with water service tracking, 55 hrs with block party workflows.
• Financial oversight: $73M+ tracked across aid, rental programs, repairs, construction oversight.
• AI Leadership: Built Copilot Studio agents like LISA (Land Info Service Agent), ordinance research copilots, CRM dashboards, and RAG-powered property insights.

📜 Certifications

Microsoft
• Microsoft 365 Certified: Fundamentals
• Microsoft Certified: Power Platform Fundamentals

Project Management & Data
• PMP
• Lean Six Sigma
• Agile Project Management
• Google Project Management Professional
• Google Data Analytics Professional
• Project Execution: Running the Project
• Project Initiation: Starting a Successful Project
• Foundations of Project Management
• Foundations: Data, Data, Everywhere
• Prepare Data for Exploration
• Crash Course on Python

ESRI (ArcGIS / Spatial Data)
• Basics of Raster Data
• Displaying Raster Data Using ArcGIS
• Using Raster Data for Site Selection
• Processing Raster Data Using ArcGIS
• Introduction to Surface Modeling Using ArcGIS
• Using LiDAR Data in ArcGIS
• Going Places with Spatial Data
• Organizing Raster Data Using ArcGIS

❓ Typical Q&A

Q: Who is JonEric?
👨‍💻 JonEric Eubanks is a Microsoft Developer + PMP, building low-code apps, dashboards, and AI copilots that help municipalities modernize services. His expertise spans Power Platform, Microsoft 365, GIS, and data analytics.

Q: What’s his biggest project?
🏆 JonEric created the Employment Lifecycle Management (ELM) App → automating onboarding/offboarding, unifying workflows across departments, and saving hundreds of staff hours. Deployed in 6+ municipalities and awarded Microsoft’s Best in Automation.

Q: What measurable impact has he delivered?
⚡ Efficiency: 585+ staff hours saved annually
💵 Financial Oversight: $73M+ tracked in aid, budgets, and construction projects
🚀 Service Delivery: 30%+ faster municipal response times
📊 Adoption: Used by multiple municipalities across Illinois + Fort Worth

Q: What other projects has he built?
• Project 25 Dashboard → Oversight of $7.2M in construction change orders
• Block Party Request Workflow → Saved 55+ hrs annually
• Water Service Records App → 3,200+ records managed
• Rental Aid Dashboard → $53M tracked in community aid
• CRM + AI Agents → 3,600+ property queries automated with Copilot

Q: What awards has he earned?
🏆 Microsoft’s Best in Automation for the ELM App — official case study published by Microsoft.
🏛️ Recognized for municipal technology impact across Illinois and Texas.

Q: What skills does he bring?
🛠️ Power Platform, Microsoft 365, SQL, GIS (ArcGIS Pro/Online), PMP project management, Lean Six Sigma, Agile.
🤖 AI copilots with Copilot Studio + Azure AI Search.
📊 Dashboards and apps that turn complex data into actionable insights.

Q: What certifications back him up?
📜 Microsoft: M365 Fundamentals, Power Platform Fundamentals
📜 Project Management: PMP, Lean Six Sigma, Agile, Google PM
📜 Data: Google Data Analytics, SQL, Python
📜 GIS: ESRI certifications in LiDAR, raster, and surface modeling

Q: What are his cons?
💡 “Restless curiosity.” JonEric moves fast with new tools—sometimes too fast. But that drive transforms experiments into full-scale solutions that deliver real community results.

Q: Why trust his work?
📊 Results speak:
• Dashboards guiding policy + budgets
• Apps streamlining onboarding, licensing, and service delivery
• AI copilots scaling local government capabilities
• Recognized by Microsoft, trusted by municipalities, and backed by measurable impact`;
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Clear input and disable send button
        this.chatInput.value = '';
        this.sendButton.disabled = true;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Add to conversation history
        this.conversationHistory.push({ role: 'user', content: message });
        this.conversationContext.conversationDepth++;
        
        // Auto-collapse suggestions after sending a message
        autoCollapseSuggestions();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Analyze user intent with enhanced context
            const intent = this.analyzeUserIntent(message);
            
            // Update conversation context
            this.updateConversationContext(intent, message);
            
            // Check for repetitive requests
            if (this.isRepetitiveRequest(intent)) {
                const response = this.handleRepetitiveRequest(intent, message);
                this.hideTypingIndicator();
                this.addMessage(response, 'ai');
                this.conversationHistory.push({ role: 'assistant', content: response });
                return;
            }
            
            // Try to generate contextual response first
            let response = this.generateContextualResponse(message, intent);
            
            // If no contextual response, use AI API with enhanced context
            if (!response) {
                response = await this.getAIResponse(message);
            }
            
            // Track the response to prevent future repetition
            this.trackResponse(response, intent);
            
            this.hideTypingIndicator();
            this.addMessage(response, 'ai');
            
            // Add AI response to conversation history
            this.conversationHistory.push({ role: 'assistant', content: response });
            
            // Keep conversation history manageable (last 20 exchanges)
            if (this.conversationHistory.length > 40) {
                this.conversationHistory = this.conversationHistory.slice(-40);
            }
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again later.', 'ai', true);
            console.error('Chat error:', error);
        }
    }

    updateConversationContext(intent, message) {
        // Track discussed topics
        this.conversationContext.discussedTopics.add(intent.type);
        if (intent.context?.specificProject) {
            this.conversationContext.discussedTopics.add(intent.context.specificProject);
        }
        if (intent.context?.projectType) {
            this.conversationContext.discussedTopics.add(intent.context.projectType);
        }
        
        // Track recent intents (last 5)
        this.conversationContext.recentIntents.push(intent);
        if (this.conversationContext.recentIntents.length > 5) {
            this.conversationContext.recentIntents.shift();
        }
        
        // Detect user preferences
        if (intent.keywords?.length > 0) {
            intent.keywords.forEach(keyword => {
                if (!this.conversationContext.userPreferences[keyword]) {
                    this.conversationContext.userPreferences[keyword] = 0;
                }
                this.conversationContext.userPreferences[keyword]++;
            });
        }
    }

    isRepetitiveRequest(intent) {
        // Check if the same intent type has been asked recently
        const recentSameIntents = this.conversationContext.recentIntents
            .filter(prevIntent => prevIntent.type === intent.type).length;
        
        if (recentSameIntents >= 2) {
            return true;
        }
        
        // Check if asking about the same specific project multiple times
        if (intent.context?.specificProject) {
            const sameProjectRequests = this.conversationContext.recentIntents
                .filter(prevIntent => prevIntent.context?.specificProject === intent.context.specificProject).length;
            return sameProjectRequests >= 2;
        }
        
        return false;
    }

    handleRepetitiveRequest(intent, message) {
        const repetitiveResponses = [
            "🔄 I notice you're interested in learning more about this topic! Let me provide a different perspective...\n\nIs there a specific aspect you'd like me to dive deeper into?",
            
            "💡 Since you're curious about this area, here's another angle:\n\nWhat particular details would be most valuable for you to know?",
            
            "🎯 You seem really interested in this! Let me share some additional insights:\n\nAny specific questions I can answer about this topic?",
            
            "📚 Great follow-up! Here's what else might interest you about this:\n\nWould you like me to elaborate on any particular aspect?"
        ];
        
        const selectedResponse = repetitiveResponses[Math.floor(Math.random() * repetitiveResponses.length)];
        
        // Add contextual follow-up based on intent
        if (intent.type === 'projects') {
            return selectedResponse + "\n\n🚀 I can tell you about technical implementation, business impact, or specific features of any project.";
        } else if (intent.type === 'skills') {
            return selectedResponse + "\n\n⚡ I can elaborate on certifications, real-world applications, or how these skills solve business problems.";
        } else if (intent.type === 'achievements') {
            return selectedResponse + "\n\n🏆 I can share more details about the impact, recognition, or measurable results of JonEric's work.";
        }
        
        return selectedResponse;
    }

    trackResponse(response, intent) {
        // Simple response tracking to help identify patterns
        const responseHash = this.simpleHash(response.substring(0, 100));
        
        if (!this.responseTracking) {
            this.responseTracking = new Map();
        }
        
        if (this.responseTracking.has(responseHash)) {
            console.warn('Potential response repetition detected');
        } else {
            this.responseTracking.set(responseHash, {
                intent: intent.type,
                timestamp: Date.now(),
                responsePreview: response.substring(0, 50)
            });
        }
        
        // Clean old tracking data (keep last 50 responses)
        if (this.responseTracking.size > 50) {
            const oldestKey = this.responseTracking.keys().next().value;
            this.responseTracking.delete(oldestKey);
        }
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    async getAIResponse(userMessage) {
        // Enhanced context with conversation history and live portfolio data
        const enhancedContext = `${this.contextPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONVERSATION HISTORY (Last ${this.conversationHistory.length} messages):
${this.conversationHistory.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

CURRENT PORTFOLIO STATS:
• Total Projects: ${this.portfolioData.projects.length}
• Power Apps: ${this.getProjectsByCategory('app').length}
• Dashboards: ${this.getProjectsByCategory('dashboard').length}  
• AI Solutions: ${this.getProjectsByCategory('ai').length}
• GIS Projects: ${this.getProjectsByCategory('gis').length}

RECENT PROJECTS TO HIGHLIGHT:
${this.portfolioData.projects.slice(0, 3).map(p => `• ${p.title}`).join('\n')}

USER QUERY: ${userMessage}

RESPONSE INSTRUCTIONS:
• Reference actual portfolio data when relevant
• Avoid repeating previous responses in conversation history
• Be specific about JonEric's work and achievements
• Use fresh examples and varied language
• Keep response under 150 words
• Include relevant emojis and formatting`;

        try {
            console.log('🚀 Attempting API call to /api/chat');
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    context: enhancedContext,
                    conversationHistory: this.conversationHistory.slice(-6), // Send recent history
                    portfolioData: {
                        projectCount: this.portfolioData.projects.length,
                        recentProjects: this.portfolioData.projects.slice(0, 5).map(p => ({
                            title: p.title,
                            category: p.category,
                            description: p.descriptions[0]?.substring(0, 100)
                        })),
                        achievements: this.portfolioData.achievements,
                        certificationCount: this.portfolioData.certifications.length
                    }
                })
            });

            console.log('📡 API Response Status:', response.status);

            if (!response.ok) {
                console.error('❌ API Error:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('❌ Error Details:', errorText);
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ API Success:', data);
            return data.reply;
        } catch (error) {
            console.error('💥 API Call Failed:', error);
            // Return a fallback response that indicates the issue
            return `🔧 **API Connection Issue Detected**

I'm having trouble connecting to the enhanced AI backend. This might be because:
• The OpenAI API key isn't configured on the server
• There's a deployment issue
• The API endpoint is not responding

**Currently showing basic responses only.** 

For now, I can tell you that JonEric has built 8+ innovative solutions including Power Apps, dashboards, AI agents, and GIS solutions. His ELM app won Microsoft's Best in Automation award!

*Note: Full AI capabilities will return once the backend is properly configured.*`;
        }
    }

    addMessage(content, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'ai' ? '🤖' : '👤';
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Ensure content is a string and handle undefined/null cases
        const safeContent = content || 'Sorry, I encountered an error. Please try again later.';
        
        // Process content for basic markdown-like formatting
        let processedContent = safeContent
            // Convert **text** to <strong>text</strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Convert bullet points (• or *) to proper list items
            .replace(/^[•*]\s(.+)$/gm, '<li>$1</li>')
            // Wrap consecutive <li> items in <ul>
            .replace(/(<li>.*<\/li>)/gm, function(match) {
                return match;
            });
        
        // If we have list items, wrap them in ul tags
        if (processedContent.includes('<li>')) {
            processedContent = processedContent.replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gs, '<ul>$1</ul>');
        }
        
        // Convert line breaks to <br> tags
        processedContent = processedContent.replace(/\n/g, '<br>');
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content ${isError ? 'error-message' : ''}">
                <div>${processedContent}</div>
            </div>
            <div class="message-time">${time}</div>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Suggestion functions
function sendSuggestion(suggestion) {
    document.getElementById('chat-input').value = suggestion;
    chatBot.sendMessage();
}

// Collapsible suggestions functionality
function toggleSuggestions() {
    const suggestionsContainer = document.getElementById('suggested-questions');
    const collapseIcon = document.querySelector('.collapse-icon');
    
    suggestionsContainer.classList.toggle('collapsed');
    
    // Update the icon rotation
    if (suggestionsContainer.classList.contains('collapsed')) {
        collapseIcon.style.transform = 'rotate(-90deg)';
    } else {
        collapseIcon.style.transform = 'rotate(0deg)';
    }
}

// Auto-collapse suggestions after a message is sent
function autoCollapseSuggestions() {
    const suggestionsContainer = document.getElementById('suggested-questions');
    if (!suggestionsContainer.classList.contains('collapsed')) {
        setTimeout(() => {
            toggleSuggestions();
        }, 1000); // Delay to allow user to see the collapse
    }
}

// Initialize chat bot when page loads
let chatBot;
document.addEventListener('DOMContentLoaded', () => {
    chatBot = new JonEricChatBot();
    
    // Auto-collapse suggestions on mobile devices for better space utilization
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        setTimeout(() => {
            const suggestionsContainer = document.getElementById('suggested-questions');
            if (suggestionsContainer && !suggestionsContainer.classList.contains('collapsed')) {
                toggleSuggestions();
            }
        }, 2000); // Increased delay to let mobile users see the suggestions first
    }
    
    // Handle window resize to adjust mobile behavior
    window.addEventListener('resize', () => {
        const isNowMobile = window.innerWidth <= 768;
        if (isNowMobile && !document.getElementById('suggested-questions').classList.contains('collapsed')) {
            // Auto-collapse on resize to mobile
            setTimeout(() => toggleSuggestions(), 500);
        }
    });
});
