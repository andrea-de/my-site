---
slug: tools/agentic-gateway
title: "Agentic Gateway & term-web: Multi-Service HTTPS Supervisor"
category: tools
description: Production process supervisor and unified HTTPS gateway on Tailscale serving terminal, voice agent, open ports, repos, and system diagnostics.
tags: [tools, agentic-gateway, nodejs, pty, websockets, tailscale, devops, voice-agent]
featured: true
updated: 2026-09-11
---

# Agentic Gateway & term-web: Multi-Service HTTPS Supervisor

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🛠️ Active Production (Live on nur) |
> | **What It Is** | Hardened Node.js process supervisor and unified HTTPS gateway (`term-web`) serving dev services securely over Tailscale. |
> | **Core Problem & Solution** | Managing multiple remote developer services and web terminals across SSH is brittle on mobile devices. Agentic Gateway consolidates 6 essential engineering surfaces into one authenticated HTTPS document with instant auto-restart. |
> | **Tech Stack** | Node.js, `node-pty`, WebSockets, Tailscale HTTPS, PTY, Linux tmux |
> | **Key Highlights** | Consolidated single-port interface: web terminal, voice agent (`/voice`), open port inspector, git repo inventory, file browser, and system metrics. |

The **Agentic Gateway** is a production infrastructure supervisor and remote engineering hub operating on the micro VM `nur`. Managed under `supervise.js`, it coordinates multiple persistent background runtimes, exposing a single secure HTTPS portal (`term-web`) over private Tailscale mesh networks.

---

## 1. Process Supervision Architecture (`supervise.js`)

Remote developer environments require robust self-healing orchestration without the bloat of heavyweight cluster schedulers:

```
                  ┌─────────────────────────────────────────┐
                  │              supervise.js               │
                  │  (Process Supervisor, Health & Auto-2s) │
                  └────────────────────┬────────────────────┘
                                       │
     ┌──────────────────┬──────────────┴─────┬──────────────────┐
     ▼                  ▼                    ▼                  ▼
┌─────────┐       ┌───────────┐        ┌───────────┐      ┌───────────┐
│ status  │       │  agy-web  │        │ codex-web │      │ term-web  │
│  :4030  │       │   :4031   │        │   :4032   │      │ :4034 (🔒)│
└─────────┘       └───────────┘        └───────────┘      └───────────┘
```

- **Zero-Downtime Auto-Restart**: Monitors child processes and automatically re-spawns failed services within 2 seconds.
- **Unified Log Aggregation**: Centralizes logs into individual service buffers and outputs structured JSON state to `status.json`.

---

## 2. `term-web`: The Six-in-One Engineering Surface

Rather than requiring distinct web ports for different utilities, `term-web` provides a tabbed, single-document workstation:

1. **Terminal (`/`)**: Full-fidelity browser terminal powered by `xterm.js` and `node-pty`, connecting directly to tmux sessions with mobile input assists.
2. **Hands-Free Voice Agent (`/voice`)**: Real-time voice interface allowing hands-free architectural querying of local git repositories.
3. **Ports Inspector (`/ports`)**: Live inspection of listening TCP ports, active process bindings, and container mappings.
4. **Repo Inventory (`/repos`)**: Real-time git status, branch tracking, and uncommitted diff counts across all local workspaces.
5. **File Explorer (`/files`)**: Low-latency directory browsing and file viewing with syntax highlighting.
6. **Device Diagnostics (`/system`)**: Real-time CPU, RAM, disk I/O, and load metrics.

---

## 3. Zero-Exposure Tailscale Security Model

- **Private Mesh Access**: Binds strictly to Tailscale virtual IP interfaces with local TLS certificates, ensuring zero exposure to the public internet.
- **Mobile Ergonomics**: Custom touch macros for `Esc`, `Tab`, `Ctrl-C`, `Ctrl-D`, and arrow keys make terminal operations seamless from smartphones.

---

## 4. Technical Stack Summary

| Component | Technology |
|---|---|
| **Supervisor Runtime** | Node.js, `node-pty`, `ws` |
| **Terminal Frontend** | xterm.js, Canvas renderer |
| **Network & Security** | Tailscale WireGuard mesh, Local TLS |
