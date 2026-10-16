---
slug: roles/advection
title: "Advection Software: Real-Time LLM Streaming & Edge Architecture"
short: "Advection"
category: roles
description: Founding Product Engineer work architecting multi-channel streaming protocols, in-house edge ad infrastructure, and serverless media processing.
tags: [streaming, nodejs, edge, cloudflare, workers, ffmpeg, zod, sse, product-engineering]
featured: true
updated: 2026-09-11
---

# Advection Software: Real-Time LLM Streaming & Edge Architecture

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Role & Tenure** | Founding Product Engineer (2023 – Present · 27+ months) |
> | **Company Focus** | AI-native product lab, multi-agent developer tooling, real-time media streaming, autonomous product synthesis. |
> | **Core Mission** | Architect resilient multi-agent orchestration workflows, headless verification harnesses, context engineering networks, and user-facing generative AI engines. |
> | **Tech Stack** | Node.js, TypeScript, Cloudflare Workers & D1, Serverless FFmpeg, Google GenAI SDK, Playwright, Zod |
> | **Key Highlights** | Multi-agent orchestration over custom remote gateways, headless verification harnesses, node-based context engineering networks, user-facing dynamic media/software/metadata engines. |

At **Advection Software**, Andrea operates as the Founding Product Engineer, leading full-stack architectural design, multi-agent systems orchestration, execution harnesses, and edge infrastructure.

---

## 1. Multi-Channel LLM Streaming Protocol

Bridging generative agent loops with responsive user interfaces requires deterministic communication contracts:

- **Structured Event Envelopes**: Replaced raw text streams with strongly typed JSON event envelopes (validated via **Zod**), streaming tool calls, UI component triggers, thinking deltas, and telemetry concurrently.
- **Backpressure & Client Hydration**: Designed reconnection protocols that replay unacknowledged event streams upon temporary network drops, ensuring state synchronization between client and serverless runtimes.
- **Low-Latency Streaming**: Optimized server-sent events (SSE) and WebSocket transports to stream tokens with sub-40ms time-to-first-byte (TTFB).

---

## 2. In-House Edge Ad Network (Cloudflare Workers + D1)

To cross-promote internal products without third-party ad network tracking bloat or cookie banners, Andrea architected a bespoke edge house-ad system:

- **Zero-Cold-Start Global Delivery**: Runs on Cloudflare Workers edge nodes across 300+ locations, executing impression tracking, placement auctions, and creative selection in under 5ms globally.
- **Lightweight D1 Storage**: Utilizes SQLite-based Cloudflare D1 databases at the edge with periodic batch reconciliation to primary data stores.
- **Strict Format Constraints**: Enforces compact WebP animated previews, AV1 video clips, and WebM assets with strict pre-fetching headers, avoiding mobile layout shifts.

---

## 3. Serverless Video Transcoding & Ingestion

- **On-Demand FFmpeg Pipelines**: Automated serverless video processing using Google Cloud Functions and AWS Lambda containers equipped with FFmpeg.
- **Adaptive Bitrate Transcoding**: Converts recorded high-framerate gameplay captures into H.264, WebP, and OGV renditions with normalized audio tracks.
- **Automated Social Clipping**: Programmatically crops and burns animated captions for automated cross-platform promotional posting.

---

## 4. Agentic Workspace Automation & Cost Governance

- **Multi-Step Agent Execution Loops**: Built autonomous 15-step agent loops capable of reading multi-file projects, applying targeted code diffs, and verifying file integrity.
- **Micro-Dollar Usage Tracking**: Implemented tiered token accounting that tracks prompt, completion, and native thinking tokens in real time, enforcing per-user budget guardrails.

---

## 5. Multi-Agent Orchestration & Headless Execution Harnesses

- **Remote Gateway Orchestration**: Directing multiple concurrent AI agents across custom remote gateways (`supervise.js`, `term-web`) over secure overlay networks, eliminating local environment bloat and isolating workloads.
- **Headless Verification Harnesses**: Wrapping AI agents in headless execution harnesses (Playwright, Linux virtual framebuffers, AST linters) to autonomously run, test, and verify code diffs before merging.
- **Node-Based Context Networks**: Authoring portable, decentralized knowledge graphs that provide structured context and architectural constraints directly into agent prompts without token bloat.

---

## 6. User-Facing Generative AI Engines

- **Autonomous Multimodal Synthesis**: Engineered production AI engines driving end-to-end synthesis of dynamic media, playable software, and rich multi-tier metadata (e.g., AudioTales script/voice dramatization, GameTsunami playable p5.js game synthesis, Fluenics pronunciation assessment).
- **Metadata Generation & Guardrails**: Structured outputs producing rich scenario metadata, phoneme scoring matrices, and state envelopes that bridge AI inference directly with reactive client interfaces.

