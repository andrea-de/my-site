---
slug: tools/the-brain
title: "The Brain: Cross-Machine Knowledge Base for Agents"
short: "Brain"
category: tools
description: Git-backed markdown knowledge base shared by every machine and agent session, with conventions that keep project state current; its public part is synced, leak-checked, into the site's knowledge tree and grounds the site's voice and chat agent.
tags: [tools, the-brain, knowledge-tree, git, markdown, context-engineering, leak-detection, agents]
featured: true
updated: 2026-10-16
---

# The Brain: Cross-Machine Knowledge Base for Agents

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | In daily use by every agent session on every development machine and the phone. |
> | **What It Is** | One git repository of markdown nodes: one per project or topic, an index in every directory, frontmatter on every node. Agents read it at the start of a session and update it as they change things. |
> | **Core Problem & Solution** | Project state and the reasons behind decisions scatter across machines, tools and expiring agent sessions. The brain is the one durable, cross-machine store, with rules that stop it from turning into a stale diary. |
> | **Tech Stack** | Git, Markdown with frontmatter, Node.js sync script, SvelteKit (public reader and graph) |
> | **Key Highlights** | Index-first traversal, state replaced versus knowledge accumulated, narrow commits for concurrent sessions, a leak-checked public subset that feeds the site. |

---

## 1. Conventions

- **Index first.** Start at the root `INDEX.md`, then a directory index, then the node. Never scan the whole tree; descriptions in the indexes are written so relevance can be judged without opening a node.
- **Current state first.** A node opens with what is true now, then decisions with their reasons, then open questions. Relative dates are converted to absolute ones.
- **State and knowledge are kept differently.** State (what is released, what is blocked) is replaced wholesale and dated, never appended to. Knowledge (decisions, traps that cost real time) accumulates and is edited only when it turns out to be wrong. History lives in git, not in the node.
- **Update in the same breath as the work.** An agent that ships, decides, discovers or abandons something updates the node then, not in a sweep at the end of a session.
- **Commit narrowly, push immediately.** Several agent sessions can share one working tree, so commits name their paths instead of sweeping up everything; an unpushed commit is knowledge no other machine has.
- **Do the work, do not hand it back.** If the tooling is available, the agent acts; only decisions, missing credentials or irreversible actions go to the owner.
- **Not a copy of the repos.** Anything derivable from code or commit history stays out; the brain holds intent, status, decisions and cross-project context.

## 2. The public subset

The `public/` directory is the portfolio part, written for recruiters, clients and agents. A sync script copies it into the portfolio site:

- **Leak gates.** The sync refuses any file containing private IP ranges, secret-style assignments (`KEY=`, `TOKEN=` and the like), references to private machine notes, links that climb into private directories, or credential file names.
- **Schema checks.** Every node needs a slug, title, category and a `short` label of at most twelve characters for the graph; the sync fails otherwise.
- **Manifest.** It precomputes a manifest (titles, descriptions, tags, headings, reading time) that the site uses without reading every file.

## 3. Where the public subset is used

- **Knowledge tree (`/tree`).** A reader with anchored headings and code blocks, a search-and-filter list, and a living graph: a hub, rings per category, one orbiting light per node, links along shared tags; tapping a node lights its connections and opens a card.
- **The site's agent.** The [voice and chat agent](/tree/products/portfolio-agent) answers from these nodes: live voice sessions get the whole tree in their instructions, and the text chat searches the index and reads nodes with tool calls.
