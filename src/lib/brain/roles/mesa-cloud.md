---
slug: roles/mesa-cloud
title: "Mesa Cloud: Monolith to Microservices & District-Scale Data Pipelines"
category: roles
description: Senior Software Engineer work migrating legacy monolithic SQL flagging engines into Python/Pandas microservices with distributed batching on AWS.
tags: [python, pandas, etl, microservices, aws, postgresql, distributed-systems]
featured: true
updated: 2026-09-11
---

# Mesa Cloud: Monolith to Microservices & District-Scale Data Pipelines

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Role & Tenure** | Senior Software Engineer (2022 – 2023 · 12 months) |
> | **Company Focus** | District-scale K-12 education data infrastructure, graduation tracking, student record audit engines. |
> | **Core Mission** | Decompose a monolithic, slow-running SQL stored procedure engine into horizontally scalable Python/FastAPI microservices. |
> | **Tech Stack** | Python, FastAPI, PostgreSQL, Pandas, NumPy, AWS (Elastic Beanstalk, SQS, RDS, S3) |
> | **Key Highlights** | 10x throughput improvement on nightly ETL runs, zero data regressions across millions of historical student records, production-parity test harness. |

At **Mesa Cloud**, Andrea served as a Senior Software Engineer responsible for core data infrastructure engineering, modernizing the distributed pipelines that audit course completion records and graduation tracks for hundreds of thousands of students across major US school districts.

---

## 1. High-Volume ETL Microservices

- **Monolith Decomposition**: Decomposed a legacy monolithic database running hours-long SQL stored procedures into modular, configurable Python/FastAPI microservices.
- **Vectorized Data Processing**: Refactored complex prerequisite checking and graduation audit rules into **NumPy** and **Pandas** vectorized operations, cutting execution times from hours to minutes.
- **District Ingestion Gateways**: Engineered adaptable data ingestion layers capable of normalizing disparate, malformed student information system (SIS) exports into unified relational schemas.

---

## 2. Horizontal Scaling & Distributed Workflows

- **Asynchronous Task Workers**: Decoupled student record evaluation using message-driven worker pools (AWS SQS), distributing processing jobs across dynamic worker clusters.
- **AWS Infrastructure Orchestration**: Managed cloud infrastructure deployments via AWS Elastic Beanstalk, configuring automated scaling policies, VPC subnet isolation, and secure database peering.

---

## 3. Production-Parity Testing & Anonymization

- **Data Anonymization Pipelines**: Built synthetic data generation and production data anonymization scripts that sanitized sensitive student FERPA data while preserving intricate rule-edge cases for continuous integration tests.
- **Regression Verification Suite**: Developed differential test suites comparing legacy SQL outputs against new microservice results across 5+ years of historical district records, guaranteeing zero statistical variance prior to production cutover.
