---
slug: tech/godot
title: "Godot and GDScript"
short: "Godot"
category: tech
description: Godot 4 and GDScript for Andrea's games: Square Swaps, live on both stores since September 2026 with a deterministic simulation core and around 310 headless tests, and Five Card Charlie, migrated from a LÖVE prototype; plus Godot-driven harnesses and promo media.
tags: [godot, gdscript, game-development, xvfb]
featured: false
updated: 2026-10-16
---

# Godot and GDScript

> [!NOTE]
> ### Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Used** | Advection era (2023 to present) |
> | **Games** | [Square Swaps](/tree/products/square-swaps) (Godot 4.6), [Five Card Charlie](/tree/products/five-card-charlie) (Godot 4.4) |
> | **Tooling** | Godot CLI headless tests, Movie Writer, Xvfb, FFmpeg, Godot export on a self-hosted Mac runner |

---

## Where Andrea used it

- **[Square Swaps](/tree/products/square-swaps).** A match-2x2 puzzle in GDScript (not C#), live on Google Play since 2026-09-17 and the App Store since 2026-09-20, built, submitted and filmed by its own self-hosted pipeline.
- **[Five Card Charlie](/tree/products/five-card-charlie).** A blackjack roguelike rebuilt in Godot 4 from a LÖVE/Lua prototype; paused since 2026-08-17 ahead of a Steam demo.
- **Harnesses.** Agents verify game builds headlessly and record promo footage with Godot's Movie Writer under Xvfb. See [development harnesses](/tree/tools/agentic-development-harnesses) and [media harnesses](/tree/tools/media-harnesses).

## Notable decisions

- **A pure simulation core (Square Swaps).** Everything under `core/` is `RefCounted` and `Resource` only, with all randomness through one seeded generator, so a board is reproducible from an integer. The view only consumes ordered batches of domain events.
- **Command sourcing for replay.** Replays record input triples and the seed rather than every event; compact, at the cost of depending on determinism, the right trade for a game whose rules rarely move.
- **Rules as data.** Levels are `LevelDefinition` resources and visuals a separate `ThemePack`, so a new level is a resource, not a code path.
- **Codec limits.** Godot decodes only Ogg Theora video, which is why the house-ad network ships both Theora and H.264 renditions.
