---
slug: architecture/multi-agent-systems
title: "Multi-Agent Systems: Running Parallel Agents That Ship"
short: "Multi-Agent"
category: architecture
description: How work is split across parallel coding agents (bounded increments, disjoint file ownership, quarantine, resumption from transcripts, shared context from the brain), and the in-product agent designs (bounded tool loops, MCP tools, specialist agents).
tags: [architecture, multi-agent, claude-code, mcp, gemini, vercel-ai-sdk, orchestration, ai-governance]
featured: false
updated: 2026-10-16
---

# Multi-Agent Systems: Running Parallel Agents That Ship

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | How the estate is built day to day, and how its agent products are designed. |
> | **What It Is** | Two layers: coding agents that build the products in parallel, and agents inside products (GameTsunami's studio, the portfolio agent, Foundry's research team). |
> | **Core Problem & Solution** | Long agent runs die to session limits and lose their work; parallel agents clobber each other; unchecked output goes live broken. Short increments, owned files, quarantine and a shared knowledge base fix each of these. |
> | **Tech Stack** | Claude Code, Model Context Protocol (MCP), Google Gemini, Vercel AI SDK, Microsoft Agent Framework |
> | **Key Highlights** | 39 games in one multi-agent session, a 32-game d3 catalogue from a rolling pool of five agents, bounded tool loops with per-user cost accounting. |

---

## 1. Coding agents in parallel

- **Waves of about five.** A rolling pool of five agents, each with its own task and **disjoint file ownership**, so no two agents edit the same file. Per-agent scratch directories replaced a shared one after agents overwrote each other's files.
- **Ten-minute increments.** Each run reaches a runnable state early, writes to the real directory continuously, and stops after roughly ten minutes; the next pass is a resume, not a relaunch. The owner's rule: "I'd rather get a WIP than have a forever process I risk losing."
- **Resume from the transcript.** When a usage limit killed all five agents at once mid-increment, the committed work was clean and each agent resumed with "finish only, start nothing new".
- **Quarantine and verification.** Work enters the live product only after a real check; verification depth is asked for explicitly, not assumed (see [development harnesses](/tree/tools/agentic-development-harnesses)).
- **Report per wave, not per agent.** A background pipeline that reports every agent feels like it constantly needs attention.
- **"Continue" means finish.** A mistaken continue once launched nine new titles instead of finishing open ones; the instruction is now read as finish what exists, new work only on explicit request.
- **Shared context.** Every session starts from the [brain](/tree/tools/the-brain), so an agent on any machine knows each project's state and the traps already found. Remote sessions are driven through the [Agentic Gateway](/tree/tools/agentic-gateway).

## 2. Agents inside products

- **Bounded tool loops.** [GameTsunami](/tree/products/gametsunami)'s studio agent edits real files through `listFiles`, `readFile`, `patchFile` and `saveFile` in a loop with a step cap. A known gap, and the next piece of work: the spending check runs once before the model is called, so one run cost $0.63 against a $0.50 cap. The fix in order is to persist on every exit path, check the budget at each step boundary, then estimate before starting.
- **Specialists over one prompt.** [Autonomic Alpha Foundry](/tree/prototypes/foundry) splits research across seven agents (manager, strategy, data, ML, optimisation, evaluation, inference) on the Microsoft Agent Framework, with tools behind MCP servers so a data source can be swapped without touching agent logic.
- **Grounding over tools or context.** The [portfolio agent](/tree/products/portfolio-agent) uses both: the text chat searches and reads knowledge nodes through tool calls, while live voice gets the whole tree up front to avoid tool latency mid-conversation.
- **Cost per session.** Input, output and thinking tokens are priced and attributed per user or session.
