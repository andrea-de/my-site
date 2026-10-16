---
slug: tech/llm
title: "LLM Integration"
short: "LLMs"
category: tech
description: Building products on language and speech models, mostly Gemini: page reading and narration in AudioTales, Gemini Live in this site's voice agent, a tool-calling game studio in GameTsunami, generated pages in Tales Unwritten, drills in Fluenics, plus civility checks, embeddings, MCP tools and the Vercel AI SDK.
tags: [llm, gemini, vercel-ai-sdk, mcp, generative-ai, tts]
featured: false
updated: 2026-10-16
---

# LLM Integration

> [!NOTE]
> ### Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Used** | Advection era (2023 to present) |
> | **Role** | [Advection Software](/tree/roles/advection) |
> | **Models and SDKs** | Gemini (text, vision, TTS, Live), OpenAI and Anthropic models through the Vercel AI SDK, OpenAI embeddings, ElevenLabs sound effects, Azure Speech |
> | **Patterns** | Bounded tool loops, MCP tools, structured JSON output, streamed speech, embedding duplicate checks |

---

## Where Andrea used it

- **[AudioTales](/tree/products/audio-tales).** Gemini transcribes page photos, decides the book's language from all pages read so far, and reads each page as one TTS take.
- **[Talk to My Agent](/tree/products/portfolio-agent).** Gemini Live over a direct WebSocket with ephemeral tokens, grounded in this tree; a text chat that calls tools over SSE and streams its speech.
- **[GameTsunami](/tree/products/gametsunami).** A multi-file, tool-calling studio agent on Gemini through the Vercel AI SDK, with reasoning and tool steps streamed live and token cost attributed per user.
- **[Tales Unwritten](/tree/prototypes/tales-unwritten).** Gemini writes each page with structured JSON output the first time a reader reaches it, with narration.
- **[Fluenics](/tree/products/fluenics)** generates speaking drills with Gemini; **[Commonts](/tree/prototypes/commonts)** screens posts with civility models and suggests rewrites that keep the argument; **[Two Truths & the Lie](/tree/prototypes/two-truths)** writes statements through a job queue and checks them with embeddings.
- **[Autonomic Alpha Foundry](/tree/prototypes/foundry).** Agents on the Microsoft Agent Framework with data fetchers and simulators exposed as MCP tools.
- **Before agent tooling.** The [Context Packager](/tree/tools/context-packager) packed whole repositories into token-budgeted prompts for large-context models. See [multi-agent systems](/tree/architecture/multi-agent-systems) and [agent-UI protocols](/tree/architecture/agent-ui-protocols).

## Notable decisions

- **Ask the question the model can answer (AudioTales).** Asked which way to rotate a page, the model got a quarter turn right about half the time; shown the photo four ways and asked which is upright, it was right on all 226 test photos.
- **Ground up front for voice.** The voice agent gets the whole public tree in its instructions, so a spoken answer never waits on a tool call; the text chat, which can wait, uses tools.
- **Stream speech.** Streaming TTS as raw PCM cut first audio from 3.6-5.7 s to about 0.6 s.
