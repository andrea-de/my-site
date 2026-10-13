# Andrea de Candia - Portfolio & AI Agent

This is the source code for my personal portfolio website, built with SvelteKit and featuring an integrated AI assistant powered by Google Gemini.

## 🚀 Features

- **AI-First UX:** A custom-built AI chat interface that acts as a technical recruiter assistant.
- **Deep Technical Context:** The AI is grounded in my specific technical philosophy and project history.
- **Real-time Interactions:** Interactive UI components using Anime.js and Vivus for SVG animations.
- **Visit Tracking:** Custom-built analytics and visit tracking system integrated with Upstash Redis.
- **Modern Tech Stack:** SvelteKit 4, Vite, and Vercel for deployment.

## 🤖 Updating the AI Context

The AI assistant is grounded using two main files. To update what the AI knows about me, modify:

1.  **`src/lib/knowledge.md`**: Contains deep technical context, architectural philosophy, and specific work experience narratives.
2.  **`src/lib/context/profile.json`**: The structured data source for my work history, skills, and projects.

The AI uses these files in its system prompt to provide high-signal, concise answers.

## 🎬 Project Media

The project cards and project view (the same on the phone Welcome screen and in the
Software section) mostly update themselves from other sites. Nothing is copied here:
visitors' browsers stream every video from where it lives.

**Which projects show.** `withMedia()` in `src/components/showcase/projects.js`: every
project in `src/lib/context/projects.json`, in file order, that has a video or a real
screenshot and is not `"hidden": true`. Hide a project there to remove it from both places.

**The card video** (first in the project's reel) comes from `src/lib/promo-videos.js`:

| Project | Source | Updates itself? |
| --- | --- | --- |
| AudioTales, Cruffled, Square Swaps, Weatherie, Tackry, Section Launcher | House-ads catalogue, `advectionsoftware.com/api/catalogue` (`APP_TO_PROJECT`) | Yes: a new cut published there replaces the card video |
| Rogue Calculator | Fixed link to its press kit's `story-portrait.mp4` (`LOCAL_VIDEOS`) | Only if that file is replaced at the same URL |
| Found Teams | Fixed link to its press kit's `media/short.mp4` (`LOCAL_VIDEOS`) | Only if that file is replaced at the same URL |
| GameTsunami | `static/landing/hero-gameplay.mp4` in this repo (`LOCAL_VIDEOS`) | No |

**The rest of the reel** comes from each product's `/press` page (`PRESS_PAGES` in
`src/lib/server/press.js`, served by `/api/press`):

- Connected: AudioTales, Cruffled, Square Swaps, Weatherie, Rogue Calculator, Found Teams.
  A new short added to one of those pages appears with no code change.
- Not connected: Tackry and Section Launcher (their press pages only hold the house-ad and
  a landscape promo today). Add a line to `PRESS_PAGES` once they have shorts.
- Only vertical social cuts are picked up: files in a `shorts/` folder, named
  `short-…`/`social-…` (or with `_`), or `trailer-portrait.mp4`; on Found Teams' page, any
  portrait video. Landscape trailers, house-ads and stills are skipped. A press video that
  is already the card video is not repeated.
- The parser knows six page layouts (listed at the top of `press.js`). A press page in a
  new layout returns no videos until a branch is added there.
- Delay: usually under an hour, at worst about two. Each server instance keeps a page's
  list for an hour, the CDN keeps the response for an hour (`s-maxage=3600`), and once
  that expires the CDN serves the old list one more time while it fetches the new one
  (`stale-while-revalidate`).

## 🛠️ Development

### Prerequisites
- Node.js 22.x
- A Google Gemini API Key (set in `.env` as `GEMINI_API_KEY`)
- Upstash Redis credentials (for visit tracking)

### Setup
```bash
npm install
cp .env.example .env
# Fill in your API keys in .env
```

### Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run check`: Run Svelte-check for type and syntax errors
- `npm run format`: Format code with Prettier
- `npm run lint`: Run ESLint and Prettier checks

## 🧪 Testing
```bash
npx playwright install
npm run test
```

## 📄 License
This project is private. All rights reserved.
