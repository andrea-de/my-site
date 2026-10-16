---
slug: products/section-launcher
title: "Section Launcher: Android Home Screen with a Wave Scroller"
short: "Launcher"
category: products
description: Jetpack Compose Android launcher with user-defined sections and a Gaussian wave scroller, live on Google Play; the reference for the estate's Play release pipeline and for rendering store media on the JVM with no device.
tags: [android, kotlin, jetpack-compose, robolectric, google-play, ci-cd, release-engineering, media-harness]
featured: true
updated: 2026-10-16
---

# Section Launcher: Android Home Screen with a Wave Scroller

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Live on Google Play (version 1.0.2, phones only, targeting Android 16 / API 36). Site and interactive demo at sectionlauncher.com. |
> | **What It Is** | A minimal home-screen launcher: apps grouped into sections you define, a weather and clock header, widgets, and a scroller that bows letters out under your thumb. |
> | **Core Problem & Solution** | Alphabet scrollers on launchers are tiny and jumpy. The wave scroller scales the letters near the touch point along a Gaussian curve, so a thumb can land on any letter, and fast moves filter the app list live. |
> | **Tech Stack** | Kotlin, Jetpack Compose, Material 3, Robolectric, GitHub Actions on a self-hosted Mac runner, Google Play Developer API |
> | **Key Highlights** | Reusable `WaveScroller` composable, closed-loop drag handling, promote-not-rebuild releases, store screenshots and a narrated video rendered on the JVM. |

---

## 1. The launcher

- **Wave scroller.** A self-contained `WaveScroller` composable evaluates a Gaussian bow around the finger. The marketing site's demo reimplements the same math in plain JavaScript so it behaves like the app.
- **Sections.** Apps sit in user-defined sections with their own layouts; home items can be dragged between them.
- **Closed-loop dragging.** One always-mounted pointer tracker on the root drives every drag, storing the finger in absolute coordinates and recomputing the drop target from live geometry on every event. Per-item detectors only start drags, so the grid can restructure mid-drag without killing the gesture. Stale coordinates were the root cause of earlier drag glitches.
- **One gesture gate.** A single `isAnyDragActive` flag is checked by every screen-level gesture, so a long press that becomes a drag always wins.
- **Quiet by design.** No analytics SDKs and no third-party ad networks; the only promotion is a dismissible card for the publisher's other apps, disclosed in the privacy policy.

## 2. Release pipeline (the estate's reference)

- **Self-hosted CI.** Builds run on a self-hosted Mac runner, never on GitHub's billed runners, and nothing depends on GitHub artifact storage (a full storage quota once took a Play upload down with it).
- **Promote, do not rebuild.** A tag uploads to the internal track; a promote workflow assigns that exact version code to production through the Play API, so what ships is byte-identical to what was tested. Staged rollouts take a fraction, and a halt flag stops one.
- **Fail early.** A version-code check runs first, because Play only rejects a duplicate at upload, after a full signed build.
- **Lint as a gate.** The API 36 bump surfaced fatal `lintVitalRelease` errors that the older toolchain never raised; they were fixed before they could kill a release.
- **Phones only, by manifest.** Tablet exclusion is done with `supports-screens`, not a console setting.
- **Never Play's Automatic Integrity Protection.** It injects a licence check into the APK; behind a VPN or on flaky connectivity the check times out and shows a blocking dialog, which on a launcher locks the user out of their phone. Diagnosed over ADB and turned off.

## 3. Store media rendered on the JVM

- **Screenshots without a device.** The real Compose screens render under Robolectric in about fifteen seconds from a fixture of sixteen fake apps with generated icons. Traps solved along the way: `captureToImage()` waits for a frame Robolectric never produces (draw the decor view instead), the transparent launcher needs the wallpaper composited underneath, and the weather widget must be pointed at a dead proxy to stay offline.
- **Narrated promo video.** The same fixture drives the real wave scroller with synthetic touches and streams frames to FFmpeg at 30 fps: a 24-second dark-mode cut showing three section setups, live letter filtering and brand cards, with a cached Gemini TTS presenter and music. It runs in the publisher's house-ad rotation and on the [press page](https://sectionlauncher.com/press/).

## 4. Stack

| Component | Technology |
|---|---|
| **App** | Kotlin, Jetpack Compose, Material 3 |
| **System integration** | Home-screen launcher role, app-widget hosting |
| **Tests and media** | JUnit, Robolectric, Compose UI test, FFmpeg |
| **Release** | GitHub Actions (self-hosted), Python scripts against the Google Play Developer API |
| **Site** | Static HTML/CSS/JS on Firebase Hosting with an in-browser simulator |
