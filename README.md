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

**Linking to a project.** Each project has its own link from its name, e.g.
`/#rogue-calculator` or `/#found-teams` (`projectSlug()` in `projects.js`; the project id
works too). Opening a project writes it to the address bar, and a link with any `#` skips
the phone Welcome screen and opens that project over the Software section.

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

## 🔐 Admin

`/admin` asks for a password and keeps the browser logged in for 24 hours (a signed,
httpOnly cookie); the dashboard is `/api/visits`. The password is `ADMIN_PASSWORD`, or
`VISITS_ADMIN_TOKEN` while that isn't set; changing it logs every browser out. Five wrong
passwords from one address lock the form for 15 minutes. Logging in also marks the browser
as Andrea's for two years: its visits aren't counted and nothing goes to Telegram, even
after the session ends ("Count this browser again" on `/admin` undoes it). Scripts still
send `VISITS_ADMIN_TOKEN` as an `x-visits-token` or Bearer header; it is no longer
accepted in the URL, and `?ignore=true` is gone.

## 🔗 Job links

Each job application can get its own short link, `andreadecandia.com/r/<code>`, for the
résumé sent to that company (and a QR code of it). Andrea's job-hunting agents create them
through the API below.

**The page** (`src/routes/r/[code]`) greets the company's team, names the role, leads with
the projects chosen for it, and links to the résumé (in the link's region) and the agent.
The text and voice agents are briefed on the job (company, role, job description) for the
rest of that browsing session, even after a click through to `/`. It is `noindex` (meta
tag and `X-Robots-Tag`). An unknown or closed code redirects to `/`. The job description
and private notes never reach the page.

**Tracking.** Every page load is logged against the code (time, country, city, device,
referrer) and sent to Telegram, e.g. `🔗 k7q · Acme · Senior AI Engineer — opened from
Madrid, ES (mobile). Visit #2.` Link-preview fetchers and other bots (Slack, LinkedIn,
iMessage…) are logged as `preview` entries, not visits, with at most one alert per previewer
per hour. The page also logs `project_open`, `resume_open`, `chat_open` and `chat_question`
(a count only; the conversation is logged by the chat itself). The dev server skips
Telegram unless `REFERRALS_TELEGRAM_IN_DEV=1`.

**Storage.** Upstash Redis, kept for good (no TTL): `ref:<code>` (record),
`ref:<code>:stats` (counters), `ref:<code>:visits` (log, newest 500), `ref:index` (codes by
creation time). Codes are 3 random characters from `a–z0–9`, case-insensitive. Without
Redis, the dev server keeps them in memory.

**API.** Every call needs `Authorization: Bearer $REFERRALS_API_TOKEN`; without it the
answer is `404 Not found`. The token lives at `hel:~/.config/my-site/referrals.env` and in
the Vercel env var `REFERRALS_API_TOKEN`. Send JSON with `Content-Type: application/json`.

```bash
API=https://www.andreadecandia.com/api/r
AUTH="Authorization: Bearer $REFERRALS_API_TOKEN"

# Create: company and role are required. → 201 { "code": "k7q", "url": "https://www.andreadecandia.com/r/k7q", "record": {…} }
curl -s -X POST $API -H "$AUTH" -H 'Content-Type: application/json' -d '{
  "company": "Acme", "role": "Senior AI Engineer", "region": "eu",
  "jobUrl": "https://acme.com/jobs/123", "jobDescription": "…",
  "notes": "private, never shown", "projects": ["gametsunami", "cruffled"],
  "greeting": "optional line in place of \"This page was put together for the … role.\""
}'

curl -s $API -H "$AUTH"                     # list: { "links": [ record + stats, no jobDescription ] }
curl -s $API/k7q -H "$AUTH"                 # one: record + stats + "log" (newest first)
curl -s -X PATCH $API/k7q -H "$AUTH" -H 'Content-Type: application/json' -d '{"status":"closed"}'
curl -s -X DELETE $API/k7q -H "$AUTH"       # { "deleted": "k7q" }
```

| Field | |
| --- | --- |
| `company`, `role` | required; up to 120 / 160 characters |
| `region` | `us` (default) or `eu`: which résumé, phone and location the page and agent use |
| `jobUrl` | optional http(s) URL |
| `jobDescription` | optional; cut to 20,000 characters; only the agent sees it |
| `notes` | optional, private: only returned by this API |
| `projects` | optional project ids from `projects.json`, in lead order (none: every project) |
| `greeting` | optional one line replacing the default line under the headline |
| `status` | `active` (default) or `closed` (the link then redirects to `/`) |

A PATCH sets only the fields it sends; `null` clears an optional one. Records also carry
`createdAt`, `updatedAt`, `visits`, `previews`, `firstVisitAt`, `lastVisitAt` and `events`
(counts by event). Bad input gets a `400` with `error` (one string) and `errors` (a list).

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
