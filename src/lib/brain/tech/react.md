---
slug: tech/react
title: "React, Next.js and React Native"
short: "React"
category: tech
description: React across web and mobile in the Advection estate: Rogue Calculator and Found Teams on React with Vite, GameTsunami and Tales Unwritten on Next.js, and AudioTales and Fluenics on Expo and React Native.
tags: [react, nextjs, react-native, expo, capacitor]
featured: false
updated: 2026-10-16
---

# React, Next.js and React Native

> [!NOTE]
> ### Overview
> | Attribute | Details |
> | :--- | :--- |
> | **Used** | Advection era (2023 to present) |
> | **React + Vite** | [Rogue Calculator](/tree/products/calculated-survival) (with Capacitor), [Found Teams](/tree/prototypes/found-teams) |
> | **Next.js** | [GameTsunami](/tree/products/gametsunami), [Tales Unwritten](/tree/prototypes/tales-unwritten), the house-ad service |
> | **Expo / React Native** | [AudioTales](/tree/products/audio-tales), [Fluenics](/tree/products/fluenics) |

---

## Where Andrea used it

- **[Rogue Calculator](/tree/products/calculated-survival).** React 18, TypeScript and Vite, shipped to TestFlight and Play internal testing through Capacitor, with a pure mechanics module tested in Vitest.
- **[Found Teams](/tree/prototypes/found-teams).** A React 19 and Vite SPA whose API client is generated from the backend's OpenAPI spec.
- **Next.js.** [GameTsunami](/tree/products/gametsunami) on Firebase App Hosting; [Tales Unwritten](/tree/prototypes/tales-unwritten), which streams Gemini-written pages and narration; and the house-ad service described under [Advection Software](/tree/roles/advection).
- **Expo and React Native.** [AudioTales](/tree/products/audio-tales), in review on both stores since 2026-10-13, and [Fluenics](/tree/products/fluenics), whose screens are rendered through react-native-web and captured with Playwright for a render harness.

## Notable decisions

- **Know where native code really builds (Fluenics).** On Expo SDK 56 a patch to a module's Kotlin source does nothing by default, because autolinking prefers the prebuilt AAR; the module must be listed to build from source.
- **Web for the harness.** React Native screens are rendered on the web so agents and [media harnesses](/tree/tools/media-harnesses) can screenshot them with no device.
