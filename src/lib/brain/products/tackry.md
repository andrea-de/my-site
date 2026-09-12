---
slug: products/tackry
title: "Tackry: Local-First Android Hub & System Hooks"
category: products
description: Local-first Android information capture hub with Room SQLite persistence, PendingIntent preservation, and grouped Android Bubbles.
tags: [android, kotlin, jetpack-compose, room, sqlite, local-first, bubbles-api]
featured: true
updated: 2026-09-11
---

# Tackry: Local-First Android Hub & System Hooks

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 📦 Shipped & Local-First |
> | **What It Is** | Native Android productivity hub that bridges fleeting system notifications with durable, actionable task workspaces. |
> | **Core Problem & Solution** | Notifications are easily dismissed and lost. Tackry intercepts notifications, captures their underlying `PendingIntent` security tokens, and stores them in local Room SQLite, allowing users to relaunch the exact deep-link action days later. |
> | **Tech Stack** | Android SDK (Kotlin), Jetpack Compose, Room SQLite, Android NotificationListenerService, Bubbles API |
> | **Key Highlights** | Serialization and preservation of live Android `PendingIntent` objects, floating multi-window Bubbles integration. |

**Tackry** is a sophisticated, local-first Android application built for high-efficiency information capture and intelligent resurfacing. It addresses the "fleeting notification" problem by allowing users to bridge the gap between temporary system alerts and durable, actionable information. The project centers around a unified data model called the **"Tack."**

---

## 1. Unified Data Model ("The Tack") & SQLite Room Persistence

A "Tack" is an atomic unit of captured information that encapsulates disparate inputs into a single reactive entity:

- **Multi-Modal Ingestion**: Captures text snippets, copied URLs, screenshot attachments, and system notification payloads into a uniform Room schema.
- **Relational Tagging & Fast Full-Text Search**: Powered by SQLite FTS (Full-Text Search) tables, providing instantaneous sub-10ms query results across thousands of historical entries.
- **Strict Local-First Privacy**: Operates 100% offline with zero cloud server dependencies, guaranteeing user notifications and clipboards never leak off-device.

---

## 2. Preserving Live Android PendingIntent Tokens

The key technical breakthrough of Tackry is its deep integration with Android's IPC security model:

- **NotificationListenerService Interception**: Deeply hooks into Android's notification pipeline to capture rich metadata (sender, timestamp, category, action buttons).
- **PendingIntent Token Preservation**: Rather than merely capturing static notification text, Tackry extracts and preserves the origin application's `PendingIntent` tokens. A user can tap a captured notification days later, and Tackry executes the origin application's exact deep-link target (e.g., jumping straight to a specific message thread or banking alert).
- **Graceful Intent Expiry Handling**: Safely detects invalidated or revoked package intents, falling back to application package launching if the token has expired.

---

## 3. Android Bubbles API & Floating Multi-Window Workspace

- **Grouped Bubble Integration**: Implements Android's system Bubbles API, allowing active Tacks to float as unobtrusive overlay bubbles on top of other running applications.
- **Instant Capture Drawer**: A global accessibility gesture or quick-settings tile summons the Tackry capture drawer without interrupting the user's foreground task.

---

## 4. Technical Stack Summary

| Component | Technology |
|---|---|
| **Architecture** | Kotlin, MVVM, Jetpack Compose |
| **Persistence** | Android Room SQLite, SQLite FTS4 |
| **System Hooks** | NotificationListenerService, PendingIntent IPC, Android Bubbles API |
| **Reactive Pipelines** | Kotlin Coroutines & StateFlow |
