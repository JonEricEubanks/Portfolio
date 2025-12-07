// Vercel serverless function for blog admin authentication
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get credentials from environment variables
    const ADMIN_EMAIL = process.env.BLOG_ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.BLOG_ADMIN_PASSWORD;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error('Admin credentials not configured in environment variables');
        return res.status(500).json({ error: 'Authentication not configured' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check credentials (case-insensitive email comparison)
        if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
            // Generate a simple session token (in production, use JWT or similar)
            const token = Buffer.from(`${Date.now()}-${Math.random().toString(36).substr(2)}`).toString('base64');
            
            return res.status(200).json({ 
                success: true, 
                token: token,
                message: 'Authentication successful' 
            });
        } else {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
}
