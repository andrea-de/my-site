---
slug: philosophy/product-engineering
title: "Product Engineering with Agents: Pipelines for Everything"
short: "Product Eng"
category: philosophy
description: Andrea's working principles: automate every recurring step, give agents a way to check their work, ship to real users, keep data on the device, and let the owner's taste be written down where agents can follow it.
tags: [philosophy, product-engineering, agentic, zero-to-one, craftsmanship, pipelines]
featured: true
updated: 2026-10-16
---

# Product Engineering with Agents: Pipelines for Everything

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Working principles behind the estate. |
> | **What It Is** | How Andrea builds and ships many products at once with AI agents doing most of the implementation. |
> | **Core Tenets** | Pipelines for everything; harnesses before trust; shipped software as the measure; local first; taste written down. |

---

## 1. Pipelines for everything

Velocity does not come from typing faster but from removing the steps that repeat. Briefs, verification, screenshots, promo videos, store listings and releases are all code in the estate ([full-lifecycle pipelines](/tree/architecture/full-lifecycle-pipelines)), so a change to a product can be carried through to the stores the same day, and redone on the next change at no extra cost.

## 2. Harnesses before trust

An agent that cannot run its code will report success on code that does not work. Agents get a browser, an engine or a renderer to check against, unverified work stays in quarantine, and a test robot has to win by honest input ([development harnesses](/tree/tools/agentic-development-harnesses)). The same harnesses later make the store media, which is why that media can be rebuilt on every release.

## 3. Shipped software is the measure

A design is a hypothesis until it is in a store and in someone's hands. Several products are live on Google Play and the App Store, and the ones that are not have a written state saying exactly what stands between them and release. Measuring the real deployment rather than localhost, and the delivered file rather than the build log, has caught problems no review would have.

## 4. Local first, honest declarations

Apps keep their data on the device and add a server only where it is unavoidable ([local-first mobile systems](/tree/architecture/local-first-mobile-systems)). That keeps them fast offline and keeps privacy declarations short and true: when a house-ad card counts as "ads" under store rules, it is declared as ads.

## 5. Taste, written down

Agents do the implementation; the product owner's judgement sets direction. That judgement is recorded where agents read it: in briefs, in each project's node in the [brain](/tree/tools/the-brain), in rules like "phone first", "no on-screen gamepad", "a fact must be true and surprising or it is filler". The owner reviews renders and cuts rather than code, and each decision becomes a rule the next session follows.
