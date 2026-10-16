---
slug: prototypes/audio-tales
title: "AudioTales: Photograph a Picture Book, Hear It Read Aloud"
short: "AudioTales"
category: products
description: Mobile app that turns photos of a picture book into a narrated audiobook in 139 languages, with an AI storyteller, your own recorded voice, music and offline copies; 1.0 submitted to the App Store and Google Play on 2026-10-13.
tags: [audio-tales, generative-ai, gemini, tts, expo, react-native, typescript, cloud-run, firebase, revenuecat]
featured: true
updated: 2026-10-16
---

# AudioTales: Photograph a Picture Book, Hear It Read Aloud

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 1.0 in review on both stores since 2026-10-13 (iOS with four subscriptions; Play in 177 countries). Backend live on Cloud Run. Site at tales.audio. |
> | **What It Is** | Snap each page of a book you own; the app reads the words off the photos and an AI storyteller narrates the book, in its own language or a translation, with page-turn sync, music and a sleep timer. |
> | **Core Problem & Solution** | Most picture books on a family's shelf have no audio edition, and none in other languages. AudioTales works from phone photos of the book itself: page reading and narration run on the server, one take per page, with no sign-up. |
> | **Tech Stack** | Expo / React Native, TypeScript, Express on Google Cloud Run, Firebase (Auth, Firestore, Storage, Crashlytics), Gemini (page reading, translation, TTS), ElevenLabs (sound effects), FFmpeg, RevenueCat |
> | **Key Highlights** | 139 languages from one registry, record-it-yourself narration, credits on expiring lots, anonymous accounts that survive reinstalls, a full store launch run end to end by an agent. |

The project began as a full-cast audio-drama engine for novels and was refocused in September 2026 on one clear job: one storyteller reading a picture book aloud.

---

## 1. From photo to narration

- **Reading pages.** Gemini transcribes each page photo and decides the book's language from the text of all pages read so far, not just page one (a one-word first page once made an Italian book "English").
- **Pages the right way up.** Photos are often taken turned. Asked which way a page needed rotating, the model knew that a page was turned but got the direction of a quarter turn right only half the time. Shown the photo four ways and asked which is upright, it was right on all 226 test photos. So a cheap flag rides along with transcription, and the four-way pick runs only on flagged pages.
- **Whole-page TTS.** Each page is one Gemini TTS take of its text, about twice real time, which performs sound words naturally and is far cheaper than ElevenLabs voices; an earlier live model reading the photos directly left long gaps. The language is named both in the speech config and in the style prompt, because the config alone let Italian words be read as English.
- **One writer per book.** Every edit and every narration step goes through a per-book server lock; the phone never writes the book, which fixed a loop that silently undid edits made mid-narration.
- **Record it yourself.** A parent can record a page in parts, re-record or undo, and the server stitches the parts into that page's take. Free, and the AI take is kept one step back.
- **Music and sound.** Background music is restricted to public-domain or CC0 tracks and gated on a listened tone (one track filed as "calm" from its title turned out to be an eerie drone); sound effects come from ElevenLabs.

## 2. Accounts, credits and billing

- **No login.** Accounts are anonymous. The identity survives a new phone through the phone's own backup, and a reinstall on the same device reopens its account through a device credential (a Keychain secret on iOS, ANDROID_ID on Android) that the server stores only as a keyed hash.
- **Credits as expiring lots.** Free and subscription credits are lots that expire after a set period, uniform across tiers. Only the backend moves credits, transactionally; client writes to balances are forbidden by Firestore rules and tested.
- **Subscriptions through RevenueCat.** A secret-header webhook is the only thing that grants, sharing idempotency with a REST sync. Restoring purchases on a fresh install opens the subscriber's account, and a device's library merges into it.
- **For grown-ups.** The app is positioned for adults (the parent runs it, a child may listen), matching the generative-AI terms it is built on.

## 3. Shipping

- **Store launch by an agent.** App records, metadata, subscriptions and prices in every territory, RevenueCat configuration, test accounts and data-safety answers were done in about a day of agent time, through store APIs where they exist and through the owner's own signed-in browser for console-only steps. The result is a reusable playbook for the estate.
- **Media from the real app.** One command regenerates every listing asset with no device: screenshots at exact store sizes in two themes and several languages, store cuts with a spoken presenter and an animated logo, the App Store product-page header, house-ad creatives and social shorts. AudioTales' press gallery is the quality bar the other products follow.
- **Offline copies and crash reporting.** Played books are cached up to a size cap, and Crashlytics reports carry only an opaque id.

## 4. Stack

| Component | Technology |
|---|---|
| **Mobile app** | Expo / React Native, TypeScript |
| **Backend** | Node.js, Express, TypeScript on Google Cloud Run |
| **Data** | Firebase Auth (anonymous), Firestore, Cloud Storage |
| **AI** | Gemini (OCR, language, translation, TTS), ElevenLabs (SFX) |
| **Audio** | FFmpeg mixing and stitching on the server |
| **Billing** | RevenueCat, App Store and Play subscriptions |
| **Web** | Landing site with live demos of the app's screens and narration |
