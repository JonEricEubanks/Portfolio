// Azure Functions v4 - Post likes via Azure Table Storage
const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;

app.http('like', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept'
        };

        if (request.method === 'OPTIONS') return { status: 200, headers: corsHeaders };
        if (!CONN) return { status: 500, jsonBody: { error: 'AZURE_STORAGE_CONNECTION_STRING not set' }, headers: corsHeaders };

        try {
            const body = await request.json();
            const postId = body?.postId;
            if (!postId) return { status: 400, jsonBody: { error: 'Post ID is required' }, headers: corsHeaders };

            context.log('Like request for post:', postId);

            const client = TableClient.fromConnectionString(CONN, 'blogposts');
            let entity;
            try {
                entity = await client.getEntity('blog', postId);
            } catch (e) {
                return { status: 404, jsonBody: { error: 'Post not found' }, headers: corsHeaders };
            }

            const newLikes = (entity.likes || 0) + 1;
            await client.updateEntity({ partitionKey: 'blog', rowKey: postId, likes: newLikes }, 'Merge');
            context.log(`Post ${postId} likes updated to ${newLikes}`);
            return { status: 200, jsonBody: { success: true, likes: newLikes }, headers: corsHeaders };
        } catch (error) {
            context.error('Like exception:', error);
            return { status: 500, jsonBody: { error: error.message }, headers: corsHeaders };
        }
    }
});
