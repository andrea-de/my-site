# GameSpark: Technical Architecture & System Design

GameSpark is a high-performance social game platform that empowers creators to build, iterate, and publish browser-playable games through an **AI-autonomous engineering workflow**. This document provides a comprehensive technical breakdown of the system's architecture, including its sandboxed runtime, cross-platform strategy, and the evolution of its core engineering challenges.

---

## 🤖 1. AI Orchestration: The Autonomous Engineering Agent

GameSpark features a state-of-the-art **AI-native development loop** that moves beyond simple chat-to-code interfaces into a robust, multi-step orchestration system.

### Key Innovations:
- **Multi-Step Reasoning Loop:** Powered by the **Vercel AI SDK** and **Google Gemini (3 Pro/2.5 Flash)**, the agent performs up to **15 steps per turn**. It doesn't just suggest code; it executes `listFiles`, `readFile`, and `saveFile` across a sandboxed workspace to implement complex, multi-file features.
- **Ephemeral Workspace Hydration:** On every request, the backend (Firebase Cloud Functions) dynamically unzips the game source from **Firebase Storage** into a temporary "scratchpad." This allows the AI to have a physical file system to work within before re-archiving and versioning the results.
- **Agentic Evolution:** Migrated from a brittle XML-based parsing system (where the AI returned `<code>` and `<summary>` tags) to a first-class **Tool-Calling architecture**. This allows the agent to reason about its own progress and recover from errors by inspecting the file system.
- **Live Telemetry Stream:** A custom data-stream protocol pipes the agent's "internal monologue" and tool-use steps directly to the frontend, transforming the AI from a black box into a transparent "peer programmer."

---

## 🎮 2. Game Runtime: Sandboxed Execution & Feature Injection

The core of the GameSpark "Play" experience is a secure, performant runtime for user-generated content, executed within an origin-restricted iframe.

### The Iframe Bridge:
- **Communication Layer:** We use a robust `postMessage` protocol to bridge the gap between the host application and the sandboxed game. This handles error propagation, execution control (`pause`/`resume`), and a heartbeat system to detect hung game threads.
- **Script Injection & Performance Equity:** To enable features usually blocked by sandboxing, we inject specialized "system scripts" into every game runner.
  - **Media Capture Bridge:** Allows the game canvas to be captured as a screenshot or video recording and sent back to the host.
  - **Adaptive Device Detection:** The runtime dynamically tunes recording parameters (FPS, bitrate, time-slicing) based on hardware capability (e.g., hardware concurrency, device memory), ensuring high-quality capture on desktop while maintaining performance on low-end Android devices.

---

## 📱 3. The "TikTok" Feed & Media Strategy

The `Feed (/feed)` surface is designed for high-engagement, vertical swipe interaction, mirroring modern social media platforms.

### Key Features:
- **Vertical Swipe & Engagement Loop:** A virtualized feed container manages the lifecycle of active game iframes. We use **Engagement Rollups** (idempotent ledger-based triggers) to calculate a **Visibility Score** for every game. This merit-based system automatically surfaces high-quality, engaging content in the global feed.
- **Granular Tracking:** Real-time monitoring of "seen" state, "playtime," and "interaction depth" powers personalized discovery algorithms, ensuring users are always presented with fresh and relevant content.
- **Serverless Media Pipeline:** High-fidelity video captures are processed through a **Cloud-based Transcoding Pipeline** (using FFmpeg). This optimizes raw captures for mobile-friendly streaming, reducing data usage and ensuring smooth playback in the feed.
- **Multi-Layer Caching & Offline Storage:** Combines the Browser Cache API for heavy binary assets and game archives with a dedicated **Media Cache Manager** that pre-fetches the next 3-5 games in the feed. This ensures near-instant transitions and supports game downloading for reliable offline playback.

---

## 💾 4. Persistence & Data Evolution

GameSpark uses a hybrid persistence strategy optimized for multi-file complexity and version history.

### Data Architecture:
- **Code as Assets:** Migrated from Firestore strings to **Firebase Storage ZIP archives**. This optimized the database for metadata while allowing the platform to scale to thousands of versioned, multi-file projects without incurring massive document overhead.
- **The Remix Graph:** Every game is part of an **Evolutionary Development Tree**. By linking games via `sourceGameId` and `sourceVersionId`, we created a "GitHub for Games" where users can fork, remix, and iterate on mechanics, allowing for a community-driven evolution of game design.
- **Immutable Versioning:** Every change is a discrete, versioned snapshot, enabling instant "time-travel" debugging and the ability to compare logic across a project's history.

---

## 💳 5. Sustainability & AI Governance

In the era of high-cost LLM tokens, GameSpark implements a sophisticated **Token Governance Layer** to ensure platform viability.

### Cost Control Mechanisms:
- **Real-Time Cost Tracking:** The system calculates the actual USD cost of every AI interaction (input/output/thoughts) and attributes it to specific users and sessions.
- **24-Hour Rolling Windows:** We enforce configurable usage limits using a rolling 24-hour window, preventing runaway costs while allowing users to utilize the AI heavily in short bursts for focused development.
- **Personal Key Support:** Power users can provide their own API keys, bypassing platform limits and billing, which reduces the platform's overhead while keeping the service accessible to all.

---

## 🛡️ 6. Community, Trust & Safety

As a UGC platform, GameSpark implements a robust layer for content moderation and community governance.

### Safety Framework:
- **Reporting & Moderation Workflow:** Users can flag inappropriate games or comments through a structured reporting system. These reports trigger a moderation lifecycle (Pending -> Reviewed -> Actioned).
- **Automated Visibility Penalties:** Flagged content can be automatically deprioritized by the **Visibility Score** algorithm, reducing its reach in the Feed and Discover sections until reviewed by an administrator.
- **Admin Dashboard:** A dedicated administrative interface allows for manual review of flagged content, user management, and platform-wide configuration of AI usage limits and safety thresholds.

---

## 🚀 7. Key Engineering Challenges & Responses

### Challenge: Firebase Web SDK vs. iOS Protocols
**Problem:** The standard Firebase Web SDK is incompatible with the strict `capacitor://` or `app://` protocols on iOS due to its reliance on iframes for auth.
**Response:** Abstracted all critical Firebase interactions behind **Server Actions** and **Cloud Functions**, ensuring 100% cross-platform compatibility.

### Challenge: Decoupling for Scalability
**Problem:** Initial Next.js API routes tightly coupled the frontend server with business logic, hindering independent scaling.
**Response:** Migrated to a dedicated **Firebase Cloud Functions** architecture, decoupling the client from the server and allowing compute-heavy AI tasks to scale independently.

### Challenge: AI Context Management
**Problem:** Early XML-based generation was restricted to single-file output, forcing creators to keep massive, unmaintainable codebases in one file.
**Response:** Re-architected into a **First-Class Agentic Workflow** where the agent uses tools to navigate a modular file system, enabling true software engineering patterns and modular game logic.

---

## 🛠️ 8. Developer Experience (DX) & Performance

GameSpark is built with a focus on high-velocity development and robust verification.

### DX Innovations:
- **Local-First Simulation:** Utilizing the **Firebase Emulator Suite**, developers can run the entire platform—including Auth, Firestore, and Storage—locally. This allows for rapid iteration and testing without incurring cloud costs or requiring an internet connection.
- **Offline-First Resilience:** A custom **Service Worker** and offline-storage strategy cache critical game assets and the app shell. This ensures near-instant startup times and allows for a "Play Offline" mode in low-connectivity environments.
- **Automated Verification:** A comprehensive suite of **Playwright E2E tests** ensures that critical flows (Studio editing, Feed swiping, and Iframe bridging) remain stable across every deployment.
- **Modular Refactoring:** Ongoing "God-file" refactors have decomposed complex services into focused, domain-specific modules, significantly reducing technical debt and improving code maintainability.

---

## 🏗️ 9. Technical Stack Summary
- **Frontend:** Next.js (App Router), Tailwind CSS, Framer Motion.
- **Mobile:** Capacitor (iOS/Android) with unified service abstractions.
- **AI Backend:** Google Gemini API, Vercel AI SDK, Firebase Cloud Functions.
- **Persistence:** Firestore (metadata), Firebase Storage (archives/media).
- **Runtime:** Sandboxed Iframe, custom `postMessage` bridge, P5.js, Phaser.
