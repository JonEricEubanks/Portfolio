# JonEric Eubanks — Portfolio

Personal portfolio showcasing production AI agents, Power Platform apps, Power BI dashboards, and GIS visualizations built for governments and organizations.

**Live site:** https://happy-tree-026e2110f.7.azurestaticapps.net/

## Highlights

- **CivicGrant IQ** (June 2026) — Best IQ Agent, Microsoft Agents League. Five-agent system that rose from a field of ~5,000 contestants and turns federal NOFOs into traceable municipal pursuit decisions.
- **CivicLens** (April 2026) — Grand Prize winner.
- **MAINTAIN AI & Kaizen AI** (February 2026) — Production AI agent builds.
- **ELM (Employment Lifecycle Management)** (March 2025) — Best in Automation, Microsoft.

## Structure

| Path | Purpose |
|---|---|
| `index.html` | Main portfolio page (hero award carousel, projects, dashboards, GIS, certs) |
| `career-timeline.html` | Chronological career timeline and awards |
| `chat.html` / `chat.js` | "Ask the AI" chat experience |
| `style.css` | Main stylesheet |
| `intro-fix.css` | Intro curtain/logo animation styles |
| `blog.js` / `blog-styles.css` | Blog section |
| `api/` | Azure Functions API (auth, chat, posts, likes, comments, image upload) |
| `Images/` | Screenshots and assets |

## GitHub Actions and deployment

The source repository is **JonEricEubanks/Portfolio**. Its [Portfolio checks workflow](.github/workflows/portfolio-checks.yml) runs on pull requests targeting `main`, pushes to `main`, and manual runs from the GitHub Actions tab. It installs the locked site and API dependencies, then runs the Jest suite, including checks for credential counts, screenshots, and verification links.

For portfolio updates:

1. Make changes on a branch in the source repository and open a pull request to `main`.
2. Review the changes and wait for **Portfolio checks / Portfolio tests** to pass before merging.
3. Promote the reviewed changes to **JonEricEubanks/Portfolio-SWA** without removing its existing deployment workflow. A pull request there can provide an Azure preview; merging into its `main` branch triggers the production deployment.
4. Verify the update on the [live site](https://happy-tree-026e2110f.7.azurestaticapps.net/).

The two repositories have separate histories: a push or successful check in `Portfolio` does **not** automatically update `Portfolio-SWA` or deploy the site. The deployment repository's `.github/workflows/azure-static-web-apps-happy-tree-026e2110f.yml` publishes the site root and the `api/` Azure Functions. Branch protection must be configured separately if passing checks should be required for merging.

When changing `style.css` or other assets, bump the cache-busting query string in `index.html` (e.g. `style.css?v=YYYYMMDD`) so browsers pick up the new version.

## Local development

On a clean checkout, install both dependency sets and run the same tests as GitHub Actions:

```powershell
npm ci
npm ci --prefix api
npm test -- --runInBand
```

Open `index.html` directly in a browser, or serve the folder with any static server. The `api/` folder runs locally with Azure Functions Core Tools (`func start`).
