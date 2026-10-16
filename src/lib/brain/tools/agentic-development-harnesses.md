---
slug: tools/agentic-development-harnesses
title: "AI Development Harnesses: Letting Agents See What They Built"
short: "Harnesses"
category: tools
description: Headless browsers, game engines and JVM renderers that let coding agents run, play and verify their own work; quarantine for unverified output, pure rule modules with headless proofs, and the same harnesses later producing store media.
tags: [tools, harnesses, agentic, verification, simulation, playwright, godot, robolectric, gametsunami, media-harnesses]
featured: true
updated: 2026-10-16
---

# AI Development Harnesses: Letting Agents See What They Built

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Standard practice in every project in the estate. |
> | **What It Is** | Environments in which an agent can boot what it wrote, drive it with input, measure it and read the result, without a person or a device in the loop. |
> | **Core Problem & Solution** | An agent that cannot run its code reports success on code that does not work. A harness gives it a browser, an engine or a renderer to check against, and a rule that unverified output never reaches the live product. |
> | **Tech Stack** | Playwright (headless Chromium), Godot CLI and Movie Writer, Xvfb, Robolectric, Flutter test, react-native-web, Node.js, FFmpeg |
> | **Key Highlights** | Quarantine before release, honest-input robots, thousands of simulated runs in seconds, design checked in renders before any device build. |

---

## 1. Patterns that work

- **Quarantine.** Agents build outside the live product and move work in only after a real check passes. In [GameTsunami](/tree/products/gametsunami) a game enters the arcade only once a browser at phone size has booted it; an agent killed mid-run therefore never leaves a broken game live.
- **Pure rules plus a headless proof.** Game logic goes in a pure module (rules, generator, scoring) with a proof script, so balance comes from 200 to 10,000 simulated runs in seconds instead of slow browser batches. One game's boss went from 0 of 2 browser wins to a measured 34% by tuning against the simulation.
- **Robots must play honestly.** A test robot has to win through real input. "Reached the boss via a hook" was sent back every time, and honest robots exposed bugs that shortcuts hid.
- **Separate verification depth from building.** One check that proves the thing runs, plus an explicit list of what was not verified. Deep fuzzing and balance sweeps are their own task, asked for where silent failure is expensive.
- **Seed consistency.** Demo seeds are run through the product's own rules in tests, after a seed once contradicted the design it was meant to show ([Commonts](/tree/prototypes/commonts)).

## 2. Harnesses by stack

| Stack | Harness | Where |
|---|---|---|
| **p5.js and d3 games** | Playwright boot check at phone size, fps sweep, honest-input robot | GameTsunami |
| **Godot** | Headless `godot -s` suites (about 310 tests), command-sourced replay of whole games from a seed | [Square Swaps](/tree/products/square-swaps) |
| **React / Capacitor** | Pure mechanics module with Vitest, seeded scripted takes in a real browser | [Rogue Calculator](/tree/products/calculated-survival) |
| **Flutter** | Golden-test captures of whole user journeys with a fake clock | [Weatherie](/tree/products/weatherie) |
| **Android Compose** | Real screens rendered on the JVM under Robolectric, no emulator | [Section Launcher](/tree/products/section-launcher), [Tackry](/tree/products/tackry) |
| **Expo / React Native** | The app bundled for a browser with native modules stubbed, every screen shot in light and dark | [Fluenics](/tree/products/fluenics), [AudioTales](/tree/products/audio-tales) |

## 3. From test harness to media harness

A harness that already boots the product headlessly, steps through seeded input and captures frames is most of a video pipeline. Adding Godot's `--write-movie`, a frame stream into FFmpeg and a cached narrator turned these debugging tools into the [media harnesses](/tree/tools/media-harnesses) that now render every product's store screenshots, previews and ads.

## 4. Running agents against them

Agents work in increments of about ten minutes, keep the product runnable throughout, write to disk continuously, and are resumed from their transcripts when a session limit stops them; a wave of five parallel agents with disjoint file ownership is the usual shape. See [multi-agent systems](/tree/architecture/multi-agent-systems).
