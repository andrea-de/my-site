---
slug: products/portfolio-agent
title: "Talk to My Agent: The Portfolio Site's Voice and Chat Agent"
short: "Voice Agent"
category: products
description: Andrea's portfolio site, built around a live voice agent that answers questions about his work from this knowledge tree; Gemini Live over a direct WebSocket with ephemeral tokens, a tool-calling text chat with streamed speech, and a project showcase fed from each product's press page.
tags: [voice-agent, gemini-live, sveltekit, svelte, web-audio, websockets, sse, tts, knowledge-tree, vercel, gemini, d3]
featured: false
updated: 2026-10-16
---

# Talk to My Agent: The Portfolio Site's Voice and Chat Agent

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Live at [www.andreadecandia.com](https://www.andreadecandia.com), deployed on Vercel. |
> | **What It Is** | A personal site that leads with a conversation: "Don't scroll. Just ask." Visitors talk to an agent that knows Andrea's projects, roles and decisions, or type to it, and can open any project from the answer. |
> | **Core Problem & Solution** | A portfolio is read in a minute and remembered for less. Here the visitor asks what they actually want to know, and the answer is grounded in the same knowledge base Andrea's own agents use, synced from the public part of the brain. |
> | **Tech Stack** | SvelteKit, Svelte 4, Vite, Vercel, Gemini Live API, Gemini (chat and TTS), Web Audio, Server-Sent Events, d3-force |
> | **Key Highlights** | Live voice with about half a second to first audio, first spoken reply in the text chat about 0.6 s after the TTS request, whole-tree grounding, visible reasoning and tool steps, phone-first welcome tour. |

---

## 1. Live voice

- **Direct to Gemini Live.** The browser opens a WebSocket straight to the Gemini Live API (`gemini-3.1-flash-live-preview`) with a short-lived ephemeral token minted by the site's server, so no long-lived key reaches the client and no audio passes through the site.
- **Grounded up front.** The whole public knowledge tree goes into the session's instructions, so a spoken answer never waits on tool calls.
- **Audio pipeline.** The microphone is captured at 16 kHz 16-bit PCM and the agent's 24 kHz PCM is scheduled gaplessly through Web Audio, with instant cut-off when the visitor interrupts.
- **Echo shield.** While the agent speaks, the microphone is gated with a short hangover, so a phone loudspeaker cannot leak the agent's voice back and trigger the server's turn detection.
- **A living orb.** Playback and microphone each run through an analyser; the orb's glow follows the RMS of whichever side is talking, smoothed per frame. The call can be minimised to a corner orb and keeps going.
- **Saying the name right.** The prompt fixes the Italian pronunciation of "Andrea" (stress on the second syllable), and transcripts are sanitised so a phonetic respelling never appears in text.

## 2. Text chat

- **Tool-calling over SSE.** The chat model searches the knowledge index and reads specific nodes in a multi-step loop before answering, streaming its reasoning and each tool step to a collapsible panel, then citing the notes it used.
- **Streamed speech.** Replies can be spoken: the TTS endpoint streams raw PCM chunks as they are generated and the client plays them as they land, which cut first audio from 3.6-5.7 s to about 0.6 s after the TTS request.
- **Speech clean-up.** A small dictionary repairs common misrecognitions of technical terms and product names in voice transcripts.

## 3. The site around it

- **Welcome tour on phones.** A three-page, voice-first tour (cover, products, experience) with shared-element transitions: the cover's orb flies into the voice view, product thumbnails grow into cards.
- **Project showcase.** Phone-shaped cards play each product's promo video from the publisher's live creative catalogue; opening one shows a reel of its social shorts, read server-side from the product's `/press` page and cached for an hour, so a new short appears on the site with no deploy.
- **Knowledge tree.** `/tree` renders these notes with a search-and-filter list and a d3-force graph of the whole tree on canvas. See [the brain](/tree/tools/the-brain).
- **Interactive resume.** `/resume` mirrors the printable one-page resume, with skill cross-highlighting across roles, per-company breakdown drawers linking to the role notes, and PDF and image views.

## 4. Decisions

- **One voice UI.** A first welcome tour had its own Gemini Live session; it was rejected as a duplicate, and the tour now opens the site's existing voice mode.
- **Voice first, then projects, then experience.** New surfaces lead with the agent.
- **Self-contained builds.** The sanitised brain copy is committed to the site repo, so a Vercel build needs no network access to the knowledge base.

## 5. Stack

| Component | Technology |
|---|---|
| **Site** | SvelteKit, Svelte 4, Vite, Vercel |
| **Voice** | Gemini Live API over WebSocket, ephemeral tokens, Web Audio |
| **Chat** | Gemini with tool calls, Server-Sent Events |
| **Speech out** | Gemini TTS, streamed PCM |
| **Graph** | d3-force and d3-zoom on canvas |
