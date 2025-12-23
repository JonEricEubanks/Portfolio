// Vercel serverless function to handle post comments
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

    // POST - Add a comment to a post
    if (req.method === 'POST') {
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_OWNER = process.env.GITHUB_OWNER;
        const GITHUB_REPO = process.env.GITHUB_REPO;

        if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        try {
            const { postId, name, content: commentContent } = req.body;

            if (!postId || !name || !commentContent) {
                return res.status(400).json({ error: 'Post ID, name, and comment content are required' });
            }

            // Validate input lengths
            if (name.length > 50) {
                return res.status(400).json({ error: 'Name must be 50 characters or less' });
            }
            if (commentContent.length > 1000) {
                return res.status(400).json({ error: 'Comment must be 1000 characters or less' });
            }

            // Step 1: Fetch current posts
            const fileUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/blog-data/posts.json`;
            const fileResponse = await fetch(fileUrl, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!fileResponse.ok) {
                return res.status(500).json({ error: 'Failed to fetch posts' });
            }

            const fileData = await fileResponse.json();
            const sha = fileData.sha;
            const posts = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));

            // Step 2: Find post and add comment
            const postIndex = posts.findIndex(p => p.id === postId);
            if (postIndex === -1) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // Initialize comments array if not present
            if (!Array.isArray(posts[postIndex].comments)) {
                posts[postIndex].comments = [];
            }

            // Create new comment (newest first)
            const newComment = {
                id: 'comment-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                name: name.trim(),
                content: commentContent.trim(),
                createdAt: new Date().toISOString()
            };

            // Add comment at the beginning (newest first)
            posts[postIndex].comments.unshift(newComment);

            // Step 3: Save updated posts
            const content = Buffer.from(JSON.stringify(posts, null, 2)).toString('base64');
            
            const updateResponse = await fetch(fileUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Comment added to post ${postId} by ${name}`,
                    content: content,
                    sha: sha,
                    branch: 'main'
                })
            });

            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                return res.status(500).json({ error: 'Failed to save comment', details: errorData.message });
            }

            return res.status(200).json({ 
                success: true, 
                comment: newComment,
                totalComments: posts[postIndex].comments.length
            });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Exception caught', 
                message: error.message
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
