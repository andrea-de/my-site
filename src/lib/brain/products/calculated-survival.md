---
slug: products/calculated-survival
title: "Rogue Calculator: Math Roguelike on a Dying Calculator"
short: "Rogue Calc"
category: products
description: Roguelike where you type equations to hit target numbers while the calculator's keys wear out and break; React and TypeScript with Capacitor, in TestFlight and Play internal testing, being scoped to a Steam demo first.
tags: [products, game-development, react, typescript, vite, capacitor, roguelike, math-game, pre-release, media-harness]
featured: true
updated: 2026-10-16
---

# Rogue Calculator: Math Roguelike on a Dying Calculator

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Pre-release. In TestFlight and Play internal testing. Release is planned on Steam first, with a demo for an upcoming Steam event; the release name is still open. Site and press kit at roguecalculator.com. |
> | **What It Is** | Solve to survive: type equations that reach each target number on a retro calculator whose keys wear out, crack and break as you use them. |
> | **Core Problem & Solution** | Math games tend to feel like homework. Here arithmetic is the combat and the calculator is your equipment, so a lost key forces a different route to the number. |
> | **Tech Stack** | React 18, TypeScript, Vite, Capacitor (iOS and Android), Web Audio, Vitest |
> | **Key Highlights** | Key wear and failure, five deeper mechanics added in September 2026, keyboard bindings with a remap screen, a press kit built entirely by a capture harness. |

---

## 1. Game

- **Key wear.** Every press wears a key; worn keys break, and losing a digit or an operator forces another way to the target.
- **Deeper mechanics (September 2026).** Chains, tempo, elite targets, key fusion and a chameleon key, implemented as pure rules in one module with unit tests.
- **Mechanics documented against source.** The repo keeps a developer description and a player-facing feature list tied to what is implemented, so marketing copy cannot promise mechanics that do not exist.
- **Desktop and touch.** Responsive layouts, keyboard bindings with a remap screen, and haptics on mobile.

## 2. Steam first

The game is planned for Steam before a public mobile release; the mobile builds stay in closed testing until then. The remaining work is a demo with a limited set of levels and a desktop wrapper, since Capacitor targets iOS, Android and the web but not desktop.

## 3. Press kit from a harness

The press kit at roguecalculator.com/press (about fifty assets) is produced by a harness that plays seeded rounds in a real browser:

- **Trailers and shorts.** A story trailer in three formats, a feature trailer, social shorts and the house-ad cut. The narration is deliberately sparse, selling the feeling (a dying machine, how long you last) rather than explaining rules.
- **A traced audio bug.** Every cached Gemini TTS take ended in a click and a burst of static. The cause: the model returns a whole WAV file, header and a provenance chunk included, and the harness decoded it as raw samples. Takes are now read by their container, and the published videos were rebuilt.
- **Portability check.** A cut timed on one machine overran on another, because a real-time capture lasts as long as that machine takes to click; the trailer builder now borrows slack from unused footage and fails only when there is none.

## 4. Stack

| Component | Technology |
|---|---|
| **Game** | React 18, TypeScript, Vite |
| **Mobile** | Capacitor (iOS and Android), Haptics, Preferences |
| **Audio** | Web Audio API |
| **Testing** | Vitest |
| **Site and media** | Firebase Hosting, Playwright capture, FFmpeg, Gemini TTS |
