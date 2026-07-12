// Azure Functions v4 - Handle post likes
const { app } = require('@azure/functions');

function encodeBase64(str) {
    return Buffer.from(str, 'utf8').toString('base64');
}

app.http('like', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept'
        };

        if (request.method === 'OPTIONS') {
            return { status: 200, headers: corsHeaders };
        }

        if (request.method === 'POST') {
            const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
            const GITHUB_OWNER = process.env.GITHUB_OWNER;
            const GITHUB_REPO = process.env.GITHUB_REPO;

            if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
                return { status: 500, jsonBody: { error: 'Server configuration error' }, headers: corsHeaders };
            }

            try {
                const body = await request.json();
                const postId = body?.postId;

                if (!postId) {
                    return { status: 400, jsonBody: { error: 'Post ID is required' }, headers: corsHeaders };
                }

                context.log('Like request for post:', postId);

                const fileUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/blog-data/posts.json`;
                const shaResponse = await fetch(fileUrl, {
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
                });

                if (!shaResponse.ok) {
                    return { status: 500, jsonBody: { error: 'Failed to get file info' }, headers: corsHeaders };
                }

                const shaData = await shaResponse.json();
                const sha = shaData.sha;

                const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/blog-data/posts.json`;
                const postsResponse = await fetch(rawUrl, { cache: 'no-store' });

                if (!postsResponse.ok) {
                    return { status: 500, jsonBody: { error: 'Failed to fetch posts' }, headers: corsHeaders };
                }

                const posts = await postsResponse.json();
                const postIndex = posts.findIndex(p => p.id === postId);

                if (postIndex === -1) {
                    return { status: 404, jsonBody: { error: 'Post not found' }, headers: corsHeaders };
                }

                if (typeof posts[postIndex].likes !== 'number') {
                    posts[postIndex].likes = 0;
                }
                posts[postIndex].likes += 1;

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
                        content,
                        sha,
                        branch: 'main'
                    })
                });

                if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    return { status: 500, jsonBody: { error: 'Failed to save like', details: errorData.message }, headers: corsHeaders };
                }

                return { status: 200, jsonBody: { success: true, likes: posts[postIndex].likes }, headers: corsHeaders };
            } catch (error) {
                context.error('Like exception:', error);
                return { status: 500, jsonBody: { error: 'Exception caught', message: error.message }, headers: corsHeaders };
            }
        }

        return { status: 405, jsonBody: { error: 'Method not allowed' }, headers: corsHeaders };
    }
});
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
            // Parse body if it's a string
            let body = req.body;
            if (typeof body === 'string') {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    return res.status(400).json({ error: 'Invalid JSON body' });
                }
            }
            
            const postId = body?.postId;

            if (!postId) {
                console.error('No postId in body:', body);
                return res.status(400).json({ error: 'Post ID is required', received: body });
            }

            console.log('Like request for post:', postId);

            // Step 1: Get current SHA from GitHub API
            const fileUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/blog-data/posts.json`;
            const shaResponse = await fetch(fileUrl, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!shaResponse.ok) {
                const errText = await shaResponse.text();
                console.error('GitHub SHA fetch failed:', shaResponse.status, errText);
                return res.status(500).json({ error: 'Failed to get file info', status: shaResponse.status });
            }

            const shaData = await shaResponse.json();
            const sha = shaData.sha;
            
            // Step 2: Fetch posts from raw URL (simpler, no base64)
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/blog-data/posts.json`;
            const postsResponse = await fetch(rawUrl, { cache: 'no-store' });
            
            if (!postsResponse.ok) {
                console.error('GitHub raw fetch failed:', postsResponse.status);
                return res.status(500).json({ error: 'Failed to fetch posts' });
            }
            
            const posts = await postsResponse.json();

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
