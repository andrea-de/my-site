---
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
