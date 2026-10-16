---
slug: architecture/full-lifecycle-pipelines
title: "Full-Lifecycle Pipelines: From Brief to Store"
short: "Lifecycle"
category: architecture
description: The estate's end-to-end delivery chain as five automated stages (brief, build and verify, supervision, media, release), each linked to the node that describes it in detail.
tags: [architecture, pipelines, full-lifecycle, ci-cd, verification, automation, release-engineering]
featured: true
updated: 2026-10-16
---

# Full-Lifecycle Pipelines: From Brief to Store

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | How every product in the estate is delivered. |
> | **What It Is** | Treating each stage of delivery, not only build and deploy, as a repeatable pipeline: writing the brief, building and verifying, supervising the machines, making the media, releasing to the stores. |
> | **Core Problem & Solution** | CI/CD usually covers the binary and leaves briefs, verification, screenshots, videos and store forms manual. When each stage is code, one person with agents can keep many products current. |
> | **Tech Stack** | Claude Code, Playwright, Godot, Robolectric, Flutter test, FFmpeg, Gemini TTS, GitHub Actions (self-hosted), App Store Connect and Google Play APIs |
> | **Key Highlights** | Briefs agents can execute, quarantine before release, media regenerated from the current app, releases promoted by API. |

---

## The five stages

```
1. Brief          written spec + owner preferences  ──►  agent-executable task
2. Build/verify   parallel agents in harnesses      ──►  quarantined, then admitted
3. Supervise      gateway on private machines       ──►  terminals, voice, state
4. Media          harness renders from the real app ──►  /press page per product
5. Release        self-hosted CI + store APIs       ──►  internal track, then promote
```

1. **Brief.** Work starts from a written brief in the repo: the game agent brief in GameTsunami, the founding document in Found Teams, the developer and player feature lists in Rogue Calculator. Owner preferences found along the way (no on-screen gamepad, phone first, a voice per short) are written into the brief so the next agent inherits them.
2. **Build and verify.** Parallel agents work in bounded increments inside harnesses that let them run what they build; unverified work stays in quarantine. See [development harnesses](/tree/tools/agentic-development-harnesses) and [multi-agent systems](/tree/architecture/multi-agent-systems).
3. **Supervise.** A supervisor and a one-port web workstation keep the development services on private machines alive and reachable from a phone. See [Agentic Gateway](/tree/tools/agentic-gateway).
4. **Media.** Store screenshots, narrated previews, shorts and house-ad creatives are rendered from the current build and published on each product's `/press` page. See [media harnesses](/tree/tools/media-harnesses).
5. **Release.** Self-hosted runners build and upload; listings, purchases and submissions go through the store APIs, and production promotes the tested build. See [deployment pipelines](/tree/architecture/deployment-pipelines) and [store publishers](/tree/tools/store-publishers).

Underneath all five, the [brain](/tree/tools/the-brain) carries each product's state between sessions and machines.
