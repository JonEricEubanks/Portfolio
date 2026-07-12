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
            testimonials: [],
            blogPosts: []
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

        // Extract blog posts from blogManager if available
        if (window.blogManager) {
            data.blogPosts = window.blogManager.getPostsForContext();
        }

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
            "👨‍💻 Welcome! Ask me about JonEric's 8+ innovative solutions, including his Microsoft-recognized automation work and $195.9M+ in tracked municipal funds!",
            "🚀 Greetings! Ready to learn about JonEric's municipal technology innovations? I can share details about his Power Platform mastery and real-world impact!"
        ]);

        this.responseVariations.set('projects_overview', [
            `🛠️ JonEric has built ${this.portfolioData.projects.length}+ award-winning solutions with measurable impact!\n\n**Project Highlights with KPIs:**\n• **ELM App** → Microsoft Award Winner | 400+ hours saved annually | 6+ cities deployed\n• **Project 25 Dashboard** → $7.2M construction oversight | 45+ change orders tracked\n• **Rental Aid Dashboard** → $53M aid distribution | 2,500+ applications processed | 85% approval rate\n• **AI Copilots** → 3,600+ automated queries | 50% faster response times\n• **Municipal Apps** → 585+ hours saved annually | 95% user satisfaction\n\n🏆 Total impact: $195.9M+ funds tracked across 6+ municipalities!`,
            
            `📊 His portfolio demonstrates real municipal impact with concrete metrics:\n\n**Key Projects with Performance Data:**\n• **Employment Lifecycle Management** → Microsoft Award Winner | 400+ hours saved | Zero compliance issues\n• **Project 25 Dashboard** → $7.2M construction oversight | 45+ change orders tracked | Real-time alerts\n• **Rental Aid Dashboard** → $53M community aid tracking | 2,500+ applications | 85% approval rate\n• **LISA AI Agent** → 3,000+ property searches automated | 75% time reduction\n\n⚡ Each solution delivers measurable efficiency gains with documented ROI!`,
            
            `🚀 JonEric's ${this.portfolioData.projects.length} projects span the complete government tech stack with proven results:\n\n**Platform Solutions with KPIs:**\n• **Power Apps** → 585+ hours saved annually | 6+ cities using solutions | 95% user satisfaction\n• **Power BI Dashboards** → $195.9M+ tracked | 45+ construction changes monitored | 99.8% accuracy\n• **AI Copilot Studio** → 3,600+ queries automated | 50% faster responses | 75% time reduction\n• **SharePoint Integration** → 100% workflow automation | Zero missed deadlines | 95% SLA compliance\n\n💡 Transforming how cities serve communities with measurable outcomes!`,
            
            `� Municipal technology excellence across multiple domains:\n\n**Impact Areas with Metrics:**\n• **Human Resources** → 400+ hours saved (ELM App) | 100% compliance maintained | 6+ cities deployed\n• **Financial Oversight** → $195.9M+ tracked accurately | 99.8% data accuracy | Real-time monitoring\n• **Citizen Services** → 30% faster response times | 95% satisfaction scores | 3,600+ queries automated\n• **Project Management** → 45+ change orders tracked | Real-time budget alerts | Zero missed deadlines\n\n🌟 Proven scalability from small towns to major cities!`
        ]);

        this.responseVariations.set('skills_overview', [
            "🛠️ JonEric brings certified expertise across the Microsoft ecosystem!\n\n**Core Specializations:**\n• Power Platform (Apps, BI, Automate, Copilot Studio)\n• Microsoft 365 (SharePoint, Teams, Entra ID)\n• Azure AI Search & GIS (ArcGIS Pro/Online)\n• PMP Project Management\n\n📜 15+ certifications including Microsoft, ESRI, and Google credentials!",
            
            "⚡ Full-stack low-code development with government focus!\n\n**Technical Expertise:**\n• Power Apps → Municipal automation solutions\n• Power BI → Financial and operational dashboards  \n• Power Automate → Workflow optimization\n• Copilot Studio → AI agent development\n• ArcGIS → Spatial analysis and mapping\n\n🎯 Skills proven across 6+ municipalities with measurable ROI!",
            
            "🚀 Technology mastery spanning development to deployment!\n\n**Platform Proficiency:**\n• Microsoft Power Platform (certified)\n• Business Intelligence & Analytics\n• AI/Copilot Development\n• Geographic Information Systems\n• Agile Project Management (PMP)\n\n💼 Each skill directly contributes to government innovation and efficiency!"
        ]);

        this.responseVariations.set('achievements', [
            `🏆 Recognition that speaks to real impact!\n\n**Top Achievements:**\n• Microsoft's Best in Automation Award (ELM App)\n• Official Microsoft case study published\n• $195.9M+ in municipal funds tracked and managed\n• 585+ staff hours saved annually through automation\n• 6+ cities using his solutions across multiple states`,
            
            `⭐ Awards backed by measurable municipal results!\n\n**Key Accomplishments:**\n• Microsoft Award Winner → ELM automation solution\n• Efficiency Expert → 30% faster municipal response times\n• Financial Steward → $195.9M+ in accurate fund tracking\n• Innovation Leader → AI copilots serving thousands of citizens`,
            
            `📈 Excellence recognized at the highest levels!\n\n**Impact Portfolio:**\n• Microsoft's Best in Automation (official case study)\n• Government Efficiency → 585+ hours saved per year\n• Financial Accuracy → $195.9M+ managed across programs\n• Scalable Solutions → Deployed in Illinois and Texas`,
            
            `🌟 Professional recognition meets community impact!\n\n**Achievement Highlights:**\n• Microsoft Award for ELM App innovation\n• Municipal Technology Leader (6+ city deployments)\n• Automation Expert (400+ hours saved in HR alone)\n• Data Steward ($195.9M+ tracked with 99%+ accuracy)`
        ]);

        this.responseVariations.set('career_growth', [
            `🚀 **Strategic Career Development with Clear Goals:**\n\n**Short-term (1-2 Years):**\n• **Technical Leadership** → Lead larger municipal technology initiatives | Mentor junior developers\n• **Certification Expansion** → Azure AI Fundamentals | Advanced Power Platform Specialist | Salesforce Admin\n• **Industry Recognition** → Speaking at Microsoft/ESRI conferences | Thought leadership in municipal tech\n• **Skills Enhancement** → Advanced AI/ML integration | Enterprise-scale Power Platform architecture\n\n**Long-term (3-5 Years):**\n• **Solution Architecture** → Senior Technical Architect role | Design enterprise municipal systems\n• **Consulting Practice** → Independent municipal technology consultant | Multi-city implementations\n• **Innovation Hub** → Lead municipal AI/automation center of excellence\n• **Industry Impact** → Published author on government technology transformation\n\n🎯 This plan leverages his Microsoft award-winning track record to scale impact from single municipalities to transforming how government operates nationwide.`,
            
            `💡 **Professional Development Strategy with Measurable Objectives:**\n\n**Technical Growth:**\n• **Cloud Architecture** → Azure solution architect certification | Enterprise-scale implementations\n• **AI Leadership** → Advanced machine learning | Predictive analytics for government\n• **Platform Mastery** → Power Platform Center of Excellence leadership | Enterprise governance\n\n**Career Advancement:**\n• **Leadership Roles** → Technical team management | Strategic planning responsibilities\n• **Industry Influence** → Conference speaking | Thought leadership articles | Best practice development\n• **Business Impact** → Municipal consulting practice | Multi-city technology transformation\n\n**Innovation Focus:**\n• **Emerging Tech** → IoT integration | Blockchain for government | Advanced AI applications\n• **Research & Development** → Patent development | Municipal technology research | Academic partnerships\n\n🚀 Building on his Microsoft award foundation to become a recognized leader in government technology transformation!`,
            
            `🎯 **Career Trajectory Built on Proven Success:**\n\n**Key Growth Areas:**\n• **Technical** → Azure cloud architecture | Advanced AI integration | Enterprise Power Platform\n• **Leadership** → Team management | Strategic planning | Stakeholder engagement\n• **Business** → Municipal budgeting expertise | Grant writing | Contract negotiation\n• **Innovation** → Emerging tech evaluation | R&D leadership | Patent development\n\n**Strategic Milestones:**\n• **Year 1-2** → Senior developer role | Team leadership | Advanced certifications\n• **Year 3-5** → Solution architect | Consulting practice | Industry recognition\n• **Year 5+** → Technology executive | Innovation center leader | Published author\n\n**Impact Vision:**\nTransform from award-winning individual contributor to industry leader shaping how government leverages technology for citizen services. Each step builds on documented success with measurable outcomes.\n\n💼 The plan: Scale proven municipal impact to national government transformation leadership!`
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
1. Detect user intent (projects, skills, achievements, blog posts, specific questions)
2. Use live portfolio data for accurate answers
3. Vary response style to maintain engagement
4. Reference specific examples when relevant
5. Keep responses concise but informative
6. When asked about a blog post by title, summarize that specific post using its excerpt and tags`;
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

        // Blog-related queries — check early so government/city keywords in blog titles
        // don't get intercepted by the municipal domain check below
        const blogKeywords = ['blog', 'post', 'article', 'wrote', 'writing', 'read', 'publish'];
        const hasBlogKeyword = blogKeywords.some(kw => lowMessage.includes(kw));
        const livePosts = (window.blogManager && window.blogManager.posts) ? window.blogManager.posts : [];
        const mentionsPostTitle = livePosts.some(p => lowMessage.includes(p.title.toLowerCase().substring(0, 20)));
        if (hasBlogKeyword || mentionsPostTitle) {
            intent.type = 'blog';
            intent.confidence = 0.95;
            return intent;
        }

        // Specific question analysis for better categorization
        if (lowMessage.includes('cons') || lowMessage.includes('disadvantage') || lowMessage.includes('weakness')) {
            intent.type = 'challenges';
            intent.confidence = 0.9;
            return intent;
        }
        
        // Dashboard-specific queries
        if (lowMessage.includes('dashboard') || lowMessage.includes('power bi') || lowMessage.includes('visualization')) {
            intent.type = 'dashboards';
            intent.confidence = 0.9;
            intent.context.projectType = 'dashboard';
            return intent;
        }
        
        // Power Platform specific queries
        if (lowMessage.includes('power platform') || (lowMessage.includes('power') && (lowMessage.includes('apps') || lowMessage.includes('automate')))) {
            intent.type = 'power_platform';
            intent.confidence = 0.9;
            intent.context.skillArea = 'microsoft';
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
            if (lowMessage.includes('gis') || lowMessage.includes('arcgis')) {
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
        
        // Career growth/plan queries
        const careerKeywords = ['career', 'growth', 'plan', 'future', 'goals', 'development', 'advancement', 'trajectory', 'next', 'where is he going', 'long term', 'short term'];
        const careerMatches = careerKeywords.filter(keyword => lowMessage.includes(keyword));
        if (careerMatches.length > 0) {
            intent.type = 'career_growth';
            intent.confidence = 0.9;
            intent.keywords = careerMatches;
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
        console.log('🔍 Generating contextual response for intent:', intent);
        
        if (intent.type === 'greeting') {
            return this.getVariedResponse('greeting');
        }
        
        // Handle specific question types with dedicated responses
        if (intent.type === 'challenges') {
            console.log('🎯 Using challenges response');
            return this.getChallengesResponse();
        }
        
        if (intent.type === 'dashboards') {
            console.log('🎯 Using dashboards response');
            return this.getDashboardResponse();
        }
        
        if (intent.type === 'power_platform') {
            console.log('🎯 Using power platform response');
            return this.getPowerPlatformResponse();
        }
        
        if (intent.type === 'projects') {
            console.log('🎯 Using projects response');
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
            console.log('🎯 Using skills response, skillArea:', intent.context?.skillArea);
            if (intent.context.skillArea) {
                const skillResponse = this.getSkillAreaResponse(intent.context.skillArea);
                if (skillResponse) {
                    console.log('✅ Got skill area response');
                    return skillResponse;
                } else {
                    console.warn('❌ No skill area response found');
                }
            } else {
                const skillsOverview = this.getVariedResponse('skills_overview');
                if (skillsOverview) {
                    console.log('✅ Got skills overview response');
                    return skillsOverview;
                } else {
                    console.warn('❌ No skills overview response found');
                }
            }
        }
        
        if (intent.type === 'achievements') {
            const variedResponse = this.getVariedResponse('achievements');
            if (variedResponse) return variedResponse;
        }
        
        if (intent.type === 'career_growth') {
            console.log('🎯 Using career growth response');
            const variedResponse = this.getVariedResponse('career_growth');
            if (variedResponse) return variedResponse;
        }

        // Blog queries always go to AI so it can reference actual post content
        if (intent.type === 'blog') {
            console.log('📚 Blog intent — deferring to AI');
            return null;
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
        
        console.log('⚠️ No contextual response found, falling back to AI API');
        return null; // Fall back to AI API
    }

    getChallengesResponse() {
        const responses = [
            "💡 **JonEric's honest self-assessment:**\n\n\"Restless curiosity\" - I move fast with new tools and technologies, sometimes too fast! \n\n🚀 **But here's the flip side:**\n• That drive transforms experiments into full-scale solutions\n• It keeps me ahead of technology trends\n• It delivers cutting-edge results for clients\n\n⚡ This 'weakness' has led to the Microsoft Award and $195.9M+ in tracked funds!",
            
            "🎯 **The challenge that drives results:**\n\nJonEric's eagerness to explore new technology can sometimes outpace documentation. But this trait has:\n\n✅ Led to innovative solutions like AI copilots\n✅ Earned Microsoft recognition\n✅ Delivered measurable municipal impact\n\n💼 In government work, this forward-thinking approach is actually a huge asset!"
        ];
        
        return this.selectUnusedResponse('challenges_responses', responses);
    }

    getDashboardResponse() {
        const responses = [
            "📊 **JonEric's dashboard portfolio delivers measurable government impact!**\n\n**Featured Dashboards with KPIs:**\n• **Project 25 Dashboard** → $7.2M construction oversight | 45+ change orders tracked | Real-time budget variance\n• **Rental Aid Dashboard** → $53M community aid tracking | 2,500+ applications processed | 85% approval rate\n• **Municipal KPI Dashboards** → 30% faster response times | 95% SLA compliance | Real-time citizen metrics\n• **Budget Tracking** → $195.9M+ total funds monitored | Monthly variance reports | Automated alerts\n\n⚡ These aren't just charts - they're decision-making tools that guide million-dollar municipal investments!",
            
            "🎯 **Power BI expertise that delivers measurable government results:**\n\n**Dashboard Categories with Performance Metrics:**\n• **Financial Oversight** → $195.9M+ tracked | 99.8% accuracy | Real-time budget alerts\n• **Project Management** → 45+ construction changes tracked | Timeline compliance monitoring\n• **Performance Metrics** → 30% improvement in response times | 95% citizen satisfaction\n• **Compliance Reporting** → 100% automated report generation | Zero missed deadlines\n\n📈 Each dashboard provides actionable insights backed by concrete performance data!"
        ];
        
        return this.selectUnusedResponse('dashboard_responses', responses);
    }

    getPowerPlatformResponse() {
        const responses = [
            "⚡ **JonEric's Power Platform mastery is comprehensive!**\n\n**Platform Expertise:**\n• **Power Apps** → Municipal automation (ELM, licensing, HR)\n• **Power BI** → Financial dashboards ($195.9M+ tracked)\n• **Power Automate** → Workflow optimization (585+ hours saved)\n• **Copilot Studio** → AI agents (3,600+ queries automated)\n\n🏆 This expertise earned the Microsoft Best in Automation Award!",
            
            "🛠️ **Full Power Platform ecosystem integration:**\n\n**Real-World Applications:**\n• **Apps** → Employee lifecycle, block party requests, water services\n• **Dashboards** → Project oversight, aid tracking, performance metrics\n• **Automation** → Approval workflows, notifications, integrations\n• **AI** → Property research, ordinance lookup, citizen services\n\n🚀 Connected with SharePoint, Teams, and Azure for complete solutions!"
        ];
        
        return this.selectUnusedResponse('power_platform_responses', responses);
    }

    getELMProjectResponse() {
        const responses = [
            "🏆 The ELM (Employment Lifecycle Management) App is JonEric's crown jewel with impressive KPIs! \n\n**Measurable Impact:**\n• **Microsoft Award Winner** → Best in Automation Award | Official case study published\n• **Time Savings** → 400+ hours saved annually in onboarding/offboarding\n• **Deployment Scale** → 6+ municipalities across Illinois and Texas\n• **Compliance** → 100% adherence to HR regulations | Zero compliance issues\n• **User Satisfaction** → 95% approval rating from municipal staff\n\n🛠️ Built with Power Apps, it unified HR workflows and became the gold standard for municipal automation.",
            
            "⭐ Great question about ELM! This award-winning solution revolutionized municipal HR with concrete results:\n\n**The Challenge:** Manual onboarding/offboarding across multiple departments\n**The Solution:** Unified Power Apps workflow with SharePoint integration\n**The Results:** \n  • 400+ hours saved annually\n  • 100% compliance maintained\n  • 6+ city deployments\n  • Microsoft recognition + case study\n  • 95% user satisfaction\n\n🚀 Perfect example of how low-code delivers enterprise-level impact with measurable ROI.",
            
            "💡 The ELM App showcases JonEric's municipal innovation expertise with proven metrics!\n\n**Technical Highlights with Performance:**\n• **Architecture** → Power Apps front-end with SharePoint backend | 99.9% uptime\n• **Automation** → Workflow automation | 85% reduction in manual tasks\n• **Integration** → Cross-department connectivity | Real-time status tracking\n• **Scalability** → 6+ cities deployed | Consistent 95% user satisfaction\n• **Recognition** → Microsoft case study | Industry best practice example\n\n🏛️ From Buffalo Grove to Fort Worth - proving scalable government solutions work!"
        ];
        
        return this.selectUnusedResponse('elm_responses', responses);
    }

    getProjectTypeResponse(type) {
        const responses = {
            dashboard: [
                "📊 JonEric's dashboard expertise delivers measurable government impact through Power BI!\n\n**Featured Dashboards with KPIs:**\n• **Project 25 Dashboard** → $7.2M construction oversight | 45+ change orders tracked | Real-time budget alerts\n• **Rental Aid Dashboard** → $53M community aid tracking | 2,500+ applications processed | 85% approval rate\n• **Municipal KPI Dashboards** → 30% improvement in response times | 95% SLA compliance | Real-time metrics\n• **Budget Tracking** → $195.9M+ total oversight | 99.8% accuracy | Automated variance reporting\n\n⚡ These decision-making tools guide million-dollar municipal investments with concrete ROI.",
                
                "🎯 His dashboard portfolio spans financial oversight to operational excellence with proven results:\n\n**Performance Categories with Metrics:**\n• **Budget Tracking** → $195.9M+ monitored | Monthly variance reports | Real-time fund allocation\n• **Project Management** → 45+ construction changes tracked | Timeline compliance | Cost variance alerts\n• **Community Services** → 2,500+ aid applications | 85% approval rate | Impact measurement\n• **Performance Analytics** → 30% faster services | 95% citizen satisfaction | Efficiency KPIs\n\n📈 Each dashboard delivers actionable insights that improve municipal decision-making with measurable outcomes."
            ],
            gis: [
                "🗺️ JonEric's GIS expertise combines spatial analysis with municipal needs!\n\n**GIS Solutions:**\n• Property research automation with AI\n• Municipal asset mapping\n• Service area optimization\n• Land use analysis\n\n🛠️ Using ArcGIS Pro/Online, he creates solutions that help cities understand their geography and optimize services.",
                
                "📍 His spatial analytics work includes:\n\n• **LISA Agent:** AI-powered land information research\n• **Municipal Mapping:** Asset and infrastructure visualization\n• **Service Optimization:** Route planning and coverage analysis\n\n🚀 Combining GIS with Power Platform creates powerful municipal tools."
            ],
            ai: [
                "🤖 JonEric's AI solutions are transforming municipal services with measurable impact!\n\n**AI Projects with Performance Metrics:**\n• **LISA (Land Info Service Agent)** → 3,000+ property searches automated | 75% time reduction | 95% accuracy\n• **Ordinance Research Copilots** → Instant policy lookup | 50% faster research | 100% compliance\n• **CRM Integration Agents** → 3,600+ automated queries | 30% response improvement | 95% satisfaction\n• **Citizen Service Bots** → 24/7 availability | 85% resolution rate | Multi-language support\n\n⚡ Built with Copilot Studio and Azure AI Search, these agents scale government capabilities with proven ROI.",
                
                "💡 His AI approach focuses on practical municipal applications with concrete results:\n\n**Impact Categories with KPIs:**\n• **Citizens** → 50% faster service through automation | 24/7 availability | 95% satisfaction\n• **Staff** → 75% reduction in research time | 3,600+ queries automated | Zero training required\n• **Government** → 30% efficiency improvement | 100% transparency | Real-time analytics\n\n🛠️ Each AI solution addresses real government pain points with measurable, documented results."
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
            "🏛️ JonEric specializes in municipal technology that delivers measurable government impact!\n\n**Cities Served with Proven Results:** Buffalo Grove, Glencoe, Brookfield, Lincolnshire, Fort Worth\n**Focus Areas with KPIs:**\n• **HR Automation** → 400+ hours saved annually | 100% compliance | 6+ deployments\n• **Financial Oversight** → $195.9M+ tracked | 99.8% accuracy | Real-time monitoring\n• **Citizen Services** → 30% faster response times | 95% satisfaction | 3,600+ queries automated\n• **Project Management** → 45+ change orders tracked | Zero missed deadlines | Real-time alerts\n\n💡 His solutions address unique local government challenges with documented ROI and scalable impact.",
            
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
        
        // Handle empty responses array
        if (!responses || responses.length === 0) {
            console.warn(`No responses available for key: ${key}`);
            return null;
        }
        
        const used = this.usedResponseSets.get(key) || [];
        const unused = responses.filter((_, index) => !used.includes(index));
        const available = unused.length > 0 ? unused : responses;
        
        const selectedIndex = Math.floor(Math.random() * available.length);
        const selected = available[selectedIndex];
        const originalIndex = responses.indexOf(selected);
        
        used.push(originalIndex);
        if (used.length >= responses.length) used.shift();
        this.usedResponseSets.set(key, used);
        
        console.log(`🎯 Selected response for ${key}:`, selected.substring(0, 50) + '...');
        return selected;
    }

    // ── Action Detection ────────────────────────────────────────────────────
    detectAction(message) {
        const lower = message.toLowerCase();

        // Require an explicit action verb to avoid false positives on info queries
        const navVerbs  = ['show me', 'take me to', 'go to', 'navigate to', 'scroll to', 'jump to', 'bring me to', 'bring up', 'open up'];
        const openVerbs = ['open', 'demo', 'launch', 'pull up'];
        const filterVerbs = ['filter', 'show only', 'only show'];

        const hasNavVerb    = navVerbs.some(v => lower.includes(v));
        const hasOpenVerb   = openVerbs.some(v => lower.includes(v));
        const hasFilterVerb = filterVerbs.some(v => lower.includes(v));

        if (!hasNavVerb && !hasOpenVerb && !hasFilterVerb) return null;

        // ── Scroll to section ──────────────────────────────────────────────
        if (hasNavVerb) {
            const sections = [
                { kw: ['ai agent', 'ai app', 'ai project'],                        id: 'ai-apps',        label: 'AI Agents' },
                { kw: ['low code', 'lowcode', 'power app', 'all project', 'projects section', 'portfolio project'], id: 'lowcode', label: 'Projects' },
                { kw: ['dashboard', 'power bi', 'visualization'],                  id: 'dashboards',     label: 'Dashboards' },
                { kw: ['gis', 'map', 'spatial', 'arcgis'],                         id: 'GIS',            label: 'GIS' },
                { kw: ['certif', 'credential'],                                    id: 'certifications', label: 'Certifications' },
                { kw: ['tech stack', 'technology stack', 'tools i use'],           id: 'tech-stack',     label: 'Tech Stack' },
                { kw: ['blog', 'article', 'writing'],                              id: 'blog',           label: 'Blog' },
                { kw: ['contact', 'reach out', 'hire', 'email', 'connect'],       id: 'contact',        label: 'Contact' },
            ];
            for (const s of sections) {
                if (s.kw.some(kw => lower.includes(kw))) {
                    return { type: 'scroll_to_section', sectionId: s.id, label: s.label };
                }
            }
        }

        // ── Open project modal ─────────────────────────────────────────────
        if (hasOpenVerb || hasNavVerb) {
            const triggers = Array.from(document.querySelectorAll('.modal-trigger[data-modal-title]'));
            let best = null, bestScore = 0;
            for (const t of triggers) {
                const title = t.getAttribute('data-modal-title').toLowerCase();
                const words = title.split(/[\s\-\/\(\)·]+/).filter(w => w.length > 3);
                const score = words.filter(w => lower.includes(w)).length;
                if (score > bestScore) { bestScore = score; best = t; }
            }
            if (bestScore >= 2 && best) {
                return { type: 'open_project', trigger: best, title: best.getAttribute('data-modal-title') };
            }
        }

        // ── Filter blog posts ──────────────────────────────────────────────
        if (hasNavVerb || hasFilterVerb) {
            const blogCats = [
                { kw: ['power platform', 'power app', 'power automate', 'power bi'], cat: 'power-platform', label: 'Power Platform' },
                { kw: ['ai', 'copilot', 'agent', 'openai', 'azure ai'],             cat: 'ai-copilot',     label: 'AI & Copilot' },
                { kw: ['dashboard', 'chart', 'visualization'],                       cat: 'dashboards',     label: 'Dashboards' },
                { kw: ['gis', 'map', 'spatial'],                                     cat: 'gis',            label: 'GIS & Data' },
                { kw: ['career', 'growth', 'professional'],                          cat: 'career',         label: 'Career' },
            ];
            for (const bc of blogCats) {
                if (bc.kw.some(kw => lower.includes(kw))) {
                    if (lower.includes('blog') || lower.includes('post') || lower.includes('article') || hasFilterVerb) {
                        return { type: 'filter_blog', category: bc.cat, label: bc.label };
                    }
                }
            }
        }

        return null;
    }

    // ── Action Execution ─────────────────────────────────────────────────
    executeAction(action) {
        if (action.type === 'scroll_to_section') {
            const el = document.getElementById(action.sectionId);
            if (!el) return false;
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                el.classList.add('ai-action-highlight');
                setTimeout(() => el.classList.remove('ai-action-highlight'), 2200);
            }, 350);
            return true;
        }

        if (action.type === 'open_project') {
            setTimeout(() => action.trigger.click(), 450);
            return true;
        }

        if (action.type === 'filter_blog') {
            if (!window.blogManager) return false;
            setTimeout(() => {
                window.blogManager.filterPosts(action.category);
                document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 350);
            return true;
        }

        return false;
    }
    // ────────────────────────────────────────────────────────────────────────

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
• Financial oversight: $195.9M+ tracked across aid, rental programs, repairs, construction oversight.
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
💵 Financial Oversight: $195.9M+ tracked in aid, budgets, and construction projects
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
            // ── Action detection: navigate / open / filter ─────────────────
            const action = this.detectAction(message);
            if (action) {
                const executed = this.executeAction(action);
                if (executed) {
                    let actionMsg;
                    if (action.type === 'scroll_to_section') {
                        actionMsg = `📍 Navigating to the **${action.label}** section...`;
                    } else if (action.type === 'open_project') {
                        actionMsg = `🚀 Opening **${action.title}** for you!`;
                    } else if (action.type === 'filter_blog') {
                        actionMsg = `🔍 Filtered blog to **${action.label}** posts and scrolled to the blog.`;
                    }
                    this.hideTypingIndicator();
                    this.addMessage(actionMsg, 'ai', false, true);
                    this.conversationHistory.push({ role: 'assistant', content: actionMsg });
                    return;
                }
            }
            // ──────────────────────────────────────────────────────────────

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
        // Only consider it repetitive if it's the EXACT SAME question or very similar
        // Don't trigger on different questions of the same category
        
        // Get recent user messages for similarity comparison
        const recentUserMessages = this.conversationHistory
            .filter(msg => msg.role === 'user')
            .slice(-3)
            .map(msg => msg.content.toLowerCase().trim());
        
        if (recentUserMessages.length < 2) return false;
        
        const currentMessage = recentUserMessages[recentUserMessages.length - 1];
        const previousMessages = recentUserMessages.slice(0, -1);
        
        // Check for very similar messages (high keyword overlap)
        for (const prevMessage of previousMessages) {
            const similarity = this.calculateMessageSimilarity(currentMessage, prevMessage);
            if (similarity > 0.7) { // 70% similarity threshold
                return true;
            }
        }
        
        // Check for identical intent AND context (very specific repetition)
        const recentIdenticalRequests = this.conversationContext.recentIntents
            .filter(prevIntent => 
                prevIntent.type === intent.type &&
                prevIntent.context?.specificProject === intent.context?.specificProject &&
                prevIntent.context?.projectType === intent.context?.projectType &&
                prevIntent.context?.skillArea === intent.context?.skillArea
            ).length;
        
        // Only trigger if 3+ identical specific requests (much higher threshold)
        return recentIdenticalRequests >= 3;
    }

    calculateMessageSimilarity(msg1, msg2) {
        // Simple keyword overlap calculation
        const words1 = msg1.split(/\s+/).filter(w => w.length > 3);
        const words2 = msg2.split(/\s+/).filter(w => w.length > 3);
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        
        return intersection.length / union.length;
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
        // Fetch live blog posts at call-time so async loads are captured
        const liveBlogPosts = (window.blogManager && window.blogManager.posts.length)
            ? window.blogManager.getPostsForContext()
            : this.portfolioData.blogPosts;

        const blogSection = liveBlogPosts.length
            ? `\nBLOG POSTS (${liveBlogPosts.length} published):\n` +
              liveBlogPosts.slice(0, 10).map(p =>
                  `• [${p.date}] "${p.title}" (${p.category})${p.excerpt ? ' — ' + p.excerpt.substring(0, 80) : ''}`
              ).join('\n')
            : '';

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
${blogSection}
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
                        certificationCount: this.portfolioData.certifications.length,
                        blogPosts: liveBlogPosts.slice(0, 10)
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
            return `🔧 **AI Assistant Temporarily Unavailable**

I'm having trouble reaching the backend right now. Please try again in a moment!

While you wait — JonEric has built 8+ innovative solutions including Power Apps, dashboards, AI agents, and GIS solutions. His ELM App won Microsoft's Best in Automation award! 🏆`;
        }
    }

    addMessage(content, sender, isError = false, isAction = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const BOT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 16h.01"/><path d="M16 16h.01"/></svg>';
        const USER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        const ACTION_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
        const avatar = isAction ? ACTION_SVG : (sender === 'ai' ? BOT_SVG : USER_SVG);
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

        const actionBadge = isAction ? '<span class="action-badge">⚡ Action</span>' : '';
        
        messageDiv.innerHTML = `
            <div class="message-avatar ${isAction ? 'action-avatar' : ''}">${avatar}</div>
            <div class="message-content ${isError ? 'error-message' : ''} ${isAction ? 'action-message' : ''}">
                ${actionBadge}
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
        
        const TYPING_BOT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 16h.01"/><path d="M16 16h.01"/></svg>';
        typingDiv.innerHTML = `
            <div class="message-avatar">${TYPING_BOT_SVG}</div>
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
