---
slug: tech/python
title: "Python"
short: "Python"
category: tech
description: Python across Andrea's whole software career, from containerised model services at AIA and a spatial transformation library at Intellisense to ETL microservices at Mesa Cloud, and later the Foundry research engine and the estate's release and asset scripts.
tags: [python, fastapi, django, pandas, numpy, etl]
featured: false
updated: 2026-10-16
---

# Python

> [!NOTE]
> ### Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Used** | 2018 to present |
> | **Roles** | [AIA](/tree/roles/aia), [Intellisense.io](/tree/roles/intellisense), [Mesa Cloud](/tree/roles/mesa-cloud) |
> | **Projects** | [Autonomic Alpha Foundry](/tree/prototypes/foundry), [Store Publishers](/tree/tools/store-publishers), [Weatherie](/tree/products/weatherie)'s theme forge, [Square Swaps](/tree/products/square-swaps) and [Section Launcher](/tree/products/section-launcher) release scripts |
> | **Libraries** | Django, FastAPI, NumPy, pandas, Plotly, Microsoft Agent Framework |

---

## Where Andrea used it

- **[AIA](/tree/roles/aia) (2018).** Containerised Python and Django services that orchestrate and deploy predictive model runs, with NumPy and pandas logic mapping user configurations to model inputs.
- **[Intellisense.io](/tree/roles/intellisense) (2020 to 2022).** A Python library for volumetric composition transformations across disparate spatial models, with Plotly visualisations for inspecting the results.
- **[Mesa Cloud](/tree/roles/mesa-cloud) (2022 to 2023).** Configurable ETL microservices in Python and FastAPI on PostgreSQL over millions of student records; heavy rule evaluation moved from monolithic SQL into NumPy and pandas on asynchronous workers. See [data pipelines](/tree/tech/data).
- **[Autonomic Alpha Foundry](/tree/prototypes/foundry).** The research engine: Python with the Microsoft Agent Framework, FastAPI and PostgreSQL 16, with MCP tools, self-hosted as a Docker stack.
- **Release and asset scripts.** Python drives Play uploads for [Section Launcher](/tree/products/section-launcher), part of [Square Swaps](/tree/products/square-swaps)' pipeline, the [store publishers](/tree/tools/store-publishers) alongside Node.js, and [Weatherie](/tree/products/weatherie)'s "theme forge", which briefs an image model, sorts and crops results, flags artefacts and packs themes.

## Notable decisions

- **Configuration over code (Mesa Cloud).** District-specific behaviour is expressed as configuration rather than code, so one service serves every district.
- **Vectorise, then parallelise (Mesa Cloud).** Long-running SQL workflows were broken into units for asynchronous workers, with the rule evaluation in NumPy and pandas, so the work scales horizontally.
