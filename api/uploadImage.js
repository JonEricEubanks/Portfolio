// Azure Functions v4 - Image upload to Azure Blob Storage
const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER = 'blog-images';

app.http('uploadImage', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization'
        };

        if (request.method === 'OPTIONS') return { status: 200, headers: corsHeaders };
        if (!CONN) return { status: 500, jsonBody: { error: 'AZURE_STORAGE_CONNECTION_STRING not set' }, headers: corsHeaders };

        // Auth check
        const authHeader = request.headers.get('authorization');
        if (!authHeader) return { status: 401, jsonBody: { error: 'Authorization required' }, headers: corsHeaders };

        try {
            const body = await request.json();
            const { imageData, filename, mimeType } = body;

            if (!imageData || !filename) {
                return { status: 400, jsonBody: { error: 'imageData (base64) and filename are required' }, headers: corsHeaders };
            }

            // Strip base64 header if present (data:image/png;base64,...)
            const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
            const buffer = Buffer.from(base64Data, 'base64');

            // Validate file size (5MB max)
            if (buffer.length > 5 * 1024 * 1024) {
                return { status: 400, jsonBody: { error: 'Image too large. Maximum 5MB.' }, headers: corsHeaders };
            }

            const blobServiceClient = BlobServiceClient.fromConnectionString(CONN);
            const containerClient = blobServiceClient.getContainerClient(CONTAINER);

            // Ensure container exists with public read access
            await containerClient.createIfNotExists({ access: 'blob' });

            // Generate unique filename
            const ext = filename.split('.').pop().toLowerCase() || 'png';
            const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase().substring(0, 30);
            const blobName = `blog-${Date.now()}-${safeName}.${ext}`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            const contentType = mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            await blockBlobClient.upload(buffer, buffer.length, {
                blobHTTPHeaders: { blobContentType: contentType }
            });

            const imageUrl = blockBlobClient.url;
            context.log(`Image uploaded: ${imageUrl}`);
            return { status: 200, jsonBody: { success: true, imageUrl, filename: blobName }, headers: corsHeaders };
        } catch (error) {
            context.error('Upload error:', error);
            return { status: 500, jsonBody: { error: error.message }, headers: corsHeaders };
        }
    }
});
