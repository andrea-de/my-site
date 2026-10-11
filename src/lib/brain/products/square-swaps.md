---
slug: products/square-swaps
title: "Square Swaps: Godot 4 Puzzle Engine, Themed Rendering & Automated Store Release"
category: products
description: Match-2x2 puzzle game in Godot 4 and GDScript, with a simulation core isolated from rendering, ten hand-built art themes, and a self-hosted CI pipeline that builds and submits to both app stores.
tags: [godot, gdscript, game-development, xvfb, ffmpeg, ci-cd, app-store-connect, google-play, advection]
featured: true
updated: 2026-10-04
---

# Square Swaps: Godot 4 Puzzle Engine, Themed Rendering & Automated Store Release

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | 🟢 Live on Google Play (2026-09-17) and the App Store (2026-09-20) |
> | **What It Is** | A match-2x2 puzzle game for iOS, Android and the web, built in Godot 4. Ten art themes, each with its own artwork, motion, instrument and music. |
> | **Core Problem & Solution** | Puzzle games rot when rules, presentation and platform plumbing grow into each other. Square Swaps keeps a deterministic simulation core that never touches a node, a view layer driven only by emitted event batches, and a release pipeline that reaches both stores' APIs directly. |
> | **Tech Stack** | Godot 4.6, GDScript, GitHub Actions on self-hosted runners, Python, FFmpeg, Xvfb |
> | **Key Highlights** | Deterministic command-sourced replay, a one-way event channel from simulation to view, remote-configured ad pacing without a store update, 310-test headless suite, direct App Store Connect and Google Play API submission. |

**Square Swaps** is a puzzle game whose rule is a 2×2 block rather than a
line of three. It is written in **GDScript on Godot 4.6** — the engine's
own language, not C# — and is built as much around release mechanics as
around play.

---

## 1. Simulation and view, kept apart on purpose

- **A pure core.** Everything under `core/` is `RefCounted` and `Resource`
  only: no nodes, no rendering, no audio, and no unseeded randomness. All
  randomness flows through one seeded generator, so a board is
  reproducible from an integer.
- **A one-way event channel to the view.** The view never reads or
  mutates board state. It consumes ordered batches of `GameEvent` values
  and animates them, so a fact the view needs must be added to the event
  payload rather than fetched behind the simulation's back. The rule is
  enforced by review and by a headless view-integration suite.

  These are *domain events*, not an event-sourced store, and the
  distinction is deliberate. `BoardModel` remains the authoritative
  mutable state; the simulation mutates it and then emits events
  describing what changed. Delete every event and the board is identical.
  In an event-sourced system the log is the truth and the state is a
  projection rebuilt from it — the inverse of this.

- **Command sourcing, not event sourcing, for replay.** What *is* sourced
  is input. `ReplayData` records `{t, action, params}` triples alongside
  the level id and the seed, and replays them against a fresh simulation
  to reproduce a run exactly. The whole log of a game is a few dozen
  dictionaries rather than thousands of events.

  That compactness is bought with a dependency on determinism, which is
  why `core/` forbids unseeded randomness and routes everything through
  `GameSim.rng` — the constraint exists to make replay possible, not for
  its own sake. The cost is that a command log is a recipe rather than a
  photograph: change a match rule or a scoring constant and an old replay
  produces a different game. An event log would survive that; this one
  does not, which is the right trade for a shipped puzzle game whose
  rules rarely move and whose replays back regression tests and bug
  reports.

  One hybrid piece exists where it earns its keep: the `BOARD_RESET`
  event carries a complete snapshot — cells, states and seed — so the
  view can rebuild from nothing without ever consulting the model.
- **Rules as data.** Verbs, match and spawn rules, scoring and difficulty
  escalation live on a `LevelDefinition` resource; visuals live on a
  separate `ThemePack`. A new level is a resource, not a code path.
- **Determinism as a test strategy.** Around 310 headless tests run under
  `godot --headless -s`, including a full scripted playthrough of the
  eleven-step tutorial on the real simulation and the real verbs.

---

## 2. Themed rendering

Ten complete themes — folded paper, an upright piano, stained glass,
timber, circuitry, lasers, brass grates, xylophone, strings and the
default — each supplying its own artwork, particles, tile motion and
sound. The piano and xylophone themes assign a distinct musical voice per
piece orientation, so play produces melody rather than sound effects.

Every piece is a **directional pattern rather than a colour**, which makes
the game fully playable without colour vision; the colour scheme is
deliberately degraded as difficulty rises, from one hue per piece to
none.

### Music that follows the state of the board

The soundtrack ships as **stems rather than finished mixes**: one shared
rhythm recording for the whole game, and four lead melodies per instrument
written at four densities. All of them play at once, always, and are never
seeked or restarted — changing intensity only moves their volumes. Two
earlier designs crossfaded between whole recordings and both were audibly
wrong, because starting a stream at a computed position costs a fraction of
a beat on the web export and the melody arrives behind the band.

Which density plays is driven by the game: an arcade run climbs a level for
every fifteen seconds its clock has lost, a level run climbs one per rank
earned, and menus and finished runs fall back to the sparsest. Tests assert
that every stem is the same length and that the levels are in density
order, because a run whose music *calms down* as the clock runs out is
still a game that works and a suite that passes.

Everything is rendered by a committed generator from three CC0 sample
libraries, so the compositions are original and nothing is owed. The key is
constrained rather than chosen: the board's own sounds are a C major
arpeggio, so the music must stay inside those seven notes; any other key
would make every match a wrong note.

That constraint was once read as "centre on A", and the driven
arrangements ran Am7-Dm7-Fmaj7-Em7, resolving to A minor every sixteen
bars. The notes were right and the mood was wrong: a game that pays you
for a match should not sound downbeat. The same seven notes centred on C
(Cmaj9-G9-Am7-Fmaj7) are exactly as consonant with the board and resolve
bright, with the minor sitting in the middle as colour rather than as
home. The change cost one chord table, because the walking bass is
written in scale degrees and the white-key snapping reads the same
either way.

---

## 3. Headless capture and generated promotional media

```
[ scripted replay ]
        │
        ▼
[ Xvfb virtual display ] ──► ( Godot --write-movie, fixed FPS )
        │
        ▼
[ frame-accurate stream ] ──► ( audio bus capture )
        │
        ▼
[ FFmpeg ] ──► ( MP4 / WebP promos, Ogg Theora in-game ad creatives )
```

Promotional clips and in-app house-advert creatives are produced from the
game itself on a headless Linux box, driven by scripted replays rather
than recorded by hand. In-game video is **Ogg Theora**, because that is
the only video codec Godot decodes — a constraint that shapes the whole
creative pipeline.

---

## 4. Release automation

- **Both stores from one dispatch.** A self-hosted macOS runner exports,
  signs, and uploads to TestFlight and Google Play internal testing.
- **Store metadata as source.** Listing copy lives in the repository and
  is pushed through the App Store Connect and Google Play APIs, with a
  guard that refuses to overwrite text edited in a console — reading the
  document's own git history to tell a stale store from somebody's edit.
- **Submission through the API.** Build attachment, review submission and
  Play track promotion are scripted against both APIs.
- **Remote configuration.** Advert pacing and store merchandising are
  fetched at launch from a small JSON document, so cadence can change for
  every installed copy without a store review. Every value is clamped by
  the client, so the document can make adverts rarer and never constant.
- **Build times as a measured quantity.** Exports were spending their
  entire duration inside Godot's Android device poll — 37 minutes on
  Android, a 20-minute timeout on iOS. Replacing the tool it polls with a
  stub brought both to roughly 40 seconds.

---

## 5. Technical Stack Summary

| Component | Technology |
|---|---|
| **Game Engine** | Godot 4.6 (GDScript) |
| **Testing** | Headless `godot -s` suites: 310 unit tests plus view integration |
| **CI/CD** | GitHub Actions, self-hosted macOS runner |
| **Store Automation** | Python against the App Store Connect and Google Play Developer APIs |
| **Media Pipeline** | Xvfb, Godot Movie Writer, FFmpeg (H.264, WebP, Ogg Theora) |
| **Platforms** | iOS, Android, Web (WebAssembly), Linux |
