---
slug: products/gametsunami
title: "GameTsunami: AI Game Platform Where an Agent Builds the Game"
short: "GameTsunami"
category: products
description: Game platform where you describe a game in chat and an agent builds it; p5.js and d3 engines, a 293-game house catalogue made by parallel agent waves, sandboxed iframe runtime; in internal testing on both stores.
tags: [agentic, gametsunami, gemini, nextjs, vercel-ai-sdk, firebase, iframe-sandbox, p5js, d3, multi-agent, capacitor]
featured: true
updated: 2026-10-16
---

# GameTsunami: AI Game Platform Where an Agent Builds the Game

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Pre-release. Web app running; iOS and Android builds in internal testing (TestFlight and Play internal track). Renamed from GameSpark on 2026-10-01. |
> | **What It Is** | A feed, discover, play and studio app: describe a game in chat, an agent writes it, people play it, and anyone can remix it. |
> | **Core Problem & Solution** | Generated games break in ways nobody sees until a player opens them. GameTsunami gives the agent real files to edit through tool calls, runs every game in a sandboxed iframe with an explicit runtime contract, and only admits house games that pass a browser check. |
> | **Tech Stack** | Next.js, Firebase (App Hosting, Cloud Functions, Firestore, Storage), Google Gemini, Vercel AI SDK, p5.js, d3, Capacitor |
> | **Key Highlights** | Two game engines behind one registry; 293 house games (261 p5.js, 32 d3), every one booting with a mid-play cover; multi-file tool-calling studio agent; native Sign in with Apple set up entirely by API. |

---

## 1. The studio agent

- **Tool calls, not code parsing.** The agent works through `listFiles`, `readFile`, `patchFile` and `saveFile` against the game's real files, in a loop capped at a fixed number of steps.
- **Workspace hydration.** For each request the backend unpacks the game's archive from Cloud Storage into a scratch workspace, lets the agent edit it, then re-archives and versions the result.
- **Proposal first.** The agent proposes a game as a card; nothing is created or stored until the user confirms it.
- **Visible reasoning.** Gemini's thinking tokens and each tool step stream to the client as a live log beside the conversation.
- **Spend per session.** Token cost (input, output, thinking) is attributed to each user, and a usage allowance is checked before a run starts. A personal Gemini key lifts the limit.

## 2. One game, several runtimes

A game runs in a studio preview (`iframe.srcdoc`, no real origin, so storage and pointer lock throw), as a hosted artifact built by a cloud function and talked to over `postMessage`, inside native Capacitor builds, and as an offline package. Each fails differently, so debugging starts by establishing which path a game is on.

- **Engine registry.** p5.js and d3 are registered side by side, each with its own adapter on a shared hosted runtime. The d3 contract is small: `window.__GAME` exposes boot, pause, resume and frame, with one root SVG, pointer events and Web Audio.
- **Pinned, self-served engines.** p5.js, p5.sound and d3 are served from immutable versioned paths, not a CDN.
- **Immutable artifacts.** A published game keeps the runtime it was built against, so a runtime change only reaches players after a refresh step republishes stale artifacts. The artifact hash covers everything inlined into the document; when it once missed a file, 63 games were "repaired" into exactly what they already were.
- **Post-deploy verification.** `verify:deploy` checks build identity, the runtime contract against a real published game, stale artifacts, callables and rules, and exits non-zero for CI.

## 3. A house catalogue made by agent waves

The catalogue was built in waves of five parallel coding agents working against a shared brief:

- **Quarantine.** Agents build outside the live catalogue and move a game in only once it boots in a real browser at phone size. An interrupted agent therefore never leaves a broken game in the arcade; the rule has saved the catalogue more than once.
- **Ten-minute increments.** Runs are capped at about ten minutes, keep the game runnable from early on, and write to disk continuously, because a long run killed by a session limit loses everything. Agents are resumed from their transcripts rather than relaunched.
- **Rules as pure modules.** Each brief asks for a pure rules or generator module with a headless proof, so balance comes from thousands of simulated runs in seconds instead of slow browser batches.
- **Robots must play honestly.** A test robot has to win through real input; that requirement exposed bugs (unhittable enemies, doors beside spikes) that a scripted shortcut hid.
- **Performance pass.** An fps sweep of every game at phone resolution found seven under 20 fps; per-frame blur, filters and full-screen gradients were the usual cause, replaced by cached layers.

Thirty titles landed in one session in September 2026, followed by a 32-game d3 set (Voronoi territory, sankey water mills, chord-diagram trading, a Delaunay truss bridge builder). Owner preferences are written into the brief, for example: no on-screen gamepad, direct touch instead.

## 4. Platform features

- **Feed and remix.** A vertical swipe feed manages iframe lifecycles; every published game can be forked, and a remix keeps a link to its parent.
- **Native sign-in.** Google, plus Sign in with Apple on iOS (required by App Store Guideline 4.8). The native Apple path was configured entirely through the Firebase API with only a bundle id, no portal visit or downloaded key.
- **Media.** Injected scripts capture canvas video and covers from inside the sandbox.

## 5. Stack

| Component | Technology |
|---|---|
| **App** | Next.js (feed, discover, play, studio), Tailwind CSS |
| **Backend** | Firebase Cloud Functions, Firestore, Cloud Storage, App Hosting |
| **AI** | Google Gemini via the Vercel AI SDK |
| **Game runtimes** | Sandboxed iframes, `postMessage` bridge, p5.js, d3 |
| **Mobile** | Capacitor (iOS and Android) |
| **Testing** | Jest (641 tests at the d3 milestone), an end-to-end sweep that boots every game |
