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
| Experience | `static/experience/intellisense.mp4` in this repo (`src/lib/experience-videos.js`) | No |

**Experience** is the last card, after every product (`experienceTile` on `ProjectCards`, in
the Software section and on the Welcome screen): Andrea's narrated videos of Intellisense.io,
Mesa Cloud, Giesecke+Devrient and AIA, served from `static/experience/` (web re-encodes, with
a poster each), with titles and roles in `src/lib/experience-videos.js`. It is not a product,
so it shows no status and has no project view: it opens its feed, `/shorts?project=experience`.
To replace a video, overwrite its file there under the same name.

**The rest of the reel** comes from each product's `/press` page (`PRESS_PAGES` in
`src/lib/press-pages.js`, read by `src/lib/server/press.js` and served by `/api/press`):

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

**`/shorts`** plays the same videos as a vertical feed (`src/lib/shorts.js`,
`src/components/shorts/`), so it updates itself the same way. The main feed shows each
project's card video, in the order above, then project by project the rest of each one's
press shorts (`REPEAT_CARDS` in `shorts.js` brings the card videos back into that second
round). Experience joins the main feed around the card videos: the AI voice short, Intellisense
first, then every product's card video, then Mesa Cloud, G+D and AIA, then the press shorts.
`/shorts?project=square-swaps` is one project's feed: its press shorts, then its card video
last (a project with only one video opens on it in the main feed instead);
`?project=experience` keeps its own order. Experience videos are named by company in the
title row and the sheet, numbered 1/4 to 4/4, with the role as the line.
A video's link is the same in both: `#square-swaps-2` is Square Swaps' second video in its
own order (card video first), and `#square-swaps` opens on the project's first in the feed.
When a video ends, a five-second countdown leads to the next one (a swipe, scrub or pause
stops it), with "More from <project>" under it (in a project's feed, "All projects"); paused,
the screen also offers "<project> shorts". The control row has an icon to the project's own
view (`/#square-swaps`), then Next project, or All projects in a project's feed. The way in:
a "Watch as shorts" card first in the project cards (Welcome screen and Software section),
and "Watch as shorts" in the project view, which opens that project's feed. Likes and how
much of each video was played show in that visit's report on the dashboard (they add nothing
to the score).

**The cover.** Loaded directly (from an email, a QR code, a shared link), the feed opens on a
cover that sits above the first video like one more item, in the same rounded frame: "Hi
<Company> team." (on a job link, else "Hi there.") over "I'm Andrea de Candia", "Product
engineer", "Short videos of my work.", and **Play with sound** and **Play muted** (each slides
the cover up and starts the video inside the tap, which is what lets phones play sound). Only
the frame moves, as between two videos: the control row stays put and, while the cover shows,
holds "Your welcome page" (`/r/<code>` on a job link, else "Welcome", `/`, reloaded so phones
get the Welcome screen), "Resume" (`/resume`, in the job link's region on a code) and, in the
spot where the videos have their close button, that button widened with an exit icon and
"Explore the site" (`/?nointro`, the site without the Welcome screen). Labels shorten as the
row narrows ("Welcome", "Explore"), so the row fits a 360px phone.
The first video loads behind the cover, so it is ready when the cover goes. A swipe up,
Space/Enter or ↓/j starts it too (a swipe without a fresh tap may play muted with "Tap for
sound"); a swipe down, ↑/k or the wheel from the first video brings it back and pauses the
video. A deep link (`/shorts#square-swaps-2`, `?project=…`) also opens on the cover, naming
the video ("Starts on Square Swaps · …"), and the buttons start that video; from there the
cover is above the feed's first video as usual. Arriving from a link inside the site (the
Watch as shorts card, the project view) skips the cover and plays at once. In the visit's
report the Shorts row says how the cover was left (`Cover: Play with sound · Resume · Main
site`) and what was done with the voice short (`Voice short: seen · talked (orb)`).

**One frame.** Every item, the cover included, sits in the same 9:16 rounded frame in the same
place (sized in CSS from the stage: its width, or its height less 20px), so a swipe never
changes its size. A cut of another shape (GameTsunami's 608x744, the 1:2 store cuts) fits whole
inside it over a blurred copy of its poster; nothing is cropped.

**The AI voice short** (`VOICE_SHORT` in `shorts.js`; false takes it out) is the main feed's
first item, under the cover and before the videos: the Welcome screen's voice agent (its orb
and the rotating capabilities, `src/components/intro/capabilities.js`) in the feed's frame
(`VoiceShort.svelte`). Nothing starts until a tap: the orb opens the site's voice mode, a
capability opens the chat with its question asked. On `/shorts/<code>` the agent is briefed on
the job, as on `/r/<code>`. Moving on from it (a swipe, the wheel, a key, the cover, another
feed) closes whatever it opened, which ends the call and releases the microphone; while the
chat covers the feed, the keys are the chat's. The shared video pauses and hides there, with
no progress line, countdown, like or share; its row offers the next video. A swipe from the
cover lands on it; Play with sound and Play muted go straight to the first video.

**`/shorts/<code>`** is the same feed for a job link: the cover opens with "Hi <Company>
team." (`src/routes/shorts/[code]`). The code follows the `/r/<code>` rules (active, with a
company; anything else redirects to `/shorts`, keeping `?project=` and the `#video`), the
page is `noindex` and `private, no-store`, and a visit is logged against the link as for
`/r/` but marked `page: "shorts"` (the timeline says "Opened shorts from …", Telegram
"shorts opened from …"; Andrea's own browser is not logged). The feed's addresses keep the
`/shorts/<code>` base while moving between videos and feeds; Share always gives the plain
`/shorts` link, since the code names the company. It also briefs the agent on the job, as
`/r/<code>` does, if the visitor goes on to the site.

## 🔐 Admin

`/admin` asks for a password and keeps the browser logged in for 14 days (a signed,
httpOnly cookie, scoped to the whole domain so a login on `www.` also works on `admin.`);
the dashboard is `/api/visits`. `admin.andreadecandia.com` and `admin.andrea-dev.com` open
the dashboard, or the login when signed out (`src/hooks.server.js`); each needs the domain
added to the Vercel project and a CNAME to Vercel at its DNS host. The password is `ADMIN_PASSWORD`, or
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

**The page** (`src/routes/r/[code]`) greets the company's team, lists up to five reasons
Andrea fits the role (`fitPoints`), shows every project, then the agent, the résumé (in the
link's region) and the full site.
The text and voice agents are briefed on the job (company, role, job description) for the
rest of that browsing session, even after a click through to `/`. It is `noindex` (meta
tag and `X-Robots-Tag`). An unknown or closed code redirects to `/`. The job description
and private notes never reach the page.

**Shorts.** `/shorts/<code>` plays the product videos with a cover that greets the company
(see Project Media above); its loads are logged against the same code, marked as shorts.

**Tracking.** Every page load is logged against the code (time, country, city, device,
referrer) and sent to Telegram, e.g. `🔗 k7q · Acme · Senior AI Engineer — opened from
Madrid, ES (mobile). Visit #2.` Link-preview fetchers and other bots (Slack, LinkedIn,
iMessage…) are logged as `preview` entries, not visits, with at most one alert per previewer
per hour. The page also logs `project_open`, `resume_open`, `chat_open` and `chat_question`
(a count only; the conversation is logged by the chat itself). The dev server skips
Telegram unless `REFERRALS_TELEGRAM_IN_DEV=1`.

**Storage.** Upstash Redis, kept for good (no TTL): `ref:<code>` (record),
`ref:<code>:stats` (counters), `ref:<code>:visits` (log, newest 500), `ref:index` (codes by
creation time), `ref:<code>:resume:<i>` (an attached resume PDF, base64 in 512 KB chunks, one
request each to stay well under Upstash's request and value limits). Codes are 3 random characters from `a–z0–9`, case-insensitive. Without
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
  "notes": "private, never shown",
  "fitPoints": ["Shipped multi-agent systems with MCP tools", "Python data pipelines at scale"],
  "greeting": "optional line in place of \"This page was put together for the … role.\""
}'

curl -s $API -H "$AUTH"                     # list: { "links": [ record + stats, no jobDescription ] }
curl -s $API/k7q -H "$AUTH"                 # one: record + stats + "log" (newest first)
curl -s -X PATCH $API/k7q -H "$AUTH" -H 'Content-Type: application/json' -d '{"status":"closed"}'
curl -s -X DELETE $API/k7q -H "$AUTH"       # { "deleted": "k7q" }

# Applied: what actually went out for the job. Agents POST right after submitting an application.
curl -s -X POST $API/k7q/applied -H "$AUTH" -H 'Content-Type: application/json' -d '{"note":"Greenhouse form"}'   # channel "ats" (default)
curl -s -X POST $API/k7q/applied -H "$AUTH" -H 'Content-Type: application/json' -d '{"channel":"email"}'          # the pitch email was sent
curl -s -X DELETE $API/k7q/applied -H "$AUTH" -H 'Content-Type: application/json' -d '{"channel":"email"}'        # clear a mistaken mark
```

**Notes between Andrea and Claude.** Each link carries two note boxes, so Andrea doesn't need
the chat to know where an application stands. `noteForAndrea` is what Claude (the agent working
on the applications) needs from Andrea: form answers, decisions, placeholders. `noteForClaude` is
Andrea's instructions or answers. Once handled, notes settle into `history`
(`[{ at, by: "andrea" | "claude", text }]`, oldest first, the newest 100 kept). A link shows
**Your turn** while `noteForAndrea` is set and `noteForClaude` empty, **Claude's turn** while
`noteForClaude` is set.

```bash
# Set or clear a note (PATCH like any field; null clears). "needs" is still accepted as noteForAndrea.
curl -s -X PATCH $API/k7q -H "$AUTH" -H 'Content-Type: application/json' -d '{"noteForAndrea":"The form asks for your earliest start date."}'
curl -s -X PATCH $API/k7q -H "$AUTH" -H 'Content-Type: application/json' -d '{"noteForClaude":null}'

# Archive: each non-empty note moves into the history as its author's entry and is cleared;
# "text" (optional) adds Claude's entry saying what was done; "only" limits it to one note.
curl -s -X POST $API/k7q/archive -H "$AUTH" -H 'Content-Type: application/json' -d '{"text":"Applied through Greenhouse with start date 1 Dec."}'
curl -s -X POST $API/k7q/archive -H "$AUTH" -H 'Content-Type: application/json' -d '{"only":"noteForClaude","text":"Found the hiring manager: jane@acme.com"}'

# Append one history entry ("by" defaults to "claude"; up to 3000 characters).
curl -s -X POST $API/k7q/history -H "$AUTH" -H 'Content-Type: application/json' -d '{"text":"Recruiter replied; call on Tuesday."}'
```

**Resume.** A link can hold one PDF (up to 2 MB), attached only when Andrea asks or a manual
submission needs one. Upload the file itself as the body; `filename` is optional (default
`<Company> - Andrea de Candia Resume.pdf`). The record then carries
`resume: { filename, size, chunks, uploadedAt }`. Downloading needs the token or Andrea's admin
session and comes as an attachment with the stored file name; it is never public.

```bash
curl -s -X PUT "$API/k7q/resume?filename=Acme%20-%20Andrea%20de%20Candia%20Resume.pdf" -H "$AUTH" \
  -H 'Content-Type: application/pdf' --data-binary @"Acme - Andrea de Candia Resume.pdf"
curl -s $API/k7q/resume -H "$AUTH" -OJ          # download
curl -s -X DELETE $API/k7q/resume -H "$AUTH"    # remove it
```

**Applied.** A link is made before anything is sent, so `POST /api/r/<code>/applied` records
what actually went out: `channel` `ats` (default; applied through the posting's form) sets
`appliedAt` and `appliedNote`, `email` (the pitch email was sent) sets `emailSentAt` and
`emailNote`. Optional `at` (ISO time, default now) and `note` (up to 500 characters). Posting
again only updates the time and note; `DELETE` with a `channel` clears it. Always send
`Content-Type: application/json` (a form-encoded POST is refused as cross-site). The dashboard's
Jobs tab shows an "Applied" count and an **Email sent** toggle on each link for marking a pitch
sent by hand.

**Dashboard.** The Jobs tab is the application tracker and where Andrea and Claude leave each
other notes. **+ New job** opens a small form (job URL, optional company and role, a note for
Claude such as "see if you can apply" or "I'll apply on LinkedIn, attach a resume") that creates
a link with `foundBy: "andrea"`, stage `not-started` and the note; until Claude fills in the
company the row shows the posting's host, and `/r/<code>` redirects to `/`. Filters (search;
quick views Your turn, Claude's turn, Ready to send, Not applied yet, Waiting on reply, Opened;
route tags; stage) sit above compact rows showing each link's route tags, stage, and a Your turn /
Claude's turn badge with the first line of the waiting note. A row opens in a sheet (bottom sheet
on phones, centred panel on desktop): **For you** (Claude's note, read-only with line breaks;
Dismiss moves it to the history), **For Claude** (a textarea with Save; saving a note makes it
Claude's turn, saving it empty clears it, and it says when there are unsaved changes), the
actions (with **Download resume** when one is attached), a Stage picker, the routes, timeline,
facts, folded fit points, notes and job description, and a **History** fold at the bottom.
Without JS, rows expand in place. The dashboard's note and New job actions are form posts to
`/api/visits` that need Andrea's admin session; SvelteKit refuses cross-origin form posts.

| Field | |
| --- | --- |
| `company`, `role` | required; up to 120 / 160 characters |
| `region` | `us` (default) or `eu`: which résumé, phone and location the page and agent use |
| `jobUrl` | optional http(s) URL |
| `jobDescription` | optional; cut to 20,000 characters; only the agent sees it |
| `notes` | optional, private: only returned by this API |
| `fitPoints` | optional, up to 5 short reasons Andrea fits the role (160 characters each), shown on the page under "Here are some ways I'm a good fit" and given to the agent |
| `projects` | ignored: every link shows every project, in the site's order (still accepted) |
| `greeting` | optional one line replacing the default line under the headline |
| `status` | `active` (default) or `closed` (the link then redirects to `/`) |
| `routes` | optional, up to 6 ways to apply: `[{ "tag": "email-apply", "where": "jobs@acme.com", "used": true }]`. `tag` is one of `agent-apply` (a standard form the agent submits once Andrea approves), `manual-apply` (a form Andrea submits), `email-apply` (the posting says to email), `email-outreach` (no posting), `referral`, `inbound`; `where` is the address or URL; `used` marks the route taken |
| `stage` | optional: `not-started`, `drafted`, `sent`, `replied`, `interviewing`, `offer`, `rejected`, `no-reply`. Marking a link applied or emailed moves `not-started`/`drafted` to `sent`. Records without one show as `sent` if applied, else `not-started` |
| `foundBy` | optional: `agent` or `andrea`; shown as a Source line at the foot of the sheet (daily search or you) |
| `noteForAndrea` | optional, up to 3,000 characters: what Claude needs from Andrea (the sheet's For you box; Dismiss moves it to `history`). `needs`, its old name, is still accepted on writes; stored `needs` values read as `noteForAndrea` and are moved there on the next write |
| `noteForClaude` | optional, up to 3,000 characters: Andrea's instructions or answers to Claude (the sheet's For Claude box) |
| `noteForAndreaAt`, `noteForClaudeAt` | set by the server: when each note was last written |
| `history` | set through `/archive` and `/history` only: `[{ at, by, text }]`, oldest first, newest 100 kept |
| `resume` | set through `/resume` only: `{ filename, size, chunks, uploadedAt }` |

A PATCH sets only the fields it sends; `null` clears an optional one (the applied marks are
set only through `/applied`). Records also carry `appliedAt`, `appliedNote`, `emailSentAt`,
`emailNote`, `createdAt`, `updatedAt`, `visits`, `previews`, `firstVisitAt`, `lastVisitAt` and `events`
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
