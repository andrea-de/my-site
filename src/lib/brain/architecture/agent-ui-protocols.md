---
slug: architecture/agent-ui-protocols
title: "Agent-UI Protocols: Streaming What the Agent Is Doing"
short: "Agent UI"
category: architecture
description: How the estate's agent interfaces stream reasoning, tool steps, UI actions and approval gates as typed events over SSE and WebSockets, with the concrete implementations in GameTsunami, the portfolio agent and Autonomic Alpha Foundry.
tags: [architecture, agentic, websockets, sse, streaming, ag-ui, reactive-ui]
featured: false
updated: 2026-10-16
---

# Agent-UI Protocols: Streaming What the Agent Is Doing

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Pattern used in three products. |
> | **What It Is** | A way of connecting an agent loop to an interface: the backend streams typed events (reasoning, tool call, tool result, UI action, content, done) instead of one block of text. |
> | **Core Problem & Solution** | A plain text stream hides the wait and cannot ask the user anything. Typed events let the interface show progress as it happens, render tool steps, and pause for an approval inside the conversation. |
> | **Tech Stack** | Server-Sent Events, WebSockets, TypeScript, SvelteKit, Next.js, Vercel AI SDK |
> | **Key Highlights** | Visible reasoning and tool chips, actions the agent can trigger in the UI, human-in-the-loop approval gates. |

---

## 1. The event shape

Each message carries an id, a session or correlation id, the emitting agent, an event type and a typed payload. The event types that matter in practice:

- **`thought`.** Reasoning deltas shown in a collapsible panel, so the answer itself stays clean.
- **`tool_call` and `tool_result`.** Rendered as step chips while they run, summarised when the turn completes.
- **`action`.** A request for the interface to do something: open a contact form, show a widget, ask for approval.
- **`content` and `done`.** The answer, then a completion marker with timing and usage.

## 2. Where it runs

- **[GameTsunami](/tree/products/gametsunami).** The studio streams Gemini's thinking tokens and each file tool step through the Vercel AI SDK data stream, so building a game looks like watching a colleague work.
- **[The portfolio agent](/tree/products/portfolio-agent).** The text chat is an SSE endpoint emitting reasoning deltas, `tool_call` events for each knowledge-tree search and node read, and citations; an action marker lets the agent open the contact form.
- **[Autonomic Alpha Foundry](/tree/prototypes/foundry).** A WebSocket protocol between seven agents and a SvelteKit interface, where an expensive step such as a multi-trial optimisation run summons an approval gate into the chat stream.

## 3. Design notes

- **Reasoning beside the answer, not in it.** Visitors and users see the agent consult specific sources in real time, which turns latency into evidence that the answer is grounded.
- **Approval as part of the stream.** A gate is just another event the interface renders, so the agent pauses without the user leaving the conversation.
- **Streams end explicitly.** A `done` event with usage lets the client summarise the turn and the server account for cost.
