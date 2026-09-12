---
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
