---
slug: prototypes/tales-unwritten
title: "Tales Unwritten: A Gamebook That Writes Itself"
short: "Tales"
category: prototypes
description: Choose-your-own-story gamebook for phones where each page is written by Gemini the first time a reader turns to it and kept for every later reader; six themed books, streamed narration, no scrolling; Next.js prototype in development, not yet published.
tags: [tales-unwritten, gamebook, interactive-fiction, nextjs, typescript, gemini, tts, streaming, web-audio, playwright]
featured: true
updated: 2026-10-16
---

# Tales Unwritten: A Gamebook That Writes Itself

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Prototype in development (as of 2026-10-16). Runs from its own build for testing on phones; not deployed and not yet published. The code is public at [andrea-de/choose-your-ai-story](https://github.com/andrea-de/choose-your-ai-story). |
> | **What It Is** | A gamebook in the style of the old "turn to page 43" books. Pick a hero and a place, or roll the dice, and the story is written as you read. |
> | **Core Problem & Solution** | A gamebook written in advance runs out of branches; one written by a model for each reader is never shared. Here a page is written the first time anyone turns to it, then kept, so the next reader who makes the same choice finds the same page and can branch off somewhere new. |
> | **Tech Stack** | Next.js, TypeScript, Gemini (text with structured JSON output, speech, optional images), Web Audio, ffmpeg, Vitest, Playwright |
> | **Key Highlights** | Six kinds of book with their own look and page turn, a shared story tree shown on each cover, narration that streams within about a second, continuity facts tracked per branch, and story structure decided in code rather than by the model. |

---

## 1. Reading a tale

- **Six kinds of book.** Historic fantasy, future, noir, pirate, dreamscape and ancient myth. Each has its own paper, type, sketch style, page transition and wording for choices: "turn to 43", "jump to LOG 043", "see file No. 43", "go to XLIII". A noir story is a typed case file whose top sheet is pulled off the pile; an ancient myth is a scroll that rolls up.
- **Nothing scrolls.** Every screen is a sheet of the book: the title page, the choice of book, the new-tale form, the shelf of tales already begun, and each page of the story. A page too long for the screen runs on over several sheets that turn with the book's own transition. Words and choices hold their place from the start, so nothing moves as it appears.
- **The cover is a map.** Each story opens on a cover with its title, what it is about, and a tree of the story so far: the pages you have read (tap one to go back), pages other readers wrote, paths nobody has taken yet, and the endings found.
- **Moods and narrators.** A new tale takes up to two moods (eight shared ones such as funny, spooky or twisty, plus two of each book's own) and a choice of who reads it aloud: the book's character narrator (an old sea dog, a ship's computer, a hardboiled detective) or a plain audiobook voice. Only the Begin button fixes the voice; a swipe cannot skip past the choice.
- **Sketches.** Most pages carry a line sketch picked by the model from a library of sixty hand-drawn SVGs, recoloured in CSS for each theme. An image model can draw a new one per page instead, at extra cost.
- **Settings** cover sound effects, reading aloud, text size, how quickly words appear, and whether pages turn with a flourish or simply fade.

## 2. How it works

- **One tree per story, written once.** Pages are numbered 1 to 400 and handed out at random, as in a printed gamebook. The first reader to reach a page triggers its writing; readers who arrive at the same moment wait for that one write instead of starting their own.
- **Written ahead.** When a page is served, the pages behind its choices are written in the background, so turning is usually instant. This can be switched off to halve text cost at the price of waiting.
- **Continuity.** Each story has a bible (world, characters, fixed rules). Each page records the facts it establishes or retires, and the model is given only the facts true on that branch.
- **Rules in code.** Page numbers and when a branch must end are decided in code, seeded so a branch replays the same way, never by the model.
- **Streaming narration.** The speech model's audio is sent to the browser as it is produced and played through Web Audio, so the narrator starts about a second after the page turns, even on a page nobody has heard. Listeners who arrive mid-recording share it from the first byte, and the finished recording is kept for later listeners. Words appear in time with the voice and the sheet turns when the reading reaches the next one. Pace changes use ffmpeg so the voice keeps its pitch.
- **Voice follows the page.** The model tags each page with a mood (hush, wonder, suspense, peril, sorrow, mirth or triumph), and the narration prompt combines the book's narrator, the tone the reader chose and that mood.
- **Provider behind an interface.** Text, speech and images sit behind one storyteller interface, with a built-in mock that writes placeholder pages so the whole app runs offline and in end-to-end tests.
- **Tests.** Vitest unit tests and Playwright runs on phone and desktop viewports: rolling the dice, turning pages, a second reader finding the same page, reaching an ending, narration starting and pausing.
- **Promo media harness.** A harness renders a vertical tour, reader-voice shorts and social posts from real generated tales, with locally generated voices. Mobile only. See [Media Harnesses](/tree/tools/media-harnesses).

## 3. Decisions

- **Narration is off by default.** Reading a page aloud costs more than writing it, so a page is recorded only when someone listens, then kept.
- **Short voice directions.** Voice names are kept to a few words and styles to a short phrase. Long speech directions made the voice drift.
- **Plot first.** Early generations tried to write literary prose. The prompts now ask for short sentences, personal stakes and a hook at the start.
- **Each book is its own interface.** The point is not that pages turn differently but that each kind of book is a different world on screen.

## 4. Open

- Stories are stored on disk by a single server. Hosting it publicly needs a database-backed story store and blob storage for audio and sketches.
- The running cost is shown on each cover during development and is to be hidden from readers before any launch.

This replaces a 2023 version (Next.js 13, OpenAI, MongoDB) kept in the repository's history.
