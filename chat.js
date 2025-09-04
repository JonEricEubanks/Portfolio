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
        
        this.initializeEventListeners();
        this.contextPrompt = this.buildContextPrompt();
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
• Recognized by Microsoft, trusted by municipalities, and backed by measurable impact
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Clear input and disable send button
        this.chatInput.value = '';
        this.sendButton.disabled = true;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Auto-collapse suggestions after sending a message
        autoCollapseSuggestions();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'ai');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again later.', 'ai', true);
            console.error('Chat error:', error);
        }
    }

    async getAIResponse(userMessage) {
        // In a real implementation, you would make an API call to your backend
        // which would then call OpenAI. Never expose your API key in frontend code!
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                context: this.contextPrompt
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
