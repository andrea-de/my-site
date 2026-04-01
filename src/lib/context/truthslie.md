# Project Overview: Truths Lie

Truths Lie is a high-engagement, AI-powered trivia platform where gameplay blends factual knowledge with psychological deception. Built as a modern, cloud-native application, it transforms a classic social game into a scalable content ecosystem. Players navigate multiple game modes—including a globally synchronized "Daily Gauntlet" and thematic "Deep Dives"—to identify which of three statements is the lie.

The platform distinguishes itself through Just-In-Time (JIT) learning, where players can instantly generate and cache context for any statement, and a dynamic difficulty engine that tracks global "deception stats" to show users how effectively they (or the AI) fooled others.

---

## 🏗️ Technical Architecture & Stack

The project employs a Thick Client / Serverless Backend architecture designed for high performance, low operational costs, and future mobile portability.

* **Frontend**: Svelte 4.0 SPA with Tailwind CSS. Chosen for its minimal bundle size and reactive performance. The architecture is "Capacitor-ready," allowing the same codebase to be wrapped as a native iOS/Android app without a Node.js server requirement.
* **Backend**: Supabase (PostgreSQL + Edge Functions). Utilizes a serverless approach for all business logic, ensuring horizontal scalability.
* **AI/LLM**: Multi-provider integration (OpenAI & Anthropic) via the Vercel AI SDK, handling both content generation and explanatory context.
* **Vector Database**: pgvector for semantic deduplication and RAG (Retrieval-Augmented Generation) workflows.

---

## 🏆 Notable Technical Accomplishments

### 1. Distributed LLM Job Queue with Context-Aware Retries
To handle the high latency and potential failures of LLM operations, I implemented a robust database-driven job system.
* **Asynchronous Processing**: Admins can dispatch batches of generation jobs (e.g., "Generate 50 History Deep Dive statements") which are processed by serverless workers.
* **Self-Correcting Retries**: If a job fails or produces a duplicate, the system increments a `retry_count` and updates the `context_data`. On the next attempt, the prompt is dynamically modified to include the failure reason (e.g., "Your previous attempt was too similar to [X]. Try a different angle"), significantly increasing generation success rates.

### 2. Semantic Deduplication via Vector Embeddings
To prevent content fatigue, the system ensures no two statements are semantically identical using OpenAI's `text-embedding-3-small` model.
* **RAG-based Duplicate Check**: Before any AI-generated statement is approved, it is converted into a 1536-dimensional vector.
* **Vector Similarity Search**: A custom PostgreSQL function (`find_similar_statements`) performs a cosine similarity search using pgvector. Any statement with a >85% similarity score is automatically flagged as a duplicate, preventing the database from filling with redundant facts.

### 3. Just-In-Time (JIT) Context Generation & Caching
To balance LLM API costs with user curiosity, I designed a Lazy Loading Context System.
* **On-Demand Explanations**: Statements are initially stored without explanations. When a user clicks "Tell Me More," an Edge Function triggers a targeted LLM call to explain the specific truth or lie.
* **Transparent Caching**: Once generated, the context is persisted to the database. Subsequent users receive the explanation instantly from the cache, reducing API costs by over 99% for popular content.

### 4. Intelligent Content Segmentation
The platform manages isolated content pools to preserve game integrity.
* **Pool Isolation**: Statements are tagged by `pool_type` (Endless, Gauntlet, DeepDive). This ensures that a player who sees a fact in "Endless Mode" won't have the "Daily Gauntlet" spoiled for them later.
* **User Persistence**: Using a denormalized `user_seen_statements` tracking system, the API guarantees that players never see the same statement twice across sessions, unless "Review Mode" is explicitly enabled.

---

## 📈 Real-World Engineering Details

* **State Management**: Utilizes Svelte's derived stores to handle complex game states, including real-time streak tracking, accuracy percentages, and localStorage persistence for anonymous users.
* **Security & RLS**: Implemented rigorous Row Level Security (RLS) in PostgreSQL, ensuring that while the app is a "thick client," users can only access the statements they are supposed to see and cannot manipulate their own global statistics.
* **Multi-Language Support**: The generation pipeline is language-aware, supporting English, Spanish, Italian, German, and French, with the AI-adapter handling both UI-ready JSON and localized explanatory context.
* **Automated Validation**: Developed a Deno-based test suite for Edge Functions that simulates complex database interactions, ensuring 100% reliability for core game loops like answer submission and score calculation.
