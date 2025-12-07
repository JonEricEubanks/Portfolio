// Vercel serverless function to save blog posts to GitHub
// Version 3 - with detailed error logging
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Version check endpoint
    if (req.method === 'GET' && req.query.version) {
        return res.status(200).json({ version: 3, timestamp: new Date().toISOString() });
    }

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GET - Fetch posts from GitHub (public)
    if (req.method === 'GET') {
        try {
            const response = await fetch(
                `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/blog-data/posts.json`,
                { cache: 'no-store' }
            );
            
            if (!response.ok) {
                return res.status(200).json([]);
            }
            
            const posts = await response.json();
            return res.status(200).json(posts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            return res.status(200).json([]);
        }
    }

    // POST - Save posts to GitHub (requires auth)
    if (req.method === 'POST') {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization required' });
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_OWNER = process.env.GITHUB_OWNER;
        const GITHUB_REPO = process.env.GITHUB_REPO;

        // Debug: Check what we have
        const tokenExists = !!GITHUB_TOKEN;
        const tokenLength = GITHUB_TOKEN ? GITHUB_TOKEN.length : 0;
        const tokenPrefix = GITHUB_TOKEN ? GITHUB_TOKEN.substring(0, 4) : 'none';

        if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
            return res.status(500).json({ 
                error: 'Server configuration error',
                debug: {
                    tokenExists,
                    tokenLength,
                    tokenPrefix,
                    owner: GITHUB_OWNER || 'missing',
                    repo: GITHUB_REPO || 'missing'
                }
            });
        }

        try {
            const { posts } = req.body;

            if (!Array.isArray(posts)) {
                return res.status(400).json({ error: 'Posts must be an array', received: typeof posts });
            }

            // Step 1: Get the current file SHA (required for updates)
            let sha = null;
            let step = 'get-sha';
            
            const fileUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/blog-data/posts.json`;
            const fileResponse = await fetch(fileUrl, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (fileResponse.ok) {
                const fileData = await fileResponse.json();
                sha = fileData.sha;
            } else {
                const errData = await fileResponse.json();
                // If file doesn't exist, that's OK - we'll create it
                if (fileResponse.status !== 404) {
                    return res.status(500).json({ 
                        error: 'Failed at step: get-sha',
                        status: fileResponse.status,
                        details: errData.message || JSON.stringify(errData),
                        url: fileUrl
                    });
                }
            }

            // Step 2: Update the file
            step = 'update-file';
            const content = Buffer.from(JSON.stringify(posts, null, 2)).toString('base64');
            
            const updateBody = {
                message: `Update blog posts - ${new Date().toISOString()}`,
                content: content,
                branch: 'main'
            };
            
            if (sha) {
                updateBody.sha = sha;
            }
            
            const updateResponse = await fetch(fileUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateBody)
            });

            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                return res.status(500).json({ 
                    error: 'Failed at step: update-file',
                    status: updateResponse.status,
                    details: errorData.message || JSON.stringify(errorData),
                    sha: sha || 'none',
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO
                });
            }

            return res.status(200).json({ success: true, message: 'Posts saved to GitHub' });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Exception caught', 
                message: error.message,
                stack: error.stack ? error.stack.substring(0, 500) : 'no stack'
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
