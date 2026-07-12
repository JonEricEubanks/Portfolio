// Azure Functions v4 - Save blog posts to GitHub
// Uses Git Data API to support large files (>1MB)
const { app } = require('@azure/functions');

app.http('posts', {
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async function handler(request, context) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization'
        };

        if (request.method === 'OPTIONS') {
            return { status: 200, headers: corsHeaders };
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_OWNER = process.env.GITHUB_OWNER;
        const GITHUB_REPO = process.env.GITHUB_REPO;

        // Version check endpoint
        if (request.method === 'GET' && request.query.get('version')) {
            return { status: 200, jsonBody: { version: 5, timestamp: new Date().toISOString() }, headers: corsHeaders };
        }

        // GET - Fetch posts from GitHub (public)
        if (request.method === 'GET') {
            try {
                const response = await fetch(
                    `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/blog-data/posts.json`,
                    { cache: 'no-store' }
                );
                if (!response.ok) {
                    return { status: 200, jsonBody: [], headers: corsHeaders };
                }
                const posts = await response.json();
                return { status: 200, jsonBody: posts, headers: corsHeaders };
            } catch (error) {
                context.error('Error fetching posts:', error);
                return { status: 200, jsonBody: [], headers: corsHeaders };
            }
        }

        // Auth check for POST and DELETE
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return { status: 401, jsonBody: { error: 'Authorization required' }, headers: corsHeaders };
        }

        if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
            return { status: 500, jsonBody: { error: 'Server configuration error' }, headers: corsHeaders };
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
        if (request.method === 'POST') {
            try {
                const { post } = await request.json();

                if (!post || !post.id) {
                    return { status: 400, jsonBody: { error: 'A post object with an id is required' }, headers: corsHeaders };
                }

                const posts = await getPosts();
                const existingIndex = posts.findIndex(p => p.id === post.id);
                if (existingIndex !== -1) {
                    posts[existingIndex] = post;
                } else {
                    posts.unshift(post);
                }

                await writePosts(posts, `Blog: save post "${post.title}" - ${new Date().toISOString()}`);
                return { status: 200, jsonBody: { success: true, message: 'Post saved to GitHub' }, headers: corsHeaders };
            } catch (error) {
                context.error('Error saving post:', error);
                return { status: 500, jsonBody: { error: error.message }, headers: corsHeaders };
            }
        }

        // DELETE - Remove a post by id
        if (request.method === 'DELETE') {
            try {
                const { postId } = await request.json();

                if (!postId) {
                    return { status: 400, jsonBody: { error: 'postId is required' }, headers: corsHeaders };
                }

                const posts = await getPosts();
                const filtered = posts.filter(p => p.id !== postId);

                if (filtered.length === posts.length) {
                    return { status: 404, jsonBody: { error: 'Post not found' }, headers: corsHeaders };
                }

                await writePosts(filtered, `Blog: delete post ${postId} - ${new Date().toISOString()}`);
                return { status: 200, jsonBody: { success: true, message: 'Post deleted from GitHub' }, headers: corsHeaders };
            } catch (error) {
                context.error('Error deleting post:', error);
                return { status: 500, jsonBody: { error: error.message }, headers: corsHeaders };
            }
        }

        return { status: 405, jsonBody: { error: 'Method not allowed' }, headers: corsHeaders };
    }
});
