# Project Overview: Weatherie

Weatherie is a high-polish, theme-driven weather platform built with Flutter. Unlike traditional weather apps with static designs, Weatherie is built around a polymorphic UI engine that allows for total visual transformations. The project demonstrates advanced expertise in asset management, dynamic UI orchestration, and performance-optimized web delivery. It serves as both a consumer-facing utility and a demonstration of a scalable, schema-driven design system.

---

## 🏆 Notable Technical Accomplishments

### 1. Schema-Driven Dynamic Theming Engine
The core innovation is a decoupled theming architecture that treats the "User Interface" as data rather than hardcoded widgets.
* **Source-Agnostic Asset Resolution**: Developed a `ThemeService` that transparently resolves UI assets (icons, backgrounds, layouts) from three distinct sources: bundled application assets, local device storage (user-created), and remote web servers.
* **JSON-Defined UI States**: Themes are governed by a JSON schema that defines color palettes and layout behaviors (e.g., toggling between minimal and detailed views, repositioning data overlays). This allows the app to pivot from a "pixel-art" aesthetic to a "high-resolution photography" look instantaneously without a restart.
* **Weather-to-Asset Mapping**: Implemented a sophisticated mapping system that translates real-time weather condition codes into theme-specific visual sets, ensuring a cohesive experience across radically different styles.

### 2. On-Device Theme Creation & Packaging
To support a community-driven ecosystem, the app includes a comprehensive "Theme Studio" for end-users.
* **Image Processing Pipeline**: Developed a multi-step creation wizard that handles raw user uploads, utilizing `flutter_exif_rotation` to normalize image data and custom cropping logic to ensure backgrounds fit various mobile aspect ratios.
* **Portable Theme Packaging**: Built an export/import system using the `archive` package. Users can package their custom themes (metadata + binary assets) into a single portable file, which the app can then parse and install into its local filesystem.
* **Asset Inheritance Logic**: Implemented a "mix-and-match" system where users can create a new theme by inheriting iconography from one source while providing custom backgrounds from another.

### 3. Optimized Web Delivery & WASM Pipeline
A major part of the project involves an embedded web demo designed to run as a high-performance micro-app within a landing site.
* **WASM-First Compilation**: Leveraged Flutter’s WebAssembly (WASM) target to achieve near-native rendering performance and smooth 60FPS animations in the browser.
* **Aggressive Bundle Trimming**: Engineered custom post-build Bash scripts that programmatically strip unused assets, symbols, and mock data from the final web bundle, significantly reducing initial load times and network overhead.
* **Bootstrap Injection**: Developed a deployment script that patches the Flutter web bootstrap to allow for dynamic renderer overrides (CanvasKit vs. HTML) via URL parameters, facilitating cross-browser compatibility testing.

### 4. Offline-First Data Architecture
The app is designed for speed and reliability, minimizing reliance on high-latency network requests where possible.
* **Local Geodata Engine**: Instead of querying an API for every city search, the app parses a local `cities.csv` containing thousands of global entries. This enables instantaneous, offline-capable search-as-you-type functionality.
* **Timezone-Aware Normalization**: Implemented custom logic to normalize UTC weather data into the target location's local time, handling complex date formatting (e.g., ordinal suffixes) and solar transit calculations (sunrise/sunset) purely on the client side.

### 5. Extensible UI Framework
The flexibility of the underlying architecture is demonstrated by the inclusion of supplementary features, such as a weather-themed Sudoku game. This serves as a "stress test" for the theming engine, proving that the system can map its dynamic weather icons and color palettes onto complex, interactive grid-based layouts without requiring specialized code for every new style.

---

## 🏗️ Core Stack
* **Framework**: Flutter (Dart)
* **State Management**: Provider (ChangeNotifier-based reactive patterns)
* **Persistence**: SharedPreferences & Local File System (`path_provider`)
* **Processing**: CSV parsing, Zip/Archive management, Image EXIF normalization
* **Deployment**: Custom Bash CI/CD scripts for Web/WASM optimization
