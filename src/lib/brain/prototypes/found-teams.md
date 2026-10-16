---
slug: prototypes/found-teams
title: "Found Teams: Non-Profit Cooperative Formation Platform"
short: "Found Teams"
category: prototypes
description: Nonprofit platform for joining, starting and hiring worker cooperatives, with explainable matching, mutual opt-in and blameless forks; Fastify, Drizzle and Postgres behind a React SPA, live as a writable demo on Cloud Run.
tags: [found-teams, cooperatives, postgresql, pgvector, fastify, drizzle, openapi, react, vite, cloud-run, zero-to-one, typescript, nodejs]
featured: true
updated: 2026-10-16
---

# Found Teams: Non-Profit Cooperative Formation Platform

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Live at [foundteams.com](https://foundteams.com) as a writable demo with sign-ups closed, until the nonprofit entity exists. Press page with promo videos since 2026-10-13. |
> | **What It Is** | Non-profit platform that helps people **join**, **start**, and **patronize** worker cooperatives — team discovery and formation ("Tinder for coop teams"). |
> | **Core Problem & Solution** | Solo freelancers lack the credibility to sell high-value services, while starting a firm alone requires prohibitive capital. Found Teams matches complementary professionals on shared preferences about the *company they want to build*, then supplies governance templates, team workspaces and client contracting. |
> | **Tech Stack** | PostgreSQL + pgvector, Fastify, Drizzle ORM, TypeBox → OpenAPI, React 19 + Vite SPA, GCP Cloud Run, Neon |
> | **Key Highlights** | Browse-first explainable matching, mutual opt-in formation, watcher pipelines, blameless fork/merge mechanics, four-tier membership ladder, and a client side sharing one conversation with each team. |

**Found Teams** is a nonprofit platform designed to catalyse the formation of worker-owned cooperatives. Operating on the premise that *"a team can sell what an individual cannot,"* it enables three people with a name and a shared portfolio to function as a credible firm, charging firm rates for skills that earn freelancer rates alone.

---

## 1. System Vision & The Three Surfaces

Found Teams structures the lifecycle of cooperative enterprise into three prioritised surfaces:

| Mission Surface | Role | Core Capabilities |
| :--- | :--- | :--- |
| **1. Join** | Discovery & Matching | Professional profile; *"call me when a team needs me"* filter; browse people and teams; explained candidate ranking; mutual opt-in handshake. |
| **2. Start** | Team Formation | Workspaces (chat, task board, consent decisions); charter defaults; probation-to-membership ladder; blameless fork & merge; public team page. |
| **3. Patronize** | Public Directory & Contracts | Public directory of active cooperatives; fixed-scope packaged offers; client intake; a client's own view of every brief sent and one conversation shared with each team; platform-set pricing tied to track record. |

```
[ Individual Talent ]
         │
         ▼
[ Surface 1: Join ] ──► ( Preference & Skill Filtering: Size, Ownership, Risk )
         │
         ▼
[ Mutual Opt-In Handshake ] ──► ( Everyone says yes before a Team exists )
         │
         ▼
[ Surface 2: Start ] ──► ( Workspace, Governance Charter, Member Ladder )
         │
         ▼
[ Surface 3: Patronize ] ──► ( Public Directory, Fixed-Price Client Offers )
```

---

## 2. Core Mechanics: Democratic Formation Architecture

Found Teams discards typical gig-economy dynamics in favour of democratic cooperative mechanics:

### Browse-First Matching (Ranking, Not an Oracle)
Onboarding asks what kind of **company** the user wants to build — firm size, ownership philosophy, hours, risk appetite, consulting versus product — rather than attempting to predict human chemistry. People who want the same company are compatible even across disparate skill sets.

Critically, ranking is **explainable by construction**: it is built from stated preferences, skill complementarity and the gaps a team has declared, so the interface can always state *why* a match surfaced — *"wants the same kind of company · fills react · same city."* A similarity score cannot do that, and for a platform asking people to opt in to strangers, the reason is doing as much work as the rank.

### Mutual Opt-In & Cheap First Commitments
Nobody is arbitrarily assigned. A team activates only when every invited participant has answered and at least the charter's public minimum (three by default) said yes; a founder plus one yes used to be enough, and produced teams of two that looked real and were not. The first commitment is a conversation, not an incorporation.

### The Watcher Pipeline
Tracking a forming team is a first-class role, not lurking. Watchers follow a team's evolving charter and proposals; when the team hits a skill gap, its watchers are already the recruitment pipeline.

### Blameless Fork & Merge
When a team reaches a strategic impasse it can **fork** cleanly, with the disagreement stated and lineage recorded openly (*"Forked from Gradient Data"*). Nobody is demoted for forking, watchers follow both branches, and merging is as easy. This replaces the toxic "vote someone out" cycle with something closer to how groups actually discover what they are.

### Four-Tier Membership Ladder
Borrowed from a century of worker-cooperative practice:
1. **Watch** — zero-commitment exploration.
2. **Join Proposal** — opting into a formation conversation.
3. **Probationary Member** — delivering concrete value (a design doc, a client pitch, shipped tasks) — paid in work, not cash.
4. **Full Member** — purchasing a membership share, payable over time out of earnings and refunded at par on departure.

---

## 3. Decoupled Architecture: OpenAPI Contract & React SPA

Found Teams adheres to a strict decoupling constraint: front and back never share a framework or hidden runtime bindings. Only the data layer is treated as permanent.

```
[ React + Vite SPA ] ──( Generated from the OpenAPI Spec )──► [ Fastify + Drizzle Node API ]
                                                                     │
                                                                     ▼
                                                          [ PostgreSQL + pgvector ]
```

- **PostgreSQL + pgvector** — the single permanent data layer. Everything that happens is recorded as an append-only event, which is what drives activity feeds and notifications. Profile and team vectors are maintained as a seam for future semantic retrieval; the shipped matching is the explainable feature scoring described above, not vector similarity.
- **Fastify API with Drizzle ORM** — owns every rule and knows nothing about a frontend. A pure domain layer (ladder transitions, fork and merge planning, match scoring) is unit-tested in isolation from both HTTP and the database. TypeBox route schemas generate the OpenAPI document.
- **Decoupled React + Vite SPA** — consumes TypeScript types generated from that document, so a route that changes shape breaks the build rather than production.
- **Single-container deployment** — one image serves the API under `/api`, the SPA on every other path, and the marketing landing page on an explicit hostname allowlist. Same origin, so no CORS and no second service. Runs on Cloud Run and scales to zero.
- **Deterministic Seed Harness** — 150 synthetic professionals and twenty teams across six US cities at every stage of the ladder, including a fork, a merge, shipped portfolios and priced offers. Same seed, same community, every run.
- **Measured against the deployment.** Two endpoints took 7-9 seconds live while instant locally: about 160 sequential queries per request crossing from Cloud Run to the database region. Batching each concern into one query brought them to 1.5 and 0.8 seconds.
- **Promo harness.** A `promo/` pipeline makes social stills, a vertical short, a landscape tour and a `/press` page from the real app over a local seed, with a Gemini TTS presenter.

---

## 4. Deliberate Omissions

As much a design statement as the features:

- **No AI business-plan generator.** The original concept had the platform run market research and generate ventures. Language models converge on the median plan; the signal worth having is what a pool's own members know, and that is an interview, not a prompt.
- **No payments or escrow.** A compliance business, not this one's — left behind an interface for a provider.
- **Open to try, not open for real use.** The community is invented and
  sign-ups are closed, so no real personal data is collected — but every
  workflow can be *performed* against the seeded data, because a demo you can
  only read proves very little. Changes revert nightly from a snapshot held
  inside the database. That is the right posture until a legal entity exists,
  rather than a gap in the build.

---

## 5. Technical Stack Summary

| Component | Technology |
|---|---|
| **Database & Search** | PostgreSQL + pgvector, Drizzle ORM, Neon (managed, serverless) |
| **Backend Engine** | Node.js, Fastify, TypeBox, OpenAPI generation |
| **Frontend Client** | React 19, Vite, TanStack Query, hand-written CSS |
| **Hosting** | GCP Cloud Run (single container), Porkbun DNS |
| **Governance Model** | Nonprofit (entity not yet formed); open source as software other organisations can run is the stated direction, licence undecided |
