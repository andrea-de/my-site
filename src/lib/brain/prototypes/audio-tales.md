---
slug: prototypes/audio-tales
title: "AudioTales: Book to Full-Cast AI Audio Performance Engine"
category: prototypes
description: AI-driven audio drama production engine that transforms written books into multi-character dramatized performances with distinct voices and sound design.
tags: [audio-tales, ai-audio, elevenlabs, gemini, cloud-run, react, expo, typescript]
featured: true
updated: 2026-09-11
---

# AudioTales: Book to Full-Cast AI Audio Performance Engine

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🧪 Pre-Launch Prototype (Active on Cloud Run) |
> | **What It Is** | End-to-end media pipeline converting books and prose into full-cast, dramatized audio performances with character voices and audio atmosphere. |
> | **Core Problem & Solution** | Audiobooks are typically monotone single-narrator recordings. AudioTales uses Gemini 1.5 to parse dialogue, assign distinct voice profiles (ElevenLabs), and generate scene-appropriate soundscapes automatically. |
> | **Tech Stack** | TypeScript, Express, Google Cloud Run, React + Vite (Studio), Expo React Native (Mobile), Gemini 1.5, ElevenLabs |
> | **Key Highlights** | Multi-character voice assignment, multimodal script extraction, cross-platform audio player with synchronized word highlighting. |

**AudioTales** transforms written books and manuscripts into full-cast, dramatized audio performances. Moving beyond traditional single-narrator audiobooks, the platform acts as an autonomous audio director—extracting characters, assigning personality-matched synthetic voices, and producing studio-grade audio dramas.

---

## 1. End-to-End Dramatization Pipeline

The conversion from raw book to full-cast performance operates as an automated state machine:

```
[ Raw Text / EPUB / PDF ]
           │
           ▼
[ Gemini 1.5 Script Adaptation ] ──► ( Dialogue Extraction, Stage Directions, Tone )
           │
           ▼
[ Character Voice Assignment ] ──► ( Voice Casting via ElevenLabs Profile Matcher )
           │
           ▼
[ Segmented Audio Synthesis ] ──► ( Parallel Sentence Batching & Normalization )
           │
           ▼
[ Synchronized Master Render ] ──► ( Word-Level Timestamps & Ambient Soundtracks )
```

- **Dialogue & Emotion Parsing**: Gemini 1.5 analyzes prose to differentiate narrator commentary from character dialogue, tagging each line with emotional inflection (e.g., *whispered*, *urgent*, *somber*).
- **Automated Cast Profiler**: Discovers recurring characters, builds psychological profiles, and maps them to consistent synthetic voice IDs across multiple chapters.

---

## 2. Distributed Cloud Run Backend & Web Director Studio

- **Containerized Cloud Run Architecture**: The Express and TypeScript backend runs as scalable microservices on Google Cloud Run, handling asynchronous generation jobs with persistent job queues.
- **Web Director Studio**: A desktop React/Vite editing suite allowing creators to preview the script, adjust line readings, swap voice actors, and fine-tune pacing before rendering final audio.

---

## 3. Expo Mobile Client with Synchronized Playback

- **Word-Level Highlighting**: Uses ElevenLabs word-level alignment timestamps to highlight words in real time as the audio plays in the mobile app.
- **Offline Caching**: Automatically downloads and stitches audio segments into local storage for uninterrupted offline playback.

---

## 4. Technical Stack Summary

| Component | Technology |
|---|---|
| **AI Ingestion** | Google Gemini 1.5 Pro / Flash |
| **Voice Synthesis** | ElevenLabs Multilingual V2 API |
| **Backend & Compute** | Node.js, Express, TypeScript, Google Cloud Run |
| **Web Studio** | React 18, Vite, Tailwind CSS |
| **Mobile App** | Expo (React Native), React Native Track Player |
