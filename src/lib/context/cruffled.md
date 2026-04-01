# Project Overview: Cruffled

Cruffled is a high-performance, interactive word-puzzle application that reimagines the classic crossword with a unique "jumbled tile" swap mechanic. Developed with a "write once, run anywhere" philosophy, Cruffled operates as a feature-rich web application, a portable "Applet" for third-party embedding, and a native mobile experience.

## 🚀 Key Technical Highlights

### 1. Custom Game Engine & Logic
The core of the project is a sophisticated Crossword.js engine implemented in pure JavaScript. This engine decouples the visual tile positions from the underlying solved state using an index-mapping array, allowing for $O(1)$ lookups and efficient state updates.
* **Dynamic Grid Mapping**: Automatically identifies "Across" and "Down" words from a flattened letter array.
* **Heuristic Validation**: A reactive matching system that distinguishes between tiles in the correct position (match) and "soft-matched" tiles that belong in the word but are currently misplaced (word-match).
* **Graph-based Navigation**: Uses recursive traversal algorithms to identify word boundaries and handle complex intersections across grid sizes ranging from 3x3 to 15x15.

### 2. "Applet" Architecture (Micro-Frontend)
Cruffled features a standalone Applet system, allowing the entire game to be bundled into a single, self-contained IIFE (`cruffled-applet.js`) via a specialized Vite configuration.
* **Web Component Integration**: It exposes a `<cruffled-puzzle>` custom element, enabling any website (Astro, React, or plain HTML) to embed fully functional puzzles with a single script tag.
* **Declarative Customization**: Supports instance-specific themes, pre-solved "demo modes," and JSON-injected puzzle data via HTML attributes.

### 3. Integrated Puzzle Level Editor
The project includes a robust Internal Creator Tool (`/create` route) that demonstrates full-stack CRUD capabilities:
* **Interactive Grid Design**: Tools for toggling "letter" vs. "block" tiles and defining grid dimensions dynamically.
* **Automated Content Mapping**: As letters are entered, the editor automatically detects word intersections and generates clue fields.
* **Difficulty Analysis**: Includes logic to analyze the minimum required swaps, helping designers calibrate puzzle difficulty before publishing.

### 4. Modern Full-Stack & State Architecture
* **SvelteKit & Svelte 4**: Leverages fine-grained reactivity for "butter-smooth" tile swap animations and efficient DOM management.
* **Hybrid Persistence**: Employs a "Double-Buffered" state strategy. Game progress is immediately updated in Svelte Stores for zero-latency UI feedback, while being asynchronously persisted to Cookies and Firebase Realtime Database for cross-session recovery.
* **Scalable Content Pipeline**: Utilizes Vite's Eager Glob Imports to automatically discover and categorize new puzzles from localized JSON files, creating a decoupled content management workflow.

### 5. Cross-Platform Strategy & QA
* **Mobile-Ready**: Integrated with Capacitor, allowing the same codebase to be deployed as native Android and iOS applications.
* **Quality Assurance**: Maintains a dual-layer testing suite using Vitest for unit-testing the engine logic and Playwright for end-to-end (E2E) validation of the player experience.
* **Adaptive UX**: A comprehensive theme engine allows for dynamic CSS variable injection, supporting different visual languages (e.g., "Modern" vs. "Classic") without changing the underlying component structure.

---

## 🛠️ Tech Stack
* **Frontend**: SvelteKit, Svelte 4, Vanilla CSS
* **Build Tools**: Vite (Custom IIFE builds for Applet/Web Components)
* **Backend/Database**: Firebase (Realtime Database, Hosting)
* **Mobile**: Capacitor (Android/iOS)
* **Testing**: Playwright (E2E), Vitest (Unit)
* **Logic**: Pure JavaScript (ES6+)

---

## 📈 Core Expertise Demonstrated
* **Architectural Design**: Creating a portable, embeddable widget system (Applets) that maintains state isolation.
* **Complex UI/UX**: Building highly interactive, touch-friendly grid interfaces with smooth animations and tactile feedback.
* **Data Structures**: Designing a custom game engine capable of handling complex 2D spatial logic and recursive word discovery.
* **DevOps & Tooling**: Implementing automated asset pipelines and internal design tools to streamline content creation.
