// Azure Functions v4 - One-time migration from GitHub JSON to Azure Table/Blob Storage
// Call POST /api/migrate with admin auth to run migration
const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');
const { BlobServiceClient } = require('@azure/storage-blob');

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

app.http('migrate', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
        if (request.method === 'OPTIONS') return { status: 200, headers: corsHeaders };

        const authHeader = request.headers.get('authorization');
        if (!authHeader) return { status: 401, jsonBody: { error: 'Authorization required' }, headers: corsHeaders };
        if (!CONN) return { status: 500, jsonBody: { error: 'AZURE_STORAGE_CONNECTION_STRING not set' }, headers: corsHeaders };

        try {
            context.log('Starting migration from GitHub JSON to Azure Storage...');

            // Fetch posts from GitHub
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/blog-data/posts.json`;
            const res = await fetch(rawUrl, { cache: 'no-store' });
            if (!res.ok) return { status: 500, jsonBody: { error: 'Failed to fetch posts.json from GitHub' }, headers: corsHeaders };
            const posts = await res.json();

            const postsClient = TableClient.fromConnectionString(CONN, 'blogposts');
            const commentsClient = TableClient.fromConnectionString(CONN, 'blogcomments');
            const blobServiceClient = BlobServiceClient.fromConnectionString(CONN);
            const containerClient = blobServiceClient.getContainerClient('blog-images');

            // Create tables and container
            await postsClient.createTable().catch(() => {});
            await commentsClient.createTable().catch(() => {});
            await containerClient.createIfNotExists({ access: 'blob' }).catch(() => {});

            let migratedPosts = 0;
            let migratedComments = 0;
            let migratedImages = 0;

            for (const post of posts) {
                let imageUrl = post.image || '';

                // If image is base64, upload to Blob Storage
                if (imageUrl && imageUrl.startsWith('data:image')) {
                    try {
                        const mimeMatch = imageUrl.match(/data:([^;]+);base64,/);
                        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
                        const ext = mimeType.split('/')[1] || 'png';
                        const base64Data = imageUrl.split(',')[1];
                        const buffer = Buffer.from(base64Data, 'base64');
                        const blobName = `blog-${post.id}-cover.${ext}`;
                        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                        await blockBlobClient.upload(buffer, buffer.length, { blobHTTPHeaders: { blobContentType: mimeType } });
                        imageUrl = blockBlobClient.url;
                        migratedImages++;
                        context.log(`Migrated image for post ${post.id}`);
                    } catch (imgError) {
                        context.error(`Failed to migrate image for ${post.id}:`, imgError.message);
                        imageUrl = '';
                    }
                }

                // Save post to Table Storage
                const entity = {
                    partitionKey: 'blog',
                    rowKey: post.id,
                    title: post.title || '',
                    category: post.category || '',
                    excerpt: (post.excerpt || '').substring(0, 500),
                    content: (post.content || '').substring(0, 32000),
                    tags: JSON.stringify(post.tags || []),
                    status: post.status || 'published',
                    postDate: post.date || new Date().toISOString(),
                    updated: post.updated || new Date().toISOString(),
                    imageUrl,
                    scheduledDate: post.scheduledDate || '',
                    likes: typeof post.likes === 'number' ? post.likes : 0,
                };
                await postsClient.upsertEntity(entity, 'Replace');
                migratedPosts++;

                // Migrate comments
                if (Array.isArray(post.comments)) {
                    for (const comment of post.comments) {
                        const commentEntity = {
                            partitionKey: post.id,
                            rowKey: comment.id || `comment-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            name: comment.name || '',
                            content: comment.content || '',
                            createdAt: comment.createdAt || new Date().toISOString()
                        };
                        await commentsClient.upsertEntity(commentEntity, 'Replace');
                        migratedComments++;
                    }
                }
            }

            context.log(`Migration complete: ${migratedPosts} posts, ${migratedComments} comments, ${migratedImages} images`);
            return {
                status: 200,
                jsonBody: {
                    success: true,
                    summary: { posts: migratedPosts, comments: migratedComments, images: migratedImages },
                    message: 'Migration complete. You can now remove blog-data/posts.json from your repo.'
                },
                headers: corsHeaders
            };
        } catch (error) {
            context.error('Migration error:', error);
            return { status: 500, jsonBody: { error: error.message }, headers: corsHeaders };
        }
    }
});
