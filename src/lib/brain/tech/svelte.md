---
slug: tech/svelte
title: "Svelte and SvelteKit"
short: "Svelte"
category: tech
description: Svelte and SvelteKit as Andrea's default for web apps: this site and its voice agent, the Cruffled game and embeddable applet, the Foundry research UI and the Two Truths trivia prototype.
tags: [svelte, sveltekit, vite, web-components]
featured: false
updated: 2026-10-16
---

# Svelte and SvelteKit

> [!NOTE]
> ### Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Used** | Advection era (2023 to present) |
> | **Projects** | [Talk to My Agent](/tree/products/portfolio-agent), [Cruffled](/tree/products/cruffled), [Autonomic Alpha Foundry](/tree/prototypes/foundry), [Two Truths & the Lie](/tree/prototypes/two-truths), [The Brain](/tree/tools/the-brain)'s public reader |
> | **Around it** | Vite, Capacitor for the stores, Custom Elements, Vercel |

---

## Where Andrea used it

- **[This site](/tree/products/portfolio-agent).** SvelteKit and Svelte 4 on Vercel: the Gemini Live voice agent, the tool-calling chat over SSE, and `/tree`, which renders [the brain](/tree/tools/the-brain)'s public notes with a d3-force graph.
- **[Cruffled](/tree/products/cruffled).** The game is SvelteKit wrapped with Capacitor for iOS and Android, live on both stores since September 2026; the same engine also builds as an IIFE bundle exposing a `<cruffled-puzzle>` custom element embedded on the landing site.
- **[Autonomic Alpha Foundry](/tree/prototypes/foundry).** A SvelteKit UI over WebSockets to the Python engine.
- **[Two Truths & the Lie](/tree/prototypes/two-truths).** Svelte 4, Vite and Tailwind over Supabase.

## Notable decisions

- **One engine, two targets (Cruffled).** The store app and the embeddable applet share the engine, so the puzzles on the website are the real game.
- **Self-contained builds (this site).** The sanitised brain copy is committed to the site repo, so a Vercel build needs no network access to the knowledge base.
