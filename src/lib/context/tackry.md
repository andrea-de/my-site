# Project Overview: Tackry

Tackry is a sophisticated, local-first Android application built for high-efficiency information capture and intelligent resurfacing. It addresses the "fleeting notification" problem by allowing users to bridge the gap between temporary system alerts and durable, actionable information. The project centers around a unified data model called the "Tack."

## 🎯 Core Purpose
Tackry serves as a centralized hub for capturing information from across the Android ecosystem—notifications, text, links, and media—and turning them into organized, persistent "Tacks" that can be pinned, categorized, or transformed into intelligent reminders.

## 🛠️ Technical Stack
* **Language**: Kotlin
* **UI Framework**: Jetpack Compose with Material 3 (fully reactive and theme-aware)
* **Architecture**: Clean Architecture with Hilt for Dependency Injection
* **Persistence**: Local-first storage using Room (SQLite)
* **System Integration**: Android Bubbles API, Notification Listener Service, Share Sheet (ACTION_SEND), and PROCESS_TEXT.

---

## 🏆 Notable Technical Details

### 1. "Live" Notification Action Preservation
One of Tackry's most advanced features is its ability to preserve and invoke "Live app actions" from captured notifications.
* **Implementation**: The app manages and invokes `PendingIntent` and `RemoteInput` from the original notification.
* **Benefit**: Users can perform actions like "Mark as Read" or "Reply" directly from within Tackry, even after the original notification has been "captured" and processed, provided the source app still has an active session.

### 2. Grouped Android Bubbles Architecture
Tackry utilizes the Android Bubbles API in a specialized "grouped" configuration for surfacing due reminders.
* **Dynamic Shortcuts**: It manages dynamic shortcuts and unique `LocusId` mappings to group multiple "Now" reminders into a single, cohesive bubble interface.
* **UX Optimization**: This approach prevents notification fatigue by consolidating active tasks into a persistent, non-intrusive UI element that doesn't clutter the status bar.

### 3. Highly Configurable Home Screen Widgets
The project includes a robust, instance-specific widget system.
* **Independent Configuration**: Each widget instance (Focus or Quick Action) is independently configurable via its own settings screen, allowing users to customize themes (Light/Dark/System), content sources (Pinned, Now Reminders, or specific Categories), and row-level actions.
* **Performance**: Widgets are optimized for low power consumption while maintaining real-time updates from the Room database.

### 4. Background Content Enrichment
When a user shares a URL to Tackry, the app initiates a background enrichment flow.
* **Heuristic Scraping**: It performs best-effort fetching of OpenGraph metadata (titles, summaries, preview images) and article text.
* **Non-Blocking UI**: The capture flow is optimized to be near-instantaneous, with the enrichment happening asynchronously to ensure the user isn't blocked by network latency.

### 5. Interaction Mapping & Customization
Tackry offers a level of interaction configurability rarely seen in consumer apps.
* **Behavioral Toggles**: Users can define specific behaviors for taps, long-presses, and swipes independently for different sections (Notifications, Tacks, Reminders).
* **Extensible Actions**: The system is designed to easily map UI events to various internal actions like "Remind Now," "Pin," or "Open Source App."

### 6. Privacy-First Local Backup System
Maintaining its commitment to a "local-first" philosophy, Tackry includes a custom backup and restore engine.
* **State Serialization**: It exports the entire Room database along with stored media and application preferences into a single, portable file.
* **Atomic Restore**: The restore process is designed as an atomic "replace-in-place" operation that ensures data integrity across app restarts.
