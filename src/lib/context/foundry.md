# Autonomic Alpha Foundry: Project Overview

The Autonomic Alpha Foundry is a proof-of-concept (POC) for a conversational platform designed to manage the lifecycle of predictive trading models. It utilizes a multi-agent architecture to coordinate data acquisition, model training, performance evaluation, and real-time inference through a unified chat interface.

## System Architecture

The system is organized into four primary layers:

1.  **Multi-Agent Orchestration:** Built using the Microsoft Agent Framework, the system employs specialized agents (Manager, Strategy, Data, Training, Optimization, and Evaluation) that communicate via an Agent-to-Agent (A2A) protocol.
2.  **Tool Integration (MCP):** Real-world operations are abstracted into Model Context Protocol (MCP) servers. This allows agents to interact with data fetchers, training orchestrators, and backtesting engines through a standardized interface.
3.  **Persistence Layer:** A PostgreSQL database manages structured data (9+ tables) including training proposals, model metadata, and backtest results. Unstructured artifacts (datasets and model weights) are stored in a file-based repository with managed TTL.
4.  **Reactive UI:** A SvelteKit-based frontend connects to the backend via WebSockets. It implements a custom AG-UI protocol to render interactive widgets, such as approval gates, live progress bars, and SVG-based equity charts.

## Implemented Features

### Conversational Workflow
- **Intent Detection:** A routing layer (Manager V3) classifies user input and directs it to the appropriate specialist agent.
- **Human-in-the-Loop:** Interactive approval widgets require user confirmation before executing resource-intensive tasks like data fetching or model training.
- **Context Tracking:** Agents maintain session-specific history and track mentioned artifacts (e.g., "this model") to resolve references in multi-turn dialogues.

### Model Lifecycle Management
- **Data Engineering:** Support for fetching wide-format datasets containing multiple correlated symbols. The system generates mock technical indicators, rolling correlations, and sector-level aggregates.
- **Hyperparameter Optimization:** A functional optimization agent coordinates multiple training trials (grid or random search) and tracks the performance of different configurations.
- **Backtesting:** An evaluation engine calculates industry-standard metrics, including Sharpe Ratio, Max Drawdown, and Win Rate, generating equity curves for historical validation.
- **Inference:** Deployed models can generate real-time prediction streams, which are broadcast via WebSockets to the UI for live observation.

### Artifact Management
- **Model Navigator:** A dedicated UI panel for browsing, deploying, archiving, and deleting datasets and model versions.
- **REST API:** A FastAPI-based service provides endpoints for CRUD operations on models, datasets, and backtest runs.

## Agent Roles and Responsibilities

The system distributes specialized tasks across several autonomous agents:

| Agent | Primary Responsibility | Key Actions |
|-------|------------------------|-------------|
| **Manager (V3)** | Interaction Gateway | Detects user intent, routes to specialists, and manages conversation persistence. |
| **Strategy Advisor** | Workflow Coordination | Brainstorms model architectures, explains technical approaches, and manages the end-to-end training pipeline. |
| **Data Specialist** | Information Retrieval | Manages multi-symbol data fetches, implements caching with 7-day TTL, and handles wide-format CSV generation. |
| **ML Specialist** | Model Training | Executes training scripts, tracks epoch-by-epoch metrics, and manages the model artifact registry (weights/configs). |
| **Optimization Specialist**| Hyperparameter Tuning | Orchestrates multi-trial optimization runs (grid/random search) and identifies the highest-performing configurations. |
| **Evaluation Specialist** | Performance Validation | Executes backtests on historical data and calculates risk/reward metrics (Sharpe, Drawdown). |
| **Inference Specialist** | Prediction Generation | Generates real-time predictions from deployed models and streams them via WebSockets. |

## Data Model and Core Entities

The system's state is persisted across 9+ relational tables in PostgreSQL, organized around these core entities:

- **`data_fetches`**: Records of historical data retrieval, including symbol lists, timeframes, and file paths to cached artifacts.
- **`training_proposals`**: High-level plans for model development, including architecture choices and target objectives.
- **`models`**: The central registry for trained artifacts, tracking their lifecycle status (`staging`, `deployed`, `archived`) and performance metadata.
- **`training_runs` & `training_metrics`**: Detailed logs of every training execution, capturing time-series metrics like loss and accuracy per epoch.
- **`optimization_runs` & `trials`**: Records of hyperparameter search experiments, storing search spaces, trial configurations, and objective scores.
- **`backtest_runs`**: Historical performance results, including equity curves (stored as JSONB), trade logs, and aggregate risk metrics.
- **`prediction_runs`**: Active or historical sessions of forward-looking model predictions.

## Key Technical Decisions

- **Envelope Messaging Pattern:** All WebSocket communication follows a structured envelope pattern. This ensures that the frontend can deterministically route system messages, agent dialogue, and UI-specific events (like chart updates) without ambiguous parsing.
- **Protocol-Driven UI (AG-UI):** The backend drives the frontend state through a custom event protocol. This allows agents to "summon" specific interactive widgets (like approval gates or progress bars) into the chat stream as needed, keeping the UI strictly synchronized with the agent's internal state.
- **Modular Tooling (MCP):** By utilizing the Model Context Protocol, the platform remains agnostic to specific data providers or training frameworks. Replacing mock data with live market feeds only requires swapping an MCP server, leaving the core agent logic untouched.
- **Asynchronous Execution:** Long-running tasks like model training and backtesting are handled as asynchronous background processes, allowing the conversational interface to remain responsive while operations continue in the background.

## The User Experience

The platform is designed to be highly interactive, moving beyond simple text-in/text-out patterns:

- **Reactive Widgets:** When a Data Agent begins a fetch, a dedicated `DataFetchWidget` appears with a live loading state. Similarly, training trials appear as a real-time table of metrics that updates as each configuration is evaluated.
- **Approval Gates:** The system stops and waits for human confirmation before performing critical actions. These gates are rendered as green/red interactive buttons directly in the conversation history.
- **Dynamic Charting:** Backtest results are not just text summaries; they include SVG-rendered equity curves and color-coded performance indicators that provide immediate visual feedback on a model's viability.

## Technical Stack

| Component | Technology |
|-----------|------------|
| Agent Framework | Microsoft Agent Framework |
| LLM Integration | OpenAI (GPT-4o-mini) |
| Tool Protocol | Model Context Protocol (MCP) |
| Backend API | FastAPI (Python) |
| Frontend | SvelteKit / Tailwind CSS |
| Database | PostgreSQL 16 |
| Containerization | Docker / Docker Compose |
