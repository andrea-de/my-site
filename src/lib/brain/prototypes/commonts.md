---
slug: prototypes/commonts
title: "Commonts: A Forum Run by Its Members"
short: "Commonts"
category: prototypes
description: Discussion platform where community rules are locked by members, contempt goes behind a civility curtain instead of being deleted, and juries of members rule on cases; TypeScript monorepo on Cloud Run, live as a locked demo at commonts.com.
tags: [commonts, community, moderation, civility, typescript, postgresql, drizzle, vite, cloud-run, llm, playwright]
featured: false
updated: 2026-10-16
---

# Commonts: A Forum Run by Its Members

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | Locked demo live at [commonts.com](https://commonts.com) since September 2026: seeded personas only, no sign-ups or uploads, reset nightly. Formerly "Forumnia". |
> | **What It Is** | "Comments, in a commons": communities whose rules belong to their members, with moderation that does not rely on a few moderators as the last line of defence. |
> | **Core Problem & Solution** | Forums fail either by tolerating contempt or by moderators deleting disagreement. Commonts screens posts for incivility before publication, offers the author a rewrite that keeps their point, puts what remains behind a curtain, and sends disputes to a jury of members. |
> | **Tech Stack** | TypeScript monorepo (API, worker, Vite web app), PostgreSQL 16, Drizzle ORM, OpenAPI, Google Cloud Run, Playwright |
> | **Key Highlights** | Civility curtain, member juries with appeals and a public moderation log, Helpful-based ordering with no downvote, volunteer moderators removable by their community, phone-first UI. |

---

## 1. The mechanics

- **Civility curtain.** A creation check screens each post. Contempt goes behind a curtain where it stands, with an automatic jury case; doxxing, threats and illegal content are held before publication for trust and safety. If both civility models are down, a post goes up at once and is reviewed afterwards rather than held.
- **Rewrites that keep the point.** The suggested rewrite removes the insult but not the argument: a sneer at a comment becomes "your comment is not defensible". Disputed calls go to a stronger model, and a bias set of plain-versus-polished pairs with a measured miss rate guards against penalising plain writing.
- **Juries.** Five members see a case together with the community and its rules. Replacement jurors are drawn under a per-community cap (a real bug: a panel could otherwise come entirely from one community). Sanctions can be appealed, and every action lands in a public moderation log.
- **Ordering without a downvote.** Ordering is Helpful normalised by viewers. Disagree only changes labels, computed from three counts (Helpful, Disagree, pressed both) and never from a model. An earlier bridging model was deleted once it was clear that pressing both buttons gamed it.
- **Moderators answer to members.** Volunteer moderators can be removed for inactivity, by team vote or by community recall. Locked principles are separate from tunable parameters, which are set with a published reason.

## 2. Engineering

- **Locked demo.** `DEMO_MODE` forces vendor fakes, closes sign-ups and uploads, and a Cloud Run job reseeds nightly. A test runs the seeded content through the creation check, because the first seed filed insults as abuse reports and contradicted the design.
- **Identity, server-side.** Phone sign-up behind attestation, rate limits, mobile-only number lookup and a spend cap, all on the server, since a client-side SMS SDK cannot stop SMS pumping.
- **Images gated.** Image uploads are production-gated on hash matching and abuse reporting being in place.
- **Isolation for tests.** End-to-end runs get their own database and ports after one run wiped the shared development database.
- **Tests.** Shared, API, vendor-client and Playwright suites (about 300 tests).
- **Media harness.** A tour in phone and desktop cuts with a presenter, four member-perspective shorts, sixty social cards and an animated logo, all rendered from the production build over a dedicated seed.

## 3. Stack

| Component | Technology |
|---|---|
| **API and worker** | Node.js, TypeScript, OpenAPI |
| **Web** | Vite SPA, Markdown, two themes (Daylight and Instrument) |
| **Data** | PostgreSQL 16, Drizzle ORM |
| **Hosting** | Google Cloud Run (scale to zero), Cloud Run Jobs and Scheduler for the nightly reset |
| **Testing** | Unit and API suites, Playwright end to end |
