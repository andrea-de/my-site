---
slug: roles/mesa-cloud
title: "Mesa Cloud: ETL Microservices for District Student Data"
short: "Mesa Cloud"
category: roles
description: Software Engineer (2022 to 2023) on student data processing, building configurable Python ETL microservices for millions of student records, parallelising monolithic workflows, and running AWS Elastic Beanstalk environments.
tags: [python, fastapi, postgresql, pandas, numpy, etl, microservices, aws, sql]
featured: false
updated: 2026-10-16
---

# Mesa Cloud: ETL Microservices for District Student Data

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Role & Tenure** | Software Engineer, Student Data Processing (2022 to 2023, 12 months), remote, Austin, TX |
> | **Company Focus** | Data infrastructure for K-12 school districts: student records, course completion and graduation tracking. |
> | **Core Mission** | Turn monolithic, slow student-data workflows into configurable services that scale horizontally. |
> | **Tech Stack** | Python, FastAPI, PostgreSQL, SQL, NumPy, pandas, AWS (Elastic Beanstalk) |
> | **Key Highlights** | Configurable ETL microservices over millions of student records; asynchronous workers for parallel processing; anonymised production data for realistic CI tests. |

---

## Work

- **High-volume ETL.** Architected configurable ETL microservices in Python and FastAPI on PostgreSQL that process millions of student records across school districts, with district-specific behaviour expressed as configuration rather than code.
- **Parallelising monolithic workflows.** Broke long-running monolithic SQL workflows into units processed by asynchronous workers, moving the heavy rule evaluation into NumPy and pandas so the work scales horizontally.
- **Cloud infrastructure.** Orchestrated scalable environments on AWS Elastic Beanstalk, including network policies.
- **Production-parity testing.** Built data anonymisation pipelines that capture real production edge cases for continuous integration, so tests exercise the cases that actually break without exposing student data.

## Technologies and related notes

- **Technologies:** [Python](/tree/tech/python), [PostgreSQL](/tree/tech/postgresql), [data pipelines and ETL](/tree/tech/data), [AWS](/tree/tech/containers), [testing](/tree/tech/testing).
- **Where it carried on:** the same Python, FastAPI and PostgreSQL stack runs the engine of [Autonomic Alpha Foundry](/tree/prototypes/foundry).
- **Career path:** after [Intellisense.io](/tree/roles/intellisense); next, [Advection Software](/tree/roles/advection).
