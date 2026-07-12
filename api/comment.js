// Azure Functions v4 - Post comments via Azure Table Storage
const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;

app.http('comment', {
    methods: ['POST', 'GET', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept'
        };

        if (request.method === 'OPTIONS') return { status: 200, headers: corsHeaders };
        if (!CONN) return { status: 500, jsonBody: { error: 'AZURE_STORAGE_CONNECTION_STRING not set' }, headers: corsHeaders };

        const client = TableClient.fromConnectionString(CONN, 'blogcomments');

        // GET - Fetch comments for a post
        if (request.method === 'GET') {
            const postId = request.query.get('postId');
            if (!postId) return { status: 400, jsonBody: { error: 'postId query param required' }, headers: corsHeaders };
            try {
                const comments = [];
                for await (const entity of client.listEntities({ queryOptions: { filter: `PartitionKey eq '${postId}'` } })) {
                    comments.push({ id: entity.rowKey, name: entity.name, content: entity.content, createdAt: entity.createdAt });
                }
                comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                return { status: 200, jsonBody: comments, headers: corsHeaders };
            } catch (error) {
                return { status: 200, jsonBody: [], headers: corsHeaders };
            }
        }

        // POST - Add a comment
        if (request.method === 'POST') {
            try {
                const body = await request.json();
                const postId = body?.postId;
                const name = body?.name;
                const commentContent = body?.content;

                if (!postId || !name || !commentContent) {
                    return { status: 400, jsonBody: { error: 'Post ID, name, and comment content are required' }, headers: corsHeaders };
                }
                if (name.length > 50) return { status: 400, jsonBody: { error: 'Name must be 50 characters or less' }, headers: corsHeaders };
                if (commentContent.length > 1000) return { status: 400, jsonBody: { error: 'Comment must be 1000 characters or less' }, headers: corsHeaders };

                const commentId = 'comment-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                const newComment = {
                    partitionKey: postId,
                    rowKey: commentId,
                    name: name.trim(),
                    content: commentContent.trim(),
                    createdAt: new Date().toISOString()
                };

                await client.createEntity(newComment);
                context.log(`Comment added to post ${postId} by ${name}`);

                // Get total comment count for this post
                let totalComments = 0;
                for await (const _ of client.listEntities({ queryOptions: { filter: `PartitionKey eq '${postId}'` } })) {
                    totalComments++;
                }

                return {
                    status: 200,
                    jsonBody: {
                        success: true,
                        comment: { id: commentId, name: name.trim(), content: commentContent.trim(), createdAt: newComment.createdAt },
                        totalComments
                    },
                    headers: corsHeaders
                };
            } catch (error) {
                context.error('Comment exception:', error);
                return { status: 500, jsonBody: { error: error.message }, headers: corsHeaders };
            }
        }

        return { status: 405, jsonBody: { error: 'Method not allowed' }, headers: corsHeaders };
    }
});
