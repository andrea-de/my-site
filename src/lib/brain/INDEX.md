---
slug: INDEX
title: Public Knowledge Tree
short: "Andrea"
category: hub
description: Andrea de Candia's public knowledge tree; the products he has shipped and is shipping, the voice agent, prototypes, developer tools, technologies, architecture notes and career history.
tags: [portfolio, products, roles, prototypes, tools, tech, architecture, voice-agent, multi-agent, mobile]
featured: true
updated: 2026-10-16
---

# Public Knowledge Tree

The public technical knowledge tree of **Andrea de Candia**, a product engineer who builds and ships mobile apps, games and AI products with orchestrated coding agents. It is written for engineering leaders, recruiters, clients and AI agents, including the agent on this site, which answers from these notes.

Each note opens with an overview table (status, what it is, the problem and solution, stack, highlights), followed by the detail. States are as of the date in each note.

---

## At a glance

| Name | Category | Status (2026-10-16) | What it is | Main stack |
| :--- | :--- | :--- | :--- | :--- |
| **Portfolio voice agent** | Product | Live | This site's live voice and chat agent, grounded in this tree | SvelteKit, Gemini Live, Web Audio |
| **AudioTales** | Product | In review, both stores | Photograph a picture book; an AI storyteller reads it aloud in 139 languages | Expo, Express on Cloud Run, Gemini TTS |
| **Weatherie** | Product | Pre-release, review pending | Weather app with AI-painted themes and a theme store | Flutter, Cloud Run, RevenueCat |
| **Square Swaps** | Product | Live, both stores | Godot 4 match-2x2 puzzle game with themed art and music | Godot 4.6, GDScript |
| **Cruffled** | Product | Live, both stores | Crossword-jumble game and embeddable puzzle applet | SvelteKit, Capacitor, Astro |
| **Rogue Calculator** | Product | Testing; Steam first | Math roguelike on a calculator whose keys break | React, TypeScript, Capacitor |
| **Tackry** | Product | Live, Google Play | Offline notes, lists, reminders and kept notifications | Kotlin, Compose, Room |
| **Section Launcher** | Product | Live, Google Play | Android launcher with a Gaussian wave scroller | Kotlin, Compose, Robolectric |
| **GameTsunami** | Product | Internal testing | Platform where an agent builds games from chat; 293 house games | Next.js, Firebase, Gemini, p5.js, d3 |
| **Five Card Charlie** | Product | Paused | Blackjack roguelike | Godot 4.4, GDScript |
| **Fluenics** | Product | Pre-release | Speaking practice with pronunciation scoring | Expo, Azure Speech, SQLite |
| **Found Teams** | Prototype | Live demo | Nonprofit platform for forming worker cooperatives | Fastify, Drizzle, Postgres, React |
| **Commonts** | Prototype | Live demo | Member-run forum with a civility curtain and juries | TypeScript, Postgres, Cloud Run |
| **Autonomic Alpha Foundry** | Prototype | Prototype | Agent-run quantitative research with family-wide error control | Python, MCP, FastAPI, SvelteKit |
| **Tales Unwritten** | Prototype | In development | Gamebook whose pages are written by AI as readers reach them | Next.js, Gemini, Web Audio |
| **Two Truths & the Lie** | Prototype | Prototype, runs locally | Trivia game: spot the lie among three LLM-written statements | Svelte, Supabase, pgvector |
| **AI Development Harnesses** | Tool | In use | Environments where agents run and verify what they built | Playwright, Godot, Robolectric |
| **Media Harnesses** | Tool | In use | Store media and narrated promos rendered from the real app | Playwright, Godot, FFmpeg, Gemini TTS |
| **Store Publishers** | Tool | In use | App Store and Google Play by API, from build to review | App Store Connect, Play Developer API |
| **Agentic Gateway** | Tool | In use | Supervisor and one-port web workstation over Tailscale | Node.js, node-pty, Tailscale |
| **The Brain** | Tool | In use | Cross-machine knowledge base for agents; source of this tree | Git, Markdown |
| **Context Packager** | Tool | Historical | Token-budgeted codebase serialiser for large-context models | Node.js |
| **Discord Chat-Ops Gateway** | Tool | Retired | Coding agents in Discord threads with approval buttons | Node.js, Discord.js |
| **Advection Software** | Role | 2023 to present | Founding Product Engineer | Full stack, mobile, GCP |
| **Mesa Cloud** | Role | 2022 to 2023 | Software Engineer, student data ETL | Python, FastAPI, AWS |
| **Intellisense.io** | Role | 2020 to 2022 | Staff Software Engineer, mining analytics | Python, Node.js, Kubernetes |
| **Giesecke+Devrient** | Role | 2018 to 2020 | Full Stack Engineer, secure mobility and telecom | Java, Spring, Android |
| **AIA** | Role | 2018 | Junior Software Developer, applied data systems | Python, Django, D3 |
| **Alps Fund Services** | Role | 2012 to 2015 | Senior Mutual Fund Accountant (before software) | Bloomberg |
| **Python** | Tech | 2018 to present | Model services, spatial library, ETL microservices, Foundry, release scripts | Django, FastAPI, NumPy, pandas |
| **TypeScript and Node.js** | Tech | 2020 to present | Site-event services, most of the estate's backends and tools | Express, Fastify, Vite |
| **Svelte and SvelteKit** | Tech | 2023 to present | This site, Cruffled, the Foundry UI, Two Truths | SvelteKit, Vite, Capacitor |
| **React, Next.js and React Native** | Tech | 2023 to present | Rogue Calculator, Found Teams, GameTsunami, Tales Unwritten, AudioTales, Fluenics | React, Next.js, Expo |
| **Android and Kotlin** | Tech | 2018 to 2020; 2023 to present | Biometric vehicle HMI prototypes; Tackry and Section Launcher | Kotlin, Compose, Room, Robolectric |
| **Java and Spring** | Tech | 2018 to 2020 | Telecom microservices, hardware integration, JSP analytics UIs | Java, Spring, JSP |
| **Godot and GDScript** | Tech | 2023 to present | Square Swaps and Five Card Charlie; headless tests and promo capture | Godot 4, GDScript |
| **Flutter and Dart** | Tech | 2023 to present | Weatherie, with golden-test store media | Flutter, Dart |
| **PostgreSQL and SQL** | Tech | 2022 to present | Student-data ETL; Commonts, Found Teams, Foundry, Two Truths | PostgreSQL, Drizzle, pgvector |
| **Google Cloud and Firebase** | Tech | 2023 to present | The estate's backends and the house-ad service | Cloud Run, Firebase, Firestore |
| **Docker, Kubernetes, AWS and Azure** | Tech | 2018 to present | Containerised delivery in the employed roles; Foundry's stack | Docker, Kubernetes, AWS, Azure |
| **LLM Integration** | Tech | 2023 to present | Gemini reading, narration, live voice, tool loops; embeddings; MCP | Gemini, Vercel AI SDK, MCP |
| **Data Pipelines and Visualisation** | Tech | 2018 to present | Model inputs, spatial transforms, ETL, D3 and Plotly | NumPy, pandas, D3, Plotly |
| **Testing and Automation** | Tech | 2018 to present | BDD frameworks, production-parity test data, Playwright, Godot and JVM suites | Cucumber, Playwright, Robolectric |

---

## 1. Products

- [Talk to My Agent](products/portfolio-agent.md): the site's voice and chat agent. Gemini Live over a direct WebSocket with ephemeral tokens, the whole tree as grounding, a tool-calling text chat with streamed speech.
- [AudioTales](products/audio-tales.md): photograph a picture book and an AI storyteller reads it, in 139 languages, or record it yourself. In review on both stores since 2026-10-13.
- [Weatherie](products/weatherie.md): weather shown as painted scenes from AI-generated themes, an eleven-theme store with credits, a drag-to-arrange tile grid.
- [Square Swaps](products/square-swaps.md): Godot 4 puzzle with a deterministic simulation core, themed music stems that follow the board, and API-driven store releases.
- [Cruffled](products/cruffled.md): crossword-jumble game on both stores, an embeddable `<cruffled-puzzle>` applet, and the reference for code-made store media.
- [Rogue Calculator](products/calculated-survival.md): math roguelike where the calculator's keys wear out; press kit built by a harness; Steam first.
- [Tackry](products/tackry.md): offline notes, lists, reminders and kept notifications with floating bubbles; live on Google Play since 2026-10-11.
- [Section Launcher](products/section-launcher.md): Compose launcher with a wave scroller; the reference Play release pipeline and JVM-rendered store media.
- [GameTsunami](products/gametsunami.md): describe a game, an agent builds it; p5.js and d3 engines, a sandboxed runtime and a catalogue made by agent waves.
- [Five Card Charlie](products/five-card-charlie.md): blackjack roguelike rebuilt from a LÖVE prototype in Godot 4.
- [Fluenics](products/fluenics.md): LLM-generated drills, Azure pronunciation scoring, a fluency map of what you know.

## 2. Prototypes

- [Found Teams](prototypes/found-teams.md): join, start and hire worker cooperatives; explainable matching, mutual opt-in, blameless fork and merge. Writable demo at foundteams.com.
- [Commonts](prototypes/commonts.md): communities whose rules belong to members; incivility goes behind a curtain, juries decide cases. Locked demo at commonts.com.
- [Autonomic Alpha Foundry](prototypes/foundry.md): an agent in the research seat, delivering verdicts under family-wide error control rather than chasing returns.
- [Tales Unwritten](prototypes/tales-unwritten.md): a shared gamebook written by Gemini page by page as readers reach it; six themed books, streamed narration. In development, not yet published.
- [Two Truths & the Lie](prototypes/two-truths.md): LLM-generated trivia with an embedding duplicate check, retry prompts and an audit desk. Runs locally, not yet published.

## 3. Tools

- [AI Development Harnesses](tools/agentic-development-harnesses.md): quarantine, pure rule modules with headless proofs, honest-input robots, one harness per stack.
- [Media Harnesses](tools/media-harnesses.md): screenshots, narrated previews, shorts and ad creatives rendered from the real app, published on each product's `/press` page.
- [Store Publishers](tools/store-publishers.md): builds, listings, purchases, data safety and submission through the store APIs, with a browser bridge for console-only steps.
- [Agentic Gateway](tools/agentic-gateway.md): `supervise.js` and term-web: terminal, read-only voice agent, ports, repos, files and diagnostics on one port.
- [The Brain](tools/the-brain.md): the cross-machine knowledge base every agent session reads and updates, and the source of this tree.
- [Context Packager](tools/context-packager.md): an early tool for packing whole repositories into large-context prompts.
- [Discord Chat-Ops Gateway](tools/discord-agent-gateway.md): the retired predecessor of the gateway.

## 4. Roles

- [Advection Software](roles/advection.md): Founding Product Engineer (2023 to present). The product estate, agent-driven delivery, self-hosted releases, the house-ad network.
- [Mesa Cloud](roles/mesa-cloud.md): Software Engineer (2022 to 2023). Configurable ETL microservices over millions of student records on AWS.
- [Intellisense.io](roles/intellisense.md): Staff Software Engineer (2020 to 2022). Industrial AI for mining; a spatial transformation library; delivery with client teams.
- [Giesecke+Devrient](roles/gandd.md): Full Stack Engineer (2018 to 2020). Biometric vehicle HMI prototypes for MWC 2019, telecom microservices, BDD frameworks.
- [AIA](roles/aia.md): Junior Software Developer (2018). Sales forecasting front end, services and visualisations for a car maker, Docker Compose, RNA sequencing analytics reports, D3 and Plotly.
- [Alps Fund Services](roles/alps.md): Senior Mutual Fund Accountant (2012 to 2015), before the move into software.

## 5. Tech

- [Python](tech/python.md): containerised model services at AIA, a spatial library at Intellisense, ETL microservices at Mesa Cloud, the Foundry engine and the estate's release scripts.
- [TypeScript and Node.js](tech/typescript-node.md): Intellisense's site-event services, then the AudioTales, Commonts and Found Teams backends and the gateway, publishers and brain sync.
- [Svelte and SvelteKit](tech/svelte.md): this site and its voice agent, Cruffled and its embeddable applet, the Foundry UI, Two Truths.
- [React, Next.js and React Native](tech/react.md): Rogue Calculator and Found Teams on React, GameTsunami and Tales Unwritten on Next.js, AudioTales and Fluenics on Expo.
- [Android and Kotlin](tech/android-kotlin.md): biometric vehicle HMI prototypes at Giesecke+Devrient; Tackry and Section Launcher in Compose.
- [Java and Spring](tech/java-spring.md): JSP analytics UIs at AIA; telecom microservices, hardware integration and BDD frameworks at Giesecke+Devrient.
- [Godot and GDScript](tech/godot.md): Square Swaps' deterministic core and Five Card Charlie; headless tests and Movie Writer capture.
- [Flutter and Dart](tech/flutter.md): Weatherie's theme-driven scenes, arranged tiles and golden-test media.
- [PostgreSQL and SQL](tech/postgresql.md): Mesa Cloud's student-data ETL; Commonts, Found Teams, Foundry and pgvector duplicate checks.
- [Google Cloud and Firebase](tech/google-cloud.md): Cloud Run backends, Firebase and Firestore across the estate and the house-ad service.
- [Docker, Kubernetes, AWS and Azure](tech/containers.md): containerised delivery at AIA, Intellisense and Mesa Cloud; Foundry's Docker stack.
- [LLM Integration](tech/llm.md): Gemini page reading, narration and live voice, tool-calling agents, embeddings and MCP tools.
- [Data Pipelines and Visualisation](tech/data.md): model inputs, spatial transforms, ETL over millions of records, D3 and Plotly.
- [Testing and Automation](tech/testing.md): Cucumber and Selenium BDD, production-parity test data, Playwright, Vitest, Robolectric and Godot suites.

## 6. Architecture

- [Multi-Agent Systems](architecture/multi-agent-systems.md): running parallel coding agents that ship, and the agent designs inside the products.
- [Full-Lifecycle Pipelines](architecture/full-lifecycle-pipelines.md): brief, build and verify, supervise, media, release.
- [Deployment Pipelines](architecture/deployment-pipelines.md): CI on owned hardware only, and the release rules every app follows.
- [Agent-UI Protocols](architecture/agent-ui-protocols.md): streaming reasoning, tool steps, actions and approval gates as typed events.
- [Local-First Mobile Systems](architecture/local-first-mobile-systems.md): where each app keeps its data, and why.

## 7. Philosophy

- [Product Engineering with Agents](philosophy/product-engineering.md): pipelines for everything, harnesses before trust, shipped software as the measure, taste written down.
