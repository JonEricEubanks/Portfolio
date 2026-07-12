// Azure Functions v4 - Blog admin authentication
import { app } from '@azure/functions';

app.http('auth', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization'
        };

        if (request.method === 'OPTIONS') {
            return { status: 200, headers: corsHeaders };
        }

        const ADMIN_EMAIL = process.env.BLOG_ADMIN_EMAIL;
        const ADMIN_PASSWORD = process.env.BLOG_ADMIN_PASSWORD;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            context.error('Admin credentials not configured in environment variables');
            return { status: 500, jsonBody: { error: 'Authentication not configured' }, headers: corsHeaders };
        }

        try {
            const { email, password } = await request.json();

            if (!email || !password) {
                return { status: 400, jsonBody: { error: 'Email and password are required' }, headers: corsHeaders };
            }

            if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
                const token = Buffer.from(`${Date.now()}-${Math.random().toString(36).substr(2)}`).toString('base64');
                return {
                    status: 200,
                    jsonBody: { success: true, token, message: 'Authentication successful' },
                    headers: corsHeaders
                };
            } else {
                return { status: 401, jsonBody: { success: false, error: 'Invalid credentials' }, headers: corsHeaders };
            }
        } catch (error) {
            context.error('Authentication error:', error);
            return { status: 500, jsonBody: { error: 'Authentication failed' }, headers: corsHeaders };
        }
    }
});
