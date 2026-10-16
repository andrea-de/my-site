---
slug: roles/advection
title: "Advection Software: Founding Product Engineer"
short: "Advection"
category: roles
description: Founding Product Engineer at Advection Software (2023 to present), shipping an estate of mobile, web and game products with orchestrated AI agents, self-hosted release pipelines, code-generated store media and an in-house ad network.
tags: [product-engineering, agent-orchestration, mobile, release-engineering, cloud-run, firebase, media-harness, house-ads, gcp]
featured: true
updated: 2026-10-16
---

# Advection Software: Founding Product Engineer

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Role & Tenure** | Founding Product Engineer (2023 to present), remote |
> | **Company Focus** | A small software publisher shipping consumer apps and games for iOS, Android, the web and, next, Steam. |
> | **Core Mission** | Take products from concept to store release and keep them running, using AI agents for most of the build work and pipelines for everything that repeats. |
> | **Tech Stack** | TypeScript, Kotlin, Dart, GDScript, Svelte, React, Next.js, Flutter, Godot, Google Cloud (Cloud Run, Firestore, Firebase), GitHub Actions on self-hosted runners, Playwright, FFmpeg, Gemini |
> | **Key Highlights** | Live on the stores: Cruffled (both), Square Swaps (both), Section Launcher and Tackry (Play). AudioTales in review on both; Weatherie, Rogue Calculator and GameTsunami in testing. One release pipeline per product. |

---

## 1. The product estate

| Product | What it is | State (2026-10-16) |
|---|---|---|
| [AudioTales](/tree/products/audio-tales) | Photograph a picture book, an AI storyteller reads it | In review on both stores |
| [Weatherie](/tree/products/weatherie) | Weather app with AI-painted themes and a theme store | Store listings complete, review pending |
| [Square Swaps](/tree/products/square-swaps) | Godot 4 match-2x2 puzzle game | Live on both stores |
| [Cruffled](/tree/products/cruffled) | Crossword-jumble game and embeddable applet | Live on both stores |
| [Rogue Calculator](/tree/products/calculated-survival) | Math roguelike on a dying calculator | Testing; Steam first |
| [Tackry](/tree/products/tackry) | Offline notes, lists and reminders | Live on Google Play |
| [Section Launcher](/tree/products/section-launcher) | Android home-screen launcher | Live on Google Play |
| [GameTsunami](/tree/products/gametsunami) | Platform where an agent builds games from chat | Internal testing on both stores |
| [Five Card Charlie](/tree/products/five-card-charlie) | Blackjack roguelike | Paused before a Steam demo |

## 2. How the work gets done

- **Orchestrated agents.** Several coding agents run in parallel on remote machines reached through a [self-built gateway](/tree/tools/agentic-gateway), each on a bounded task with its own files, resumed from its transcript when a session limit cuts it off. See [multi-agent systems](/tree/architecture/multi-agent-systems).
- **Harnesses, not trust.** Agents work inside [development harnesses](/tree/tools/agentic-development-harnesses): headless browsers, game engines and JVM renderers that let them run and verify what they built.
- **Shared context.** A cross-machine [knowledge base](/tree/tools/the-brain) holds every product's state and the decisions behind it, so any session on any machine starts informed.

## 3. Release engineering

- **Self-hosted CI only.** Every workflow runs on owned hardware, chiefly a Mac runner that builds and signs iOS and Android releases. GitHub-hosted runners never trigger automatically, because the free allowance is shared across all repositories and one careless workflow stops CI everywhere. See [deployment pipelines](/tree/architecture/deployment-pipelines).
- **Stores by API.** Builds, listings, screenshots, subscriptions, data-safety answers and review submissions go through the App Store Connect and Google Play APIs; the few console-only steps are driven through a signed-in browser. See [store publishers](/tree/tools/store-publishers).
- **Store media from code.** Screenshots, narrated previews, social shorts and house-ad creatives are rendered from the real apps, and each product publishes them on a `/press` page. See [media harnesses](/tree/tools/media-harnesses).

## 4. The house-ad network

Instead of a third-party ad network, the apps cross-promote each other through a first-party ad service, with no advertising identifiers:

- **One contract, several clients.** `GET /api/ad` returns one creative or a 204; the client declares which formats it can render (`fmt`) and the server never returns anything outside that, which keeps old clients safe as formats are added. Click and impression beacons go through the same service.
- **Placements and prefetch.** Banner, mrec, card, interstitial and rewarded placements; a `prefetch=1` flag separates fetching ahead from displaying, which made fill-versus-impression figures meaningful again.
- **Codec constraints.** Godot decodes only Ogg Theora and iOS WebViews cannot decode Theora at all, so video creatives ship in both Theora and H.264 renditions, with a poster.
- **Hosting.** A Next.js site on Firebase Hosting with API routes on Cloud Run and the catalogue in Firestore, in US East near the audience. It moved off Cloudflare in September 2026 after regional ISP-level blocks on Cloudflare address ranges made it intermittently unreachable. Media stays in the CDN, rows in the database: a creative can be killed in seconds by flipping `active`, with no deploy.
- **Every app keeps working without it.** Each client bundles a fallback promotion for timeouts, no-fill or bad responses.
