/**
 * Tests that the chatbot answers project questions from the real index.html
 * (live scrape) instead of canned text. Pure DOM/logic, no network calls.
 */
const fs = require('fs');
const path = require('path');

function createChatBotWithPage() {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1].replace(/<script[\s\S]*?<\/script>/gi, '');
    document.body.innerHTML = body;
    window.blogManager = { posts: [], getPostsForContext: () => [] };

    jest.resetModules();
    const { JonEricChatBot } = require('../chat.js');
    return new JonEricChatBot();
}

describe('live project data', () => {
    let bot;

    beforeEach(() => {
        bot = createChatBotWithPage();
    });

    test('scrapes only real projects (no certifications or recommendation letter)', () => {
        const titles = bot.portfolioData.projects.map(p => p.title);
        expect(titles.length).toBeGreaterThan(0);
        expect(titles).not.toContain('Letter of Recommendation');
        expect(titles).not.toContain('Microsoft Transcript');
        expect(titles.some(t => t.includes('ELM App'))).toBe(true);
        expect(titles.some(t => t.includes('CivicLens'))).toBe(true);
    });

    test('scrapes certifications from the page', () => {
        expect(bot.portfolioData.certifications.length).toBeGreaterThan(0);
    });

    test('"what projects has he worked on" lists projects from every section', () => {
        const intent = bot.analyzeUserIntent('What projects has JonEric worked on?');
        const reply = bot.generateContextualResponse('What projects has JonEric worked on?', intent);
        expect(reply).toContain('AI Agents & Applications');
        expect(reply).toContain('Low-Code Apps');
        expect(reply).toContain('Dashboards');
        expect(reply).toContain('GIS Maps');
        expect(reply).toContain('CivicLens');
        expect(reply).toContain(`${bot.portfolioData.projects.length} projects`);
    });

    test('narrowed list only includes the requested section', () => {
        const intent = bot.analyzeUserIntent('What GIS projects has he built?');
        const reply = bot.generateContextualResponse('What GIS projects has he built?', intent);
        expect(reply).toContain('GIS Maps');
        expect(reply).not.toContain('AI Agents & Applications');
    });

    test('project lists cite the page sections they came from', () => {
        const intent = bot.analyzeUserIntent('What projects has JonEric worked on?');
        const reply = bot.generateContextualResponse('What projects has JonEric worked on?', intent);
        expect(reply).toMatch(/Sources: .*\[Featured Work\]\(#awards\)/);
        expect(reply).toContain('[GIS Maps](#GIS)');
    });

    test('ELM questions are answered from the Featured Work case study, including the role', () => {
        const intent = bot.analyzeUserIntent('Tell me about the ELM project');
        const reply = bot.generateContextualResponse('Tell me about the ELM project', intent);
        expect(reply).toContain('Employment Lifecycle Management');
        expect(reply).toContain('Hanover Park');
        expect(reply).toContain('[Featured Work](#award-elm)');
    });

    test('award questions list the three featured cases with roles', () => {
        const intent = bot.analyzeUserIntent('What awards has JonEric won?');
        const reply = bot.generateContextualResponse('What awards has JonEric won?', intent);
        ['CivicGrant IQ', 'CivicLens', 'Employment Lifecycle Management', 'Role:'].forEach(text => expect(reply).toContain(text));
    });

    test('credentials are grouped by type, with courses separated from certifications', () => {
        const types = bot.portfolioData.certifications.map(c => c.type);
        expect(types).toContain('certification');
        expect(types).toContain('applied-skill');
        expect(types).toContain('course');
        expect(bot.portfolioData.certifications.map(c => c.title)).not.toContain('Microsoft Transcript');

        const reply = bot.generateContextualResponse('What certifications does he have?', bot.analyzeUserIntent('What certifications does he have?'));
        expect(reply).toContain('GitHub Certified: Agentic AI Developer');
        expect(reply).toContain('Microsoft Applied Skills (2)');
        expect(reply).not.toContain('Basics of Raster Data');
    });

    test('open-ended and comparison questions defer to the grounded AI instead of canned text', () => {
        ['Tell me about his Power Platform experience', 'How does this compare to a vendor product?', 'How did he build the Project 25 dashboard?']
            .forEach(q => expect(bot.generateContextualResponse(q, bot.analyzeUserIntent(q))).toBeNull());
    });

    test('AI context includes featured work, writing, and grounding rules', () => {
        const ctx = bot.buildPortfolioDataContext();
        expect(ctx.featured).toContain('Solo build');
        expect(ctx.writing).toContain('techcommunity.microsoft.com');
        expect(bot.contextPrompt).toMatch(/Never invent numbers/);
        expect(bot.contextPrompt).toContain('Sources:');
    });
});

describe('formatMessage', () => {
    let bot;

    beforeEach(() => {
        bot = createChatBotWithPage();
    });

    test('escapes HTML so user or model text cannot inject markup', () => {
        const html = bot.formatMessage('<img src=x onerror=alert(1)> **bold**');
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
        expect(html).toContain('<strong>bold</strong>');
    });

    test('renders page-anchor, https, and site-file links but drops unsafe schemes', () => {
        const html = bot.formatMessage('[Featured](#awards) [Article](https://example.com/a?b=1&c=2) [CV](resume/JonEric-Eubanks-Resume.pdf) [Bad](javascript:alert(1))');
        expect(html).toContain('<a href="#awards" class="chat-source-link" data-section="awards">Featured</a>');
        expect(html).toContain('href="https://example.com/a?b=1&amp;c=2"');
        expect(html).toContain('href="resume/JonEric-Eubanks-Resume.pdf"');
        expect(html).not.toContain('javascript:');
    });

    test('turns bullet lines into a list', () => {
        expect(bot.formatMessage('Intro\n- one\n- two')).toBe('Intro<br><ul><li>one</li><li>two</li></ul>');
    });
});
