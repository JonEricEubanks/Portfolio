/**
 * Unit tests for JonEricChatBot.analyzeUserIntent() — the keyword-based intent
 * classifier that decides whether chat.js answers from a canned response or
 * falls back to the Claude API. Pure logic test, no network/API calls.
 */

function createChatBot() {
    document.body.innerHTML = `
        <div id="chat-messages"></div>
        <input id="chat-input" />
        <button id="send-button"></button>
        <div id="chat-status"></div>
    `;
    window.blogManager = { posts: [], getPostsForContext: () => [] };

    // Fresh module instance per test so class state doesn't leak between tests
    jest.resetModules();
    const { JonEricChatBot } = require('../chat.js');
    return new JonEricChatBot();
}

describe('analyzeUserIntent', () => {
    let bot;

    beforeEach(() => {
        bot = createChatBot();
    });

    test('detects a greeting', () => {
        const intent = bot.analyzeUserIntent('Hello there!');
        expect(intent.type).toBe('greeting');
    });

    test('detects a general project question', () => {
        const intent = bot.analyzeUserIntent('What projects have you worked on?');
        expect(intent.type).toBe('projects');
    });

    test('detects dashboard-specific questions', () => {
        const intent = bot.analyzeUserIntent('Tell me about your Power BI dashboards');
        expect(intent.type).toBe('dashboards');
        expect(intent.context.projectType).toBe('dashboard');
    });

    test('detects Power Platform questions', () => {
        const intent = bot.analyzeUserIntent('What is your experience with Power Platform?');
        expect(intent.type).toBe('power_platform');
    });

    test('detects skills/certification questions', () => {
        const intent = bot.analyzeUserIntent('What certifications do you have?');
        expect(intent.type).toBe('skills');
    });

    test('detects achievement/award questions', () => {
        const intent = bot.analyzeUserIntent('What awards has JonEric won?');
        expect(intent.type).toBe('achievements');
    });

    test('detects career growth questions', () => {
        const intent = bot.analyzeUserIntent('What are his career growth plans?');
        expect(intent.type).toBe('career_growth');
    });

    test('always defers blog questions to the AI (returns type "blog")', () => {
        const intent = bot.analyzeUserIntent('What have you written about on your blog?');
        expect(intent.type).toBe('blog');
    });

    test('detects challenge/weakness questions', () => {
        const intent = bot.analyzeUserIntent('What are the cons of using low-code tools?');
        expect(intent.type).toBe('challenges');
    });

    test('detects comparison questions', () => {
        const intent = bot.analyzeUserIntent('How does this solution compare to a typical vendor product?');
        expect(intent.context.isComparison).toBe(true);
    });

    test('falls back to "general" for unmatched messages', () => {
        const intent = bot.analyzeUserIntent('Do you enjoy hiking during weekends?');
        expect(intent.type).toBe('general');
        expect(intent.confidence).toBe(0.5);
    });

    test('detects government/municipal domain context', () => {
        const intent = bot.analyzeUserIntent('Have you built solutions for city government?');
        expect(intent.context.domain).toBe('government');
    });
});
