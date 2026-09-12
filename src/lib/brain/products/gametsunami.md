---
slug: products/gametsunami
title: "GameTsunami: AI-Native Game Platform & Multi-Agent Arcade Architecture"
category: products
description: Ambitious social gaming arcade & creation platform featuring autonomous parallel subagent game generation, 15-step tool-calling loops, sandboxed execution bridges, and the Remix Graph.
tags: [agentic, gametsunami, gemini, nextjs, vercel-ai-sdk, iframe-sandbox, postmessage, p5js, multi-agent, social-media]
featured: true
updated: 2026-09-11
---

# GameTsunami: Technical Architecture & System Design

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🟢 Active Production |
> | **What It Is** | AI-native social gaming arcade and studio where autonomous agents synthesize, patch, and publish playable browser/mobile games. |
> | **Core Problem & Solution** | LLM code generation often fails at multi-file coherence and creates broken loops. GameTsunami uses a 15-step tool-calling reasoning loop with isolated quarantine directories, automated physics & balance verification, and sandboxed iframe bridges. |
> | **Tech Stack** | Next.js, Google Gemini, Vercel AI SDK, p5.js, Capacitor, Cloud Storage, FFmpeg |
> | **Key Highlights** | Multi-agent studio sprints, Remix Graph ("GitHub for Games"), deterministic canvas video capture, micro-dollar spend accounting. |

**GameTsunami** is an ambitious, AI-native social gaming arcade and creation platform. It empowers creators to describe, build, iterate, fork, and publish browser-playable web and mobile games through a **multi-agent autonomous engineering workflow**. 

Moving far beyond simple single-file code generation, GameTsunami represents a comprehensive ecosystem combining autonomous game generation sprints, sandboxed multi-runtime execution bridges, evolutionary game remix trees, and serverless media transcoding.

---

## 1. System Vision & The Multi-Agent Arcade Generation Engine

GameTsunami treats AI not merely as a coding assistant, but as an **autonomous game production studio**.

```
[ Game Brief / Proposal ]
          │
          ▼
[ Parallel Subagent Swarm ] ──( Beadcoil, Undercroft, Grimbrew, etc. )
          │
          ├─► Isolated Workspace Quarantine ( wip-games/ )
          │
          ├─► 15-Step Tool-Calling Reasoning Loop ( listFiles, readFile, patchFile )
          │
          ├─► Verification Pass ( Floor Connectivity, Physics Fuzzing, Balance Sims )
          │
          ▼
[ Verified Arcade Release ] ──► ( Live Platform Feed & Cover Capture )
```

### Key Engineering Accomplishments in Game Synthesis:

- **Parallel Subagent Generation Sprints**: Orchestrated waves of parallel autonomous agents operating against structural specifications (`GAME_BRIEF.md`), generating original p5.js games complete with game-loop mechanics, sprite pipelines, and canvas cover captures (`media/images/cover.png`).
- **Quarantine & Verification Isolation**: Solved broken catalog issues by forcing subagents to build in isolated quarantine directories (`wip-games/`), moving games into the live arcade (`platform-games/p5js/`) only after passing explicit browser verification.
- **Structural Verification Harnesses**: Automated non-visual verification suites proving physics monotonicity, level-generation floor connectivity, and AI difficulty balance before accepting agent outputs.
- **10-Minute Increment Guard Rails**: Enforced strict agent execution boundaries (10-minute/tool-count caps), prioritizing continuous file writes to ensure runnable WIP states survive process kills or session timeouts.

---

## 2. AI Orchestration: 15-Step Autonomous Tool Loops

At the core of the studio creation experience is a 15-step agentic execution loop powered by the **Vercel AI SDK** and **Google Gemini**:

- **Iterative Tool-Calling Architecture**: Replaced fragile XML/prompt code parsing with first-class tool calls (`listFiles`, `readFile`, `patchFile`, `saveFile`), enabling the agent to reason across multi-file game codebases.
- **Ephemeral Workspace Hydration**: On every creation request, the backend dynamically unzips game archives from cloud storage into a temporary scratchpad file system, allowing the agent to inspect real files before re-archiving and versioning the result.
- **Proposal-First Studio Flow**: Prevents uncommitted project bloat by ensuring agents first propose game concepts as interactive proposal cards. Workspace creation and storage allocation occur only when the user confirms the build proposal.
- **Live Telemetry & Thought Streaming**: Emits a real-time data-stream protocol piping native Gemini thinking tokens and tool execution steps directly into the client UI, displaying a live "peer programmer" thought log.

---

## 3. Sandboxed Multi-Runtime Execution Bridge

GameTsunami games run across multiple environments—studio live previews, hosted cloud artifacts, Capacitor native mobile wrappers, and offline packages—each with distinct browser security boundaries.

```
[ Host Platform UI ] ──( postMessage Protocol )──► [ Sandboxed Game Iframe ]
                                                            │
                                                            ├─► Pause / Resume Heartbeat
                                                            ├─► Error Boundary Propagation
                                                            └─► System Script Injections:
                                                                 - Canvas Media Capture
                                                                 - Adaptive Device Bitrate Tuning
```

### Iframe Bridge & Performance Equity:

- **Origin-Restricted Communication**: Implemented a bidirectional `postMessage` protocol handling runtime lifecycle management, execution pausing/resuming, and thread heartbeat monitoring to terminate hung game loops.
- **Injected Media Capture Bridge**: Injects lightweight system scripts into game runners to capture high-framerate canvas video and screenshots without breaking iframe sandboxing constraints.
- **Adaptive Bitrate Tuning**: Dynamically adjusts canvas recording parameters (FPS, bitrate, time-slicing) based on device capabilities, preserving 60 FPS gameplay on low-end mobile hardware.

---

## 4. The Feed Surface, Remix Graph & Media Pipeline

- **Vertical Swipe Arcade Feed**: Virtualized feed containers manage active iframe lifecycles, using idempotent ledger triggers to calculate real-time **Visibility Scores** based on playtime, completion rates, and user interaction depth.
- **The Remix Graph ("GitHub for Games")**: Every published game is an evolutionary node linking back to parent games via immutable parent IDs. Users and agents can fork, modify, and publish remix branches of any existing game mechanic.
- **Native Cross-Platform Auth**: Integrated native Sign in with Apple and Google OAuth via direct Firebase configuration, fulfilling App Store Review Guideline 4.8 without portal key lock-in.
- **Serverless Transcoding Pipeline**: Cloud Functions running FFmpeg process raw canvas video captures into optimized streaming formats, backed by multi-layer pre-fetching cache managers.

---

## 5. AI Governance & Spend Accounting

- **Micro-Dollar Usage Tracking**: Attributes precise USD token costs (input, output, native thinking) to individual user sessions.
- **Step-Boundary Spending Checks**: Enforces strict step-boundary budget checks (`checkAgentUsageAllowance`), preventing run-away execution costs during heavy developer experimentation.
- **BYOK Authorization**: Supports Bring-Your-Own-Key authentication, allowing power users to plug in personal Gemini API keys for unrestricted studio access.

---

## 6. Technical Stack Summary

| Component | Technology |
|---|---|
| **Frontend & Feed** | Next.js (App Router), Tailwind CSS, Framer Motion |
| **Mobile Native** | Capacitor (iOS & Android) |
| **AI Orchestration** | Google Gemini API, Vercel AI SDK, Cloud Functions |
| **Persistence** | Firestore (Metadata), Cloud Datastore, Google Cloud Storage (ZIP Archives) |
| **Game Runtimes** | Sandboxed Iframe, custom `postMessage` bridge, P5.js, Phaser |
| **Media Processing** | FFmpeg Cloud Workers, Browser Cache API |
