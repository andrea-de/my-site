---
slug: products/cruffled
title: "Cruffled: Crossword-Jumble Game and Embeddable Puzzle Applet"
short: "Cruffled"
category: products
description: Multilingual crossword-jumble game, live on Google Play and the App Store since September 2026, with an embeddable Web Component applet, offline puzzle catalogue, house ads and code-generated narrated promo videos.
tags: [sveltekit, svelte, astro, web-components, vite, capacitor, revenuecat, mobile, media-harness, playwright, vitest]
featured: true
updated: 2026-10-16
---

# Cruffled: Crossword-Jumble Game and Embeddable Puzzle Applet

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Live: version 1.0 on Google Play and the App Store (both approved September 2026), plus a web version and the site at cruffled.com. |
> | **What It Is** | A crossword whose letters start shuffled: players drag and swap tiles back into place. Puzzles in several languages and sizes. |
> | **Core Problem & Solution** | One codebase has to serve the native apps, the web and an embeddable widget. Cruffled is a SvelteKit app wrapped by Capacitor for the stores and also built as a self-contained Web Component that the landing site embeds. |
> | **Tech Stack** | SvelteKit, Svelte 4, Vite, Capacitor, RevenueCat, Firebase Analytics and Remote Config, Astro (landing), Playwright |
> | **Key Highlights** | `<cruffled-puzzle>` applet, six UI languages, two in-app purchases approved with the first iOS release, first-party house ads with offline fallback, reference implementation for the estate's store-media harnesses. |

---

## 1. Game and content

- **Swap mechanic.** Tiles are dragged and swapped until every word reads; a Classic (newspaper-style) mode and a hard mode that removes the color hints add variety.
- **Offline catalogue.** Puzzles are generated offline into a catalogue rather than solved live, and new puzzle files are picked up by Vite glob imports with no code change.
- **Puzzle editor.** `/create` toggles letter and block tiles on grids from 3x3 to 15x15, detects word intersections to generate clue fields, and computes the minimum swaps a puzzle needs. Creating puzzles is free.
- **Device-local by design.** Progress, statistics, personal puzzles and rewarded unlocks stay on the device. Store purchases are the durable layer, restorable through RevenueCat.

## 2. The embeddable applet

The same engine builds as an IIFE bundle exposing a `<cruffled-puzzle>` custom element. The Astro landing site at cruffled.com embeds live puzzles on its home page, next to the store links and the privacy pages.

## 3. Monetization and house ads

- **Purchases.** Two non-consumables, Remove Ads and Unlock Everything (all puzzles, importing, sharing, no ads), sold through RevenueCat. Apple first rejected the app under Guideline 2.1(b) because the purchases had not been submitted with it; the fix was a consolidated submission of the app version plus both IAPs, approved together.
- **House ads.** Banner, puzzle-completion interstitial and rewarded-unlock slots ask the publisher's own ad service for a campaign and fall back to a bundled promotion on timeout, no-fill or malformed response, so every slot works offline and in review. Video creatives use the H.264 rendition, since iOS WebViews cannot decode Ogg Theora.
- **Remote control.** Firebase Remote Config switches providers, test units and the daily rewarded-unlock quota without a release.

## 4. Release and quality

- **Pipelines.** iOS builds are signed, verified and uploaded to TestFlight from a self-hosted Mac runner; Android builds go to Play internal testing and are promoted to production by a guarded workflow. No step depends on GitHub artifact storage.
- **Tests.** Vitest on the engine; a deterministic Playwright suite across phone, iPad portrait and iPad landscape (62 tests), including a fix for audio lost after a WebKit device locks.

## 5. Store media made from code

Cruffled is the reference for how the estate makes store media:

- **Screenshots** captured at each store slot's exact size from the real app, plus benefit-led promotional compositions with enforced safe areas.
- **Narrated promos.** A short app preview, a 49-second portrait feature tour and a 1920x1080 cut, captured as independent beats with measured boundaries so narration lines bind to clips rather than global timestamps. Gemini TTS presenter takes are cached, so rebuilding never re-spends.
- **Comic social shorts.** Five 20-25 second shorts in which a narrator solves a real 7x7 puzzle whose answers tell a joke. Voice takes are generated first, measured, and the swap choreography is derived from their durations, so dialogue and play cannot drift apart.
- **Press page.** Everything is published at `cruffled.com/press/` from one generator.

## 6. Stack

| Component | Technology |
|---|---|
| **App and applet** | SvelteKit, Svelte 4, Vite, Custom Elements |
| **Mobile** | Capacitor (iOS and Android) |
| **Purchases and config** | RevenueCat, Firebase Analytics, Firebase Remote Config |
| **Landing** | Astro, deployed on Vercel |
| **Testing** | Vitest, Playwright |
| **Media** | Playwright capture, FFmpeg, Gemini TTS |
