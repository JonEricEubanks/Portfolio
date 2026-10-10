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
});
