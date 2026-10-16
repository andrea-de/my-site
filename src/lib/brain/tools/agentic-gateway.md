---
slug: tools/agentic-gateway
title: "Agentic Gateway: Supervisor and term-web Workstation over Tailscale"
short: "Gateway"
category: tools
description: Self-built process supervisor and one-port HTTPS workstation (term-web) on private machines over Tailscale; phone-friendly terminal, read-only voice agent, ports, repos, files and system diagnostics, running on Linux and macOS.
tags: [tools, agentic-gateway, nodejs, pty, websockets, sse, tailscale, devops, voice-agent, claude-code]
featured: false
updated: 2026-10-16
---

# Agentic Gateway: Supervisor and term-web Workstation over Tailscale

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | In daily use on three machines (two Linux, one macOS) as of September 2026. |
> | **What It Is** | `supervise.js`, a small Node.js supervisor that keeps the gateway services alive, and `term-web`, one HTTPS document with six views for working on a remote machine from a phone or laptop. |
> | **Core Problem & Solution** | Driving coding agents on remote machines from a phone over SSH is clumsy, and every extra service means another port. term-web puts a terminal, a voice agent and the machine's state behind one authenticated port on the private tailnet. |
> | **Tech Stack** | Node.js, node-pty, xterm.js, WebSockets, Server-Sent Events, tmux, Tailscale HTTPS, systemd user services |
> | **Key Highlights** | Mobile terminal input tray, a voice agent that reads the knowledge base and repos but cannot write, a Claude Code session inventory, cross-machine repo view, dependency-free diagnostics. |

It grew out of two earlier projects: a mobile web terminal (whose input modes it absorbed) and a [Discord chat-ops gateway](/tree/tools/discord-agent-gateway).

---

## 1. Supervisor

`supervise.js` starts each service, restarts any that exits after two seconds, writes per-service logs and a live `status.json`, and runs as a systemd user service. A self-update path (watch a `deploy` branch, fast-forward, restart only the children whose package changed) is built and tested but parked: enabling it is a per-machine job rather than a code change.

## 2. term-web: six views on one port

1. **Terminal.** xterm.js on node-pty attached to tmux, with a draggable tray of phone keys (Esc, Tab, Ctrl combinations, arrows) and a reconnect window so a reload reattaches to the same terminal.
2. **Voice agent.** Hands-free questions with editable wake and stop words. It reads the knowledge base first, then the source repos (files plus `git log`, `status`, `diff` and friends), and can search the web. It has no tmux access and cannot write anything.
3. **Ports.** Listening ports with their processes, on Linux (`ss`, `/proc`) and macOS (`lsof`, `ps`), with fingerprints that match across both so saved port names survive a move.
4. **Repos.** Every git checkout with branch, ahead and behind, uncommitted and untracked counts. It never fetches, so a page load never waits on the network; other machines' repos appear only if peers are configured.
5. **Files.** A browser for the home directory with upload, download, rename, in-place viewing of text, images, video, audio and PDFs, and favourites. Paths are resolved against the root, so symlinks cannot escape it.
6. **System.** CPU, memory, pressure stall information, network, disk and top processes from `/proc` with no dependencies. The sampler ticks once a second only while someone is watching (about 0.75% of a core) and stops 15 seconds after the last viewer leaves. On macOS it falls back to `vm_stat`, `sysctl`, `netstat` and `ps`, and reports what the platform cannot answer rather than inventing it.

## 3. Claude Code session inventory

The gateway reads Claude Code's own session files and transcripts to list live and recent sessions with their titles and last prompts, at no token cost, and can extract the last few exchanges of a session as compact text (about 6 KB from a 6 MB transcript). The voice agent uses this to answer "where was I" and "continue on X". The agent's own headless runs are filed under a separate working directory so they never show up as the user's sessions.

## 4. Security model

- **Tailnet only.** Served over Tailscale HTTPS certificates on the private network, never on the public internet.
- **Read-only where it matters.** The voice agent and repo view cannot modify anything; the file view is confined to one root.

## 5. Stack

| Component | Technology |
|---|---|
| **Supervisor** | Node.js, systemd user service |
| **Terminal** | xterm.js, node-pty, tmux, WebSockets |
| **Live data** | Server-Sent Events, `/proc`, macOS command-line fallbacks |
| **Network** | Tailscale HTTPS |
