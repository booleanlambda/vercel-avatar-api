Vercel Avatar API
A free, open-source library and serverless API for dynamically fetching avatar image paths from a public GitHub repository.
This project provides a reliable backend for front-end avatar selectors, avoiding the client-side rate limits and complexities of calling the GitHub API directly from a browser. You can deploy it for free on Vercel and use it in any of your projects.
🚀 Features
 * Dynamic: Automatically discovers all .jpg and .png files in the avatars/ directory of the target repository.
 * Robust: Uses a GitHub Personal Access Token (PAT) for authenticated API requests, providing a much higher rate limit.
 * CORS Enabled: Configured to allow requests from any origin, making it perfect for local development and production websites.
 * Cached: Uses Vercel's CDN to cache the API response for fast, repeated lookups.
🛠️ Setup
To deploy your own version of this API, follow these steps.
1. GitHub Personal Access Token (PAT)
The function requires a GitHub PAT to make authenticated requests.
 * Go to your GitHub Settings > Developer settings > Personal access tokens > Tokens (classic).
 * Click "Generate new token" (classic).
 * Give it a descriptive name (e.g., "Vercel Avatar API").
 * Set an expiration date (e.g., 90 days).
 * Under "Select scopes," check the box for repo (or just public_repo if the target repository is public).
 * Click "Generate token" and copy the token immediately. You will need it for the next step.
2. Deploy to Vercel
 * Clone or fork this repository.
 * Go to vercel.com and create a new project by importing the repository.
 * Before deploying, go to the project's Settings > Environment Variables.
 * Add a new variable:
   * Name: GITHUB_PAT
   * Value: Paste the Personal Access Token you copied from GitHub.
 * Save the variable and deploy the project.
📡 API Endpoint
Once deployed, your API will be available at the following endpoint.
 * URL: https://your-vercel-app-name.vercel.app/api/get-avatars
 * Method: GET
Example Success Response (200 OK):
{
  "avatars": [
    "avatars/female/black/avatar-1.jpg",
    "avatars/female/white/avatar-1.jpg",
    "avatars/male/black/avatar-1.jpg",
    "avatars/male/white/avatar-1.jpg"
  ]
}

Example Error Response (500 Internal Server Error):
{
  "error": "Failed to fetch avatar list from GitHub."
}

