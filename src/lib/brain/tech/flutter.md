---
slug: tech/flutter
title: "Flutter and Dart"
short: "Flutter"
category: tech
description: Flutter and Dart for Weatherie, the weather app whose scenes come from AI-generated themes, with a theme store, home-screen widgets, a Cloud Run backend and store media captured from Flutter golden tests.
tags: [flutter, dart, mobile, golden-tests, home-widgets]
featured: false
updated: 2026-10-16
---

# Flutter and Dart

> [!NOTE]
> ### Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Used** | Advection era (2023 to present) |
> | **App** | [Weatherie](/tree/products/weatherie), pre-release with both store listings complete |
> | **Stack** | Flutter, Dart, Provider, flutter_staggered_grid_view, home_widget, Flutter golden tests |

---

## Where Andrea used it

- **[Weatherie](/tree/products/weatherie).** Every scene is art from a theme; themes map each condition and day or night to pools of variants, and store themes download as a manifest plus WebP images from a [Cloud Run](/tree/tech/google-cloud) backend. Phones and tablets get different layouts, and a drag-to-arrange tile grid packs one ordered list into two or four columns.
- **Media from golden tests.** Flutter golden-test captures produce 32 store stills across seven device classes, a narrated preview and social shorts. See [media harnesses](/tree/tools/media-harnesses).
- **Release.** Signed builds go to TestFlight and Play internal testing from a self-hosted Mac runner. See [deployment pipelines](/tree/architecture/deployment-pipelines).

## Notable decisions

- **One predicate for orientation.** iOS locks per device class in the Info.plist; Android locks at runtime from the same "is this a tablet" predicate that chooses the split layout, so the two cannot disagree.
- **House ads only.** The AdMob SDK was removed before launch, which removed the advertising-ID permission and the iOS tracking prompt. See [local-first mobile systems](/tree/architecture/local-first-mobile-systems).
