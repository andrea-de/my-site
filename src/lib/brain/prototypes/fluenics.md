---
slug: prototypes/fluenics
title: "Fluenics: Mobile Language Practice & Azure Pronunciation Scoring"
category: prototypes
description: Native Expo/React Native mobile language practice application featuring LLM conversational drills and Azure Pronunciation Assessment.
tags: [react-native, expo, azure-speech, llm, language-learning, mobile, sqlite]
featured: true
updated: 2026-09-11
---

# Fluenics: Mobile Language Practice & Azure Pronunciation Scoring

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🧪 Functional Prototype (44+ Commits) |
> | **What It Is** | Mobile language learning app providing scenario-based conversational drills and phoneme-level pronunciation scoring. |
> | **Core Problem & Solution** | Language learners struggle to practice speaking without human tutors. Fluenics combines LLM scenario generation with Azure Speech Pronunciation Assessment for instantaneous, objective acoustic feedback. |
> | **Tech Stack** | React Native, Expo, Azure Cognitive Speech Services, SQLite (Local-First), TypeScript |
> | **Key Highlights** | Phoneme-level scoring (accuracy, fluency, completeness), offline-first review queue, independent target/translation audio playback. |

**Fluenics** is an intensive mobile pronunciation practice application built with Expo and React Native. Designed to bridge the gap between passive vocabulary apps and live conversational fluency, Fluenics provides structured speaking drills with automated phonetic feedback.

---

## 1. LLM-Generated Conversational Drills

- **Contextual Scenario Engines**: Generates progressive difficulty drills tailored to real-world situations (ordering at cafes, workplace negotiations, medical visits).
- **Independent Audio Stems**: Allows learners to listen to native target pronunciations, toggle translated audio, or isolate individual difficult phonemes.

---

## 2. Azure Pronunciation Assessment Integration

- **Acoustic Waveform Analysis**: Directly integrates with Azure Cognitive Services Speech SDK to analyze user-recorded audio against reference text.
- **Multi-Metric Scoring**: Evaluates user speech across four distinct axes:
  - **Accuracy Score**: How closely phonemes match native pronunciation.
  - **Fluency Score**: Natural cadence, pause frequency, and flow.
  - **Completeness Score**: Percentage of target syllables enunciated.
  - **Prosody Score**: Pitch variance, stress, and intonation.

---

## 3. Local-First SQLite Matrix Review Queue

- **Spaced-Repetition System**: Stores session audio recordings and scoring history locally in an offline SQLite database, scheduling difficult phrases for automated resurfacing.
- **Zero-Network Degradation**: Drills and cached audio remain fully playable during commutes without active cellular data.

---

## 4. Technical Stack Summary

| Component | Technology |
|---|---|
| **Mobile Platform** | React Native, Expo SDK |
| **Speech Engine** | Azure Cognitive Services (Speech-to-Text & Pronunciation Assessment) |
| **Local Storage** | SQLite (Expo SQLite), Async Storage |
| **Language** | TypeScript |
