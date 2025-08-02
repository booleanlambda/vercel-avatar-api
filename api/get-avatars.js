// This function runs on Vercel's servers, not in the user's browser.

export default async function handler(req, res) {
  // Your GitHub repository details
  const GITHUB_USER = 'alertalerted-dotcom';
  const GITHUB_REPO = 'modern-art-avatars';
  const BRANCH = 'main';

  // This uses an environment variable for security, which you'll set in Vercel.
  const GITHUB_PAT = process.env.GITHUB_PAT;

  if (!GITHUB_PAT) {
    return res.status(500).json({ error: 'GitHub Personal Access Token is not configured.' });
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/git/trees/${BRANCH}?recursive=1`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        // Authenticate with your Personal Access Token
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const data = await response.json();

    // Filter the file list to get only the avatar images
    const avatarPaths = data.tree
      .map(file => file.path)
      .filter(path => path.startsWith('avatars/') && path.endsWith('.png'));

    // Set caching headers to make subsequent requests fast
    // Cache on Vercel's CDN for 1 hour, and allow browsers to use a stale version for up to a day
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

    // Send the final list of avatar paths as a JSON response
    res.status(200).json({ avatars: avatarPaths });

  } catch (error) {
    console.error('Error fetching from GitHub API:', error);
    res.status(500).json({ error: 'Failed to fetch avatar list from GitHub.' });
  }
}

