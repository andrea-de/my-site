---
slug: products/tackry
title: "Tackry: Offline Notes, Lists and Reminders for Android"
short: "Tackry"
category: products
description: Offline Android app for notes, lists, links, reminders and swiped-away notifications, with floating notes as bubbles; live on Google Play since 2026-10-11, in ten languages, with no cloud.
tags: [android, kotlin, jetpack-compose, room, sqlite, local-first, bubbles-api, notifications]
featured: true
updated: 2026-10-16
---

# Tackry: Offline Notes, Lists and Reminders for Android

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Live on Google Play since 2026-10-11 (version 1.3.4), full rollout in 178 countries and regions. Android 11+. No iOS version. |
> | **What It Is** | A place for anything worth keeping: notes, checklists, links, reminders, and notifications you swiped away. Each item is a "tack". |
> | **Core Problem & Solution** | A notification dismissed by accident is gone, and a quick note gets buried. Tackry keeps both on the device, brings them back when they matter, and can float a note over any app as a bubble. |
> | **Tech Stack** | Kotlin, Jetpack Compose, Room (SQLite), NotificationListenerService, Bubbles API, AlarmManager, Quick Settings tiles, widgets |
> | **Key Highlights** | Floating notes, snoozing another app's notification, a Today page, three themes, ten languages, 528 tests, a dogfooded daily-use app. |

---

## 1. What it does

- **Tacks.** Notes, lists, links, attachments and captured notifications share one model and one board, organised into Recent, Pinned and categories, with a Today page that fans pinned tacks out from a 3D stack.
- **Kept notifications.** With notification access, Tackry keeps what you swipe away, including the original app's actions where Android still allows them. Banking, authenticator and password apps are skipped by default (about 70 packages plus name matching), reversible from a list.
- **Snooze the original.** A `NotificationListenerService` can snooze another app's live notification, and the system re-posts it later. Measured on device: no cap on the duration, and an updated notification stays snoozed, which matters for messaging apps that keep one notification per chat.
- **Floating notes.** A pinned list or note can float over a recipe or a browser as an Android bubble and be edited there, with its own bubble icon.
- **Reminders.** Recurring reminders, snooze chains and rescheduling after reboot.
- **Around the system.** Home-screen widgets, Quick Settings tiles, a themed launcher icon that follows the app's Light, Dark or Midnight theme, and backup and restore to a file.

## 2. Data model

The Room schema was reworked before release, while changes were still free:

- **Stable identity.** Every tack carries a UUID alongside its row id, because an autoincrement id survives neither export and restore nor any future sync.
- **Reminders and list items are rows.** A tack can own several reminders, each with an occurrence history (fired, snoozed, completed, dismissed, rescheduled), so completing a reminder no longer deletes the tack behind it. List items are rows with their own checked state.
- **Caches, not rewrites.** The old columns were kept as denormalised read caches written in the same transaction, so the UI kept reading one row per tack and the migration stayed purely additive.
- **Safe restore.** Backups record their schema version; a newer backup is refused with a message before any file is touched.

## 3. Shipping it

- **Release pipeline.** A tag builds, signs and uploads to Play internal testing from a self-hosted Mac runner, and a promote workflow moves the tested build to production through the Play API. The first production release of a never-published app has to be a draft sent from the console; the script now falls back to that automatically.
- **Real bugs from real use.** Two reported "crashes" were the app closing: restore killed its own process before Android could relaunch it (fixed with a restart activity in its own process), and Android ending the app while a system file picker was open lost the waiting result (fixed by marking picker returns).
- **R8 and accessibility.** R8 shrank the bundle from 8.1 MB to 4.8 MB with keep rules for Room and the launcher aliases. A bounded accessibility pass added labels to icon-only controls, 48 dp targets and a contrast test across all three themes.
- **Store media without a device.** Screenshots come from Roborazzi tests and the promo video is rendered from the Compose UI on the JVM, with a Gemini TTS presenter. Listing text is in ten languages and everything is on the [press page](https://www.tackry.com/press/).
- **Honest ads disclosure.** The only ad is one dismissible card in Settings promoting the publisher's other apps. It sends no identifier and opts out of geo-targeting, and the Play data-safety form declares it anyway, because Google counts any server-fetched banner as an ad.

## 4. Stack

| Component | Technology |
|---|---|
| **App** | Kotlin, Jetpack Compose, Coroutines and Flow |
| **Persistence** | Room (SQLite), file backup and restore |
| **System hooks** | NotificationListenerService, Bubbles API, AlarmManager, widgets, Quick Settings tiles |
| **Testing** | JUnit, Robolectric, Roborazzi screenshot tests |
| **Release** | GitHub Actions (self-hosted), Google Play Developer API |
