---
slug: tech/typescript-node
title: "TypeScript and Node.js"
short: "TypeScript"
category: tech
description: TypeScript and Node.js from Intellisense's asynchronous site-event services to most of the Advection estate, including the AudioTales Express backend, the Commonts and Found Teams APIs, Rogue Calculator, and the agent gateway, store publishers and brain sync.
tags: [typescript, nodejs, express, fastify, vite]
featured: false
updated: 2026-10-16
---

# TypeScript and Node.js

> [!NOTE]
> ### Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Used** | 2020 to present |
> | **Roles** | [Intellisense.io](/tree/roles/intellisense), [Advection Software](/tree/roles/advection) |
> | **Backends** | Express ([AudioTales](/tree/products/audio-tales)), Fastify ([Found Teams](/tree/prototypes/found-teams)), a TypeScript API and worker monorepo ([Commonts](/tree/prototypes/commonts)) |
> | **Tooling** | [Agentic Gateway](/tree/tools/agentic-gateway), [Store Publishers](/tree/tools/store-publishers), [Context Packager](/tree/tools/context-packager), [The Brain](/tree/tools/the-brain)'s sync script |

---

## Where Andrea used it

- **[Intellisense.io](/tree/roles/intellisense) (2020 to 2022).** Asynchronous Node.js services bridging industrial site events with predictive models, packaged in Docker.
- **Backends at [Advection Software](/tree/roles/advection) (2023 to present).** [AudioTales](/tree/products/audio-tales) runs Node.js, Express and TypeScript on Cloud Run. [Commonts](/tree/prototypes/commonts) is a TypeScript monorepo (API, worker, Vite web app) with Drizzle and OpenAPI. [Found Teams](/tree/prototypes/found-teams) puts a Fastify and Drizzle API, with TypeBox generating the OpenAPI spec, behind a React SPA.
- **Front ends.** [Rogue Calculator](/tree/products/calculated-survival) (React, TypeScript, Vite), [Tales Unwritten](/tree/prototypes/tales-unwritten) (Next.js, TypeScript) and the mobile apps built on [React Native](/tree/tech/react).
- **Developer tools.** The [Agentic Gateway](/tree/tools/agentic-gateway) (Node.js, node-pty, WebSockets, SSE), its retired predecessor the [Discord Chat-Ops Gateway](/tree/tools/discord-agent-gateway), the [Context Packager](/tree/tools/context-packager), the [store publishers](/tree/tools/store-publishers) and [the brain](/tree/tools/the-brain)'s sync script.

## Notable decisions

- **The API owns every rule (Found Teams).** The Fastify API knows nothing about a frontend; a pure domain layer is unit-tested apart from HTTP and the database, and the SPA's client is generated from the OpenAPI spec.
- **Vendor fakes for a public demo (Commonts).** `DEMO_MODE` forces vendor fakes and closes sign-ups and uploads, and a Cloud Run job reseeds the demo nightly.
