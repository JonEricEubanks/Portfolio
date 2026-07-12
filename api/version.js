// Azure Functions v4 - Version check endpoint
const { app } = require('@azure/functions');

app.http('version', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        return {
            status: 200,
            jsonBody: {
                version: 4,
                timestamp: new Date().toISOString(),
                env: {
                    hasToken: !!process.env.GITHUB_TOKEN,
                    owner: process.env.GITHUB_OWNER || 'missing',
                    repo: process.env.GITHUB_REPO || 'missing'
                }
            },
            headers: { 'Access-Control-Allow-Origin': '*' }
        };
    }
});
