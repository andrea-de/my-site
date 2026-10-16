---
slug: architecture/local-first-mobile-systems
title: "Local-First Mobile Systems: The Device Owns the Data"
short: "Local-First"
category: architecture
description: How the estate's mobile apps keep data on the device and use servers only where they must, with the concrete choices in Tackry, Section Launcher, Cruffled, Square Swaps, Weatherie and AudioTales.
tags: [architecture, mobile, android, kotlin, flutter, local-first, sqlite, room, offline]
featured: true
updated: 2026-10-16
---

# Local-First Mobile Systems: The Device Owns the Data

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Default for every mobile app in the estate. |
> | **What It Is** | A design rule: the app works fully offline from local storage, and a server is added only for what cannot live on the device (purchases, shared catalogues, AI work). |
> | **Core Problem & Solution** | Apps that need the network to open lose data, drain batteries and collect what they do not need. Keeping state local makes them fast and private, and keeps store privacy declarations short and true. |
> | **Tech Stack** | Room (SQLite), SharedPreferences, AsyncStorage, Expo SQLite, StoreKit 2, Play Billing, RevenueCat |
> | **Key Highlights** | Tackry's no-cloud data model, purchases restored from the store rather than an account, device-local daily state in Weatherie, offline audio copies in AudioTales. |

---

## 1. Where the data lives

| App | Local | Server, and why |
|---|---|---|
| [Tackry](/tree/products/tackry) | Everything: tacks, reminders, list items, attachments in Room; file backup and restore | None. The only network call is one dismissible house-ad card |
| [Section Launcher](/tree/products/section-launcher) | Sections, layout and settings | None beyond the weather header and a house-ad card |
| [Cruffled](/tree/products/cruffled) | Progress, statistics, created puzzles, rewarded unlocks | Store purchases through RevenueCat, the durable and restorable layer |
| [Square Swaps](/tree/products/square-swaps) | Save data and entitlements as reported by the store SDK | None: no backend at all, by decision |
| [Weatherie](/tree/products/weatherie) | Installed themes, tile order, the day's chosen scene per condition | Theme catalogue and credits, which must be shared and tamper-proof |
| [AudioTales](/tree/prototypes/audio-tales) | Offline copies of played books (size-capped cache) | OCR and narration, credits and the library, because the AI work runs server-side |

## 2. Patterns

- **Identity that survives the device.** Rows that may ever leave the device carry a UUID, not just an autoincrement id, and an honest `updatedAt` (Tackry).
- **Additive migrations.** Normalised tables are added beside denormalised read caches written in the same transaction, so the UI keeps its queries and no data-loss case exists.
- **Refuse what you cannot read.** Backups record their schema version, and a newer backup is refused before any file is touched.
- **Purchases from the store, not an account.** Entitlements restore from the store SDK at launch (Square Swaps), or through RevenueCat (Cruffled, Weatherie); Android purchases are acknowledged immediately, because Google refunds unacknowledged ones after three days.
- **Daily state persisted, not recomputed.** Weatherie stores which pool variant each slot shows today, so the art is stable across relaunches, the widget and the share card, and rotates once per local day.
- **Anonymous accounts that come back.** Where a server account is unavoidable (AudioTales), it is anonymous, rides on the phone's own backup, and is reopened on reinstall by a device credential the server keeps only as a keyed hash.
- **Keep licence checks out of offline apps.** Play's injected integrity check fails behind a VPN or on flaky networks and blocks the app; it stays off.
