// Vercel serverless function to save blog posts to GitHub
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

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

        if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
            console.error('GitHub environment variables not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        try {
            const { posts } = req.body;

            if (!Array.isArray(posts)) {
                return res.status(400).json({ error: 'Posts must be an array' });
            }

            // Get the current file SHA (required for updates)
            const fileResponse = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/blog-data/posts.json`,
                {
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            let sha = null;
            if (fileResponse.ok) {
                const fileData = await fileResponse.json();
                sha = fileData.sha;
            } else {
                const errData = await fileResponse.json();
                console.error('Error getting file SHA:', errData);
            }

            // Update the file
            const content = Buffer.from(JSON.stringify(posts, null, 2)).toString('base64');
            
            const updateBody = {
                message: `Update blog posts - ${new Date().toISOString()}`,
                content: content,
                branch: 'main'
            };
            
            // Only include sha if file exists (required for updates, omit for creates)
            if (sha) {
                updateBody.sha = sha;
            }
            
            const updateResponse = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/blog-data/posts.json`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateBody)
                }
            );

            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                console.error('GitHub API error:', errorData);
                return res.status(500).json({ 
                    error: 'Failed to save to GitHub', 
                    details: errorData.message,
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO 
                });
            }

            return res.status(200).json({ success: true, message: 'Posts saved to GitHub' });
        } catch (error) {
            console.error('Error saving posts:', error);
            return res.status(500).json({ error: 'Failed to save posts', details: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
