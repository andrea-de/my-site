---
slug: tech/google-cloud
title: "Google Cloud and Firebase"
short: "Google Cloud"
category: tech
description: Google Cloud as the Advection estate's backend platform: Cloud Run services for AudioTales, Weatherie, Commonts and Found Teams, Firebase and Firestore for accounts, data and hosting, and the move of the ad service and Weatherie backend off Cloudflare in 2026.
tags: [gcp, cloud-run, firebase, firestore]
featured: false
updated: 2026-10-16
---

# Google Cloud and Firebase

> [!NOTE]
> ### Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Used** | Advection era (2023 to present) |
> | **Role** | [Advection Software](/tree/roles/advection) |
> | **Cloud Run** | [AudioTales](/tree/products/audio-tales), [Weatherie](/tree/products/weatherie), [Commonts](/tree/prototypes/commonts), [Found Teams](/tree/prototypes/found-teams), the house-ad API |
> | **Firebase** | Auth, Firestore, Storage, Hosting, Crashlytics, Remote Config, Cloud Functions |

---

## Where Andrea used it

- **[AudioTales](/tree/products/audio-tales).** An Express backend on Cloud Run with anonymous Firebase Auth, Firestore, Cloud Storage and Crashlytics.
- **[Weatherie](/tree/products/weatherie).** A Cloud Run service with Cloud Storage for theme packages and Firestore for data; moved off Cloudflare in August 2026.
- **[GameTsunami](/tree/products/gametsunami).** Firebase App Hosting, Cloud Functions, Firestore and Storage.
- **[Cruffled](/tree/products/cruffled).** Firebase Analytics and Remote Config, which switch ad providers and quotas without a release.
- **Prototypes.** [Commonts](/tree/prototypes/commonts) (with a nightly Cloud Run reseed job) and [Found Teams](/tree/prototypes/found-teams) run as Cloud Run demos.
- **House ads.** A Next.js site on Firebase Hosting with API routes on Cloud Run and the catalogue in Firestore, moved off Cloudflare in September 2026. See [Advection Software](/tree/roles/advection).

## Notable decisions

- **Only the backend moves money (AudioTales).** Credits change only on the server, transactionally; client writes to balances are forbidden by Firestore rules, and the rules are tested.
- **Near the audience.** The ad service runs in US East, near its users, not near the developer.
- **Kill switches as data.** A house-ad creative is turned off in seconds by flipping `active` in Firestore, with no deploy.
