// This function runs on Vercel's servers
export default async function handler(req, res) {
  // --- CORS Headers ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const GITHUB_USER = 'alertalerted-dotcom';
  const GITHUB_REPO = 'modern-art-avatars';
  const BRANCH = 'main';
  const GITHUB_PAT = process.env.GITHUB_PAT;

  if (!GITHUB_PAT) {
    return res.status(500).json({ error: 'GitHub Personal Access Token is not configured.' });
  }

  try {
    // --- STEP 1: Resolve branch → commit SHA
    const branchUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/branches/${BRANCH}`;
    const branchRes = await fetch(branchUrl, {
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!branchRes.ok) {
      throw new Error(`Failed to fetch branch info: ${branchRes.status}`);
    }

    const branchData = await branchRes.json();
    const treeSha = branchData.commit.commit.tree.sha;

    // --- STEP 2: Get full recursive tree from tree SHA
    const treeUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/git/trees/${treeSha}?recursive=1`;
    const treeRes = await fetch(treeUrl, {
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!treeRes.ok) {
      throw new Error(`Failed to fetch recursive tree: ${treeRes.status}`);
    }

    const treeData = await treeRes.json();

    // --- Filter avatars by file type & path
    const avatarPaths = treeData.tree
      .map(file => file.path)
      .filter(path =>
        path.startsWith('avatars/') &&
        (path.endsWith('.jpg') || path.endsWith('.png'))
      );

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ avatars: avatarPaths });

  } catch (error) {
    console.error('Error fetching from GitHub API:', error);
    res.status(500).json({ error: 'Failed to fetch avatar list from GitHub.' });
  }
}
