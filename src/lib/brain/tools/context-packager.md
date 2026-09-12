---
slug: tools/context-packager
title: "Configurable Source Context Packager: Pre-Agentic Code Ingestion"
category: tools
description: High-speed CLI utility for AST-aware, token-budgeted codebase serialization, packing entire multi-file repositories for large-context LLM reasoning.
tags: [tools, context-bundler, ast, llm-tooling, token-budget, code-ingestion, pre-agentic]
featured: true
updated: 2026-09-11
---

# Configurable Source Context Packager: Pre-Agentic Code Ingestion

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🛠️ Foundation Tooling (Pre-Agentic LLM Era) |
> | **What It Is** | Configurable CLI utility that serializes complete multi-file repositories into token-optimized, structured single documents for large-context LLMs. |
> | **Core Problem & Solution** | Early 1M/2M context models (Claude 3, Gemini 1.5) lacked native multi-file editing harnesses. This packager uses AST awareness, `.packignore` rules, and token budgeting to feed coherent codebases to models without clutter. |
> | **Tech Stack** | Node.js, Bash, AST Tree Parsers, Tokenizer Estimators |
> | **Key Highlights** | Prioritizes type declarations & schemas over large implementation bodies, automated secret scrubbing, attention-optimized formatting. |

Before official agentic harnesses (such as the Model Context Protocol, IDE agent sidecars, or CLI tool loops) were released by research labs, Andrea engineered custom **source code context packagers** to unlock deep, repository-wide reasoning from large-context LLMs.

---

## 1. The Token Budgeting & Priority Engine

Dumping entire repositories verbatim into an LLM degrades reasoning quality and exhausts token limits. The packager introduced an **intelligent priority matrix**:

```
[ Source Code Repository ]
           │
           ▼
[ .packignore & Security Scrub ] ──► ( Strips secrets, .env, build output, binary blobs )
           │
           ▼
[ Tier 1: Directory Tree & Types ] ──► ( Always Included: Folder structure, index.d.ts, schemas )
           │
           ▼
[ Tier 2: Public Interfaces & APIs ] ──► ( Always Included: Exported signatures, routers, routes )
           │
           ▼
[ Tier 3: Core Business Logic ] ────► ( Budget Permitting: Algorithm files, state stores )
           │
           ▼
[ Tier 4: Implementation Details ] ──► ( Stripped/Stubbed if Token Limit Exceeded )
```

- **AST-Aware Signature Trimming**: When token budgets were constrained, the tool stripped internal function bodies, preserving type signatures and JSDoc comments so the model retained structural understanding of the entire codebase.
- **Hierarchical Tree Generation**: Prefixed the bundle with a visual ASCII directory tree annotated with file sizes and purposes.

---

## 2. Secret Redaction & Leak Prevention

- **Automated Credential Scrubbing**: Applied strict regex gates to strip API keys, OAuth tokens, private IP addresses, and private machine hostnames before emitting the bundle.
- **Binary Exclusion**: Automatically blocked images, compiled bytecode, database files, and minified vendor bundles.

---

## 3. Attention-Optimized Formatting

- **Fenced Code Blocks with Relative Paths**: Structured file blocks with exact relative file paths and line number markers, allowing models to cite exact file locations in their generated patches.
- **Standardized Prompt Envelopes**: Framed the codebase with clear instruction preambles that instructed models on expected diff formats and coding standards.
