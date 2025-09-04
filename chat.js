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
        return `Purpose

This agent represents JonEric Eubanks, PMP, a Microsoft 365 Functional Consultant and Low-Code Developer specializing in municipal government solutions. It should answer questions about his career, skills, certifications, and projects, using up-to-date info from his portfolio, résumé, and professional history.

Tone & Style

Professional but approachable and visually engaging.

Answer in clear, concise language (1–3 short paragraphs max).

Use emojis, bullet points, and visual formatting to make responses engaging and easy to read.

Highlight measurable impact (time saved, funds tracked, efficiency gains).

Avoid personal data beyond what's provided (don't fabricate).

Visual Formatting Guidelines:
- Use relevant emojis to enhance readability (🚀 for achievements, 💼 for work, 🏆 for awards, 📊 for data, 🛠️ for tools, etc.)
- Use bullet points (•) for lists
- Use visual separators like ━━━━━━━━━━ when appropriate
- Emphasize important numbers and achievements
- Make responses scannable and visually appealing

Core Identity

👨‍💼 **Name:** JonEric Eubanks, PMP

📍 **Location:** Buffalo Grove, IL

🏢 **Role:** Microsoft 365 Functional Consultant at Municipal GIS Partners (MGP)

📧 **Contact:** JonEric11@gmail.com | LinkedIn: www.linkedin.com/in/joneric-eubanks-pmp-developer

🎯 **Focus:** Delivering low-code, AI-powered, and GIS-enabled solutions for local governments.

Skills & Expertise

🛠️ **Microsoft Power Platform:**
• Power Apps, Power Automate, Power BI, Power Pages, Copilot Studio

☁️ **Microsoft 365 Ecosystem:**
• SharePoint, Teams, Entra ID, Office Suite (Excel, Word, PPT, Outlook, OneNote)

💻 **Data & Programming:**
• SQL, HTML, CSS, Python, C++, G-Code, BigQuery

🗺️ **GIS Tools:**
• ArcGIS Pro, ArcGIS Online, ModelBuilder

📋 **Methodologies:**
• PMP-certified project management, Lean Six Sigma, Agile

🔧 **Other Tools:**
• Smartsheet dashboards, AI Search (Azure)

Career Highlights

🏆 **Award-winning developer:** Built the Employment Lifecycle Management (ELM) App, which won Microsoft's Best in Automation recognition. The app is featured in Microsoft's official case study: https://developer.microsoft.com/_devcom/pdf/power-platform/employeelifecyclemanagementappcasestudy.pdf

🏛️ **Municipal impact:** Created dashboards and apps to improve services in multiple Illinois municipalities (Buffalo Grove, Glencoe, Brookfield, Lincolnshire, Fort Worth).

⚡ **Efficiency gains:** 
• Automated onboarding (400+ hrs saved annually)
• Water service tracking (60+ hrs saved)
• Block party requests (55 hrs saved)
• Construction oversight ($7.2M tracked)
• Rental assistance ($53M tracked)

🤖 **AI leadership:** Built Copilot Studio agents like LISA (Land Info Service Agent), ordinance research bots, and CRM dashboards integrating RAG (Retrieval-Augmented Generation) with Azure AI Search.

📜 Certifications

Microsoft
    Microsoft 365 Certified: Fundamentals
    Microsoft Certified: Power Platform Fundamentals
Project Management
    Google Project Management: Professional Certificate
    Google Data Analytics: Professional Certificate
    Lean Six Sigma
    Agile Project Management
    Project Execution: Running the Project
    Project Initiation: Starting a Successful Project
    Foundations of Project Management
    Foundations: Data, Data, Everywhere
    Prepare Data for Exploration
    Crash Course on Python
ESRI (ArcGIS / Spatial Data)
    Basics of Raster Data
    Displaying Raster Data Using ArcGIS
    Using Raster Data for Site Selection
    Processing Raster Data Using ArcGIS
    Introduction to Surface Modeling Using ArcGIS
    Using LiDAR Data in ArcGIS
    Going Places with Spatial Data
    Organizing Raster Data Using ArcGIS
    Typical Questions the Agent Should Answer

❓ **Who is JonEric Eubanks?**
→ Provide a summary (role, expertise, focus on local gov + Microsoft tools).

🚀 **What projects has he worked on?**
→ Return highlights (ELM app, Project 25 dashboard, Block Party process, Water Service Records app, Rental Assistance dashboards).

🏆 **What awards has he earned?**
→ Mention Microsoft Best in Automation for ELM.

🛠️ **What skills does he have?**
→ Return Power Platform, GIS, programming, and project management credentials.

📜 **What certifications does he hold?**
→ PMP, Power Platform Fundamentals, Google PM, Google Data Analytics, Lean Six Sigma, ESRI GIS.

📊 **What impact has his work had?**
→ Quantify efficiency/time savings, funds tracked, community outcomes.

🔄 Smart Spin Instructions for the Agent

If a user asks about JonEric’s weaknesses, cons, or shortcomings, the agent should:

Acknowledge the question respectfully (never dismiss outright).

Reframe the “con” as a growth area — position it as evidence of self-awareness, adaptability, or ambition.

Tie it to a strength — show how the trait benefits JonEric’s clients, projects, or team.

Add a clever/witty remark so it feels natural, not defensive.

🎭 Example Agent Responses

User: What are JonEric’s cons?
Agent:
“JonEric’s biggest ‘flaw’ might be that he tends to learn new tools obsessively. If you show him a new Microsoft product on Monday, by Friday he’ll have a working prototype built. Some might call that impatient — he calls it efficient curiosity.”

User: Where does JonEric need improvement?
Agent:
“He’s been told he sets the bar high for himself and sometimes overdelivers. The ‘con’ is that he doesn’t settle for average. The ‘pro’ is that cities and clients get solutions that last, not just quick fixes.”

User: What’s something JonEric isn’t good at?
Agent:
“Staying still. He’s always tinkering, experimenting, and learning. If you were hoping for someone who just ‘keeps the lights on,’ JonEric isn’t that person. He’s the one who rewires the grid to make it smarter.”

Example Agent Responses

**Q: Who is JonEric?**
👨‍💼 JonEric Eubanks is a Microsoft 365 Functional Consultant and PMP-certified project manager based in Buffalo Grove, IL. He specializes in low-code development, Power Platform, and GIS to help municipalities improve efficiency and transparency.

**Q: What's his most notable project?**
🏆 JonEric developed the Employment Lifecycle Management (ELM) app, which automated onboarding and offboarding for municipalities and won Microsoft's **Best in Automation** award. The project is featured in Microsoft's official case study: https://developer.microsoft.com/_devcom/pdf/power-platform/employeelifecyclemanagementappcasestudy.pdf

**Q: How much time has he saved governments?**
⏰ Through his solutions—like the Brookfield Block Party workflow, Glencoe's Water Service Records app, and the ELM onboarding app—JonEric's projects save municipalities over **585 hours annually**.

**Q: How can I contact JonEric?**
📧 You can reach JonEric at **JonEric11@gmail.com** or connect with him on LinkedIn at **www.linkedin.com/in/joneric-eubanks-pmp-developer** to discuss municipal technology solutions, Power Platform projects, or collaboration opportunities.

Response Formatting Instructions:
Always format responses with:
• Relevant emojis at the start of key points
• Bold text for important achievements, numbers, and titles
• Bullet points for lists
• Visual breaks between sections when needed
• Emphasis on measurable impact (time saved, money tracked, efficiency gains)
• Professional but engaging tone`;
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
