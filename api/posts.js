// Azure Functions v4 - Blog posts via Azure Table Storage
// Falls back to GitHub JSON if Azure Storage is not yet configured
const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const POSTS_TABLE = 'blogposts';
const PART_KEY = 'blog';

function getClient() {
    return TableClient.fromConnectionString(CONN, POSTS_TABLE);
}

function entityToPost(e) {
    return {
        id: e.rowKey,
        title: e.title || '',
        category: e.category || '',
        excerpt: e.excerpt || '',
        content: e.content || '',
        tags: e.tags ? JSON.parse(e.tags) : [],
        status: e.status || 'published',
        date: e.postDate || '',
        updated: e.updated || '',
        image: e.imageUrl || '',
        scheduledDate: e.scheduledDate || null,
        likes: e.likes || 0,
    };
}

function postToEntity(post) {
    return {
        partitionKey: PART_KEY,
        rowKey: post.id,
        title: post.title || '',
        category: post.category || '',
        excerpt: (post.excerpt || '').substring(0, 500),
        content: (post.content || '').substring(0, 32000),
        tags: JSON.stringify(post.tags || []),
        status: post.status || 'published',
        postDate: post.date || new Date().toISOString(),
        updated: post.updated || new Date().toISOString(),
        imageUrl: post.image || '',
        scheduledDate: post.scheduledDate || '',
        likes: typeof post.likes === 'number' ? post.likes : 0,
    };
}

app.http('posts', {
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization'
        };

        if (request.method === 'OPTIONS') return { status: 200, headers: corsHeaders };

        // If Azure Storage not configured yet, fall back to GitHub JSON (keeps images working)
        if (!CONN && request.method === 'GET') {
            try {
                const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/blog-data/posts.json`;
                const res = await fetch(rawUrl, { cache: 'no-store' });
                if (!res.ok) return { status: 200, jsonBody: [], headers: corsHeaders };
                const posts = await res.json();
                const published = posts.filter(p => p.status === 'published');
                return { status: 200, jsonBody: published, headers: corsHeaders };
            } catch (e) {
                return { status: 200, jsonBody: [], headers: corsHeaders };
            }
        }

        if (!CONN) return { status: 503, jsonBody: { error: 'Azure Storage not configured. Add AZURE_STORAGE_CONNECTION_STRING.' }, headers: corsHeaders };

        if (request.method === 'GET' && request.query.get('version')) {
            return { status: 200, jsonBody: { version: 6, storage: 'azure-table' }, headers: corsHeaders };
        }

        if (request.method === 'GET') {
            try {
                const client = getClient();
                const posts = [];
                for await (const entity of client.listEntities({ queryOptions: { filter: `PartitionKey eq '${PART_KEY}'` } })) {
                    const post = entityToPost(entity);
                    if (post.status === 'published') posts.push(post);
                }
                posts.sort((a, b) => new Date(b.date) - new Date(a.date));
                return { status: 200, jsonBody: posts, headers: corsHeaders };
            } catch (error) {
                context.error('Error fetching posts:', error);
                return { status: 200, jsonBody: [], headers: corsHeaders };
            }
        }

        const authHeader = request.headers.get('authorization');
        if (!authHeader) return { status: 401, jsonBody: { error: 'Authorization required' }, headers: corsHeaders };

        if (request.method === 'POST') {
            try {
                const { post } = await request.json();
                if (!post || !post.id) return { status: 400, jsonBody: { error: 'A post object with an id is required' }, headers: corsHeaders };
                await getClient().upsertEntity(postToEntity(post), 'Replace');
                return { status: 200, jsonBody: { success: true, message: 'Post saved to Azure Table Storage' }, headers: corsHeaders };
            } catch (error) {
                context.error('Error saving post:', error);
                return { status: 500, jsonBody: { error: error.message }, headers: corsHeaders };
            }
        }

        if (request.method === 'DELETE') {
            try {
                const { postId } = await request.json();
                if (!postId) return { status: 400, jsonBody: { error: 'postId is required' }, headers: corsHeaders };
                await getClient().deleteEntity(PART_KEY, postId);
                return { status: 200, jsonBody: { success: true, message: 'Post deleted' }, headers: corsHeaders };
            } catch (error) {
                if (error.statusCode === 404) return { status: 404, jsonBody: { error: 'Post not found' }, headers: corsHeaders };
                return { status: 500, jsonBody: { error: error.message }, headers: corsHeaders };
            }
        }

        return { status: 405, jsonBody: { error: 'Method not allowed' }, headers: corsHeaders };
    }
});
