// Vercel serverless function to save blog posts to GitHub
// Version 4 - single-post merge to avoid payload size limits
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Version check endpoint
    if (req.method === 'GET' && req.query.version) {
        return res.status(200).json({ version: 4, timestamp: new Date().toISOString() });
    }

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER;
    const GITHUB_REPO = process.env.GITHUB_REPO;
    const fileUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/blog-data/posts.json`;

    // GET - Fetch posts from GitHub (public)
    if (req.method === 'GET') {
        try {
            const response = await fetch(
                `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/blog-data/posts.json`,
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

    // Auth check for POST and DELETE
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization required' });
    }

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Helper: get current posts and SHA from GitHub
    async function getPostsAndSha() {
        const fileResponse = await fetch(fileUrl, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            const content = Buffer.from(fileData.content, 'base64').toString('utf8');
            return { posts: JSON.parse(content), sha: fileData.sha };
        } else if (fileResponse.status === 404) {
            return { posts: [], sha: null };
        } else {
            const errData = await fileResponse.json();
            throw new Error(`GitHub API error (${fileResponse.status}): ${errData.message}`);
        }
    }

    // Helper: write posts array to GitHub
    async function writePosts(posts, sha, commitMessage) {
        const content = Buffer.from(JSON.stringify(posts, null, 2)).toString('base64');
        const updateBody = {
            message: commitMessage,
            content: content,
            branch: 'main'
        };
        if (sha) updateBody.sha = sha;

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
            throw new Error(`GitHub write failed (${updateResponse.status}): ${errorData.message}`);
        }
        return true;
    }

    // POST - Save a single post (merge server-side)
    if (req.method === 'POST') {
        try {
            const { post } = req.body;

            if (!post || !post.id) {
                return res.status(400).json({ error: 'A post object with an id is required' });
            }

            // Fetch existing posts from GitHub
            const { posts, sha } = await getPostsAndSha();

            // Merge: update existing or add new
            const existingIndex = posts.findIndex(p => p.id === post.id);
            if (existingIndex !== -1) {
                posts[existingIndex] = post;
            } else {
                posts.unshift(post);
            }

            await writePosts(posts, sha, `Blog: save post "${post.title}" - ${new Date().toISOString()}`);
            return res.status(200).json({ success: true, message: 'Post saved to GitHub' });
        } catch (error) {
            console.error('Error saving post:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // DELETE - Remove a post by id
    if (req.method === 'DELETE') {
        try {
            const { postId } = req.body;

            if (!postId) {
                return res.status(400).json({ error: 'postId is required' });
            }

            const { posts, sha } = await getPostsAndSha();
            const filtered = posts.filter(p => p.id !== postId);

            if (filtered.length === posts.length) {
                return res.status(404).json({ error: 'Post not found' });
            }

            await writePosts(filtered, sha, `Blog: delete post ${postId} - ${new Date().toISOString()}`);
            return res.status(200).json({ success: true, message: 'Post deleted from GitHub' });
        } catch (error) {
            console.error('Error deleting post:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
