---
slug: prototypes/inwork
title: "InWork: Non-Profit Cooperative Formation Platform"
category: prototypes
description: Non-profit platform helping workers join, start, and patronize worker cooperatives ("Tinder for coop teams"), featuring Fastify/Drizzle OpenAPI and React/Vite.
tags: [inwork, cooperatives, postgresql, pgvector, fastify, drizzle, openapi, react, vite, zero-to-one]
featured: true
updated: 2026-09-11
---

# InWork: Non-Profit Cooperative Formation Platform

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🧪 Functional Prototype & Incubating Platform (Active on this device) |
> | **What It Is** | Non-profit platform that helps people **join**, **start**, and **patronize** worker cooperatives — team discovery and formation ("Tinder for coop teams"). |
> | **Core Problem & Solution** | Solo freelancers lack credibility to sell high-value services, while starting a firm alone requires prohibitive capital. InWork matches complementary professionals on shared company preferences, providing governance templates, pod workspaces, and client contracting. |
> | **Tech Stack** | PostgreSQL 16 + pgvector, Fastify, Drizzle ORM, OpenAPI, React + Vite SPA, Tailwind CSS |
> | **Key Highlights** | Browse-first matching, mutual opt-in pod formation, watcher pipelines, blameless fork/merge mechanics, four-tier membership ladder. |

**InWork** is an open-source, non-profit platform designed to catalyze the formation of worker-owned cooperatives. Operating on the premise that *"teams can sell what individuals cannot,"* InWork enables three people with a name and a shared portfolio to function as a credible agency, transforming underemployed talent into democratic economic firms.

---

## 1. System Vision & The Three Surfaces

InWork structures the lifecycle of cooperative enterprise into three prioritized surfaces:

| Mission Surface | Role | Core Capabilities |
| :--- | :--- | :--- |
| **1. Join** | Discovery & Matching | Professional profile; *"call me when a team needs me"* filter; browse people and pods; candidate ranking; mutual opt-in handshake. |
| **2. Start** | Pod Formation | Pod workspaces (chat, task board, governance polls); charter defaults; probation-to-membership ladder; blameless fork & merge; public pod page. |
| **3. Patronize** | Public Directory & Contracts | Public directory of active cooperatives; fixed-scope packaged offers; client intake; platform-enforced pricing tied to track record; escrow integration. |

```
[ Individual Talent ]
         │
         ▼
[ Surface 1: Join ] ──► ( Preference & Skill Filtering: Size, Risk, Tech )
         │
         ▼
[ Mutual Opt-In Handshake ] ──► ( Everyone says yes before a Pod exists )
         │
         ▼
[ Surface 2: Start ] ──► ( Pod Workspace, Governance Charter, Member Ladder )
         │
         ▼
[ Surface 3: Patronize ] ──► ( Public Directory, Client Contracts & Escrow )
```

---

## 2. Core Mechanics: Democratic Formation Architecture

InWork discards typical gig-economy dynamics in favor of democratic cooperative mechanics:

### Browse-First Matching (Ranking, Not an Oracle)
Onboarding is an intentional form asking what kind of **company** the user wants to build (firm size, ownership philosophy, hours, risk appetite, consulting vs. product), rather than predicting human chemistry with an opaque AI oracle. People who want the same company are compatible even across disparate skill sets.

### Mutual Opt-In & Cheap First Commitments
Nobody is arbitrarily assigned to a pod. A pod activates only when all participants mutually confirm interest. The first commitment is simply a conversation, not a legally binding incorporation.

### The Watcher Pipeline
Tracking an incubating pod is a first-class citizen role. "Watchers" observe a pod's evolving charter and project proposals. When a pod experiences a skill gap (e.g., needing a backend engineer or finance lead), the watchers serve as the immediate recruitment pipeline.

### Blameless Fork & Merge
When a pod reaches an ideological or strategic impasse, it can **fork** cleanly into two distinct proposals. Lineage is tracked openly (*"Forked from Pod Alpha"*). Watchers choose which branch to support, eliminating toxic "vote someone out" political cycles.

### Four-Tier Membership Ladder
Borrowed from a century of successful worker-cooperative history:
1. **Watch**: Zero-commitment exploration.
2. **Join Proposal**: Opting into active team formation conversations.
3. **Probationary Member**: Delivering concrete value (design doc, client pitch, task delivery) — paid in work, not cash.
4. **Full Member**: Purchasing a membership equity share (payable over time out of client earnings, refundable at par upon departure).

---

## 3. Decoupled Architecture: OpenAPI Contract & React SPA

InWork adheres to a strict architectural decoupling constraint: front and back never share a unified framework or hidden runtime bindings.

```
[ React + Vite SPA ] ──( Strictly-Typed OpenAPI Spec )──► [ Fastify + Drizzle Node API ]
                                                                     │
                                                                     ▼
                                                          [ PostgreSQL 16 + pgvector ]
```

- **PostgreSQL + pgvector**: The single permanent data layer. Profiles and pod charters store high-dimensional skill and value embeddings, powering vector similarity ranking for team recommendations.
- **Fastify API with Drizzle ORM**: High-throughput REST API generating a live OpenAPI schema. Validates requests with strict JSON schemas and handles transactional state.
- **Decoupled React + Vite SPA**: Client code consumes generated TypeScript types directly from the OpenAPI schema, guaranteeing compile-time type safety without framework lock-in.
- **Deterministic Seed Harness**: Features a seed of 150 diverse professionals and 20 incubating pods, allowing all three surfaces to run end-to-end in offline local environments.

---

## 4. Technical Stack Summary

| Component | Technology |
|---|---|
| **Database & Search** | PostgreSQL 16, pgvector extension, Drizzle ORM |
| **Backend Engine** | Node.js, Fastify, Zod, OpenAPI 3.1 generation |
| **Frontend Client** | React 18, Vite, Tailwind CSS, TanStack Query |
| **Port Allocations** | DB: `5433`, API: `4000`, Web: `5174` (Clean isolation on nur) |
| **Governance Model** | Non-profit open source; zero private equity capital dependencies |
