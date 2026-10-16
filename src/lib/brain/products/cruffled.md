---
slug: products/cruffled
title: "Cruffled: Crossword Engine & Embeddable Applet Architecture"
short: "Cruffled"
category: products
description: Interactive crossword jumble game with O(1) letter tile mapping, graph-based word navigation, and embeddable Web Component IIFE.
tags: [sveltekit, svelte, astro, algorithms, web-components, vite, capacitor, mobile]
featured: true
updated: 2026-10-16
---

# Cruffled: Crossword Engine & Embeddable Applet Architecture

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 📦 Shipped & Live (Web, iOS, and Android) |
> | **What It Is** | High-polish interactive word puzzle game and embeddable crossword engine featuring a jumbled-tile swap mechanic. |
> | **Core Problem & Solution** | Grid-based crossword manipulation is computationally expensive with nested layouts. Cruffled uses a flat O(1) dictionary tile map and bidirectional graph pointers for instant word completion checks and fluid tile swapping. |
> | **Tech Stack** | SvelteKit, Svelte 4, Vite, Web Components (Custom Elements), Capacitor (iOS/Android) |
> | **Key Highlights** | Embeddable zero-dependency Web Component IIFE (`<cruffled-puzzle>`), in-engine puzzle generator, full offline playability. |

**Cruffled** is a high-performance, interactive word-puzzle application that reimagines the classic crossword with a unique "jumbled tile" swap mechanic. Developed with a "write once, run anywhere" philosophy, Cruffled operates as a feature-rich web application, a portable "Applet" for third-party embedding, and a native mobile experience on iOS and Android.

---

## 1. System Architecture & O(1) Letter State Engine

At the core of Cruffled's fluid responsiveness is an optimized state management model:

- **Flat Indexing Engine**: Rather than maintaining a two-dimensional grid array with nested loops, the board is represented as an $O(1)$ dictionary mapping coordinate keys (`${x},${y}`) directly to tile states, letter values, and mutation locks.
- **Bidirectional Word Graphs**: Each cell maintains bidirectional pointers to horizontal and vertical word entities. Entering or swapping a tile immediately triggers localized word validation without traversing unchanged sections of the board.
- **Zero-Latency Drag & Drop**: Custom touch and mouse gesture responders execute sub-16ms layout transforms, avoiding layout thrashing through hardware-accelerated CSS transforms.

---

## 2. Embeddable Web Component IIFE ("The Applet")

A major architectural achievement of Cruffled is its ability to run as an embeddable micro-frontend inside external publications:

```html
<script src="https://cdn.cruffled.com/applet.iife.js"></script>
<cruffled-puzzle puzzle-id="daily-2026-09-11" theme="dark"></cruffled-puzzle>
```

- **Shadow DOM Encapsulation**: The entire UI, CSS variables, and interaction handlers are isolated inside a custom element, preventing stylesheet bleed into host publications.
- **Rollup/Vite Tree-Shaking**: The applet build strips out routing and external dependencies, producing a lightweight, standalone bundle under 60KB gzipped.
- **Event Bus Contract**: Emits standard CustomEvents (`puzzle:start`, `puzzle:solved`, `word:completed`) allowing host publishing systems to track player engagement and integrate rewards programs.

---

## 3. Native Mobile Wrapper & Monetization

- **Capacitor Integration**: Native iOS and Android binaries packaged with Capacitor, utilizing hardware haptics for tile placement and local storage for offline progress saving.
- **Non-Intrusive Monetization**: Integrated AdMob banner and rewarded interstitial flows, along with RevenueCat non-consumable store passes.
- **Store-Oriented Polish**: Designed with high aesthetic craftsmanship, fluid spring physics, and zero network latency requirements during active play.
- **Current Distribution**: Version 1.0 is live on Google Play and the App Store, with benefit-led promotional media tailored for phone, portrait tablet, and landscape tablet. Its two first-time non-consumable purchases were reviewed and published with the iOS app.

---

## 4. Level Editor, Landing Site & Quality

- **Puzzle Level Editor**: An internal creator tool (`/create`) toggles letter and block tiles, sets grid sizes from 3x3 to 15x15, detects word intersections as letters are typed to generate clue fields, and computes the minimum swaps a puzzle needs so difficulty can be tuned before publishing.
- **Content Pipeline**: Vite eager glob imports discover and categorize new puzzles from JSON files, so adding a puzzle needs no code change.
- **Hybrid Persistence**: Progress updates Svelte stores immediately for zero-latency feedback and persists asynchronously to cookies and Firebase Realtime Database for recovery across sessions.
- **Astro Landing Site**: `cruffled.com` runs from a separate Astro repository (`cruffled-landing`) that embeds live applet puzzles on the homepage, links both store listings, and serves the store privacy pages.
- **Store Media**: Deterministic, benefit-led phone and tablet screenshots rendered from current app state, with crop-safe feature artwork.
- **Testing**: Vitest unit tests on the engine and Playwright end-to-end runs across phone and tablet aspect ratios.
- **Theme Engine**: CSS variable injection gives puzzles different visual languages without touching component structure.

---

## 5. Technical Stack Summary

| Component | Technology |
|---|---|
| **Web & Applet** | SvelteKit, Svelte 4, Vite, Custom Elements (Web Components) |
| **Mobile Native** | Capacitor, iOS (Swift bridge), Android (Kotlin bridge) |
| **State & Algorithm** | Flat coordinate hash map, bidirectional word graph |
| **Monetization & Analytics** | RevenueCat, Google AdMob, Firebase Analytics |
| **Landing & Data** | Astro (`cruffled-landing`), Firebase Realtime Database, Remote Config |
| **Testing** | Vitest (unit), Playwright (E2E) |
