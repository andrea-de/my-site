---
slug: tech/android-kotlin
title: "Android and Kotlin"
short: "Android"
category: tech
description: Android from Giesecke+Devrient's biometric vehicle HMI prototypes shown at MWC 2019 to the Kotlin and Jetpack Compose apps Tackry and Section Launcher, both live on Google Play, with Room persistence and Robolectric-rendered store media.
tags: [android, kotlin, jetpack-compose, room, robolectric]
featured: false
updated: 2026-10-16
---

# Android and Kotlin

> [!NOTE]
> ### Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Used** | 2018 to 2020, and 2023 to present |
> | **Roles** | [Giesecke+Devrient](/tree/roles/gandd), [Advection Software](/tree/roles/advection) |
> | **Apps** | [Tackry](/tree/products/tackry) and [Section Launcher](/tree/products/section-launcher), both live on Google Play |
> | **Stack** | Kotlin, Jetpack Compose, Material 3, Coroutines and Flow, Room, Robolectric, Roborazzi |

---

## Where Andrea used it

- **[Giesecke+Devrient](/tree/roles/gandd) (2018 to 2020).** Led development of Android vehicle HMI prototypes for biometric authentication, showcased at Mobile World Congress 2019, on top of a co-developed [Java](/tree/tech/java-spring) hardware-integration library.
- **[Section Launcher](/tree/products/section-launcher).** A Compose home-screen launcher with user-defined sections and a Gaussian wave scroller; the estate's reference Play release pipeline.
- **[Tackry](/tree/products/tackry).** Offline notes, lists, reminders and kept notifications, live on Google Play since 2026-10-11, using `NotificationListenerService`, the Bubbles API, AlarmManager, widgets and Quick Settings tiles over a Room database.
- **Store media on the JVM.** Both apps render their real Compose screens under Robolectric with no device, for screenshots and narrated promo videos. See [media harnesses](/tree/tools/media-harnesses) and [local-first mobile systems](/tree/architecture/local-first-mobile-systems).

## Notable decisions

- **Stable identity before release (Tackry).** Every row carries a UUID beside its autoincrement id, because the id survives neither export and restore nor any future sync; the schema rework stayed purely additive.
- **Promote, do not rebuild (Section Launcher).** The tested internal-track build is promoted to production by version code through the Play API, so what ships is byte-identical to what was tested.
- **Never Play's Automatic Integrity Protection (Section Launcher).** Its injected licence check can time out on flaky connectivity and show a blocking dialog, which on a launcher locks the user out of their phone.
