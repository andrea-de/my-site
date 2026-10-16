---
slug: tools/media-harnesses
title: "Media Harnesses: Store Media and Promo Video Rendered from Code"
short: "Media"
category: tools
description: Harnesses that render every product's store screenshots, narrated previews, social shorts and house-ad creatives from the real app, per engine (browser, Godot, Flutter, Android on the JVM, Expo web), with a cached TTS presenter and a /press page per product.
tags: [tools, media-harnesses, playwright, godot, flutter, robolectric, ffmpeg, gemini-tts, app-store, google-play]
featured: true
updated: 2026-10-16
---

# Media Harnesses: Store Media and Promo Video Rendered from Code

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | In use across the estate; every shipped or near-shipped product's listing media comes from one. |
> | **What It Is** | Code that drives the real app through scripted scenes, captures frames at each store slot's exact size, and assembles narrated videos, shorts, stills and ad renditions with FFmpeg. |
> | **Core Problem & Solution** | Hand-made store media goes stale with every UI change and cannot be rebuilt. A harness regenerates the whole set from the current app in one command, so media is reviewable, repeatable and versioned. |
> | **Tech Stack** | Playwright, Godot Movie Writer, Flutter golden tests, Robolectric and Roborazzi, react-native-web, Xvfb, FFmpeg, Gemini TTS |
> | **Key Highlights** | No phone or emulator needed for Android or Flutter; narration bound to measured clip boundaries; presenter takes cached and never re-spent; a pre-flighted `/press` page per product. |

---

## 1. One method per engine

| Engine | Method | Reference product |
|---|---|---|
| **Web (Svelte, React)** | Playwright drives the app; motion overlays are code-native; the soundtrack is rebuilt from the page's own sound events | [Cruffled](/tree/products/cruffled), [Rogue Calculator](/tree/products/calculated-survival) |
| **Godot** | Movie Writer at a fixed frame rate under Xvfb, audio bus captured alongside, scripted replays from seeds | [Square Swaps](/tree/products/square-swaps) |
| **Flutter** | Golden-test frame capture with a fake clock and fixture data, composited in Python and FFmpeg | [Weatherie](/tree/products/weatherie) |
| **Android Compose** | The real UI rendered on the JVM under Robolectric native graphics, touch events driving real components, frames streamed to FFmpeg | [Section Launcher](/tree/products/section-launcher), [Tackry](/tree/products/tackry) |
| **Expo / React Native** | The static web export with native modules stubbed, real screens over snapshot data, stills selected by test id | [AudioTales](/tree/prototypes/audio-tales) |

## 2. Rules the harnesses enforce

- **Inventory every slot first.** Before making anything, list every media slot both stores offer (phone, tablet, feature graphic, previews, the App Store product-page header) with its size, length, frame rate and safe area, and build those rules in as checks. The App Store header's phone crop, for instance, is a centred box of about 1646 by 661 pixels out of 3840 by 1646.
- **Check the delivered file.** Length, codec, frame rate and dimensions are measured on the output, not trusted from the build. One committed App Store preview turned out to be 60 fps, which the store rejects.
- **A beat must show what its line says.** Captures log the events they film with timestamps, and seeds are chosen so the event lands inside the window the cut keeps.
- **Record at the device's real scale.** A harness that set the design resolution instead of the window drew the interface at 1x into a phone-sized frame, so the preview looked like a tablet.

## 3. Narration

- **A spoken presenter**, ranked above burned-in text chips. Scripts are keyed lines with a voice and style prompt.
- **Cached by wording and voice.** Each line is synthesised once with Gemini TTS and cached under a hash of its text and voice, with spend logged, so rebuilding a cut for picture or caption changes costs nothing.
- **Measured, not timed.** Takes are measured first and the scene schedule is derived from their durations; lines bind to named clips and local offsets rather than global timestamps; every cut must end with a pause after the last word.
- **Decode the container.** A TTS response is a whole WAV file with a header and a provenance chunk; reading it as raw samples put a click and a burst of static on every line until it was traced from a spectrogram.

## 4. Output

- **Store sets** at exact pixel sizes per device class, factual captures kept apart from framed promotional versions.
- **Videos** per slot: App Store preview (30 seconds is a hard cap), Play/YouTube cut, house-ad interstitial, social shorts.
- **House-ad renditions** in Ogg Theora (the only video codec Godot decodes) and H.264 (for iOS WebViews and Safari), plus posters.
- **A `/press` page per product**, generated in one pass: every asset with its slot, measured size and pre-flight result, the video scripts, listing copy and brand art. It is an asset catalogue, not a to-do list.

## 5. Stack

| Component | Technology |
|---|---|
| **Capture** | Playwright, Godot Movie Writer, Flutter test framework, Robolectric, Roborazzi, Xvfb |
| **Assembly** | FFmpeg (H.264, Theora, WebP), Python and Node.js scripts |
| **Voice** | Gemini TTS, cached takes |
| **Publishing** | Generated static `/press` pages on each product site |
