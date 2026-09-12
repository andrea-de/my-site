---
slug: tools/discord-agent-gateway
title: "Discord Chat-Ops Gateway: Collaborative Agentic Coding"
category: tools
description: Multi-user developer gateway wrapping autonomous CLI coding agents (agy, codex, gemini) into Discord forum threads with interactive approval buttons.
tags: [tools, discord-bot, chat-ops, agentic, nodejs, pty, multi-user, collaboration]
featured: true
updated: 2026-09-11
---

# Discord Chat-Ops Gateway: Collaborative Agentic Coding

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🛠️ Functional Tool / Developer Gateway (69 Commits) |
> | **What It Is** | Developer gateway that wraps autonomous CLI coding agents (`agy`, `codex`, `gemini`) into Discord forum channels and interactive threads. |
> | **Core Problem & Solution** | Agentic CLIs are built for single-user local terminals, isolating pair-programming sessions. This gateway parses streaming agent stdout into readable markdown thread logs and translates permission checkpoints into interactive Discord buttons. |
> | **Tech Stack** | Node.js, Discord.js v14, `node-pty`, Child Process Streams, REST API |
> | **Key Highlights** | Interactive Discord button approval gates, provider drivers (`agyDriver`, `codexDriver`), mobile collaboration on agent runs. |

The **Discord Chat-Ops Developer Gateway** (`andrea-de/discord-agent-gateway`) bridges local autonomous coding CLI tools into team communication channels, allowing developers to spin up, monitor, and interact with agentic coding sessions from desktop or mobile Discord.

---

## 1. System Vision: Chat-Ops for Autonomous Coding Agents

Rather than emulating a noisy, raw ANSI terminal in chat, the gateway treats agent executions as structured collaborative sessions:

```
[ Developer in Discord ] ──( Slash Command: /antigravity, /codex )
            │
            ▼
[ Gateway Router ] ──────► ( Creates Dedicated Forum Thread per Task )
            │
            ├─► Process Manager / PTY Session ( Spawns agy or codex CLI )
            │
            ├─► Real-Time Stdout Parser ( Strips ANSI, Extracts Token Cost )
            │
            ▼
[ Interactive Thread ] ──► ( Markdown Logs + Button Gates: [Approve Tool] [Reject] )
```

- **Forum Channel Architecture**: Automatically provisions project-specific Discord forum channels with dedicated threads for each coding prompt.
- **Interactive Component Buttons**: When an agent requests permission to run a bash command, modify a file, or invoke a subagent, the gateway translates the prompt into clickable Discord buttons (`Approve`, `Deny`, `Revise`).

---

## 2. Multi-Provider Driver Architecture

The gateway features modular provider drivers that abstract distinct agent CLI formats:

- **`agyDriver`**: Formats Google Antigravity tool-calling logs, subagent spawn events, and cost accounting.
- **`codexDriver`**: Handles OpenAI Codex execution loops, file diff previews, and sandbox checkpoints.
- **`geminiDriver`**: Parses Google Gemini streaming thinking tokens and tool payloads.

---

## 3. Dual Execution: PTY & Subprocess Streams

- **`ptyManager.js`**: Uses `node-pty` to simulate a real pseudo-terminal for agents that demand TTY interactivity.
- **`processManager.js`**: Handles standard spawned subprocesses with log buffering and token rate-limiting to adhere to Discord API message burst constraints.

---

## 4. Technical Stack Summary

| Component | Technology |
|---|---|
| **Runtime & Gateway** | Node.js, Discord.js v14, `dotenv` |
| **Terminal Integration** | `node-pty` (Pseudo-Terminal Bindings) |
| **Drivers** | Modular adapter pattern (`agyDriver`, `codexDriver`, `geminiDriver`) |
| **Evolution** | Served as direct conceptual predecessor to Agentic Gateway's supervisor |
