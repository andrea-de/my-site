---
slug: products/weatherie
title: "Weatherie: Weather App with AI-Painted Themes and a Theme Store"
short: "Weatherie"
category: products
description: Flutter weather app whose every scene is art from an AI-generated theme; an eleven-theme store with credits, a Cloud Run backend, user-arranged tiles, house ads only; metadata-complete on both stores, awaiting review submission.
tags: [flutter, dart, generative-ai, theming, cloud-run, firestore, revenuecat, mobile, media-harness]
featured: true
updated: 2026-10-16
---

# Weatherie: Weather App with AI-Painted Themes and a Theme Store

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Pre-release. Builds in TestFlight and Play internal testing; both store listings complete, review submission pending. Site and press page at weatherie.com. |
> | **What It Is** | A weather app where the current conditions are shown as a painted scene from the active theme: art deco posters, stained glass, balloon animals, a little fox. Roughly 1,500 scenes across the live themes. |
> | **Core Problem & Solution** | Weather apps look the same. Weatherie makes the art the product: a dev-only "theme forge" generates and quality-checks hundreds of scenes per style, and the app resolves the right scene for each condition and time of day. |
> | **Tech Stack** | Flutter, Dart, Provider, Google Cloud Run, Cloud Storage, Firestore, RevenueCat, home-screen widgets |
> | **Key Highlights** | Eleven live themes (three free, eight paid with credits), a 379-scene default theme bundled for offline first launch, drag-to-arrange tile grid, no advertising SDK in the shipped app. |

---

## 1. Themes as data

- **Scene pools.** A theme maps each weather condition and day or night to a pool of background variants plus a matching icon set. The chosen variant is locked per local day and persisted, so the art stays the same across relaunches, the widget and the share card, and rotates once a day.
- **Theme packages.** The default theme ships in the app; store themes download from the backend as a zip of a manifest plus WebP images (quality 85, about 13% of the PNG size). Store names, descriptions and tiers live in one listings file that the publisher script reads, so reviewed wording and shipped wording cannot drift.
- **The theme forge.** A dev-only pipeline briefs an image model, sorts results by what their skies actually show, crops stray borders, flags artefacts for review and packs the theme. The default "Open Road" travel-poster theme was built this way from about 350 reviewed backgrounds.

## 2. Store and credits

- **Theme store.** A Featured page plus Mine, Store, Free and Paid shelves; previews show six real scenes and their icons, with dimmed "ghost" cards signalling how many more exist.
- **Credits.** Paid themes unlock with credits bought through RevenueCat. The Cloud Run backend owns balances and entitlements; a webhook grants purchases, a restore button recovers them, and a purchase also turns ads off on every grant path.
- **Backend.** Cloud Run service with Cloud Storage for packages and Firestore for data, moved off Cloudflare in August 2026. Paid downloads without entitlement are refused; free ones get a signed URL.

## 3. The app

- **Today grid you arrange.** Long-press a tile and drag; once the would-be drop has been stable for a second, the grid reflows under the finger, so releasing confirms what is already visible. The user owns an order and the device owns the rows: one list of ids packs into two columns on a phone and four on a tablet, and a smaller tile backfills a hole ahead of it.
- **Phones portrait, tablets free.** iOS locks per device class in the Info.plist; Android locks at runtime from the same "is this a tablet" predicate that chooses the split layout, so the two can never disagree.
- **Tablet layouts.** Split portrait and landscape layouts, a wrapped forecast grid, painted vector forecast glyphs and a wind tile with a Beaufort strength bar.
- **House ads only.** The AdMob SDK was removed before launch; banner, in-feed tile and settings card serve the publisher's own creatives. That removed the advertising-ID permission and the iOS tracking prompt.

## 4. Release and media

- **CI.** Release workflows on a self-hosted Mac runner sign and upload to Play internal testing and TestFlight, numbering each build one past the store's highest. Listing copy, screenshots and data-safety answers are pushed by script.
- **Media harness.** Flutter golden-test captures produce 32 store stills across seven device classes, a 27.5-second narrated preview, social shorts, house-ad stills built from real theme art, and an animated logo whose sticker peel lands exactly on the shipped icon. All published at [weatherie.com/press](https://www.weatherie.com/press/).

## 5. Stack

| Component | Technology |
|---|---|
| **App** | Flutter, Dart, Provider, flutter_staggered_grid_view, home_widget |
| **Weather data** | OpenWeatherMap |
| **Backend** | Google Cloud Run, Cloud Storage, Firestore |
| **Purchases** | RevenueCat (credits) |
| **Theme pipeline** | Python "theme forge" with image generation and QC |
| **Landing** | Astro site with privacy policy and press page |
