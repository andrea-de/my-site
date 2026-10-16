---
slug: products/five-card-charlie
title: "Five Card Charlie: Blackjack Roguelike in Godot 4"
short: "5 Card"
category: products
description: Blackjack roguelike built in Godot 4 and GDScript, migrated from a LÖVE/Lua prototype; a full Night of dealers, shops and plaques plays end to end, paused ahead of a Steam demo.
tags: [products, godot, gdscript, lua, game-development, blackjack, roguelike, card-game, pre-release]
featured: false
updated: 2026-10-16
---

# Five Card Charlie: Blackjack Roguelike in Godot 4

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Pre-release and paused since 2026-08-17. The migration is nearly complete; next is final content, the entry flow and a demo for an upcoming Steam event. |
> | **What It Is** | A roguelike built on blackjack and its "five card Charlie" rule: survive a Night of three dealers by hitting cumulative score targets. |
> | **Core Problem & Solution** | The LÖVE/Lua prototype proved the fun but grew hard to extend. The game was rebuilt in Godot 4 with the design written down first and the migration tracked in stages against the prototype. |
> | **Tech Stack** | Godot 4.4, GDScript, LÖVE 2D (reference prototype) |
> | **Key Highlights** | Night, Dealer, Round and Hand structure; Dealer Traits, Favor, Shops, Sit Outs, Tables and Plaques; achievements and lifetime statistics. |

---

## 1. Structure of a run

- **A Night is three Dealers**, each an elimination checkpoint with a cumulative score target, played over several Rounds of a variable number of Hands.
- **A Round** runs from shuffle to the cut card, then pays cash and interest before the Shops open.
- **Sitting out.** Reaching a Dealer's target early lets the remaining Rounds be sat out for revealed rewards instead of being skipped.
- **Tables** are challenge rulesets unlocked by winning Nights.

## 2. Design decisions

- **One Plaque per Night.** A persistent Plaque, equipped at the start, is the run's identity. It replaced the prototype's separate Talent and Ability systems on purpose.
- **Feedback for quiet moments.** The last pass before pausing added feedback for events that were "passing in silence".
- **Design lives in the repo.** A definitive gameplay document and a staged implementation plan measure the Godot build against the prototype, which is kept as reference only.

## 3. Platform plan

Godot exports to Windows, macOS and Linux natively, so a Steam build needs no new technology. As with Rogue Calculator, Steam comes before mobile.

## 4. Stack

| Component | Technology |
|---|---|
| **Engine** | Godot 4.4, GDScript |
| **Reference prototype** | LÖVE 2D (Lua) |
| **Targets** | PC (Windows, macOS, Linux) first, mobile later |
