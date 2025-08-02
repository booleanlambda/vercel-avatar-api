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
    async function fetchFolderContents(path = '') {
      const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}?ref=${BRANCH}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `token ${GITHUB_PAT}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!res.ok) {
        throw new Error(`GitHub API error ${res.status} for ${path}`);
      }

      const data = await res.json();
      let files = [];

      for (const item of data) {
        if (item.type === 'file' && (item.name.endsWith('.png') || item.name.endsWith('.jpg'))) {
          files.push(item.path);
        } else if (item.type === 'dir') {
          files = files.concat(await fetchFolderContents(item.path));
        }
      }

      return files;
    }

    const avatarPaths = await fetchFolderContents('avatars');

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ avatars: avatarPaths });

  } catch (error) {
    console.error('Error fetching from GitHub API:', error);
    res.status(500).json({ error: 'Failed to fetch avatar list from GitHub.' });
  }
}
