---
slug: products/fluenics
title: "Fluenics: Speaking Practice with Pronunciation Scoring"
short: "Fluenics"
category: products
description: Expo / React Native app for speaking practice in any language; LLM-generated drills, Azure pronunciation scoring, guided and listen modes, a review queue and a fluency map over offline SQLite; in daily personal use, not yet released.
tags: [react-native, expo, azure-speech, llm, language-learning, mobile, sqlite, offline, typescript, gemini]
featured: false
updated: 2026-10-16
---

# Fluenics: Speaking Practice with Pronunciation Scoring

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Functional prototype in daily personal use on Android; not released. A v1 is being prepared under the house package naming. |
> | **What It Is** | A practice app for saying things out loud: generate drills for real situations, listen to target and translation separately, record yourself and get scored. |
> | **Core Problem & Solution** | Vocabulary apps rarely make you speak. Fluenics generates drills for any language with an LLM and scores each recorded attempt with Azure Pronunciation Assessment, then tracks what you have heard, said and recalled. |
> | **Tech Stack** | React Native, Expo, TypeScript, Azure Speech (Pronunciation Assessment), Gemini (drill generation), SQLite |
> | **Key Highlights** | Open-ended language support, Guided and Listen modes, a review queue, a fluency map of verbs, words and tenses, data export and import, 441 tests. |

---

## 1. Practice

- **Generated drills.** Drills are generated for a situation in any language; open-ended language support is a v1 requirement, not limited to a built-in list.
- **Drill workspace.** Target phrase and translation play independently. Guided mode walks phrase by phrase; Listen mode plays a continuous track.
- **Scored attempts.** Each recording is scored by Azure Pronunciation Assessment. The phone records in the format Azure reads directly (Ogg/Opus on Android 10+, WAV on iOS), so nothing is transcoded; FFmpeg is only a fallback for old Android.
- **Review.** A review queue brings back weak phrases, and per-phrase recall is recorded separately from shadowing so that repeating a phrase is not mistaken for remembering it.

## 2. The fluency map

A matrix engine tags every phrase by verb, tense, word and expression and records evidence per tag. A new fluency screen (Mosaic and Islands views) shows what you know and offers exercises that start real practice on just those phrases. Italian has a reference pack of core verbs, words and expressions; other languages are built from the learner's own data. An audit of the engine fixed tag spellings that split one tense three ways, kept non-Latin tags that used to be stripped, and made generated drill ids unique.

## 3. Engineering notes

- **One speech path.** Store builds send speech through a backend proxy and never embed a key; a personal build can go straight to Azure with the same client. A release check refuses embedded keys unless explicitly told otherwise.
- **An Expo trap.** On SDK 56 a patch to an Expo module's Kotlin source does nothing by default, because autolinking prefers the prebuilt AAR; the module must be listed to build from source. The Opus recording patch depends on this.
- **Design system and render harness.** The app moved onto tokens taken from its icon (a carved limestone tablet). A harness bundles the real app with react-native-web and screenshots every screen in light and dark with Playwright, so design is checked in renders before any device build.
- **Testing.** Hooks are tested in isolation with mocked primitives and fake timers; the physical phone is kept for what cannot be automated (microphone, audible playback, offline).

## 4. Stack

| Component | Technology |
|---|---|
| **Mobile** | React Native, Expo, TypeScript |
| **Speech** | Azure Speech Pronunciation Assessment, Expo audio (Opus recording) |
| **Drill generation** | Gemini |
| **Storage** | SQLite (offline), AsyncStorage, JSON export and import |
| **Tooling** | react-native-web render harness, Playwright, Jest |
