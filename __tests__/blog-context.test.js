/**
 * Verifies BlogManager exposes external (Tech Community) posts to the chatbot
 * alongside the GitHub-hosted posts.
 */
function createBlogManager() {
    document.body.innerHTML = '<div id="blog-posts"></div>';
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve([]) }));
    jest.resetModules();
    const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'blog.js'), 'utf8');
    const BlogManager = new Function(`${src.replace(/document\.addEventListener\('DOMContentLoaded'[\s\S]*$/, '')}; return BlogManager;`)();
    const proto = BlogManager.prototype;
    // Skip DOM/auth/network setup — only the post-aggregation logic is under test
    const manager = Object.create(proto);
    manager.posts = [
        { id: 'a', title: 'GitHub post', category: 'ai', excerpt: 'x', date: '2026-06-01T00:00:00Z', tags: [] }
    ];
    manager.externalPosts = [
        { id: 'ext-1', title: 'Tech Community post', category: 'ai', excerpt: 'y', date: '2026-09-23T00:00:00Z', tags: [], source: 'Microsoft Tech Community', externalUrl: 'https://techcommunity.microsoft.com/x' }
    ];
    manager.formatDate = d => d;
    return manager;
}

describe('BlogManager chat context', () => {
    test('getPostsForContext includes external posts, newest first', () => {
        const ctx = createBlogManager().getPostsForContext();
        expect(ctx.map(p => p.title)).toEqual(['Tech Community post', 'GitHub post']);
        expect(ctx[0].source).toBe('Microsoft Tech Community');
        expect(ctx[0].url).toContain('techcommunity');
    });
});
