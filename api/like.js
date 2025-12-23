// Vercel serverless function to handle post likes

// Helper functions for base64 encoding/decoding (Node.js compatible)
function decodeBase64(str) {
    return Buffer.from(str, 'base64').toString('utf8');
}

function encodeBase64(str) {
    return Buffer.from(str, 'utf8').toString('base64');
}

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

    // POST - Add a like to a post
    if (req.method === 'POST') {
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_OWNER = process.env.GITHUB_OWNER;
        const GITHUB_REPO = process.env.GITHUB_REPO;

        if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
            console.error('Missing env vars:', { 
                hasToken: !!GITHUB_TOKEN, 
                hasOwner: !!GITHUB_OWNER, 
                hasRepo: !!GITHUB_REPO 
            });
            return res.status(500).json({ error: 'Server configuration error' });
        }

        try {
            const { postId } = req.body;

            if (!postId) {
                return res.status(400).json({ error: 'Post ID is required' });
            }

            console.log('Like request for post:', postId);

            // Step 1: Fetch current posts
            const fileUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/blog-data/posts.json`;
            const fileResponse = await fetch(fileUrl, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!fileResponse.ok) {
                const errText = await fileResponse.text();
                console.error('GitHub fetch failed:', fileResponse.status, errText);
                return res.status(500).json({ error: 'Failed to fetch posts', status: fileResponse.status });
            }

            const fileData = await fileResponse.json();
            const sha = fileData.sha;
            
            // Decode base64 content
            const decodedContent = decodeBase64(fileData.content.replace(/\n/g, ''));
            const posts = JSON.parse(decodedContent);

            // Step 2: Find post and increment likes
            const postIndex = posts.findIndex(p => p.id === postId);
            if (postIndex === -1) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // Initialize likes if not present
            if (typeof posts[postIndex].likes !== 'number') {
                posts[postIndex].likes = 0;
            }

            // Increment likes (no restrictions - Option C)
            posts[postIndex].likes += 1;

            // Step 3: Save updated posts
            const content = encodeBase64(JSON.stringify(posts, null, 2));
            
            const updateResponse = await fetch(fileUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Like added to post ${postId}`,
                    content: content,
                    sha: sha,
                    branch: 'main'
                })
            });

            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                console.error('GitHub update failed:', errorData);
                return res.status(500).json({ error: 'Failed to save like', details: errorData.message });
            }

            return res.status(200).json({ 
                success: true, 
                likes: posts[postIndex].likes 
            });
        } catch (error) {
            console.error('Like exception:', error);
            return res.status(500).json({ 
                error: 'Exception caught', 
                message: error.message
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
