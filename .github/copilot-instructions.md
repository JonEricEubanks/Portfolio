# AI Coding Agent Instructions - JonEric Portfolio

## Project Overview
This is a personal portfolio website for JonEric Eubanks showcasing low-code development, dashboards, and GIS projects. The site features an AI chatbot assistant, interactive "spotlight" dashboard mode, and modal-based project showcases.

## Architecture

### Deployment Pattern: Dual Environment
- **Local Dev**: Express.js server (`server.js`) on port 3000
- **Production**: Vercel serverless (`api/chat.js`) with edge functions
- Both environments share identical AI chat logic but differ in CORS and initialization
- Always update BOTH `server.js` AND `api/chat.js` when modifying chat backend

### Frontend Structure
- **Single-page application** with vanilla JS (no framework)
- `index.html`: Monolithic 1876-line file containing all content (hero, projects, certifications, blog section)
- Four main JS modules:
  - `chat.js`: AI chatbot with conversation history, intent detection, anti-repetition
  - `dashboard.js`: "Spotlight mode" toggle with KPI indicators and counter animations
  - `blog.js`: Blog management system with localStorage-based CMS
  - `slideshow-kpi.js`: Currently empty, reserved for modal slideshow enhancements

### AI Chat System
The AI chatbot uses **dual-layer intelligence**:
1. **Frontend** (`chat.js` lines 176-606): Intent detection, response variations, conversation tracking
2. **Backend** (both `server.js` and `api/chat.js`): OpenAI GPT-4o-mini with dynamic context

**Key anti-repetition mechanisms**:
- Backend: `presence_penalty: 0.6`, `frequency_penalty: 0.3`, conversation history (last 6 messages)
- Frontend: `conversationContext` tracks discussed topics, `usedResponseSets` prevents identical responses
- System prompt includes recent response themes to force variety

### Modal System (`index.html`)
Project cards use data attributes to populate modals:
```html
data-modal-title="Project Name"
data-modal-slideshow="executive-summary-key,img1.png,img2.png"
data-modal-descriptions="Slide 1 text||Slide 2 text||Slide 3 text"
data-modal-link="https://external-link"
```
The `chat.js` extracts this data via `extractPortfolioData()` to provide the AI with project context.

### Blog System
**Architecture**: Built-in content management system (no third-party dependencies)
- **Storage**: localStorage (`portfolio-blog-posts` key)
- **Admin Panel**: Hidden by default, toggled via "Admin" button in blog section
- **Blog Manager**: `blog.js` provides full CRUD operations
- **Modal Integration**: Full blog posts display using existing modal system

**Key Features**:
- Create/Edit/Delete posts via form in admin panel
- Posts include: title, category, excerpt, content, tags, timestamps
- Auto-extracts blog data for AI chat context via `blogManager.getPostsForContext()`
- Export functionality: Download all posts as JSON for backup/version control
- Categories: low-code, dashboards, gis, ai, career, tutorial

**Usage Pattern**:
1. Click "Admin" button in blog section
2. Fill form and click "Publish Post"
3. Posts save to localStorage instantly (no deployment needed)
4. Export JSON periodically for git backup

## Critical Conventions

### CSS Design System
- **Glass morphism** (`glass-morphism` class): Frosted glass cards with blur
- **Gradient text** (`gradient-text` class): Teal-to-cyan gradient (#0F766E → #0D9488)
- **Modern prefix**: Classes like `modern-header`, `modern-nav`, `modern-grid` indicate the current design language
- CSS variables in `:root` define the teal/cyan theme — avoid hardcoding colors

### JavaScript Patterns
1. **No build step**: All code is vanilla JS, directly loaded in browser
2. **DOMContentLoaded listeners**: Each JS file waits for DOM before initializing
3. **Portfolio data extraction**: `chat.js` scrapes HTML to provide AI with live project data
4. **Conversation state**: Maintained in `JonEricChatBot.conversationHistory` array (user/assistant messages)

### Deployment Workflow
```powershell
# Local testing
npm install
npm start  # Runs on localhost:3000

# Production deployment (Vercel)
# Requires OPENAI_API_KEY environment variable in Vercel dashboard
git add .
git commit -m "Your commit message"
git push origin main  # Auto-deploys to Vercel (GitHub connection active)
```

## Common Tasks

### Adding a New Project
1. Add project card in `index.html` under appropriate section (`#lowcode`, `#dashboards`, `#GIS`)
2. Include all `data-modal-*` attributes (see Modal System above)
3. Add images to `Images/` directory
4. The AI chatbot will automatically discover via `extractPortfolioData()`

### Adding a Blog Post
1. Navigate to blog section on live site
2. Click "Admin" button
3. Fill out form (title, category, excerpt, content, tags)
4. Click "Publish Post" — appears instantly
5. Optional: Click "Export All Posts" to download JSON backup for version control

### Modifying AI Behavior
1. **System prompt**: Edit `buildDefaultContext()` in BOTH `server.js` and `api/chat.js`
2. **Intent detection**: Modify `analyzeIntent()` in `chat.js` (lines ~850-1000)
3. **Response variations**: Update `initializeResponseVariations()` in `chat.js` (lines ~100-500)
4. **Model parameters**: Adjust `temperature`, `max_tokens`, penalties in chat endpoints
5. **Blog context**: Blog posts automatically included via `extractPortfolioData()` — no manual updates needed

### Updating Spotlight Dashboard Mode
**Purpose**: Demonstrates dashboard development skills by transforming the portfolio into an interactive data visualization—showcasing the same KPI presentation techniques used in client projects.

- Toggle logic in `dashboard.js` (line ~35)
- KPI indicators added via `addKpiIndicator()` using `data-kpi-*` attributes on project cards
- Counter animations use `animateCounters()` with `data-target` attributes on metric values
- Mobile behavior changes via `setupMobileKpiObserver()` (intersection observer)

## Debugging Tips
- **Chat not responding**: Check `OPENAI_API_KEY` in `.env` (local) or Vercel dashboard (production)
- **Repetitive AI responses**: Verify `conversationHistory` is passed to backend in `sendMessage()`
- **Modal not opening**: Ensure ALL `data-modal-*` attributes are present and `data-modal-descriptions` uses `||` separator
- **Metrics not animating**: Confirm elements have `counter` class and `data-target` attribute
- **Blog posts not saving**: Check browser localStorage quota (usually 5-10MB limit)
- **Blog posts not appearing in chat**: Ensure `blog.js` loads before `chat.js` initializes `extractPortfolioData()`
- **Admin panel not opening**: Verify `blog-admin-panel` element exists and `blog.js` is loaded

## Key Files Reference
- `index.html` (1961+ lines): All content markup including blog section
- `chat.js` (1146 lines): AI chatbot frontend with blog context extraction
- `blog.js` (370 lines): Blog management system with localStorage CMS
- `server.js` / `api/chat.js`: AI chat backend (keep in sync)
- `style.css` (4099 lines): Complete design system
- `chat-styles.css`: AI chat UI styles
- `blog-styles.css` (440 lines): Blog-specific styles with glass-morphism
- `dashboard.js` (608 lines): Spotlight mode logic
- `vercel.json`: Serverless function config (30s timeout)

## Don't
- Don't split `index.html` into components — it's intentionally monolithic for performance (single HTTP request, no framework overhead)
- Don't add a frontend framework — vanilla JS by design keeps it fast and maintainable
- Don't forget to update BOTH chat backend files (`server.js` AND `api/chat.js`)
- Don't hardcode colors — use CSS variables from `:root`
- Don't deploy manually — just commit and push to trigger Vercel auto-deploy

## Planned Features

### Blog Section ✅ IMPLEMENTED
Blog section with built-in content management system now complete:
- **Location**: Below certifications section
- **Architecture**: localStorage-based CMS (no third-party services)
- **Features**: Full CRUD operations, category filtering, tag system, export to JSON
- **Styling**: Matches existing glass-morphism design system
- **AI Integration**: Blog posts automatically included in chat context

### Future Considerations
- Add blog post search/filter functionality on frontend
- Implement blog RSS feed generation
- Add social sharing buttons to blog posts
- Consider migrating from localStorage to JSON file for cross-device editing
