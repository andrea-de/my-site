---
slug: tech/postgresql
title: "PostgreSQL and SQL"
short: "PostgreSQL"
category: tech
description: PostgreSQL from Mesa Cloud's student-data ETL over millions of records to the estate's server-side prototypes: Commonts and Found Teams on Drizzle, Foundry's research store, and pgvector duplicate checks in Two Truths and matching seams in Found Teams.
tags: [postgresql, sql, pgvector, drizzle, supabase]
featured: false
updated: 2026-10-16
---

# PostgreSQL and SQL

> [!NOTE]
> ### Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Used** | 2022 to present |
> | **Roles** | [Mesa Cloud](/tree/roles/mesa-cloud) |
> | **Projects** | [Commonts](/tree/prototypes/commonts), [Found Teams](/tree/prototypes/found-teams), [Autonomic Alpha Foundry](/tree/prototypes/foundry), [Two Truths & the Lie](/tree/prototypes/two-truths) |
> | **Around it** | Drizzle ORM, pgvector, Supabase (row level security, Edge Functions), Neon, PostgreSQL 16 |

---

## Where Andrea used it

- **[Mesa Cloud](/tree/roles/mesa-cloud) (2022 to 2023).** ETL microservices on PostgreSQL processing millions of student records; long-running monolithic SQL workflows broken into units for asynchronous workers. See [data pipelines](/tree/tech/data).
- **[Commonts](/tree/prototypes/commonts).** PostgreSQL 16 with Drizzle ORM behind a TypeScript API and worker on Cloud Run.
- **[Found Teams](/tree/prototypes/found-teams).** PostgreSQL with pgvector on Neon as the single permanent data layer; everything that happens is recorded as an append-only event, which drives activity feeds and notifications.
- **[Autonomic Alpha Foundry](/tree/prototypes/foundry).** PostgreSQL 16 holds the research state across 17 application-owned tables, including a model registry with staging, deployed and archived statuses.
- **[Two Truths & the Lie](/tree/prototypes/two-truths).** Supabase PostgreSQL with row level security; a PostgreSQL function runs a pgvector cosine-similarity search over live and pending statements to catch near-duplicates.

## Notable decisions

- **Similarity in the database (Two Truths).** The duplicate check runs where the statements live, against both live and pending rows, rather than in application code.
- **Servers only where they must be.** The mobile apps keep data on the device in SQLite instead; see [local-first mobile systems](/tree/architecture/local-first-mobile-systems).
