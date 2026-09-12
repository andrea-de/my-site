import os

BRAIN_PUBLIC = "/home/dev/brain/public"

def write_node(rel_path, content):
    full_path = os.path.join(BRAIN_PUBLIC, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Wrote {rel_path} ({len(content)} bytes)")

# -------------------------------------------------------------
# 1. INWORK (PROTOTYPE)
# -------------------------------------------------------------
write_node("prototypes/inwork.md", """---
slug: prototypes/inwork
title: "InWork: Non-Profit Cooperative Formation Platform"
category: prototypes
description: Non-profit platform helping workers join, start, and patronize worker cooperatives ("Tinder for coop teams"), featuring Fastify/Drizzle OpenAPI and React/Vite.
tags: [inwork, cooperatives, postgresql, pgvector, fastify, drizzle, openapi, react, vite, zero-to-one]
featured: true
updated: 2026-09-11
---

# InWork: Non-Profit Cooperative Formation Platform

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🧪 Functional Prototype & Incubating Platform (Active on this device) |
> | **What It Is** | Non-profit platform that helps people **join**, **start**, and **patronize** worker cooperatives — team discovery and formation ("Tinder for coop teams"). |
> | **Core Problem & Solution** | Solo freelancers lack credibility to sell high-value services, while starting a firm alone requires prohibitive capital. InWork matches complementary professionals on shared company preferences, providing governance templates, pod workspaces, and client contracting. |
> | **Tech Stack** | PostgreSQL 16 + pgvector, Fastify, Drizzle ORM, OpenAPI, React + Vite SPA, Tailwind CSS |
> | **Key Highlights** | Browse-first matching, mutual opt-in pod formation, watcher pipelines, blameless fork/merge mechanics, four-tier membership ladder. |

**InWork** is an open-source, non-profit platform designed to catalyze the formation of worker-owned cooperatives. Operating on the premise that *"teams can sell what individuals cannot,"* InWork enables three people with a name and a shared portfolio to function as a credible agency, transforming underemployed talent into democratic economic firms.

---

## 1. System Vision & The Three Surfaces

InWork structures the lifecycle of cooperative enterprise into three prioritized surfaces:

| Mission Surface | Role | Core Capabilities |
| :--- | :--- | :--- |
| **1. Join** | Discovery & Matching | Professional profile; *"call me when a team needs me"* filter; browse people and pods; candidate ranking; mutual opt-in handshake. |
| **2. Start** | Pod Formation | Pod workspaces (chat, task board, governance polls); charter defaults; probation-to-membership ladder; blameless fork & merge; public pod page. |
| **3. Patronize** | Public Directory & Contracts | Public directory of active cooperatives; fixed-scope packaged offers; client intake; platform-enforced pricing tied to track record; escrow integration. |

```
[ Individual Talent ]
         │
         ▼
[ Surface 1: Join ] ──► ( Preference & Skill Filtering: Size, Risk, Tech )
         │
         ▼
[ Mutual Opt-In Handshake ] ──► ( Everyone says yes before a Pod exists )
         │
         ▼
[ Surface 2: Start ] ──► ( Pod Workspace, Governance Charter, Member Ladder )
         │
         ▼
[ Surface 3: Patronize ] ──► ( Public Directory, Client Contracts & Escrow )
```

---

## 2. Core Mechanics: Democratic Formation Architecture

InWork discards typical gig-economy dynamics in favor of democratic cooperative mechanics:

### Browse-First Matching (Ranking, Not an Oracle)
Onboarding is an intentional form asking what kind of **company** the user wants to build (firm size, ownership philosophy, hours, risk appetite, consulting vs. product), rather than predicting human chemistry with an opaque AI oracle. People who want the same company are compatible even across disparate skill sets.

### Mutual Opt-In & Cheap First Commitments
Nobody is arbitrarily assigned to a pod. A pod activates only when all participants mutually confirm interest. The first commitment is simply a conversation, not a legally binding incorporation.

### The Watcher Pipeline
Tracking an incubating pod is a first-class citizen role. "Watchers" observe a pod's evolving charter and project proposals. When a pod experiences a skill gap (e.g., needing a backend engineer or finance lead), the watchers serve as the immediate recruitment pipeline.

### Blameless Fork & Merge
When a pod reaches an ideological or strategic impasse, it can **fork** cleanly into two distinct proposals. Lineage is tracked openly (*"Forked from Pod Alpha"*). Watchers choose which branch to support, eliminating toxic "vote someone out" political cycles.

### Four-Tier Membership Ladder
Borrowed from a century of successful worker-cooperative history:
1. **Watch**: Zero-commitment exploration.
2. **Join Proposal**: Opting into active team formation conversations.
3. **Probationary Member**: Delivering concrete value (design doc, client pitch, task delivery) — paid in work, not cash.
4. **Full Member**: Purchasing a membership equity share (payable over time out of client earnings, refundable at par upon departure).

---

## 3. Decoupled Architecture: OpenAPI Contract & React SPA

InWork adheres to a strict architectural decoupling constraint: front and back never share a unified framework or hidden runtime bindings.

```
[ React + Vite SPA ] ──( Strictly-Typed OpenAPI Spec )──► [ Fastify + Drizzle Node API ]
                                                                     │
                                                                     ▼
                                                          [ PostgreSQL 16 + pgvector ]
```

- **PostgreSQL + pgvector**: The single permanent data layer. Profiles and pod charters store high-dimensional skill and value embeddings, powering vector similarity ranking for team recommendations.
- **Fastify API with Drizzle ORM**: High-throughput REST API generating a live OpenAPI schema. Validates requests with strict JSON schemas and handles transactional state.
- **Decoupled React + Vite SPA**: Client code consumes generated TypeScript types directly from the OpenAPI schema, guaranteeing compile-time type safety without framework lock-in.
- **Deterministic Seed Harness**: Features a seed of 150 diverse professionals and 20 incubating pods, allowing all three surfaces to run end-to-end in offline local environments.

---

## 4. Technical Stack Summary

| Component | Technology |
|---|---|
| **Database & Search** | PostgreSQL 16, pgvector extension, Drizzle ORM |
| **Backend Engine** | Node.js, Fastify, Zod, OpenAPI 3.1 generation |
| **Frontend Client** | React 18, Vite, Tailwind CSS, TanStack Query |
| **Port Allocations** | DB: `5433`, API: `4000`, Web: `5174` (Clean isolation on nur) |
| **Governance Model** | Non-profit open source; zero private equity capital dependencies |
""")

# -------------------------------------------------------------
# 2. CALCULATED SURVIVAL (PRE-RELEASE PRODUCT)
# -------------------------------------------------------------
write_node("products/calculated-survival.md", """---
slug: products/calculated-survival
title: "Calculated Survival: Math Roguelike on Retro Calculator Engine"
category: products
description: Turn-based mathematical roguelike played on a simulated vintage scientific calculator, featuring deteriorating buttons, LCD rendering, and remap screens.
tags: [products, game-development, react, vite, capacitor, roguelike, retro, math-game, pre-release]
featured: true
updated: 2026-09-11
---

# Calculated Survival: Math Roguelike on Retro Calculator Engine

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 📦 Pre-Release (Feature-Complete & Store-Ready · 163+ Commits) |
> | **What It Is** | Turn-based mathematical roguelike game played entirely on the LCD screen and keypad of a simulated 1980s scientific calculator. |
> | **Core Problem & Solution** | Math games often feel like dry homework. Calculated Survival turns arithmetic into tactical equipment survival: each keypress causes mechanical wear, forcing players to improvise equations as keys shatter and break. |
> | **Tech Stack** | React 18, Vite, Capacitor (iOS & Android), Web Audio API, Tailwind CSS |
> | **Key Highlights** | Procedural key degradation mechanics, authentic 7-segment LCD rendering, custom keyboard binding matrix, browsable screenshot gallery. |

**Calculated Survival** is a feature-complete mathematical roguelike built in React, Vite, and Capacitor. Players must produce target numbers through calculations while their calculator hardware physically degrades—keys jam, crack, and fail, demanding tactical algebraic improvisation.

---

## 1. Core Mechanics: Equipment Degradation Roguelike

- **Key Wear & Mechanical Failure**: Every button press increments a wear counter. As keys break, players lose access to specific digits or operators (`+`, `×`, `^`), forcing non-linear algebraic solutions to reach required targets.
- **Shop & Repair Upgrades**: Earn internal compute units to solder broken circuits, purchase scientific functions (square roots, logarithms), or reinforce high-frequency keys.
- **Turn-Based Encounters**: Enemy algorithms introduce electromagnetic interference, inverted LCD displays, and arithmetic curses.

---

## 2. Technical Craftsmanship & Aesthetic Simulation

- **Authentic LCD 7-Segment Simulation**: Custom CSS and SVG rendering accurately models vintage LCD ghosting, viewing angles, and segment bleed.
- **Web Audio Sound Synthesis**: Every button click, relay trigger, and short circuit is synthesized via the Web Audio API without external audio asset bloat.
- **Cross-Platform Responsive Ergonomics**: Supports physical desktop keyboard remapping, touch haptics on mobile, and responsive aspect-ratio scaling.

---

## 3. Technical Stack Summary

| Component | Technology |
|---|---|
| **Frontend Framework** | React 18, Vite |
| **Mobile Bridge** | Capacitor (iOS & Android) |
| **Audio Engine** | Procedural Web Audio API sound generators |
| **Styling** | Custom SVG and CSS 7-Segment Displays |
| **State** | Feature-complete, awaiting final store submission |
""")

# -------------------------------------------------------------
# 3. FIVE CARD CHARLIE (PRE-RELEASE PRODUCT)
# -------------------------------------------------------------
write_node("products/five-card-charlie.md", """---
slug: products/five-card-charlie
title: "Five Card Charlie: Godot 4 Blackjack Roguelike Architecture"
category: products
description: Card combat roguelike migrated from a LÖVE/Lua prototype into Godot 4 and C#, featuring deterministic card resolution and rule modifier stacks.
tags: [products, godot, csharp, game-development, blackjack, roguelike, card-game, pre-release]
featured: true
updated: 2026-09-11
---

# Five Card Charlie: Godot 4 Blackjack Roguelike Architecture

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 📦 Pre-Release (Store-Staged / Feature-Complete in Godot 4) |
> | **What It Is** | Turn-based deckbuilding card combat roguelike built around the classic "Five Card Charlie" rule of blackjack. |
> | **Core Problem & Solution** | Expanding a card engine in dynamic Lua created state bugs during complex modifier chaining. The engine was refactored into Godot 4 with strongly-typed C#, implementing an immutable action-resolution queue and headless simulation test harness. |
> | **Tech Stack** | Godot 4.4, C# (.NET 8), LÖVE 2D (Reference Prototype), Linux Xvfb |
> | **Key Highlights** | Strongly typed card modifier stacks, deterministic combat resolution, headless simulation test harness. |

**Five Card Charlie** is a roguelike deckbuilder that reimagines casino blackjack as tactical card combat. Players manipulate deck probabilities, trigger stacked card powers, and battle through dungeon floors by achieving the legendary "Five Card Charlie" hand (drawing 5 cards without busting).

---

## 1. Engine Evolution: Migrating from LÖVE to Godot 4 C#

- **Overcoming Dynamic Lua Limits**: The initial prototype was built in LÖVE/Lua. While rapid for prototyping, cascading card relic interactions became prone to runtime bugs.
- **Strongly Typed C# State Machine**: Ported to Godot 4 using C# (.NET 8), establishing an immutable state queue that evaluates card draws, dealer AI decisions, and relic triggers in deterministic sequence.

---

## 2. Card Combat & Probability Manipulation

- **Relic & Rule Mutators**: Players collect mutators that alter fundamental casino rules (e.g., *aces count as 1, 2, or 11*, *dealer stands at 16*, *busting reflects damage to enemies*).
- **Procedural Dungeon Encounters**: Escalating dealer archetypes each introduce custom deck modifiers and passive abilities.

---

## 3. Headless Development & Simulation Harness

To balance complex card relics, the game incorporates an automated headless simulation harness:
- Runs thousands of simulated hands headlessly under Linux Xvfb.
- Analyzes win-rate variance across relic combinations, preventing un-winnable seed generations.
- This verification harness later served as the foundation for automated promotional video rendering with Godot Movie Writer.

---

## 4. Technical Stack Summary

| Component | Technology |
|---|---|
| **Game Engine** | Godot 4.4 (C# / .NET 8) |
| **Reference Prototype** | LÖVE 2D (Lua) |
| **Architecture** | Component-Based Entity Model, Deterministic Action Queue |
| **Platforms** | PC (Linux / macOS / Windows), Mobile (Android) |
""")

# -------------------------------------------------------------
# 4. DISCORD CHAT-OPS GATEWAY (TOOL)
# -------------------------------------------------------------
write_node("tools/discord-agent-gateway.md", """---
slug: tools/discord-agent-gateway
title: "Discord Chat-Ops Gateway: Collaborative Agentic Coding"
category: tools
description: Multi-user developer gateway wrapping autonomous CLI coding agents (agy, codex, gemini) into Discord forum threads with interactive approval buttons.
tags: [tools, discord-bot, chat-ops, agentic, nodejs, pty, multi-user, collaboration]
featured: true
updated: 2026-09-11
---

# Discord Chat-Ops Gateway: Collaborative Agentic Coding

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🛠️ Functional Tool / Developer Gateway (69 Commits) |
> | **What It Is** | Developer gateway that wraps autonomous CLI coding agents (`agy`, `codex`, `gemini`) into Discord forum channels and interactive threads. |
> | **Core Problem & Solution** | Agentic CLIs are built for single-user local terminals, isolating pair-programming sessions. This gateway parses streaming agent stdout into readable markdown thread logs and translates permission checkpoints into interactive Discord buttons. |
> | **Tech Stack** | Node.js, Discord.js v14, `node-pty`, Child Process Streams, REST API |
> | **Key Highlights** | Interactive Discord button approval gates, provider drivers (`agyDriver`, `codexDriver`), mobile collaboration on agent runs. |

The **Discord Chat-Ops Developer Gateway** (`andrea-de/discord-agent-gateway`) bridges local autonomous coding CLI tools into team communication channels, allowing developers to spin up, monitor, and interact with agentic coding sessions from desktop or mobile Discord.

---

## 1. System Vision: Chat-Ops for Autonomous Coding Agents

Rather than emulating a noisy, raw ANSI terminal in chat, the gateway treats agent executions as structured collaborative sessions:

```
[ Developer in Discord ] ──( Slash Command: /antigravity, /codex )
            │
            ▼
[ Gateway Router ] ──────► ( Creates Dedicated Forum Thread per Task )
            │
            ├─► Process Manager / PTY Session ( Spawns agy or codex CLI )
            │
            ├─► Real-Time Stdout Parser ( Strips ANSI, Extracts Token Cost )
            │
            ▼
[ Interactive Thread ] ──► ( Markdown Logs + Button Gates: [Approve Tool] [Reject] )
```

- **Forum Channel Architecture**: Automatically provisions project-specific Discord forum channels with dedicated threads for each coding prompt.
- **Interactive Component Buttons**: When an agent requests permission to run a bash command, modify a file, or invoke a subagent, the gateway translates the prompt into clickable Discord buttons (`Approve`, `Deny`, `Revise`).

---

## 2. Multi-Provider Driver Architecture

The gateway features modular provider drivers that abstract distinct agent CLI formats:

- **`agyDriver`**: Formats Google Antigravity tool-calling logs, subagent spawn events, and cost accounting.
- **`codexDriver`**: Handles OpenAI Codex execution loops, file diff previews, and sandbox checkpoints.
- **`geminiDriver`**: Parses Google Gemini streaming thinking tokens and tool payloads.

---

## 3. Dual Execution: PTY & Subprocess Streams

- **`ptyManager.js`**: Uses `node-pty` to simulate a real pseudo-terminal for agents that demand TTY interactivity.
- **`processManager.js`**: Handles standard spawned subprocesses with log buffering and token rate-limiting to adhere to Discord API message burst constraints.

---

## 4. Technical Stack Summary

| Component | Technology |
|---|---|
| **Runtime & Gateway** | Node.js, Discord.js v14, `dotenv` |
| **Terminal Integration** | `node-pty` (Pseudo-Terminal Bindings) |
| **Drivers** | Modular adapter pattern (`agyDriver`, `codexDriver`, `geminiDriver`) |
| **Evolution** | Served as direct conceptual predecessor to Agentic Gateway's supervisor |
""")

# -------------------------------------------------------------
# 5. CONTEXT PACKAGER (TOOL)
# -------------------------------------------------------------
write_node("tools/context-packager.md", """---
slug: tools/context-packager
title: "Configurable Source Context Packager: Pre-Agentic Code Ingestion"
category: tools
description: High-speed CLI utility for AST-aware, token-budgeted codebase serialization, packing entire multi-file repositories for large-context LLM reasoning.
tags: [tools, context-bundler, ast, llm-tooling, token-budget, code-ingestion, pre-agentic]
featured: true
updated: 2026-09-11
---

# Configurable Source Context Packager: Pre-Agentic Code Ingestion

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🛠️ Foundation Tooling (Pre-Agentic LLM Era) |
> | **What It Is** | Configurable CLI utility that serializes complete multi-file repositories into token-optimized, structured single documents for large-context LLMs. |
> | **Core Problem & Solution** | Early 1M/2M context models (Claude 3, Gemini 1.5) lacked native multi-file editing harnesses. This packager uses AST awareness, `.packignore` rules, and token budgeting to feed coherent codebases to models without clutter. |
> | **Tech Stack** | Node.js, Bash, AST Tree Parsers, Tokenizer Estimators |
> | **Key Highlights** | Prioritizes type declarations & schemas over large implementation bodies, automated secret scrubbing, attention-optimized formatting. |

Before official agentic harnesses (such as the Model Context Protocol, IDE agent sidecars, or CLI tool loops) were released by research labs, Andrea engineered custom **source code context packagers** to unlock deep, repository-wide reasoning from large-context LLMs.

---

## 1. The Token Budgeting & Priority Engine

Dumping entire repositories verbatim into an LLM degrades reasoning quality and exhausts token limits. The packager introduced an **intelligent priority matrix**:

```
[ Source Code Repository ]
           │
           ▼
[ .packignore & Security Scrub ] ──► ( Strips secrets, .env, build output, binary blobs )
           │
           ▼
[ Tier 1: Directory Tree & Types ] ──► ( Always Included: Folder structure, index.d.ts, schemas )
           │
           ▼
[ Tier 2: Public Interfaces & APIs ] ──► ( Always Included: Exported signatures, routers, routes )
           │
           ▼
[ Tier 3: Core Business Logic ] ────► ( Budget Permitting: Algorithm files, state stores )
           │
           ▼
[ Tier 4: Implementation Details ] ──► ( Stripped/Stubbed if Token Limit Exceeded )
```

- **AST-Aware Signature Trimming**: When token budgets were constrained, the tool stripped internal function bodies, preserving type signatures and JSDoc comments so the model retained structural understanding of the entire codebase.
- **Hierarchical Tree Generation**: Prefixed the bundle with a visual ASCII directory tree annotated with file sizes and purposes.

---

## 2. Secret Redaction & Leak Prevention

- **Automated Credential Scrubbing**: Applied strict regex gates to strip API keys, OAuth tokens, private IP addresses, and private machine hostnames before emitting the bundle.
- **Binary Exclusion**: Automatically blocked images, compiled bytecode, database files, and minified vendor bundles.

---

## 3. Attention-Optimized Formatting

- **Fenced Code Blocks with Relative Paths**: Structured file blocks with exact relative file paths and line number markers, allowing models to cite exact file locations in their generated patches.
- **Standardized Prompt Envelopes**: Framed the codebase with clear instruction preambles that instructed models on expected diff formats and coding standards.
""")

# -------------------------------------------------------------
# 6. AGENTIC DEVELOPMENT HARNESSES (TOOL)
# -------------------------------------------------------------
write_node("tools/agentic-development-harnesses.md", """---
slug: tools/agentic-development-harnesses
title: "AI Development Harnesses: The Bedrock of Autonomous Velocity"
category: tools
description: Headless execution, verification, and simulation harnesses that give autonomous coding agents the 'eyes and hands' to build software—and from which media harnesses developed.
tags: [tools, harnesses, agentic, verification, simulation, gametsunami, five-card-charlie, media-harnesses]
featured: true
updated: 2026-09-11
---

# AI Development Harnesses: The Bedrock of Autonomous Velocity

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🛠️ Core Architectural Tooling |
> | **What It Is** | Headless execution, verification, and simulation environments that provide autonomous AI agents with instant feedback on code correctness. |
> | **Core Problem & Solution** | Autonomous agents fail when they code blind without runtime feedback. Development harnesses run code headlessly, fuzz physics, verify level connectivity, and test game balance—serving as the exact foundation from which deterministic media harnesses evolved. |
> | **Tech Stack** | Linux Xvfb, Playwright, Godot Engine CLI, Node.js, FFmpeg, Custom Simulation Runners |
> | **Key Highlights** | Quarantine verification isolation (GameTsunami), headless Monte Carlo balance simulations (Five Card Charlie), seamless transition into automated media capture. |

A core realization of Andrea's engineering practice is that **autonomous AI agents are only as capable as the development harnesses that wrap them**. An agent given an editor and an empty terminal will hallucinate; an agent operating inside a headless, self-verifying test harness will reliably synthesize complex applications.

---

## 1. The Anatomy of an AI Development Harness

An AI development harness provides the "senses" an agent lacks:

```
[ AI Agent Code Patch ]
           │
           ▼
[ Isolated Quarantine Sandbox ] ────► ( wip-games/ or sandbox/ )
           │
           ▼
[ Headless Execution Harness ] ─────► ( Linux Xvfb Virtual Framebuffer )
           │
           ├─► Structural Verification Pass:
           │    - Syntax & Type Compilation Checks
           │    - Floor Connectivity & Navigation Mesh Reachability
           │    - Physics Monotonicity & Boundary Fuzzing
           │
           ├─► Simulation & Balance Run:
           │    - 1,000 Headless Monte Carlo Runs
           │    - Win-Rate Variance & Dead-End Detection
           │
           ▼
[ Diagnostic Telemetry to Agent ] ──► ( Pass / Fail Diff with Exact Line Feedback )
```

---

## 2. Proven Implementations Across the Estate

### GameTsunami: Quarantine Sprints & Physical Verifiers
- **Quarantine Isolation**: Subagents write code exclusively in quarantine directories (`wip-games/`). Games are never added to the live catalog until a headless browser harness boots the game, verifies that the canvas draws frames, and confirms that key mechanics respond to synthetic input.
- **Procedural Floor Verifiers**: For dungeon or platforming games, mathematical flood-fill algorithms verify that levels are solvable before accepting the agent's generation.

### Five Card Charlie: Headless Card Combat Simulations
- **Card Balance Verification**: The agent runs thousands of simulated card rounds headlessly in Godot 4 C# to prove that newly synthesized relics do not break the economy or create infinite loops.

### Square Swaps: Deterministic Input Replay Harnesses
- **Frame-Accurate State Stepping**: Moves are recorded as discrete structs. The harness replays whole games frame-by-frame, verifying that cascade matching formulas produce identical scores on every run.

---

## 3. How Media Harnesses Developed from Development Harnesses

A critical architectural evolution occurred across these projects: **the deterministic media harnesses were born directly out of the AI development harnesses**.

```
[ Headless Test Harness ] ──────► ( Already runs engine headlessly under Linux Xvfb )
            │                     ( Already renders at fixed time steps without lag )
            │                     ( Already captures canvas frames and audio buses )
            ▼
[ Deterministic Media Harness ] ─► ( Records frame-perfect promotional videos, 9:16 reels, )
                                  ( store screenshots, and WebP house-ad creatives! )
```

Because the development harness was already capable of booting Godot or Chromium headlessly in Xvfb, stepping through inputs deterministically, and capturing canvas frame buffers, adding `--write-movie` and FFmpeg transcoding transformed a **debugging tool** into an **automated production studio**.

---

## 4. Technical Stack Summary

| Component | Technology |
|---|---|
| **Headless Displays** | Linux Xvfb (`Xvfb :99 -screen 0 1920x1080x24`) |
| **Browser Harness** | Playwright (Headless Chromium, frame-accurate canvas recording) |
| **Engine Harness** | Godot 4 Engine CLI (`--fixed-fps 30`, `--write-movie`) |
| **Simulation Languages** | TypeScript (GameTsunami), C# / .NET 8 (Five Card Charlie, Square Swaps) |
""")

# -------------------------------------------------------------
# 7. THE BRAIN KNOWLEDGE SYSTEM (TOOL)
# -------------------------------------------------------------
write_node("tools/the-brain.md", """---
slug: tools/the-brain
title: "The Brain Knowledge System: Cross-Machine Architecture & Sync"
category: tools
description: Distributed, Git-backed Markdown knowledge repository living across development machines, featuring strict operational conventions and automated leak prevention.
tags: [tools, the-brain, knowledge-tree, git, markdown, sync-pipeline, leak-detection, digital-garden]
featured: true
updated: 2026-09-11
---

# The Brain Knowledge System: Cross-Machine Architecture & Sync

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🛠️ Active Production / Estate-Wide Knowledge Base |
> | **What It Is** | Cross-machine Git-backed markdown knowledge repository (`~/brain`) synchronized across development machines, powering the public Knowledge Tree and AI recruiter assistant. |
> | **Core Problem & Solution** | Architectural decisions and project state fragment across multiple physical machines and private workspaces. The Brain enforces strict session pull/push operational rules, modular index navigation, and an automated regex leak-prevention sync pipeline. |
> | **Tech Stack** | Git, Markdown, Node.js (`sync-brain.mjs`), Regex Leak Detectors, SvelteKit |
> | **Key Highlights** | Strict session lifecycle rules, automated credential/IP scrubbing, precomputed `manifest.json` generation, grounds the Gemini Live voice agent. |

The **Brain** (`andrea-de/brain`) is the foundational knowledge infrastructure of Andrea's engineering ecosystem. Living at `~/brain` across multiple physical and virtual development machines, it serves as the single source of truth for architectural designs, operational runbooks, hardware topology, and project statuses.

---

## 1. Cross-Machine Topography & Operational Rules

The Brain spans multiple development environments:

```
[ Dev Machines: hel / nur / mac / xps ]
                   │
                   ▼ ( git pull at session start )
        [ Local ~/brain Workspace ]
                   │
                   ├─► INDEX.md ( Modular root index; never scan whole tree )
                   ├─► projects/ ( Status and state of active/paused repos )
                   ├─► machines/ ( Hardware capabilities, IP bindings, ports )
                   ├─► tools/ ( Developer CLI environments, harnesses )
                   ├─► media-harnesses/ ( Normative media production contracts )
                   └─► public/ ( Sanitized public portfolio notes & architecture )
                   │
                   ▼ ( git commit & push before finishing work )
          [ GitHub Master Remote ]
```

### Strict Operational Conventions
1. **Session Start Synchronization**: At the beginning of any work session, the agent/developer runs `git pull` and inspects `<brain-path>/INDEX.md`, drilling into only relevant nodes to conserve context.
2. **State Transition Updates**: Before concluding work that changes an entity's state (shipped, decided, discovered, abandoned), the matching project node is updated, committed, and pushed.
3. **No Whole-Tree Scans**: Navigation relies on structured indexes to preserve token efficiency.

---

## 2. The Public Knowledge Tree Sync Pipeline (`sync-brain.mjs`)

To expose curated architectural notes to technical recruiters, clients, and autonomous agents without risking private credential leakage, Andrea built a deterministic sync engine:

```
[ ~/brain/public/ Source Nodes ]
                │
                ▼
[ Regex Leak Detection Gates ] ──► ( Blocks Private IPs, Passwords, Hostnames, Traversal )
                │
                ▼
[ Frontmatter & Schema Validation ] ──► ( Validates slug, title, category, tags )
                │
                ▼
[ Target Ingestion (src/lib/brain/) ] ──► ( Sanitized Copy + manifest.json Compilation )
                │
                ▼
[ Dual Presentation Surfaces ]
    ├─► Knowledge Tree Digital Garden (/tree)
    └─► Gemini Live Voice & Chat Recruiter Assistant (/api/chat, /api/live-token)
```

### Automated Leak Detection Gates
The sync script strictly scans all ingested files against sensitive regex patterns:
- **Private IPs**: Flags RFC 1918 addresses (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`).
- **Secret Assignments**: Blocks any environment variable assignments matching `KEY`, `SECRET`, `PASSWORD`, `TOKEN`.
- **Private Machine Hostnames**: Blocks references to private internal hardware nodes (`hel.md`, `nur.md`, `xps.md`, `mac.md`).
- **Directory Traversal**: Flags `../` traversal escaping the public sandbox.

---

## 3. Dual Consumption: Digital Garden & Real-Time AI Grounding

1. **Digital Garden (`/tree`)**: SvelteKit reader route with syntax-highlighted code blocks, copy buttons, responsive cards, category filters, and rendered Mermaid diagrams.
2. **Gemini Live AI Grounding**: Ingests the precomputed `manifest.json` into the system prompt of the Gemini 3.1 Flash Live API, enabling the voice recruiter assistant to speak authoritatively about every shipped project and architectural decision.
""")

# -------------------------------------------------------------
# 8. FULL-LIFECYCLE PIPELINES (ARCHITECTURE)
# -------------------------------------------------------------
write_node("architecture/full-lifecycle-pipelines.md", """---
slug: architecture/full-lifecycle-pipelines
title: "Full-Lifecycle Pipelines: From Feature Conception to Store Delivery"
category: architecture
description: Comprehensive architecture treating feature development, automated verification, media synthesis, and store releases as continuous, deterministic pipelines.
tags: [architecture, pipelines, full-lifecycle, ci-cd, verification, automation, release-engineering]
featured: true
updated: 2026-09-11
---

# Full-Lifecycle Pipelines: From Feature Conception to Store Delivery

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 📐 Architectural Standard |
> | **What It Is** | Systems architecture that models every stage of application development—from brief conception and verification to media production and store delivery—as automated, deterministic pipelines. |
> | **Core Problem & Solution** | Isolated CI/CD pipelines only address binary deployment, leaving feature conception, testing, and media creation manual and error-prone. This architecture establishes cohesive pipelines for every phase of product delivery. |
> | **Tech Stack** | Git, Fastlane, Linux Xvfb, Playwright, Godot Movie Writer, Node.js Crypto, Self-Hosted Runners |
> | **Key Highlights** | Brief-driven agentic feature pipelines, headless simulation & verification passes, code-driven media harnesses, zero-quota direct store publishers. |

Modern software development often treats "pipelines" as synonymous with "continuous integration and deployment." In Andrea's architecture, **pipelines exist for everything**: feature development, headless verification, application integration, promotional media generation, and store release.

---

## 1. The Five Interlocking Lifecycle Pipelines

```
┌────────────────────────────────────────────────────────────────────────┐
│                   1. Feature Conception & Brief Pipeline               │
│ (GAME_BRIEF.md / FOUNDING.md ──► Proposal Cards ──► Workspace Hydration) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│               2. Autonomous Development & Verification Pipeline        │
│ (15-Step Tool Loop ──► Quarantine wips/ ──► Physics / Logic Fuzzing)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│               3. Application Integration & Supervision Pipeline        │
│ (supervise.js ──► term-web :4034 ──► Discord Gateway ──► Live Preview) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│               4. Deterministic Media & Creative Pipeline               │
│ (Headless Xvfb ──► Godot Movie Writer / Playwright ──► FFmpeg Renditions)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│               5. Zero-Quota Store & Infrastructure Pipeline             │
│ (Self-Hosted Apple Silicon ──► asc.mjs / play.mjs ──► Managed Staged)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Deep Dive Across Each Pipeline

### 1. Feature Conception & Brief Pipeline
- **Specification-First Scoping**: Features begin with structural briefs (`GAME_BRIEF.md`, `docs/FOUNDING.md`) establishing user personas, algorithmic constraints, and acceptance criteria.
- **Proposal Gates**: Agents generate lightweight proposal cards before allocating disk space or modifying source files, preventing uncommitted repository bloat.

### 2. Autonomous Verification & Simulation Pipeline
- **Quarantine Isolation**: Subagents work in isolated sandbox directories. Code merges only after passing automated verification.
- **Monte Carlo Simulations**: Runs thousands of simulated game turns (Five Card Charlie) or market periods (Foundry 252-day embargoes) headlessly to prove balance and monotonicity.

### 3. Application Integration & Supervision Pipeline
- **Process Supervision (`supervise.js`)**: Coordinates multiple development services on private Tailscale networks with automatic 2-second crash restarts.
- **Unified Workstation Surfaces**: PTY terminals, live voice agents, open ports, and repository inventories accessible through a single HTTPS port (`term-web`).

### 4. Deterministic Media & Creative Pipeline
- **Code-Driven Video Generation**: Virtual framebuffers (`Xvfb :99`) and fixed-fps clocks render video trailers with zero frame jitter.
- **Multi-Rendition Batching**: Converts raw master captures into 9:16 vertical reels, 1:1 square app store compositions, and compact WebP animated house-ad creatives.

### 5. Zero-Quota Store & Release Pipeline
- **Direct Crypto Authentication**: Uses native Node.js standard libraries (`node:crypto`) to authenticate directly with store APIs, eliminating third-party CI vendor fees and quotas.
- **Hardware-Backed Runners**: Self-hosted Apple Silicon runners compile native iOS and Android binaries at full bare-metal hardware speeds.
""")

# -------------------------------------------------------------
# 9. EXPANDED PHILOSOPHY (PHILOSOPHY)
# -------------------------------------------------------------
write_node("philosophy/product-engineering.md", """---
slug: philosophy/product-engineering
title: "Product Engineering in the Agentic Era: Pipelines for Everything"
category: philosophy
description: Bridging zero-to-one product execution, autonomous AI development harnesses, sensory craftsmanship, and full-lifecycle automation pipelines.
tags: [philosophy, product-engineering, agentic, zero-to-one, craftsmanship, pipelines]
featured: true
updated: 2026-09-11
---

# Product Engineering in the Agentic Era: Pipelines for Everything

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 💡 Core Philosophy |
> | **What It Is** | Operating principles that define Andrea's approach to software engineering and product craftsmanship in the era of generative AI. |
> | **Core Tenets** | Pipelines for everything, development harnesses as the bedrock of velocity, working software as the only truth, and local-first data sovereignty. |

The emergence of large language models has fundamentally transformed software development, but it has not changed what makes a software product enduring: **architectural determinism, relentless execution velocity, and deep user empathy**.

---

## 1. Pipelines for Everything

High-velocity engineering is not achieved by typing faster; it is achieved by **eliminating human ceremony through deterministic pipelines**. In Andrea's estate, pipelines govern every stage of product delivery:

- **Feature Conception Pipelines**: Structuring requirements into machine-readable briefs (`GAME_BRIEF.md`, `FOUNDING.md`) so autonomous agents can propose architectures before touching production trees.
- **Verification & Fuzzing Pipelines**: Running automated physics checks, floor connectivity algorithms, and statistical embargoes before accepting agent pull requests.
- **Media Production Pipelines**: Generating promotional video clips, store screenshots, and animated house ads programmatically from headless browser and game engine replays.
- **Store Delivery Pipelines**: Streaming releases directly to App Store Connect and Google Play Console using zero-dependency native crypto scripts on self-hosted hardware.

When every recurring task is wrapped in a deterministic pipeline, engineering energy is spent purely on novel zero-to-one product design.

---

## 2. AI Development Harnesses: The Core Multiplier

A central tenet of this philosophy is that **AI agents cannot code in a vacuum**. Prompting an LLM without runtime feedback produces fragile, hallucinated code.

To unlock genuine autonomous velocity, engineers must build **AI development harnesses**:
- Headless virtual framebuffers (Linux Xvfb) where agents can boot apps and inspect canvas frames.
- Automated simulation loops that run Monte Carlo checks on game balance (Five Card Charlie) or physics monotonicity (GameTsunami).
- Isolated quarantine worktrees that keep experiments from contaminating production branches.

### The Natural Evolution into Media Harnesses
When a development harness can execute an application headlessly, step through inputs deterministically, and capture frame buffers, **the media harness is a natural byproduct**. The exact same harness that verified an agent's code patch now generates 60 FPS promotional video reels and house ads with zero additional effort.

---

## 3. Zero-to-One Execution Over Passive Consulting

- **Working Software as the Only Truth**: Whitepapers and architecture diagrams are merely hypotheses; software running reliably in the hands of real users is proof.
- **Full-Spectrum Capability**: High-craftsmanship product engineering requires mastery across the entire vertical stack—from low-level Linux audio routing and C# engine mechanics, to reactive SvelteKit state trees and distributed cloud microservices.

---

## 4. Sensory Performance & User Sovereignty

- **Sub-16ms Responsiveness**: Software must feel instantaneous. High craftsmanship is evident in 60 FPS spring physics, zero layout shifts, and tactile haptics.
- **Local-First Data Sovereignty**: Whenever possible, applications should treat the local device as the primary source of truth. Network connectivity should enhance the experience, never hold it hostage.
""")

# -------------------------------------------------------------
# 10. PUBLIC HUB INDEX
# -------------------------------------------------------------
write_node("INDEX.md", """---
slug: INDEX
title: Public Knowledge Tree & Engineering Index
category: hub
description: Comprehensive index of Andrea de Candia's shipped products, professional leadership roles, prototypes, developer tools, and systems architecture.
tags: [portfolio, products, roles, prototypes, tools, architecture, multi-agent, android, nodejs]
featured: true
updated: 2026-09-11
---

# Public Knowledge Tree & Engineering Index

Welcome to the public technical knowledge tree of **Andrea de Candia**. This repository serves as an authoritative reference for engineering leaders, technical recruiters, and autonomous agents — presenting architectural designs, full-stack systems, shipped products, and career leadership.

Every entry is organized with an **Executive Overview** table at the top for immediate high-level evaluation, followed by exhaustive technical breakdowns, architecture diagrams, and implementation details.

---

## Ongoing & Past Concerns (Status & Timeline Table)

| Entity / Focus | Category | Status | What It Is Right Now | Primary Tech |
| :--- | :--- | :--- | :--- | :--- |
| **GameTsunami** | Product | 🟢 Active Production | AI-native gaming platform; autonomous multi-agent game synthesis, 15-step tool loops | Next.js, Gemini, p5.js, Iframe Bridge |
| **Cruffled** | Product | 📦 Shipped & Live | Crossword engine with graph word navigation, embeddable Web Component applet | SvelteKit, Capacitor, Vite |
| **Section Launcher** | Product | 📦 Shipped (Play Store) | Minimalist Android launcher with Room persistence and reference Play release pipeline | Kotlin, Jetpack Compose, Room |
| **Weatherie** | Product | 📦 Shipped (Pre-Launch) | Schema-driven dynamic UI theme engine with optimized Flutter WASM web delivery | Flutter, Dart, WASM, Dynamic UI |
| **Square Swaps** | Product | 📦 Shipped & Active | Cross-platform C#/Godot match-2x2 engine with deterministic headless Xvfb movie capture | Godot 4, C#, Xvfb, FFmpeg |
| **Tackry** | Product | 📦 Shipped (Local-First) | Local-first Android capture hub with PendingIntent preservation and grouped Bubbles | Kotlin, Jetpack Compose, SQLite |
| **Calculated Survival** | Product | 📦 Pre-Release | Math roguelike on a retro calculator; decaying buttons and LCD simulation | React 18, Vite, Capacitor, Web Audio |
| **Five Card Charlie** | Product | 📦 Pre-Release | Godot 4 blackjack roguelike; deterministic card combat state machine & simulation harness | Godot 4.4, C#, LÖVE2D |
| **InWork** | Prototype | 🧪 Functional Prototype | Non-profit cooperative formation platform ("Tinder for coop teams"); seeded end-to-end demo | Fastify, Drizzle, React, Vite, Postgres, pgvector |
| **Alpha Foundry** | Prototype | 🧪 Functional Prototype | Quantitative research platform with family-wide error control, 7 agents, MCP servers | Python, FastAPI, MCP, WebSockets, SvelteKit |
| **AudioTales** | Prototype | 🧪 Functional Prototype | Turn a book into a full-cast AI audio performance; Cloud Run backend | Python, TypeScript, Cloud Run, ElevenLabs |
| **Fluenics** | Prototype | 🧪 Functional Prototype | Mobile language practice app with LLM conversational drills & Azure pronunciation scoring | React Native / Expo, Azure Speech |
| **Agentic Gateway (term-web)**| Tool | 🛠️ Active Production | Remote web terminal, live voice call, and process supervision over Tailscale HTTPS | Node.js, PTY, WebSockets, Tailscale |
| **Discord Chat-Ops Gateway** | Tool | 🛠️ Functional Tool | Multi-user collaborative agentic coding in Discord threads with interactive buttons | Node.js, Discord.js, node-pty |
| **Source Context Packager** | Tool | 🛠️ Foundation Tooling | Token-budgeted, AST-aware multi-file project serializer for large-context LLM coding | Node.js, AST Parsers, Tokenizer |
| **AI Development Harnesses** | Tool | 🛠️ Core Tooling | Headless execution & fuzzing environments where agents code—origin of media harnesses | Linux Xvfb, Playwright, Godot Engine CLI |
| **Deterministic Media Harnesses**| Tool | 🛠️ Active Production | Code-driven app preview video generation with Playwright & Godot Movie Writer | Playwright, Xvfb, FFmpeg |
| **Zero-Quota Store Publishers**| Tool | 🛠️ Active Production | Native Node.js crypto store publishers (`asc.mjs`, `play.mjs`) streaming directly to stores | Node.js Crypto, App Store API |
| **The Brain Knowledge System** | Tool | 🛠️ Active Production | Distributed Git-backed knowledge repository, regex leak prevention, and sync pipeline | Git, Node.js, Markdown, SvelteKit |
| **Advection Software** | Role | 🟢 Active (2023–Pres.) | Founding Product Engineer; LLM streaming protocols, edge house-ads, serverless FFmpeg | Node.js, Cloudflare, SSE, Zod |
| **Mesa Cloud** | Role | 🏛️ Past (2022–23) | Senior Software Engineer; Monolith-to-microservices ETL migration for district student data | Python, FastAPI, PostgreSQL, AWS |
| **Intellisense.io** | Role | 🏛️ Past (2020–22) | Staff Software Engineer; Industrial AI mine-to-market integration, 3D spatial math engine | Python, Plotly, Docker, Kubernetes |
| **Giesecke+Devrient** | Role | 🏛️ Past (2018–20) | Full Stack Engineer; MWC showcase biometric Android system, telecom microservices | Java, Android, Spring, Cucumber |
| **AIA** | Role | 🏛️ Past (2018) | Junior Developer; Predictive model orchestration, bioscience UI, D3/Plotly reporting | Python, Django, Java, D3 |
| **Alps Fund Services** | Role | 🏛️ Past (2012–15) | Senior Mutual Fund Accountant; NAV calculation operations & Bloomberg automation | Bloomberg Terminal, Financial Modeling |
| **Full-Lifecycle Pipelines** | Architecture | 📐 Standard | Pipelines for everything: feature conception, automated verification, media, and releases | Fastlane, Playwright, Godot, Crypto |
| **Agent-UI Protocols** | Architecture | 📐 Standard | Structured event envelopes, dynamic widget summoning ("AG-UI"), and stream-of-thought | WebSockets, SSE, Zod, SvelteKit |
| **Multi-Agent Systems** | Architecture | 📐 Standard | Subagent topologies, MCP server standards, 15-step autonomous tool-calling loops | MCP, Gemini, Vercel AI SDK |
| **Local-First Mobile Systems** | Architecture | 📐 Standard | Local-first Room persistence, serialized PendingIntents, schema-driven theming | Kotlin, Jetpack Compose, Flutter |
| **Product Engineering** | Philosophy | 💡 Philosophy | Zero-to-one execution, pipelines for everything, development harnesses as multipliers | Systems Design, Craftsmanship |

---

## 1. Products & Applications

Shipped, store-ready, and interactive applications built with high craftsmanship, performance equity, and zero-to-one engineering execution.

- [GameTsunami](products/gametsunami.md) — **AI-Native Game Platform & Multi-Agent Arcade** *(🟢 Active Production)*  
  Autonomous parallel subagent game synthesis swarms, 15-step Vercel AI SDK/Gemini tool-calling loops, structural physics & balance verification, sandboxed iframe bridges, and the Remix Graph ("GitHub for Games").
- [Cruffled](products/cruffled.md) — **Crossword Engine & Embeddable Applet** *(📦 Shipped & Live)*  
  Interactive crossword jumble game featuring $O(1)$ letter tile mapping, graph-based word navigation, integrated puzzle editor, and embeddable Web Component IIFE micro-frontend.
- [Section Launcher](products/section-launcher.md) — **Android Home Engine & Wave Scroller** *(📦 Shipped - Play Store)*  
  Minimalist Android home screen launcher built with Jetpack Compose, Room SQLite persistence, Gaussian wave scroller ergonomics, and the reference zero-quota Play Store release pipeline.
- [Weatherie](products/weatherie.md) — **Polymorphic Dynamic UI & WASM Engine** *(📦 Shipped - Pre-Launch)*  
  Theme-driven Flutter weather application with schema-driven asset resolution, on-device theme packaging, and optimized WASM web delivery.
- [Square Swaps](products/square-godot.md) — **Cross-Platform C#/Godot Engine** *(📦 Shipped & Active)*  
  Match-2x2 puzzle game featuring deterministic gameplay clips, in-engine motion overlays, and automated headless Xvfb movie rendering.
- [Tackry](products/tackry.md) — **Local-First Android Capture Hub** *(📦 Shipped - Local-First)*  
  Android information capture hub with Room SQLite persistence, live `PendingIntent` action preservation, and grouped Android Bubbles API integration.
- [Calculated Survival](products/calculated-survival.md) — **Retro Calculator Math Roguelike** *(📦 Pre-Release)*  
  Turn-based mathematical roguelike game played on a simulated 1980s scientific calculator where mechanical button wear forces creative equation solving.
- [Five Card Charlie](products/five-card-charlie.md) — **Godot 4 Blackjack Roguelike** *(📦 Pre-Release)*  
  Card combat roguelike migrated from a LÖVE/Lua prototype into Godot 4 and C# with an immutable action-resolution queue and headless balance simulation harness.

---

## 2. Prototypes & Incubating Systems

Exploratory architectures, proof-of-concepts, and incubating projects testing cutting-edge paradigms in cooperative economics, quantitative research, audio, and language.

- [InWork](prototypes/inwork.md) — **Non-Profit Cooperative Formation Platform** *(🧪 Functional Prototype)*  
  Platform helping workers join, start, and patronize worker cooperatives ("Tinder for coop teams"). Decoupled OpenAPI backend in Fastify/Drizzle with PostgreSQL + pgvector, React/Vite SPA, mutual opt-in, watchers, and blameless fork/merge mechanics.
- [Autonomic Alpha Foundry](prototypes/foundry.md) — **Agentic Quantitative Research Platform** *(🧪 Functional Prototype)*  
  Quantitative platform where an autonomous agent occupies the research seat: forms hypotheses, acquires data, runs studies, and delivers verdicts under family-wide error control (FWER), MCP servers, and WebSocket AG-UI approval gates.
- [AudioTales](prototypes/audio-tales.md) — **Book-to-Full-Cast AI Audio Performance Engine** *(🧪 Functional Prototype)*  
  Converts written books into full-cast, dramatized audio performances with character voice assignment (ElevenLabs) and sound effects; Cloud Run backend.
- [Fluenics](prototypes/fluenics.md) — **Mobile Language Practice App** *(🧪 Functional Prototype)*  
  Expo/React Native application with LLM-driven scenario drills and Azure Speech pronunciation scoring over offline SQLite.

---

## 3. Developer Tools & Infrastructure

Custom tooling, developer utilities, and headless media pipelines built to eliminate operational friction and multiply agentic velocity.

- [AI Development Harnesses](tools/agentic-development-harnesses.md) — **The Bedrock of Autonomous Velocity**  
  Headless virtual execution environments (Linux Xvfb, Playwright, Godot Movie Writer) where agents build, fuzz, and simulate apps—and from which deterministic media harnesses evolved.
- [The Brain Knowledge System](tools/the-brain.md) — **Cross-Machine Architecture & Sync Pipeline**  
  Distributed Git-backed knowledge repository living across machines, enforcing session lifecycle conventions, automated regex leak prevention, and digital garden ingestion.
- [Agentic Gateway & term-web](tools/agentic-gateway.md) — **Multi-Service HTTPS Supervisor**  
  Hardened Node.js supervisor (`supervise.js`) on nur hosting a tabbed single-document workstation: browser terminal, voice agent (`/voice`), ports inspector, repo inventory, file browser, and system diagnostics over Tailscale HTTPS.
- [Discord Chat-Ops Gateway](tools/discord-agent-gateway.md) — **Collaborative Agentic Coding**  
  Multi-user developer gateway wrapping autonomous coding agents into Discord forum threads with interactive buttons for tool approvals and permissions.
- [Configurable Source Context Packager](tools/context-packager.md) — **Pre-Agentic Code Ingestion**  
  High-speed CLI utility for AST-aware, token-budgeted codebase serialization, packing entire multi-file repositories for large-context LLM reasoning.
- [Deterministic Media & Video Harnesses](tools/media-harnesses.md) — **Code-Driven App Preview Generation**  
  Reusable headless Xvfb video rendering pipelines using Playwright and Godot 4 Movie Writer (`--fixed-fps 30`), with event-timestamped audio bus capture and FFmpeg post-production.
- [Zero-Quota Store Publishers](tools/store-publishers.md) — **Native Crypto Store Deployment**  
  Zero-dependency native Node.js crypto store publishers (`asc.mjs`, `play.mjs`) that authenticate with store APIs and stream releases directly to TestFlight and Google Play, bypassing CI/CD quotas.

---

## 4. Professional Roles & Career Leadership

Architectural leadership, distributed systems, and product engineering across high-growth startups and enterprise platforms.

- [Advection Software](roles/advection.md) — **Founding Product Engineer (2023 – Present)**  
  Architected multi-channel LLM streaming protocols, in-house edge house-ad network on Cloudflare Workers/D1 with microsecond cold starts, and serverless FFmpeg media transcoding.
- [Mesa Cloud](roles/mesa-cloud.md) — **Senior Software Engineer (2022 – 2023)**  
  Architected configurable ETL microservices processing millions of district student records, parallelized monolithic workflows with asynchronous Python workers, and managed AWS Elastic Beanstalk infrastructure.
- [Intellisense.io](roles/intellisense.md) — **Staff Software Engineer (2020 – 2022)**  
  Delivered industrial AI Mine-to-Market system interoperability, authored a Python 3D voxel-to-column spatial translation math library, and led containerized artifact delivery with Docker and Kubernetes.
- [Giesecke+Devrient](roles/gandd.md) — **Full Stack Engineer (2018 – 2020)**  
  Led development of vehicle HMI prototypes for biometric mobility showcased at Mobile World Congress (MWC 2019), built high-volume telecom marketing microservices in Java/Spring, and architected BDD QA automation frameworks.
- [Aplicaciones En Informática Avanzada (AIA)](roles/aia.md) — **Junior Software Developer (2018)**  
  Containerized predictive model orchestration in Python/Django/Docker, built bioscience analytics UIs in Java/JSP, and designed reusable data visualizations with D3 and Plotly.
- [Alps Fund Services](roles/alps.md) — **Senior Mutual Fund Accountant (2012 – 2015)**  
  Reconciled daily mutual fund activity for daily NAV calculations and automated workflows for Bloomberg terminal-driven operations in Denver, Colorado.

---

## 5. Architecture & Protocols

Reusable architectural blueprints, communication protocols, and engineering standards.

- [Full-Lifecycle Pipelines](architecture/full-lifecycle-pipelines.md) — **Pipelines for Everything**  
  Comprehensive architecture treating feature conception, automated verification & fuzzing, media synthesis, and store delivery as continuous, deterministic pipelines.
- [Agent-UI Protocols & Streaming Envelopes](architecture/agent-ui-protocols.md) — **Real-Time UI Streaming**  
  Structured event envelopes, dynamic widget summoning ("AG-UI"), and transparent stream-of-thought protocols bridging autonomous agents with reactive frontend interfaces.
- [Multi-Agent Systems & Tool Calling](architecture/multi-agent-systems.md) — **Agentic Systems Architecture**  
  Topologies, MCP server standards, 15-step autonomous tool-calling loops, and real-time LLM cost governance.
- [Local-First Mobile Infrastructure](architecture/local-first-mobile-systems.md) — **Mobile Systems Engineering**  
  Deep native Android integrations (`PendingIntent` live action preservation, grouped Bubbles API, Room SQLite) and schema-driven polymorphic theming.

---

## 6. Product Philosophy

- [Product Engineering in the Agentic Era](philosophy/product-engineering.md) — **Engineering Philosophy**  
  Why high-velocity product engineering requires pipelines for everything, how AI development harnesses enable autonomous velocity, and the discipline of sensory performance.
""")

print("Successfully wrote all updated public nodes!")
