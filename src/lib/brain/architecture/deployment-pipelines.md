---
slug: architecture/deployment-pipelines
title: "Deployment Pipelines: Self-Hosted CI for Every Repository"
short: "Deploy Fleet"
category: architecture
description: CI that runs only on owned hardware, chiefly a self-hosted Mac runner that builds, signs and uploads iOS and Android releases; why GitHub-hosted runners never trigger automatically, and the release rules every app follows.
tags: [architecture, ci-cd, devops, github-actions, self-hosted, app-store-connect, google-play, release-engineering]
featured: false
updated: 2026-10-16
---

# Deployment Pipelines: Self-Hosted CI for Every Repository

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | The rule for every repository in the estate since August 2026. |
> | **What It Is** | GitHub Actions workflows that run on self-hosted machines: runners on a Mac, one registered per repository, build the iOS and Android releases, and local test scripts run before every push. |
> | **Core Problem & Solution** | With many private repositories on one account, GitHub-hosted minutes are a shared allowance; when it runs out, every repository's workflows stop starting, days after someone added one innocent workflow elsewhere. Owned runners have no such ceiling. |
> | **Tech Stack** | GitHub Actions (self-hosted runners), macOS, Xcode, Gradle, Godot export, Flutter, App Store Connect and Google Play APIs |
> | **Key Highlights** | No hosted runner triggers automatically in any repository; releases upload straight to the stores; nothing depends on GitHub artifact storage. |

---

## 1. The rules

- **Every job runs on `self-hosted`.** No `ubuntu-latest` or `macos-latest`; macOS minutes on GitHub's hardware also count ten times.
- **Nothing on GitHub's hardware runs by itself.** A hosted workflow, if one exists at all, is manual (`workflow_dispatch`). "The repository is public, so minutes are free" is not an exception.
- **Tests run locally** before pushing, through each repository's own check and test scripts.
- **Check `on:` before `runs-on:`** whenever a workflow is added or edited, and audit all repositories at once when in doubt.

## 2. Release pipelines

- **One pipeline per product**, each a pair of manual or tag-triggered workflows (`android-release`, `ios-release`) on the Mac runner: build, sign, verify the signature, upload to the Play internal track or TestFlight.
- **Version numbers from the store**, one past the highest it has seen, checked before the build starts.
- **No artifact handoffs.** A full GitHub storage quota once failed an upload step and took a Play release with it, so binaries go straight to the store and are deleted from the runner's workspace.
- **Promotion is separate.** Production releases promote the tested build through the store API; nothing is rebuilt for production. See [store publishers](/tree/tools/store-publishers).
- **Web and backends** deploy from a known-clean tree of the main branch, because a Firebase Hosting deploy replaces the whole site and two sessions deploying from different trees can drop each other's files.

## 3. Traps written down

- A release keystore has a different SHA-1 from the debug one, so Google sign-in that works in debug fails in release until both fingerprints are registered.
- Play's lint in a newer Android Gradle Plugin can be fatal where the old one was silent; a target-API bump is a release risk to run through CI early.
- A Godot export can spend its whole run polling for Android devices; replacing the polled tool with a stub took exports from 37 minutes to about 40 seconds.
