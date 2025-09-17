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
            "👋 Hi! I'm here to help you learn about JonEric's work and expertise. What would you like to know?",
            "🤖 Hello! I can tell you about JonEric's projects, skills, and achievements. What interests you most?",
            "👨‍💻 Welcome! Ask me anything about JonEric's portfolio - from Power Platform projects to AI solutions!"
        ]);

        this.responseVariations.set('projects_overview', [
            `🛠️ JonEric has built ${this.portfolioData.projects.length}+ innovative solutions including:\n• ${this.getProjectsByCategory('app').length} Power Apps\n• ${this.getProjectsByCategory('dashboard').length} Power BI dashboards\n• ${this.getProjectsByCategory('ai').length} AI agents\n• ${this.getProjectsByCategory('gis').length} GIS solutions`,
            `📊 His portfolio spans ${this.portfolioData.projects.length} major projects across:\n• Municipal automation apps\n• Data visualization dashboards\n• AI-powered copilots\n• Geographic information systems`,
            `🚀 JonEric's ${this.portfolioData.projects.length} projects demonstrate expertise in:\n• Low-code development\n• Business intelligence\n• Artificial intelligence\n• Spatial analytics`
        ]);

        this.responseVariations.set('achievements', [
            `🏆 Key achievements:\n• ${this.portfolioData.achievements[0]?.award || 'Microsoft Award Winner'}\n• ${this.portfolioData.achievements.find(a => a.value?.includes('$'))?.value || '$195M+'} in funds tracked\n• ${this.portfolioData.achievements.find(a => a.value?.includes('+'))?.value || '585+'} hours saved annually`,
            `⭐ Notable accomplishments:\n• Award-winning ELM app recognized by Microsoft\n• Streamlined municipal operations across multiple cities\n• Delivered measurable ROI through automation`,
            `📈 Impact delivered:\n• Government efficiency improvements\n• Significant cost savings through automation\n• Enhanced citizen service delivery`
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
        
        // Greeting detection
        if (/^(hi|hello|hey|greetings)/i.test(message.trim())) {
            return { type: 'greeting', confidence: 0.9 };
        }
        
        // Project-related queries
        if (lowMessage.includes('project') || lowMessage.includes('work') || lowMessage.includes('built') || lowMessage.includes('app')) {
            return { type: 'projects', confidence: 0.8 };
        }
        
        // Skills/expertise queries
        if (lowMessage.includes('skill') || lowMessage.includes('expertise') || lowMessage.includes('experience') || lowMessage.includes('technology')) {
            return { type: 'skills', confidence: 0.8 };
        }
        
        // Achievement/award queries
        if (lowMessage.includes('award') || lowMessage.includes('achievement') || lowMessage.includes('recognition') || lowMessage.includes('accomplishment')) {
            return { type: 'achievements', confidence: 0.8 };
        }
        
        // Specific project queries
        const projectKeywords = ['elm', 'dashboard', 'power bi', 'power apps', 'gis', 'agent', 'copilot', 'ai'];
        const foundKeyword = projectKeywords.find(keyword => lowMessage.includes(keyword));
        if (foundKeyword) {
            return { type: 'specific_project', keyword: foundKeyword, confidence: 0.7 };
        }
        
        return { type: 'general', confidence: 0.5 };
    }

    generateContextualResponse(userMessage, intent) {
        // Try to use varied responses first
        if (intent.type === 'greeting') {
            return this.getVariedResponse('greeting');
        }
        
        if (intent.type === 'projects') {
            const variedResponse = this.getVariedResponse('projects_overview');
            if (variedResponse) return variedResponse;
        }
        
        if (intent.type === 'achievements') {
            const variedResponse = this.getVariedResponse('achievements');
            if (variedResponse) return variedResponse;
        }
        
        if (intent.type === 'specific_project' && intent.keyword) {
            const relevantProjects = this.portfolioData.projects.filter(p => 
                p.title.toLowerCase().includes(intent.keyword) ||
                p.descriptions.some(d => d.toLowerCase().includes(intent.keyword))
            );
            
            if (relevantProjects.length > 0) {
                const project = relevantProjects[0];
                return `🎯 Great question about ${intent.keyword}! 

**${project.title}**
${project.descriptions[0]?.substring(0, 120)}...

${project.hasSlideshow ? '📷 This project includes detailed screenshots and walkthroughs in the portfolio.' : ''}

Want to know more about any specific aspect?`;
            }
        }
        
        return null; // Fall back to AI API
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
        
        // Auto-collapse suggestions after sending a message
        autoCollapseSuggestions();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Analyze user intent
            const intent = this.analyzeUserIntent(message);
            
            // Try to generate contextual response first
            let response = this.generateContextualResponse(message, intent);
            
            // If no contextual response, use AI API
            if (!response) {
                response = await this.getAIResponse(message);
            }
            
            this.hideTypingIndicator();
            this.addMessage(response, 'ai');
            
            // Add AI response to conversation history
            this.conversationHistory.push({ role: 'assistant', content: response });
            
            // Keep conversation history manageable (last 10 exchanges)
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
            }
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again later.', 'ai', true);
            console.error('Chat error:', error);
        }
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

        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        return data.reply;
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
