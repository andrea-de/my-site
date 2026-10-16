---
slug: prototypes/two-truths
title: "Two Truths & the Lie: An LLM-Generated Trivia Game"
short: "Two Truths"
category: prototypes
description: Trivia game where players spot the lie among three statements; statements are written by an LLM through a job queue, checked for near-duplicates with pgvector embeddings and approved at an admin audit desk; Svelte and Supabase prototype that runs locally, not yet published.
tags: [two-truths, trivia, llm, rag, embeddings, pgvector, supabase, postgresql, svelte, deno, vercel-ai-sdk, vite]
featured: false
updated: 2026-10-16
---

# Two Truths & the Lie: An LLM-Generated Trivia Game

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Working prototype that runs locally (as of 2026-10-16); not yet published. Last worked on in July 2026; a public release is likely. |
> | **What It Is** | The party game as a trivia app: three statements, two true and one false, and the player picks the lie. |
> | **Core Problem & Solution** | A trivia game needs a steady supply of fresh, distinct facts, and a model asked for trivia repeats itself. Statements are generated in batches by an LLM, each is compared against everything already stored using embeddings, near-duplicates are sent back with the reason, and a person approves what goes live. |
> | **Tech Stack** | Svelte 4, Vite, Tailwind CSS; Supabase (PostgreSQL, Edge Functions on Deno, row level security); pgvector; Vercel AI SDK over OpenAI or Anthropic models; OpenAI embeddings |
> | **Key Highlights** | Retry prompts that name the duplicate to avoid, an audit desk with AI-assisted revision, explanations written on demand and cached, separate statement pools per mode, and per-statement "how many players were fooled" figures. |

---

## 1. The game

- **Modes.** Endless (a running streak), the Daily Gauntlet (five rounds, the same for every player on a given date) and Deep Dives (ten-round themed packs drawn from one category). Chaos Mode is on the menu and currently draws from the endless pool.
- **After each answer** the cards reveal which statements were true and what share of players each one fooled, from counts of how often a statement was shown and how often it deceived.
- **Tell Me More.** A statement's explanation is written by the model only when a player first asks for it, then stored, so later players get it straight from the database.
- **No repeats.** Each player's seen statements are tracked so they are not shown again; a review mode allows replays but still avoids repeats within a session. Players are anonymous, identified by an ID kept in the browser.
- **Five languages.** Statements carry a language (English, Spanish, Italian, German or French), and generation writes in the chosen one.

## 2. The generation pipeline

- **Job queue in the database.** An admin asks for a batch (say twenty statements for a Deep Dive theme) and it becomes one job per statement in a `jobs` table. A worker function claims a pending job, asks the model for one statement as JSON, and records the result.
- **Separate prompts per pool.** General statements range across subjects; Deep Dive statements stay on one theme; Gauntlet statements are meant to subvert common assumptions. Each prompt asks for a single short claim with the explanation kept apart, and the code, not the model, decides whether a given statement should be true or false (about two in three are true). The recent statements are listed in the prompt to steer away from them.
- **Duplicate check with embeddings.** Each new statement is embedded (OpenAI `text-embedding-3-small`) and a PostgreSQL function runs a cosine-similarity search with pgvector over both live and pending statements in the same language. At 0.85 similarity or above it is rejected: the job goes back in the queue with the near-duplicate attached, the next prompt names it and asks for a different topic, and the temperature rises. After three tries the job is marked failed.
- **Audit desk.** Statements that pass go to a pending table with their closest matches attached, so the reviewer can see what each one resembles. From the admin panel a statement can be approved, edited and approved, discarded, or revised by the model from a written instruction, with the revision re-checked for duplicates. The panel also searches statements, shows job statistics and backfills embeddings for older rows. A setting exists to skip review and approve automatically, but it is not wired to a real confidence score yet, so everything goes through review.
- **Swappable model.** Generation, revision and explanations go through the Vercel AI SDK, so the provider (OpenAI or Anthropic) and model are set by configuration, and a placeholder mode lets the whole flow run without a key.

## 3. Engineering

- **Thick client, serverless back end.** The Svelte single-page app talks to Supabase directly for reads and through Edge Functions for answers, explanations and admin actions. Row level security policies limit what the browser can read and write.
- **Mobile-ready shape.** No Node server is needed, so the same app can later be wrapped with Capacitor; that has not been done.
- **Tests.** Deno tests run the answer and statement functions against a local Supabase: three statements with exactly one lie, filtering by language, pool and category, streaks resetting on a wrong answer, metrics updating, missing fields rejected.

## 4. Not built yet

The design also describes a Live Pulse event mode, global leaderboards for the Gauntlet, sign-in accounts, sharing and a mobile release. None of these is built.
