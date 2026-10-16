---
slug: tech/testing
title: "Testing and Automation"
short: "Testing"
category: tech
description: Test automation from Giesecke+Devrient's Cucumber and Selenium BDD frameworks and Mesa Cloud's anonymised production-parity test data to the Advection estate's Playwright, Vitest, Robolectric and headless Godot suites, which double as the harnesses agents verify their work in.
tags: [test-automation, playwright, robolectric, vitest, verification]
featured: false
updated: 2026-10-16
---

# Testing and Automation

> [!NOTE]
> ### Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Used** | 2018 to present |
> | **Roles** | [Giesecke+Devrient](/tree/roles/gandd), [Mesa Cloud](/tree/roles/mesa-cloud) |
> | **Projects** | [Cruffled](/tree/products/cruffled), [Square Swaps](/tree/products/square-swaps), [Commonts](/tree/prototypes/commonts), [Tackry](/tree/products/tackry), [Tales Unwritten](/tree/prototypes/tales-unwritten) |
> | **Stack** | Cucumber, Selenium, Playwright, Vitest, Jest, JUnit, Robolectric, Roborazzi, Godot headless |

---

## Where Andrea used it

- **[Giesecke+Devrient](/tree/roles/gandd) (2018 to 2020).** Custom BDD frameworks on Cucumber and Selenium with proprietary registry and reporting integrations, run in CI/CD.
- **[Mesa Cloud](/tree/roles/mesa-cloud) (2022 to 2023).** Data anonymisation pipelines that capture real production edge cases for continuous integration.
- **Browser suites.** [Cruffled](/tree/products/cruffled) runs a deterministic Playwright suite of 62 tests across phone and iPad layouts plus Vitest on the engine; [Commonts](/tree/prototypes/commonts) has about 300 shared, API, vendor-client and Playwright tests; [Tales Unwritten](/tree/prototypes/tales-unwritten) runs Vitest and Playwright on phone and desktop viewports.
- **Engines and the JVM.** [Square Swaps](/tree/products/square-swaps) runs around 310 headless Godot tests, including a scripted playthrough of the tutorial; [Tackry](/tree/products/tackry) uses JUnit, Robolectric and Roborazzi screenshot tests.
- **Tests as harnesses.** The same tools let agents run and verify what they built, and later render store media. See [development harnesses](/tree/tools/agentic-development-harnesses) and [full-lifecycle pipelines](/tree/architecture/full-lifecycle-pipelines).

## Notable decisions

- **Determinism as a test strategy (Square Swaps).** A seeded simulation makes replays reproducible, so recorded inputs back regression tests and bug reports.
- **Test the policy, not just the code.** AudioTales tests its Firestore rules that forbid client writes to balances, and Commonts runs its seed content through the civility check, because the first seed filed insults as abuse reports and contradicted the design.
