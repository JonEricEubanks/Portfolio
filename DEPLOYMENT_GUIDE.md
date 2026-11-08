# Deployment Guide

The portfolio is hosted on **Azure Static Web Apps**:
https://happy-tree-026e2110f.7.azurestaticapps.net/

Vercel is no longer used. The `vercel.json` file has been removed, and the Vercel
GitHub App should not have access to this repository.

## How a change reaches the live site

The site uses two repositories with separate histories:

| Repository | Role |
|------------|------|
| **JonEricEubanks/Portfolio** | Source and review. The `Portfolio checks` workflow runs the Jest suite on pull requests and pushes to `main`. Nothing here deploys. |
| **JonEricEubanks/Portfolio-SWA** | Deployment. Its `azure-static-web-apps-happy-tree-026e2110f.yml` workflow creates an Azure preview for each pull request and deploys to production when changes merge into `main`. |

1. Make the change on a branch in `Portfolio` and open a pull request. Wait for `Portfolio tests` to pass.
2. Bring the same change into `Portfolio-SWA` (for example, cherry-pick it onto a branch from `swa/main`) and open a pull request there.
3. Check the Azure preview URL that the Static Web Apps bot posts on that pull request.
4. Merge the `Portfolio-SWA` pull request to deploy to production, then verify the live site.

The deployment workflow publishes the site root (`app_location: "/"`) and the
Azure Functions in `api/` (`api_location: "api"`). It authenticates with the
`AZURE_STATIC_WEB_APPS_API_TOKEN_HAPPY_TREE_026E2110F` repository secret.

## Application settings

Set these in the Azure portal under **Static Web App ? Settings ? Environment
variables**. Never commit them to either repository.

| Variable | Used for |
|----------|----------|
| `ANTHROPIC_API_KEY` | AI chat assistant (`api/chat`) |
| `BLOG_ADMIN_EMAIL` | Blog admin sign-in |
| `BLOG_ADMIN_PASSWORD` | Blog admin sign-in |
| `GITHUB_TOKEN` | Saving blog posts to GitHub |
| `GITHUB_OWNER` | Repository owner for blog posts |
| `GITHUB_REPO` | Repository name for blog posts |
| `AZURE_STORAGE_CONNECTION_STRING` | Likes, comments, and image uploads |

## Troubleshooting

- **Deployment failed:** open the failed run in the `Portfolio-SWA` **Actions** tab.
- **Chat not responding:** confirm `ANTHROPIC_API_KEY` is set in the Static Web App
  environment variables, then check the browser console for `/api/chat` errors.
- **Change not live:** confirm it was merged into `Portfolio-SWA` `main`. Merging into
  `Portfolio` alone does not deploy.
