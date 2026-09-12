---
slug: tools/store-publishers
title: "Zero-Quota Store Deployment: Native Crypto Store Publishers"
category: tools
description: Dependency-free native Node.js crypto publishers (asc.mjs, play.mjs) that stream releases directly to Apple TestFlight and Google Play without CI quotas.
tags: [tools, ci-cd, app-store-connect, google-play, nodejs, crypto, fastlane, devops]
featured: true
updated: 2026-09-11
---

# Zero-Quota Store Deployment: Native Crypto Store Publishers

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🛠️ Active Production |
> | **What It Is** | Zero-dependency native Node.js command-line tools (`asc.mjs`, `play.mjs`) that authenticate and publish binaries directly to App Store Connect and Google Play. |
> | **Core Problem & Solution** | Commercial CI/CD platforms impose strict monthly minute quotas and lock developers into brittle SDK wrappers. These standalone scripts use native Node.js `node:crypto` to mint JWTs and upload binaries with zero runtime dependencies. |
> | **Tech Stack** | Node.js, `node:crypto`, `node:https`, App Store Connect API, Google Play Developer API |
> | **Key Highlights** | Zero npm dependencies, sub-second authentication, preflight binary integrity checks, bypasses vendor CI limits. |

To break free from third-party CI/CD quotas and bloated deployment dependencies, Andrea developed bespoke store publishing scripts implemented entirely in standard library Node.js.

---

## 1. `asc.mjs`: App Store Connect Native Publisher

- **Native Node.js JWT Minting**: Uses `node:crypto` to generate ES256 JSON Web Tokens with Apple's private `.p8` key without requiring heavy external JWT packages.
- **Asset Chunking & Direct Upload**: Directly interfaces with Apple's multi-part asset reservation and chunked upload endpoints, uploading IPAs and `.pkg` files with resume support.
- **TestFlight Distribution Gates**: Polls processing state and automatically attaches newly validated builds to specified internal test groups.

---

## 2. `play.mjs`: Google Play Developer API Publisher

- **Service Account Direct Auth**: Implements Google OAuth2 service account token exchange natively over HTTPS.
- **Atomic Edit Sessions**: Manages Google Play Console "Edits" API sessions—uploading Android App Bundles (`.aab`), updating release notes, assigning roll-out percentages, and committing atomically.

---

## 3. Preflight Binary Validation

- **Integrity Verification**: Inspects Mach-O signatures, entitlements, and Android `AndroidManifest.xml` attributes prior to upload, aborting immediately if version codes or bundle IDs conflict.
- **Local Fleet Execution**: Runs directly from self-hosted Apple Silicon and Linux machines, eliminating reliance on third-party SaaS build queues.
