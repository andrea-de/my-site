---
slug: prototypes/foundry
title: "Autonomic Alpha Foundry: Agentic Quantitative Research Platform"
category: prototypes
description: Quantitative research platform where an autonomous agent occupies the research seat, testing trading hypotheses under family-wide error control, MCP tooling, and WebSocket AG-UI.
tags: [foundry, quant, multi-agent, mcp, python, fastapi, postgresql, sveltekit, websockets, finance]
featured: true
updated: 2026-09-11
---

# Autonomic Alpha Foundry: Agentic Quantitative Research Platform

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🧪 Functional Prototype & Research Engine (Active on nur) |
> | **What It Is** | Quantitative research platform where the research seat is occupied by an autonomous agent that forms hypotheses, acquires data, runs studies, and delivers trustworthy verdicts. |
> | **Core Problem & Solution** | Quantitative strategies routinely overfit historical noise. Foundry enforces family-wide error control (Bonferroni / Holm corrections), measures selection cost via 252-day embargoes, and *refuses* lookahead-polluted evidence rather than scoring it badly. |
> | **Tech Stack** | Python, Microsoft Agent Framework, FastAPI, PostgreSQL 16, Model Context Protocol (MCP), SvelteKit, WebSockets |
> | **Key Highlights** | Family-wide error control across all historical tests, 7 specialized collaborating agents, AG-UI live approval gates. |

**Autonomic Alpha Foundry** is a quantitative research platform where the research seat is occupied by an autonomous agent. Its primary product is **trustworthy verdicts, not profitable ones** — an honest negative result proves the statistical governance system is working.

---

## 1. Core Statistical Philosophy: Honest Verdicts & Error Control

Modern algorithmic trading platforms frequently fail because multiple testing generates false discoveries. Foundry incorporates rigorous mathematical safeguards directly into the agent's decision loop:

### Refusing Evidence Rather Than Scoring Badly
If two trading strategies exhibit identical return curves and t-statistics, but one strategy reads a corporate fundamental figure that did not exist on the day of the trade, Foundry **refuses the evidence outright**. Scoring corrupted evidence "badly" would imply the system could be trusted with approvals; refusal is the only scientifically valid response.

### Measuring the Cost of Selection
Foundry splits data into folds separated by a strict **252-day temporal embargo** between selection and evaluation. In validation studies, signals with apparent in-sample t-statistics of +2.22 collapsed to -1.28 out-of-sample:
```
Mean in-sample t:       +0.94
Mean out-of-sample t:   +0.00
Cost of selection:      +0.94 t
```
The system openly surfaces how much of an apparent edge is merely the statistical cost of picking the winner.

### Family-Wide Error Control (FWER)
As the autonomous agent registers hypotheses, the required statistical threshold rises automatically. While a single hypothesis requires a t-statistic of $1.96$ ($p < 0.05$), registering multiple candidate studies raises the hurdle to $2.236$ and beyond under Holm-Bonferroni correction.

---

## 2. Multi-Agent Orchestration Architecture

Built on top of the **Microsoft Agent Framework**, the platform coordinates seven specialized agents over an Agent-to-Agent (A2A) protocol:

```
                  ┌─────────────────────────────────┐
                  │      Manager Agent (V3)         │
                  │ (Intent Routing & Conversation) │
                  └───────────────┬─────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Strategy Advisor │    │  Data Specialist │    │  ML Specialist   │
│ (Pipeline Coord) │    │ (Wide CSV / TTL) │    │ (Training Runs)  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Optimization   │    │    Evaluation    │    │    Inference     │
│ (Hyperparameter) │    │(Sharpe/Drawdown) │    │(Live Prediction) │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

| Agent | Core Responsibility | Key Operations |
| :--- | :--- | :--- |
| **Manager (V3)** | Interaction Gateway | Intent classification, user routing, session persistence. |
| **Strategy Advisor** | Workflow Coordination | Formulates training proposals and oversees end-to-end pipelines. |
| **Data Specialist** | Information Retrieval | Fetches multi-symbol datasets, calculates rolling correlations, manages 7-day TTL caching. |
| **ML Specialist** | Model Training | Orchestrates training runs, tracks loss/accuracy epochs, manages weight registry. |
| **Optimization** | Hyperparameter Search | Runs grid and random search trials to discover optimal architectures. |
| **Evaluation** | Risk & Performance | Calculates Sharpe ratio, Max Drawdown, win rate, and plots equity curves. |
| **Inference** | Prediction Generation | Generates forward-looking predictions and streams them over WebSockets. |

---

## 3. Tool Integration via Model Context Protocol (MCP)

Operations are cleanly decoupled through **MCP servers**:
- Data fetchers, execution simulators, and model registries operate as standard MCP tools.
- Replacing synthetic data feeds with live institutional market feeds requires swapping an MCP server with zero changes to the multi-agent reasoning logic.

---

## 4. AG-UI Real-Time Streaming & Approval Envelopes

The frontend connects via WebSockets using a custom **AG-UI protocol**:
- **Structured Envelopes**: Every message adheres to an immutable JSON envelope schema (`event_type`, `correlation_id`, `agent_name`, `payload`).
- **Human-in-the-Loop Approval Gates**: When an agent attempts an expensive compute action (e.g. 50-trial hyperparameter optimization), the UI dynamically summons an interactive approval gate widget into the chat stream.

---

## 5. Persistence & Relational Schema

State is maintained in **PostgreSQL 16** across 17 application-owned tables:
- `training_proposals`: High-level architectural specifications.
- `models`: Central registry tracking statuses (`staging`, `deployed`, `archived`).
- `backtests` & `trade_logs`: Equity curves stored as indexed JSONB.
- `training_metrics`: Time-series loss and validation telemetry.

---

## 6. Technical Stack Summary

| Component | Technology |
|---|---|
| **Agent Orchestration** | Microsoft Agent Framework, Python |
| **Tool Protocol** | Model Context Protocol (MCP) |
| **Backend Services** | FastAPI, Celery, Redis, WebSockets |
| **Database** | PostgreSQL 16 (17 tables, JSONB curves) |
| **Frontend** | SvelteKit, Tailwind CSS, Canvas/SVG Charts |
