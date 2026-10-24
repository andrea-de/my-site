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
| Five Card Charlie | `static/five-card-charlie/trailer-portrait.mp4` in this repo: its press kit's portrait trailer (phone render) re-encoded at 720x1280, 4 MB (`LOCAL_VIDEOS`) | No. The press host sends the whole 23 MB file to every request, with no byte ranges, which iPhones won't play |
| Fluenics | Fixed link to its press kit's portrait product tour, `media/tour-1080x1920.mp4` (6 MB, `LOCAL_VIDEOS`) | Only if that file is replaced at the same URL |
| GameTsunami | `static/landing/hero-gameplay.mp4` in this repo (`LOCAL_VIDEOS`); hidden for now (`"hidden": true` in `projects.json`, out of every project row and shorts) until its media is improved | No |
| Experience | `static/experience/intellisense.mp4` in this repo (`src/lib/experience-videos.js`) | No |

**Experience** and **Methodologies** are cards on a job link's row only (`/r/<code>`, `entry` on
`ProjectCards`): Watch as shorts, Methodologies, Experience, then every product, under
"Explore my work"; like the products, they open the project view (`entryShowcase()` in
`components/showcase/projects.js`), whose reel is the set's own videos and whose "Read the
note" follows the video on screen (the role's note, the method's note); with no site, stores
or page of their own, they show no Visit row and no share link. The
Software section and the Welcome screen show neither (`experienceTile` still puts Experience
last, unused). **Methodologies** is Andrea's narrated videos on how they work with agents (Brain,
Media harnesses, Connectivity, Agentic Gateway), in `static/methodologies/` with headings and notes in
`src/lib/methodology-videos.js`; in the main shorts feed Brain plays in the first round
(before Intellisense) and the others right after it, before the other Experience videos, and its sheet links the tree note each video
explains. **Experience** is Andrea's narrated videos of Intellisense.io,
Mesa Cloud, Giesecke+Devrient and AIA, served from `static/experience/` (web re-encodes, with
a poster each), with titles and roles in `src/lib/experience-videos.js`. It is not a product,
so it shows no status and has no project view: it opens its feed, `/shorts?project=experience`.
To replace a video, overwrite its file there under the same name. On the site's Experience
section, each role with a video has a "Watch short" link beside "Details" (its role note):
`/shorts?project=experience#experience-2` opens the Experience feed on that video and plays
at once (`experienceShortHref()`, matched by the role's `treeSlug`).

**The rest of the reel** comes from each product's `/press` page (`PRESS_PAGES` in
`src/lib/press-pages.js`, read by `src/lib/server/press.js` and served by `/api/press`):

- Connected: AudioTales, Cruffled, Square Swaps, Weatherie, Rogue Calculator, Found Teams,
  Five Card Charlie, Fluenics. A new short added to one of those pages appears with no code
  change. Five Card Charlie's page holds one trailer in two portrait renders, both the card
  video's own (`covers` in its `LOCAL_VIDEOS` entry), so its reel and feed show the card video
  only until the page gets another portrait cut.
- Not connected: Tackry and Section Launcher (their press pages only hold the house-ad and
  a landscape promo today). Add a line to `PRESS_PAGES` once they have shorts.
- Only vertical social cuts are picked up: files in a `shorts/` folder, named
  `short-…`/`social-…` (or with `_`), or `trailer-portrait.mp4`; on Found Teams' and Five
  Card Charlie's pages, any portrait video. Landscape trailers, house-ads and stills are
  skipped. A press video that is already the card video (ignoring a `?v=` cache-buster, or a
  copy listed in the card's `covers`) is not repeated, and one cut published in several
  sizes (`short-886x1920.mp4`, `short-1080x1920.mp4`) is kept once, closest to 9:16.
- The parser knows seven page layouts (listed at the top of `press.js`). A press page in a
  new layout returns no videos until a branch is added there.
- Delay: usually under an hour, at worst about two. Each server instance keeps a page's
  list for an hour, the CDN keeps the response for an hour (`s-maxage=3600`), and once
  that expires the CDN serves the old list one more time while it fetches the new one
  (`stale-while-revalidate`).

**`/shorts`** plays the same videos as a vertical feed (`src/lib/shorts.js`,
`src/components/shorts/`), so it updates itself the same way. The main feed shows each
project's card video, in the order above, then project by project the rest of each one's
press shorts (`REPEAT_CARDS` in `shorts.js` brings the card videos back into that second
round). Methodologies and Experience join the main feed around the card videos: the AI voice
short, then the first of each kind (Brain, Intellisense, every product's card video), then the
rest kind by kind in the filters' order: Media harnesses, Connectivity and Agentic Gateway,
then Mesa Cloud, G+D and AIA, then the press shorts.
`/shorts?project=square-swaps` is one project's feed, in the project's own order (card video
first, as its sheet lists them; a project with only one video opens on it in the main feed
instead). A project's feed has no cover, even opened directly: it is just its videos, and a
swipe (or scroll, or arrow key) past its first or last video springs back while the
playlist button's count hops. Over the last five seconds of a video, however long it is, whose project
has more, the main feed shows a **See more <project>** pill at the frame's bottom right
("See more Methodologies", "See more Square Swaps"); it and the paused screen's "<project>
shorts" open that feed on the video that was playing, which carries on into the project's
next ones. So does choosing a video in the sheet (which lists one project's videos):
in the main feed it opens that project's feed there. The title row no longer numbers the
video; the playlist button shows where it sits in the open feed ("12/35"), and when the feed
changes the count rolls over to the new one ("3/5") in teal while the button's ring pulses.
In the playlist, All projects and the filters (shown in a project's playlist too) swap the
list without closing it: the video playing stays, paused, if the new feed holds it and carries
on from there when the playlist closes; otherwise it stops and the new feed's first video waits. Experience videos are named by company in the
title row and the sheet, numbered 1/4 to 4/4 in the row, with the role as the line. The
playlist and the sheet call Experience "Work experience" (`fullName`), and the sheet lists
Advection Software (Product Engineer, 2023 to present) first as 1/5 though it has no video
yet (`lead` in `experience-videos.js`): choosing it plays Mesa Cloud's, as if that was
chosen. Products' sheets have no methodology slot any more (none had a video). The sheet
holds every link a project has, so the row needs no link of its own: a product's site, App
Store and Google Play pages, engineering notes and project view (`/#square-swaps`);
Methodologies' notes, one per video; Experience's work history on the site; and for the voice
short (whose title opens a sheet too, without a video list) how the voice agent is built.
Products show their app icon (`static/app-icons/`, taken from each store listing or site) in
the title row and the sheet, the voice short the site's chat prism (`ShortsIcon`);
Experience has a leather briefcase (`work.svg`) and Methodologies a drafting compass
(`methods.svg`). A bare mark without a tile of its own is named `*.mark.svg` and sits on a
light one. Every icon is fetched and decoded once the feeds load, so the row never flashes
the previous project's. While a video should be playing but its frames haven't arrived
(after Start, or a later video still downloading), the frame "develops" after 500ms, fading in from clear over 0.6s: a veil
over it (a backdrop blur, so it fades smoothly) eases the still from a dark blur toward sharp
under film grain, while a light runs round the frame's edge. It ends on the first frame
actually drawn (`requestVideoFrameCallback`, else the clock moving), not on `playing`, which
can come before any frame is on screen and left a dark gap, and fades out over the moving
video. The fade sets inline opacity (a Svelte CSS transition would replace the pieces' own
animations and snap them), and the edge light, if mid-lap, races round at 10× to finish the
lap, stops at the top and fades there (`src/lib/finish-lap.js`); the cover's light does the
same before the feed takes over. Swipes go through it. (Sheen and Prism were tried alongside it; Andrea chose Develop.)
The cover shows the same edge light and grain while the feed loads, as plain CSS, since most
of that wait passes before the page's code runs, and "Loading…" breathes under it. The page
also preloads the promo catalogue and the press lists, and loadShorts asks for them all at
once, so the wait itself is shorter.
A video's link is the same in both: `#square-swaps-2` is Square Swaps' second video in its
own order (card video first), and `#square-swaps` opens on the project's first in the feed.
When a video ends, the feed moves straight on to the next one and plays it, keeping the
visitor's sound setting. At the end of a project's feed it goes on in the main feed, on the next
project's first video (after Methodologies, Experience's; after Experience, the first product's); at the end of the main feed it
stops on a Start over screen (no countdown, so it never loops by itself). Paused, the screen
offers "<project> shorts" and a **Pause at end** switch (off by default, kept per browser in
`localStorage`, logged as `visit:short_setting` and shown in the visit report as "Pause at end:
turned on/off"). With it on, a video's end shows the old five-second countdown to the next one
instead (a swipe, scrub or pause stops it), with "More from <project>" under it (in a project's
feed, "All projects"). The voice short never moves on by itself; a swipe may start on its orb or suggestions (the stage takes the pointer once it moves, and swallows the click a drag ends with). On every item after the cover
the control row holds the project's icon and the title (a tap opens the sheet), then
**Playlist** and **Close shorts** (×: back to the page
the visitor came from, else the job link's page or the site). Close dims the page at once and
ignores further taps (a second tap used to go back twice); opened directly, the page to return
to is preloaded, and a full load takes over if nothing has changed four seconds on. The row's
round buttons take taps over 42px. The **playlist**
lists every item of the open feed (the voice short included), grouped by project in the order
each first appears, with posters (a video without one borrows its project's, dimmed), titles
and the one playing marked; a tap jumps there, and in a project's feed it also offers All
projects. In the main feed the cover's filters sit under its title as labels that toggle the
same cut (the video playing stays if the cut keeps it; otherwise the cut's first item waits,
paused, until the playlist closes). Each project's headline video, its card video (Intellisense for Experience; the
first round of the main feed), wears a star and a teal ring, in any feed (in a project's feed,
that is its card video, last); the voice short keeps its own look, with no star. Next project and All projects are no longer in the row: the next project is a swipe
away, any other is in the playlist, and "<project> shorts" stays on the paused screen.
**Full screen** is the whole page (not the video), so the rows and swipes keep working: the
paused screen and the cover switch it, and Esc or the system gesture leaves it with the
switches kept in sync (`src/lib/fullscreen.js`). iPhone Safari has no element full screen, so
there the switches are hidden (feature detection: iPads get them). The way in:
a "Watch as shorts" card first in the project cards (Welcome screen, Software section and a
job link's row), in gold (a ring with a light running round it, a slow glow) with a "Start here"
pill, since it is where the site funnels visitors; and a gold "Shorts feed" link in the project
view, which opens that project's feed. Reduced motion keeps the gold and drops the motion. Likes and how
much of each video was played show in that visit's report on the dashboard (they add nothing
to the score).

**The cover.** Loaded directly (from an email, a QR code, a shared link), the feed opens on a
cover that sits above the first video like one more item, in the same rounded frame: "Hi
<Company> team." (on a job link, else "Hi there.") over "I'm Andrea de Candia", "Product
engineer", "Short videos of my work.", two switches side by side across the frame (teal when on, like the filters), **Sound** (on
by default) and **Full screen** (hidden where the browser can't), then (main feed only) three
filter toggles in a row, **Methods** (Methodologies), **Work** (Experience) and **Products**, the feed's order,
each over a small bullet list of what it holds, cut at five with the fifth fading out
(`coverGroups()` in `shorts.js`; a filter that's
off sets its list in the mono face, struck through). They cut the main feed down (the voice
short plays while Methods or Work is on). With all three off, swiping up finds one card, an
easter egg: "To seek is to suffer. To seek nothing is bliss." (Bodhidharma; `NOTHING` in
`shorts.js`). Changing a filter never starts the video under the cover, and every way back to all projects goes to
that cut. A narrow frame drops the switch icons and filter ticks and tightens the type. Then a big cue, "Swipe up to start" ("Scroll to
start" with a mouse). The feed starts with a swipe up, the wheel, ↓/j or Space/Enter, or a tap
on the cue. Each switch is a tap, so it also starts and pauses the shared video at once:
iPhones then let the first video play with sound after the swipe; where sound is still refused,
it plays muted with "Tap for sound". Only the frame moves, as between two videos: the control
row stays put and, while the cover shows, holds four equal buttons, each an icon over its
label: **Welcome** (teal; `/r/<code>` on a job link, else `/`, reloaded so phones get the
Welcome screen), **Resume** (blue; `/resume`, in the job link's region on a code), **Playlist**
(a tap on an entry starts the feed there) and **Close shorts** (`/?nointro`, the site without
the Welcome screen; "Close" on a narrow phone). All four fit a 360px phone.
The first video loads behind the cover, so it is ready when the cover goes. A swipe down, ↑/k
or the wheel from the first video brings the cover back and pauses the video. A deep link
(`/shorts#square-swaps-2`, `?project=…`) also opens on the cover, naming the video ("Starts
on Square Swaps · …"), and starting goes to that video; from there the cover is above the
feed's first video as usual. Arriving from the site's Watch as shorts card
(Welcome screen, Software section) opens on the cover too, as a fresh `/shorts` does; a link
inside the site to a particular video or a project's feed (the project view's Watch as shorts,
the Experience card) skips the cover and plays at once. In the visit's
report the Shorts row says what happened on the cover (`Cover: sound off · full screen on ·
swiped in`, or `tapped Start`, `Playlist`, `Resume`, `Close shorts`) and what was done with
the voice short (`Voice short: seen · talked (orb)`).

**One frame.** Every item, the cover included, sits in the same rounded frame in the same
place: a container filling the stage inside the page's 16px gutters (sized in CSS from the
stage: its width, its height less 20px), so a swipe never changes its size. A video fits whole
inside it (nothing is cropped), across its width on a phone, and a blurred copy of its poster
fills the bands above and below (a frame with no poster shows dark bands). The voice short's
layout (designed at 358px wide, 9:16) sits in the frame's middle, where its intro video is.

**The AI voice short** (`VOICE_SHORT` in `shorts.js`; false takes it out) is the main feed's
first item, under the cover and before the videos: the Welcome screen's voice agent (its orb
and the rotating capabilities, `src/components/intro/capabilities.js`) in the feed's frame
(`VoiceShort.svelte`). Nothing starts until a tap: the orb opens the site's voice mode, a
capability opens the chat with its question asked. On `/shorts/<code>` the agent is briefed on
the job, as on `/r/<code>`. Moving on from it (a swipe, the wheel, a key, the cover, another
feed) closes whatever it opened, which ends the call and releases the microphone; while the
chat covers the feed, the keys are the chat's. The shared video pauses and hides there, with
no progress line, countdown, like or share; its row offers the next video. A swipe from the
cover lands on it.

**Its intro.** A narrated video leads it (`VOICE_INTRO` in `shorts.js`, files in
`static/voice-agent/`; null takes it out): the shared video plays it, so it has sound on
iPhones, once per visit, and starting the feed from the cover starts it. Its last frame is VoiceShort's layout at a
358px frame (a 390px phone), and VoiceShort is laid out at that size and scaled to the real
frame, so the two match at any width. Under the video it holds still (`waiting`: no rotating
capabilities, no fade-in, its idle motion paused at its first frame); at the end the video
layer hides at once and the motion starts from there. A tap on the intro pauses and resumes it
like any video (wheel, swipes and keys still move on); while it is paused its Skip intro chip
pulses. Only that chip skips, straight to the live agent with a short fade. Once the intro is
over, a Replay intro chip in the same spot plays it again from the start on the shared video
(from the tap, so with sound), over a fresh VoiceShort at rest, so the hand-off at the end, or a
skip, is as clean as the first time. Leaving the voice short mid-intro means it plays again
next time. The visit report adds "paused the intro", "resumed the intro", "watched the intro",
"skipped the intro" or "replayed the intro" to the voice short's line.

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
the dashboard is `/dashboard` (`/api/visits` is the visits API: the tracker posts there and
`format=json` returns the dashboard's data; a browser opening it is sent to `/dashboard`).
In the Visits tab, a long press on a row starts choosing rows (Cancel and **Delete N** show
then, in Filter's place); a tap picks or unpicks one, and **Delete N** removes them after a confirm (`deleteMany`; in the
Visitors view it removes each visitor's sessions). Deletes post in the background and take
the rows off at once; several are removed in one pass over the store (one scan, one index
rebuild). Referrers are stored by name where known ("Google" for any google.* search,
"Google app" and "Gmail app" for Android's android-app:// referrers, "Gmail", "LinkedIn",
"Hacker News", …; `referrerName` in `src/lib/server/visits/shared.js`), and older rows and
counts are shown under those names. Apps that send no referrer (Gmail on iPhone, most email
apps) still read "direct"; job links already say which pitch a visit came from. A link's own
tag fills that gap: `?ref=linkedin` (or `utm_source`, `source`) is read once on arrival
(the tracker's `source`, kept as the visitor moves on) and, when the browser sent no
referrer, becomes the Referrer ("LinkedIn", "Resume", or the tag as written, e.g.
"weatherie"). Tag the links you post: profiles, the resume, the product sites' footers.

Any address with no page shows `src/routes/+error.svelte`: a black page in the shorts' look
with "Not all those who wander are lost." (Tolkien), the address tried, and Home and Watch
shorts. It is still a 404, and marked noindex. `admin.andreadecandia.com` and `admin.andrea-dev.com` open
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
`/dashboard` (older pages' posts to `/api/visits` still work) that need Andrea's admin session; SvelteKit refuses cross-origin form posts.

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
