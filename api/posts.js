// Vercel serverless function to save blog posts to GitHub
// Version 5 - use Git Data API to support large files (>1MB)
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb'
        }
    }
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Version check endpoint
    if (req.method === 'GET' && req.query.version) {
        return res.status(200).json({ version: 5, timestamp: new Date().toISOString() });
    }

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER;
    const GITHUB_REPO = process.env.GITHUB_REPO;

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

    // Helper: get current posts from GitHub (uses raw URL to handle large files)
    async function getPosts() {
        const rawResponse = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/blog-data/posts.json`,
            { cache: 'no-store' }
        );
        if (rawResponse.ok) {
            return await rawResponse.json();
        }
        return [];
    }

    // Helper: write posts array to GitHub using Git Data API (supports files >1MB)
    async function writePosts(posts, commitMessage) {
        const content = JSON.stringify(posts, null, 2);
        const gitApiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git`;
        const headers = {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        // 1. Create blob with UTF-8 content (no base64 overhead on the wire)
        const blobRes = await fetch(`${gitApiBase}/blobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ content, encoding: 'utf-8' })
        });
        if (!blobRes.ok) {
            const e = await blobRes.json();
            throw new Error(`Blob create failed (${blobRes.status}): ${e.message} [repo: ${GITHUB_OWNER}/${GITHUB_REPO}]`);
        }
        const { sha: blobSha } = await blobRes.json();

        // 2. Get latest commit SHA for main branch
        const refRes = await fetch(`${gitApiBase}/refs/heads/main`, { headers });
        if (!refRes.ok) {
            const e = await refRes.json();
            throw new Error(`Ref fetch failed (${refRes.status}): ${e.message}`);
        }
        const latestCommitSha = (await refRes.json()).object.sha;

        // 3. Get the tree SHA from the latest commit
        const commitRes = await fetch(`${gitApiBase}/commits/${latestCommitSha}`, { headers });
        if (!commitRes.ok) {
            const e = await commitRes.json();
            throw new Error(`Commit fetch failed (${commitRes.status}): ${e.message}`);
        }
        const treeSha = (await commitRes.json()).tree.sha;

        // 4. Create a new tree pointing the file at the new blob
        const treeRes = await fetch(`${gitApiBase}/trees`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                base_tree: treeSha,
                tree: [{ path: 'blog-data/posts.json', mode: '100644', type: 'blob', sha: blobSha }]
            })
        });
        if (!treeRes.ok) {
            const e = await treeRes.json();
            throw new Error(`Tree create failed (${treeRes.status}): ${e.message}`);
        }
        const { sha: newTreeSha } = await treeRes.json();

        // 5. Create a new commit
        const newCommitRes = await fetch(`${gitApiBase}/commits`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message: commitMessage, tree: newTreeSha, parents: [latestCommitSha] })
        });
        if (!newCommitRes.ok) {
            const e = await newCommitRes.json();
            throw new Error(`Commit create failed (${newCommitRes.status}): ${e.message}`);
        }
        const { sha: newCommitSha } = await newCommitRes.json();

        // 6. Advance the branch ref
        const updateRes = await fetch(`${gitApiBase}/refs/heads/main`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ sha: newCommitSha })
        });
        if (!updateRes.ok) {
            const e = await updateRes.json();
            throw new Error(`Ref update failed (${updateRes.status}): ${e.message}`);
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
            const posts = await getPosts();

            // Merge: update existing or add new
            const existingIndex = posts.findIndex(p => p.id === post.id);
            if (existingIndex !== -1) {
                posts[existingIndex] = post;
            } else {
                posts.unshift(post);
            }

            await writePosts(posts, `Blog: save post "${post.title}" - ${new Date().toISOString()}`);
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

            const posts = await getPosts();
            const filtered = posts.filter(p => p.id !== postId);

            if (filtered.length === posts.length) {
                return res.status(404).json({ error: 'Post not found' });
            }

            await writePosts(filtered, `Blog: delete post ${postId} - ${new Date().toISOString()}`);
            return res.status(200).json({ success: true, message: 'Post deleted from GitHub' });
        } catch (error) {
            console.error('Error deleting post:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
