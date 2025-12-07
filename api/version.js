// Simple version check endpoint
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ 
        version: 3, 
        timestamp: new Date().toISOString(),
        env: {
            hasToken: !!process.env.GITHUB_TOKEN,
            tokenLength: process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.length : 0,
            tokenPrefix: process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.substring(0, 7) : 'none',
            owner: process.env.GITHUB_OWNER || 'missing',
            repo: process.env.GITHUB_REPO || 'missing'
        }
    });
}
