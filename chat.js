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

        // Extract project data only from the project sections — certifications and the
        // recommendation letter are also .modal-trigger elements and must not count as projects
        JonEricChatBot.PROJECT_SECTIONS.forEach(section => {
            document.querySelectorAll(`#${section.id} .modal-trigger`).forEach(trigger => {
                const title = trigger.getAttribute('data-modal-title');
                const descriptions = trigger.getAttribute('data-modal-descriptions')
                    || trigger.getAttribute('data-modal-description'); // dashboard/GIS cards use the singular form
                const slideshow = trigger.getAttribute('data-modal-slideshow');

                if (title && descriptions) {
                    data.projects.push({
                        title: title,
                        shortTitle: this.shortProjectTitle(title),
                        descriptions: descriptions.split('||'),
                        hasSlideshow: !!slideshow,
                        category: this.categorizeProject(title),
                        section: section.id,
                        sectionLabel: section.label
                    });
                }
            });
        });

        // Extract credentials, keeping their group (certification / applied-skill / course)
        document.querySelectorAll('.certification-item').forEach(cert => {
            const title = cert.getAttribute('data-modal-title') || cert.textContent.replace(/\s+/g, ' ').trim();
            const org = cert.querySelector('.certification-org')?.textContent;
            const type = cert.closest('[data-credential-type]')?.getAttribute('data-credential-type') || 'certification';
            if (title) {
                data.certifications.push({ title, organization: org, type });
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

    shortProjectTitle(title) {
        const short = title.split(/\s[—–·]\s/)[0].trim();
        return short.length > 60 ? short.substring(0, 57) + '…' : short;
    }

    // Projects grouped by portfolio section, in page order; empty sections are dropped
    getProjectGroups() {
        return JonEricChatBot.PROJECT_SECTIONS
            .map(section => ({
                ...section,
                projects: this.portfolioData.projects.filter(p => p.section === section.id)
            }))
            .filter(group => group.projects.length > 0);
    }

    // Answers "what projects has he worked on" from the live page data instead of canned text.
    // `type` optionally narrows to one section ('ai', 'app', 'dashboard', 'gis').
    getLiveProjectsResponse(type) {
        const groups = this.getProjectGroups().filter(g => !type || g.type === type);
        if (groups.length === 0) return null;

        const MAX_NAMES = 6;
        const total = groups.reduce((sum, g) => sum + g.projects.length, 0);
        const lines = groups.map(g => {
            const names = g.projects.slice(0, MAX_NAMES).map(p => p.shortTitle).join(', ');
            const extra = g.projects.length - MAX_NAMES;
            return `• **${g.label} (${g.projects.length})** → ${names}${extra > 0 ? ` and ${extra} more` : ''}`;
        });

        const intro = type
            ? `JonEric's ${groups[0].label} portfolio includes ${total} projects:`
            : `JonEric's portfolio showcases **${total} projects** across ${groups.length} areas:`;
        const sources = ['[Featured Work](#awards)', ...groups.map(g => `[${g.label}](#${g.id})`)];

        return `${intro}\n\n${lines.join('\n')}\n\nHe led every one of them; the three award winners are written up in Featured Work. Say "open" plus a project name to view it.\n\nSources: ${sources.join(' · ')}`;
    }

    // Featured Work case studies, read from the rendered #awards section
    getFeaturedCases() {
        const clean = t => (t || '').replace(/\s+/g, ' ').trim();
        return Array.from(document.querySelectorAll('#awards .award-case')).map(el => {
            const outcome = Array.from(el.querySelectorAll('.award-step'))
                .find(step => /outcome/i.test(step.querySelector('.award-step-label')?.textContent || ''));
            return {
                id: el.id,
                title: clean(el.querySelector('h3')?.textContent),
                award: clean(el.querySelector('.award-case-sub')?.textContent),
                role: clean(el.querySelector('.award-case-role')?.textContent).replace(/^My role:\s*/i, ''),
                outcome: clean(outcome?.querySelector('p')?.textContent),
                links: Array.from(el.querySelectorAll('.award-case-links a'))
                    .map(a => ({ label: clean(a.textContent).replace(/\s*↗$/, ''), href: a.href }))
            };
        });
    }

    getFeaturedWorkResponse() {
        const cases = this.getFeaturedCases();
        if (!cases.length) return null;
        const lines = cases.map(c => `• **${c.title}** — ${c.award}${c.role ? `. Role: ${c.role}` : ''}`);
        return `JonEric's award-winning work — each a project he led:\n\n${lines.join('\n')}\n\nSources: [Featured Work](#awards)`;
    }

    getFeaturedCaseResponse(id) {
        const c = this.getFeaturedCases().find(x => x.id === id);
        if (!c) return null;
        const links = c.links.map(l => `[${l.label}](${l.href})`);
        const details = [c.role && `• **Role:** ${c.role}`, c.outcome && `• **Outcome:** ${c.outcome}`].filter(Boolean);
        return `**${c.title}** — ${c.award}\n\n${details.join('\n')}\n\nSources: ${[`[Featured Work](#${c.id})`, ...links].join(' · ')}`;
    }

    getCredentialsResponse() {
        const creds = this.portfolioData.certifications;
        if (!creds.length) return null;
        const titles = type => creds.filter(c => c.type === type).map(c => c.title);
        const certs = titles('certification');
        const applied = titles('applied-skill');
        const courses = titles('course');
        const parts = [];
        if (certs.length) parts.push(`**Certifications (${certs.length})**\n${certs.map(t => `• ${t}`).join('\n')}`);
        if (applied.length) parts.push(`**Microsoft Applied Skills (${applied.length})**\n${applied.map(t => `• ${t}`).join('\n')}`);
        if (courses.length) parts.push(`Plus ${courses.length} completed courses (Google project management and data analytics, Esri ArcGIS).`);
        return `${parts.join('\n\n')}\n\nSources: [Certifications](#certifications)`;
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
            "Hi! I'm JonEric's portfolio assistant. Ask about his award-winning AI agents, the projects he has led, his certifications, or his published writing — I'll link you to where it appears on this page.",
            "Hello! I can walk you through JonEric's featured work, his AI and Power Platform projects, or his career history, with links to the source on this page."
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
        const livePosts = (window.blogManager && window.blogManager.getAllPosts) ? window.blogManager.getAllPosts() : [];
        const mentionsPostTitle = livePosts.some(p => lowMessage.includes(p.title.toLowerCase().substring(0, 20)));
        if (hasBlogKeyword || mentionsPostTitle) {
            intent.type = 'blog';
            intent.confidence = 0.95;
            return intent;
        }

        // Specific question analysis for better categorization
        if (/\bcons\b/.test(lowMessage) || lowMessage.includes('disadvantage') || lowMessage.includes('weakness')) {
            intent.type = 'challenges';
            intent.confidence = 0.9;
            return intent;
        }

        // "What projects has he worked on / built?" — answered from the live project list.
        // Checked before the dashboard/Power Platform topics so a tech name inside the question
        // narrows the list instead of hijacking it into a canned skills answer.
        const asksForProjects = /\bprojects?\b|\b(worked|working|work) on\b|\bbuilt\b|\bportfolio\b/.test(lowMessage);
        const asksForSkillsOrOther = /\b(experience|skills?|expertise|certif\w*|awards?|career)\b/.test(lowMessage);
        if (asksForProjects && !asksForSkillsOrOther) {
            intent.type = 'projects';
            intent.confidence = 0.9;
            intent.keywords = ['project'];
            intent.context.listProjects = true;
            if (/\belm\b|employment/.test(lowMessage)) {
                intent.context.specificProject = 'elm';
                intent.context.listProjects = false;
            } else if (/\bdashboards?\b|power bi/.test(lowMessage)) {
                intent.context.projectType = 'dashboard';
            } else if (/\bgis\b|\bmaps?\b|\bmapping\b|spatial|arcgis/.test(lowMessage)) {
                intent.context.projectType = 'gis';
            } else if (/\bai\b|\bagents?\b|copilot/.test(lowMessage)) {
                intent.context.projectType = 'ai';
            }
            if (/government|municipal|\bcity\b|\bpublic\b/.test(lowMessage)) {
                intent.context.domain = 'government';
            }
            if (message.includes('?')) {
                intent.context.isQuestion = true;
            }
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
            } else if (/\bai\b|\bagents?\b|copilot/.test(lowMessage)) {
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
        if (intent.type === 'greeting') {
            return this.getVariedResponse('greeting');
        }

        // "How/why" questions need explanation, not a list — let the grounded AI answer them
        if (/^\s*(how|why|explain|describe)\b/i.test(userMessage)) {
            return null;
        }

        if (intent.type === 'projects') {
            if (intent.context.specificProject === 'elm') {
                return this.getFeaturedCaseResponse('award-elm') || this.getLiveProjectsResponse('app');
            }
            return this.getLiveProjectsResponse(intent.context.projectType);
        }

        if (intent.type === 'dashboards') {
            return this.getLiveProjectsResponse('dashboard');
        }

        if (intent.type === 'achievements') {
            return this.getFeaturedWorkResponse();
        }

        if (intent.type === 'skills' && /certif|credential/i.test(userMessage)) {
            return this.getCredentialsResponse();
        }

        // Everything else (Power Platform, skills, career, blog, comparisons, ...) goes to the
        // AI, which is instructed to answer only from the page data it is given and cite sources.
        return null;
    }

    // ── Action Detection ────────────────────────────────────────────────────
    detectAction(message) {
        const lower = message.toLowerCase();

        // ── Guided tour (highest priority, no verb needed) ─────────────────
        if (/\btour\b|walk me through|guided tour|show everything|take me through/.test(lower)) {
            return { type: 'guided_tour' };
        }

        // ── Career timeline ────────────────────────────────────────────────
        if (/career.*timeline|timeline|career.*journey|career.*path|career.*story|his journey/.test(lower)) {
            return { type: 'open_career_timeline' };
        }

        // ── Stop tour ──────────────────────────────────────────────────────
        if (this.tourActive && /stop tour|stop|cancel tour|exit tour|quit/.test(lower)) {
            return { type: 'stop_tour' };
        }

        // ── Replay career metrics counters ────────────────────────────────
        if (/replay.*(stat|counter|number|metric)|show.*(impact.*number|metric)|animate.*(stat|counter|number)|impact number|show metric/.test(lower)) {
            return { type: 'replay_counters' };
        }

        // ── Copy email to clipboard ───────────────────────────────────────
        if (/copy.*email|get.*email|email.*address|copy.*contact/.test(lower)) {
            return { type: 'copy_email' };
        }

        // ── Project spotlight by technology ───────────────────────────────
        if (/spotlight|highlight.*project|show only.*project|filter.*project/.test(lower)) {
            const techMap = [
                { kw: ['power platform', 'power app', 'power automate', 'power bi'], tech: 'power_platform', label: 'Power Platform' },
                { kw: ['ai', 'copilot', 'agent'],                                    tech: 'ai',            label: 'AI & Copilot' },
                { kw: ['gis', 'map', 'spatial', 'arcgis'],                           tech: 'gis',           label: 'GIS' },
                { kw: ['dashboard', 'power bi'],                                     tech: 'dashboard',     label: 'Dashboard' },
                { kw: ['sharepoint', 'intranet'],                                    tech: 'sharepoint',    label: 'SharePoint' },
            ];
            for (const t of techMap) {
                if (t.kw.some(kw => lower.includes(kw))) {
                    return { type: 'spotlight_projects', tech: t.tech, label: t.label };
                }
            }
        }

        // ── Open blog post by keyword ─────────────────────────────────────
        if ((lower.includes('read') || lower.includes('open')) && (lower.includes('blog') || lower.includes('article') || lower.includes('post'))) {
            const posts = (window.blogManager && window.blogManager.posts) ? window.blogManager.posts : [];
            for (const post of posts) {
                const words = post.title.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
                if (words.some(w => lower.includes(w))) {
                    return { type: 'open_blog_post', postId: post.id, title: post.title };
                }
            }
        }

        // ── Share section deep-link ───────────────────────────────────────
        if (/copy.*link|share.*link|get.*link|link to/.test(lower)) {
            const sectionMap = [
                { kw: ['ai agent', 'ai app'],          id: 'ai-apps',        label: 'AI Agents' },
                { kw: ['project', 'low code'],         id: 'lowcode',        label: 'Projects' },
                { kw: ['dashboard'],                   id: 'dashboards',     label: 'Dashboards' },
                { kw: ['gis', 'map'],                  id: 'GIS',            label: 'GIS' },
                { kw: ['certif'],                      id: 'certifications', label: 'Certifications' },
                { kw: ['blog'],                        id: 'blog',           label: 'Blog' },
                { kw: ['contact'],                     id: 'contact',        label: 'Contact' },
            ];
            for (const s of sectionMap) {
                if (s.kw.some(kw => lower.includes(kw))) {
                    return { type: 'share_link', sectionId: s.id, label: s.label };
                }
            }
        }

        // Require an explicit action verb for remaining actions
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
                { kw: ['contact', 'reach out', 'hire', 'connect'],                id: 'contact',        label: 'Contact' },
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
                const words = title.split(/[\s\-\/\(\)·]+/).filter(w => w.length >= 3);
                const score = words.filter(w => lower.includes(w)).length;
                if (score > bestScore) { bestScore = score; best = t; }
            }
            if (bestScore >= 1 && best) {
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
        if (action.type === 'guided_tour') {
            this.startGuidedTour();
            return true;
        }

        if (action.type === 'stop_tour') {
            this.tourActive = false;
            return true;
        }

        if (action.type === 'open_career_timeline') {
            window.open('career-timeline.html', '_blank');
            return true;
        }

        if (action.type === 'replay_counters') {
            document.getElementById('career-metrics')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
                document.querySelectorAll('.counter[data-target]').forEach(counter => {
                    const target = parseFloat(counter.getAttribute('data-target'));
                    counter.innerText = '0';
                    const inc = target / 150;
                    const tick = () => {
                        const cur = parseFloat(counter.innerText);
                        if (cur < target) {
                            counter.innerText = target % 1 !== 0
                                ? Math.min(cur + inc, target).toFixed(1)
                                : Math.ceil(Math.min(cur + inc, target));
                            setTimeout(tick, 8);
                        } else {
                            counter.innerText = target % 1 !== 0 ? target.toFixed(1) : target;
                        }
                    };
                    tick();
                });
            }, 700);
            return true;
        }

        if (action.type === 'copy_email') {
            this._copyText('joneric11@gmail.com');
            return true;
        }

        if (action.type === 'share_link') {
            const url = `${location.origin}${location.pathname}#${action.sectionId}`;
            this._copyText(url);
            return true;
        }

        if (action.type === 'open_blog_post') {
            setTimeout(() => {
                document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => {
                    if (window.blogManager?.openPost) window.blogManager.openPost(action.postId);
                }, 700);
            }, 350);
            return true;
        }

        if (action.type === 'spotlight_projects') {
            document.querySelectorAll('.spotlight-match,.spotlight-dim').forEach(el =>
                el.classList.remove('spotlight-match', 'spotlight-dim'));
            const kws = {
                power_platform: ['power apps', 'power automate', 'power bi', 'power pages', 'copilot studio'],
                ai:             ['ai', 'copilot', 'agent', 'lisa', 'civicgrant', 'civiclens', 'maintain', 'kaizen'],
                gis:            ['gis', 'arcgis', 'spatial', 'land info'],
                dashboard:      ['dashboard', 'power bi', 'smartsheet'],
                sharepoint:     ['sharepoint', 'intranet'],
            }[action.tech] || [action.tech];
            let count = 0;
            document.querySelectorAll('.modal-trigger[data-modal-title]').forEach(card => {
                const text = ((card.getAttribute('data-modal-title') || '') + ' ' + (card.getAttribute('data-modal-descriptions') || '')).toLowerCase();
                const match = kws.some(kw => text.includes(kw));
                card.classList.add(match ? 'spotlight-match' : 'spotlight-dim');
                if (match) {
                    count++;
                    if (window.revealProjectCard) window.revealProjectCard(card);
                }
            });
            // Scroll to first matching card
            const first = document.querySelector('.spotlight-match');
            if (first) setTimeout(() => first.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
            setTimeout(() => document.querySelectorAll('.spotlight-match,.spotlight-dim').forEach(el =>
                el.classList.remove('spotlight-match', 'spotlight-dim')), 8000);
            return count;
        }

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

    // ── Guided tour ───────────────────────────────────────────────────────
    startGuidedTour() {
        this.tourActive = true;
        const stops = [
            { id: 'awards',         msg: '**Stop 1 — Featured Work:** Three projects JonEric led that won global Microsoft competitions: CivicGrant IQ (Best IQ Agent, ~31,000 contestants), CivicLens (Best Agent, ~1,000 contestants), and the ELM app (Best in Automation, live in 6 municipalities).' },
            { id: 'writing',        msg: '**Stop 2 — Published Writing:** His Microsoft Tech Community articles on multi-agent patterns in Microsoft Foundry, Copilot Studio harnesses, and CivicGrant IQ.' },
            { id: 'ai-apps',        msg: '**Stop 3 — AI Agents:** CivicGrant IQ, CivicLens, MAINTAIN AI, and Kaizen AI — multi-agent systems he built solo.' },
            { id: 'lowcode',        msg: '**Stop 4 — Low-Code Apps:** Power Platform apps for municipal clients, including ELM and LISA, a GIS agent that automates 3,600+ property lookups a year.' },
            { id: 'dashboards',     msg: '**Stop 5 — Dashboards:** Power BI and Smartsheet dashboards, including oversight of a $7.2M capital project and $53M in rental assistance.' },
            { id: 'certifications', msg: '**Stop 6 — Certifications:** GitHub Certified: Agentic AI Developer, Azure AI Fundamentals, two Microsoft Applied Skills, PMP, and more.' },
            { id: 'contact',        msg: '**Stop 7 — Contact:** Tour complete. JonEric is open to AI Engineer roles — connect on LinkedIn, email joneric11@gmail.com, or download the résumé.' },
        ];
        this.addMessage(`Starting portfolio tour — ${stops.length} stops. Say "stop tour" at any time to exit.`, 'ai', false, true);
        stops.forEach((stop, i) => {
            setTimeout(() => {
                if (!this.tourActive) return;
                const el = document.getElementById(stop.id);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    el.classList.add('ai-action-highlight');
                    setTimeout(() => el.classList.remove('ai-action-highlight'), 2200);
                }
                this.addMessage(stop.msg, 'ai', false, true);
                this.conversationHistory.push({ role: 'assistant', content: stop.msg });
            }, i * 4500 + 800);
        });
        setTimeout(() => { this.tourActive = false; }, stops.length * 4500 + 1200);
    }

    // ── Clipboard helper ──────────────────────────────────────────────────
    _copyText(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(() => this._copyFallback(text));
        } else {
            this._copyFallback(text);
        }
    }
    _copyFallback(text) {
        const el = Object.assign(document.createElement('textarea'), { value: text });
        Object.assign(el.style, { position: 'fixed', opacity: '0' });
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
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

        // "Sources:" links to page sections: scroll there, closing the chat on small screens
        this.messagesContainer.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-section]');
            const target = link && document.getElementById(link.dataset.section);
            if (!target) return;
            e.preventDefault();
            if (window.innerWidth <= 768) {
                document.getElementById('chat-sidebar')?.classList.remove('open');
            }
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.classList.add('ai-action-highlight');
            setTimeout(() => target.classList.remove('ai-action-highlight'), 2200);
        });
    }

    buildContextPrompt() {
        return `You are the portfolio assistant on JonEric Eubanks' website. Recruiters and hiring managers use you to learn about his work.

ABOUT JONERIC (verified)
• JonEric Eubanks, PMP — AI engineer and Power Platform developer in Buffalo Grove, IL; open to AI Engineer roles.
• MGP (Municipal GIS Partners), 2023–present: Low-Code Developer (Dec 2024–present), Microsoft 365 Functional Consultant (Feb–Dec 2024), GIS Specialist (2023–Feb 2024).
• City of Fort Worth, 2014–2023: Development Project Coordinator (2022–2023), Neighborhood Program Coordinator (2017–2022), Neighborhood Services Liaison (2014–2017).
• He was the lead on every project in this portfolio. CivicGrant IQ, CivicLens, MAINTAIN AI, and Kaizen AI were solo builds.

RULES
1. Answer only with facts from this prompt and the PORTFOLIO DATA. Never invent numbers, clients, dates, employers, awards, or future plans.
2. If the answer is not in the data, say so plainly and point to the résumé or the Contact section.
3. Professional, concise tone: under 150 words unless asked to list items (then list every item). Short bullets and **bold** names are fine; at most one emoji.
4. End every answer with a line starting "Sources:" followed by 1–3 markdown links chosen only from SOURCE LINKS, e.g. Sources: [Featured Work](#awards)
5. Link to an external article, demo, or case study only with a URL that appears in the PORTFOLIO DATA.

SOURCE LINKS
[Featured Work](#awards) · [Published Writing](#writing) · [AI Agents](#ai-apps) · [Low-Code Apps](#lowcode) · [Dashboards](#dashboards) · [GIS Maps](#GIS) · [Certifications](#certifications) · [Career Journey](#journey) · [Blog](#blog) · [Contact](#contact) · [Résumé (PDF)](resume/JonEric-Eubanks-Resume.pdf)`;
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
            // ── Action detection ──────────────────────────────────────────
            const action = this.detectAction(message);
            if (action) {
                const result = this.executeAction(action);
                if (result !== false) {
                    this.hideTypingIndicator();
                    // guided_tour manages its own messages
                    if (action.type === 'guided_tour') return;
                    let actionMsg;
                    if (action.type === 'stop_tour') {
                        actionMsg = 'Tour stopped.';
                    } else if (action.type === 'scroll_to_section') {
                        actionMsg = `Navigating to the **${action.label}** section...`;
                    } else if (action.type === 'open_project') {
                        actionMsg = `Opening **${action.title}** for you.`;
                    } else if (action.type === 'filter_blog') {
                        actionMsg = `Filtered blog to **${action.label}** posts.`;
                    } else if (action.type === 'replay_counters') {
                        actionMsg = `Replaying career metrics — counting up from zero.`;
                    } else if (action.type === 'copy_email') {
                        actionMsg = `Email copied to clipboard: joneric11@gmail.com`;
                    } else if (action.type === 'share_link') {
                        actionMsg = `Link copied to clipboard: ${location.origin}${location.pathname}#${action.sectionId}`;
                    } else if (action.type === 'open_blog_post') {
                        actionMsg = `Opening blog post: **${action.title}**`;
                    } else if (action.type === 'spotlight_projects') {
                        actionMsg = `Spotlighting **${result}** ${action.label} project${result !== 1 ? 's' : ''} on the page. Resets in 8 seconds.`;
                    } else if (action.type === 'open_career_timeline') {
                        actionMsg = `Opening career timeline in a new tab.`;
                    }
                    if (actionMsg) {
                        this.addMessage(actionMsg, 'ai', false, true);
                        this.conversationHistory.push({ role: 'assistant', content: actionMsg });
                    }
                    return;
                }
            }
            // ─────────────────────────────────────────────────────────────

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

    // Everything the AI may cite, read from the rendered page at question time
    buildPortfolioDataContext() {
        const clean = t => (t || '').replace(/\s+/g, ' ').trim();

        const featured = this.getFeaturedCases().map(c =>
            `• ${c.title} — ${c.award}. Role: ${c.role}. Outcome: ${c.outcome}` +
            (c.links.length ? ` Links: ${c.links.map(l => `${l.label} ${l.href}`).join(', ')}` : '')
        ).join('\n');

        const projects = this.getProjectGroups().map(g =>
            `${g.label} (${g.projects.length}) [#${g.id}]:\n` +
            g.projects.map(p => `• ${p.shortTitle}: ${clean(p.descriptions[0]).substring(0, 220)}`).join('\n')
        ).join('\n\n');

        const credentials = [['certification', 'Certifications'], ['applied-skill', 'Microsoft Applied Skills'], ['course', 'Courses & training']]
            .map(([type, label]) => {
                const items = this.portfolioData.certifications.filter(c => c.type === type).map(c => c.title);
                return items.length ? `${label} (${items.length}): ${items.join('; ')}` : '';
            })
            .filter(Boolean)
            .join('\n');

        const writing = Array.from(document.querySelectorAll('#writing .writing-card')).map(a =>
            `• ${clean(a.querySelector('h3')?.textContent)} — ${clean(a.querySelector('.writing-card-meta')?.textContent)} — ${a.href}`
        ).join('\n');

        const blogPosts = (window.blogManager && window.blogManager.getPostsForContext)
            ? window.blogManager.getPostsForContext()
            : this.portfolioData.blogPosts;
        const blog = blogPosts.slice(0, 25).map(p =>
            `• [${p.date}] "${p.title}"${p.source ? ` (published on ${p.source}${p.url ? ', ' + p.url : ''})` : ''}` +
            (p.excerpt ? ` — ${p.excerpt.substring(0, 140)}` : '')
        ).join('\n');

        const metrics = Array.from(document.querySelectorAll('.hero-metrics .metric-item')).map(m =>
            `${clean(m.querySelector('.metric-value')?.textContent)} ${clean(m.querySelector('.metric-label')?.textContent)}`
        ).join('; ');

        return { featured, projects, credentials, writing, blog, blogPosts, metrics };
    }

    async getAIResponse(userMessage) {
        const ctx = this.buildPortfolioDataContext();
        const testimonial = (this.portfolioData.testimonials[0] || '').replace(/\s+/g, ' ').trim();

        const enhancedContext = `${this.contextPrompt}

PORTFOLIO DATA (live from the page)

FEATURED WORK [#awards]:
${ctx.featured || '• (not available)'}

ALL PROJECTS (${this.portfolioData.projects.length}):
${ctx.projects}

CREDENTIALS [#certifications]:
${ctx.credentials}

PUBLISHED TECHNICAL WRITING [#writing]:
${ctx.writing || '• (not available)'}

BLOG POSTS (${ctx.blogPosts.length}) [#blog] — list every one when asked what he has written:
${ctx.blog || '• (none loaded)'}

HEADLINE METRICS SHOWN ON THE SITE: ${ctx.metrics || 'n/a'}

TESTIMONIAL: ${testimonial || 'n/a'}`;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    context: enhancedContext,
                    conversationHistory: this.conversationHistory.slice(-6),
                    portfolioData: {
                        projectCount: this.portfolioData.projects.length,
                        projects: this.portfolioData.projects.map(p => ({
                            title: p.shortTitle,
                            category: p.category,
                            sectionLabel: p.sectionLabel,
                            description: p.descriptions[0]?.substring(0, 100)
                        })),
                        achievements: this.portfolioData.achievements,
                        certificationCount: this.portfolioData.certifications.filter(c => c.type === 'certification').length,
                        blogPosts: ctx.blogPosts.slice(0, 25)
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.reply;
        } catch (error) {
            console.error('Chat API call failed:', error);
            return `I can't reach the AI service right now, so here are the essentials:\n\n• **Featured work:** three projects JonEric led that won global Microsoft competitions — CivicGrant IQ, CivicLens, and the ELM app.\n• **Résumé:** his full work history as a PDF.\n\nSources: [Featured Work](#awards) · [Résumé (PDF)](resume/JonEric-Eubanks-Resume.pdf) · [Contact](#contact)`;
        }
    }

    // Escapes text, then applies the small markdown subset the bot uses: **bold**, bullets
    // (•, *, -), line breaks, and [label](href) links limited to page anchors, site files,
    // https URLs, and mailto. Anything else renders as plain text.
    formatMessage(text) {
        const escape = str => str
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        let html = escape(String(text));
        html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
            const raw = href.replace(/&amp;/g, '&');
            if (/^#[A-Za-z][\w-]*$/.test(raw)) {
                return `<a href="${href}" class="chat-source-link" data-section="${raw.slice(1)}">${label}</a>`;
            }
            if (/^(https:\/\/|mailto:)/i.test(raw) || /^[\w-]+(\/[\w.-]+)*\.(pdf|html)$/i.test(raw)) {
                return `<a href="${href}" class="chat-source-link" target="_blank" rel="noopener noreferrer">${label}</a>`;
            }
            return label;
        });
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/^\s*[•*-]\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/<li>.*?<\/li>(?:\n<li>.*?<\/li>)*/g, list => `<ul>${list.replace(/\n/g, '')}</ul>`);
        return html.replace(/\n/g, '<br>');
    }

    addMessage(content, sender, isError = false, isAction = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const BOT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 16h.01"/><path d="M16 16h.01"/></svg>';
        const USER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        const ACTION_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
        const avatar = isAction ? ACTION_SVG : (sender === 'ai' ? BOT_SVG : USER_SVG);
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const safeContent = content || 'Sorry, I encountered an error. Please try again later.';
        const processedContent = this.formatMessage(safeContent);

        const actionBadge = isAction ? '<span class="action-badge">Action</span>' : '';
        
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

// Page sections that hold portfolio projects, in page order. `type` matches intent.context.projectType.
JonEricChatBot.PROJECT_SECTIONS = [
    { id: 'ai-apps', label: 'AI Agents & Applications', type: 'ai' },
    { id: 'lowcode', label: 'Low-Code Apps', type: 'app' },
    { id: 'dashboards', label: 'Dashboards', type: 'dashboard' },
    { id: 'GIS', label: 'GIS Maps', type: 'gis' }
];

// Exported for unit tests only (Node/Jest) — `module` is undefined in browsers so this is a no-op there
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JonEricChatBot };
}
