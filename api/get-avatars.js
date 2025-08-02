// This function runs on Vercel's servers, not in the user's browser.

// Function to fetch trees non-recursively when truncated
async function fetchNonRecursively(res, GITHUB_USER, GITHUB_REPO, GITHUB_PAT) {
  const allFiles = [];
  
  // Start with the avatars directory
  const dirsToProcess = ['avatars'];
  
  while (dirsToProcess.length > 0) {
    const currentDir = dirsToProcess.shift();
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${currentDir}`;
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${GITHUB_PAT}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch ${currentDir}: ${response.status}`);
        continue;
      }
      
      const items = await response.json();
      
      for (const item of items) {
        if (item.type === 'file' && (item.name.endsWith('.jpg') || item.name.endsWith('.png'))) {
          allFiles.push(item.path);
        } else if (item.type === 'dir') {
          dirsToProcess.push(item.path);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${currentDir}:`, error);
    }
  }
  
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).json({ avatars: allFiles });
}

export default async function handler(req, res) {
  // --- CORS Headers ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
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

  const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/git/trees/${BRANCH}?recursive=1`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const data = await response.json();

    // Check if results are truncated
    console.log('Is truncated:', data.truncated);
    console.log('Total items returned:', data.tree.length);
    
    if (data.truncated) {
      // If truncated, we need to fetch trees non-recursively
      return await fetchNonRecursively(res, GITHUB_USER, GITHUB_REPO, GITHUB_PAT);
    }

    // --- CORRECTED LOGIC ---
    // Now filters for files ending in .jpg OR .png within the 'avatars/' directory and all subdirectories
    const avatarPaths = data.tree
      .filter(item => {
        return item.type === 'blob' && // Only files, not directories
               item.path.startsWith('avatars/') && // In avatars directory or subdirectories
               (item.path.endsWith('.jpg') || item.path.endsWith('.png')); // Image files
      })
      .map(item => item.path);

    console.log('Final avatar paths found:', avatarPaths.length);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ avatars: avatarPaths });

  } catch (error) {
    console.error('Error fetching from GitHub API:', error);
    res.status(500).json({ error: 'Failed to fetch avatar list from GitHub.' });
  }
}
