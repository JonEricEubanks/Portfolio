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

## Deployment

Hosted on **Azure Static Web Apps**. Pushes to `main` trigger the GitHub Actions workflow in `.github/workflows/azure-static-web-apps-happy-tree-026e2110f.yml`, which deploys the site root and the `api/` Azure Functions.

When changing `style.css` or other assets, bump the cache-busting query string in `index.html` (e.g. `style.css?v=YYYYMMDD`) so browsers pick up the new version.

## Local development

Open `index.html` directly in a browser, or serve the folder with any static server. The `api/` folder runs locally with Azure Functions Core Tools (`func start`).
