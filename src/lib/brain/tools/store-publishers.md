---
slug: tools/store-publishers
title: "Store Publishers: App Store and Google Play by API"
short: "Publishers"
category: tools
description: Scripts that take an app from built to live on both stores through the App Store Connect and Google Play APIs, from build upload and version numbering to listings, subscriptions, data safety and review submission, with a browser bridge for console-only steps.
tags: [tools, ci-cd, app-store-connect, google-play, revenuecat, nodejs, python, playwright, release-engineering]
featured: false
updated: 2026-10-16
---

# Store Publishers: App Store and Google Play by API

> [!NOTE]
> ### Executive Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Status** | In use for every app in the estate. Run end to end for AudioTales in October 2026: from built app to test purchases on both stores in about a day of agent time. |
> | **What It Is** | Small scripts per concern (builds, listings, screenshots, subscriptions, submission) against the store APIs, run from self-hosted CI or by an agent, plus a playbook for the order of operations. |
> | **Core Problem & Solution** | Store consoles turn every release into an hour of forms, and a typo there is invisible in review. Keeping listing copy, screenshots and settings in the repo and pushing them by API makes a store update a reviewable diff. |
> | **Tech Stack** | App Store Connect API (ES256 JWT), Google Play Developer API (service account), RevenueCat API, Node.js and Python, GitHub Actions on a self-hosted Mac, Playwright |
> | **Key Highlights** | Version numbers asked from the store, promote-not-rebuild releases, guards against overwriting console edits, App Privacy and Play declarations driven through the owner's own signed-in browser. |

---

## 1. Builds and version numbers

- **Ask the store for the next number.** Both stores reject a duplicate build number only after the build is made, so the pipeline asks first: `asc.mjs` and `play.mjs` (pure Node.js crypto, no SDK) fetch the next build number and versionCode, and a preflight check fails in seconds instead of after a full signed build.
- **Upload straight to the store.** iOS builds go to TestFlight and Android bundles to the Play internal track directly from the runner, keeping nothing in GitHub artifact storage, whose shared quota once silently killed builds.
- **Promote, do not rebuild.** Production releases reassign the version code already tested on internal; staged rollouts take a fraction. A never-published app's first release must be a draft sent from the console, and the promote script falls back to that.

## 2. Listings and media

- **Metadata as source.** Listing texts per locale, categories, age rating, pricing and territories live in the repo and are pushed by script. One guard reads the document's own git history to tell a stale store from somebody's console edit, and refuses to overwrite the latter.
- **Screenshots and previews.** Uploaders read only from the version-controlled store tree, treat an empty match as fatal (an earlier run would have emptied a live listing and printed success), and wait for Apple's asset delivery state to be COMPLETE rather than trusting a 200.
- **Data safety by API.** Play's data-safety form is submitted from a prepared CSV.

## 3. Purchases

Subscriptions and in-app products, prices in every territory, review screenshots, and the RevenueCat project (store apps, products, entitlements, offerings, webhook) are set up by script. RevenueCat grants only through a secret-header webhook keyed on the backend's user id, sharing idempotency with a REST sync.

## 4. What still needs a console

App creation on both stores, Apple's App Privacy answers, and most of Play's app-content declarations have no API. Those steps run through a Playwright bridge into the owner's own signed-in browser, in batches the owner approves once. A few things stay human by nature: developer agreements, tax and banking.

## 5. Traps written down

- The App Store Connect API can report a subscription as missing metadata while the console says it is ready; the console is the truth.
- Apple review screenshots must be an exact device size; a crop fails.
- Play shows an internal test track as inactive until a tester list is ticked.
- Adding the Sign in with Apple capability invalidates every existing provisioning profile.

## 6. Stack

| Component | Technology |
|---|---|
| **Apple** | App Store Connect API, TestFlight |
| **Google** | Google Play Developer API (edits, tracks, listings, data safety, subscriptions) |
| **Purchases** | RevenueCat REST API and webhooks |
| **Runtime** | Node.js (`node:crypto`), Python, GitHub Actions on a self-hosted Mac |
| **Console steps** | Playwright bridge into a signed-in browser |
