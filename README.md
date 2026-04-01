# Andrea de Candia - Portfolio & AI Agent

This is the source code for my personal portfolio website, built with SvelteKit and featuring an integrated AI assistant powered by Google Gemini.

## 🚀 Features

- **AI-First UX:** A custom-built AI chat interface that acts as a technical recruiter assistant.
- **Deep Technical Context:** The AI is grounded in my specific technical philosophy and project history.
- **Real-time Interactions:** Interactive UI components using Anime.js and Vivus for SVG animations.
- **Visit Tracking:** Custom-built analytics and visit tracking system integrated with Upstash Redis.
- **Modern Tech Stack:** SvelteKit 4, Vite, and Vercel for deployment.

## 🤖 Updating the AI Context

The AI assistant is grounded using two main files. To update what the AI knows about me, modify:

1.  **`src/lib/knowledge.md`**: Contains deep technical context, architectural philosophy, and specific work experience narratives.
2.  **`src/lib/context/profile.json`**: The structured data source for my work history, skills, and projects.

The AI uses these files in its system prompt to provide high-signal, concise answers.

## 🛠️ Development

### Prerequisites
- Node.js 22.x
- A Google Gemini API Key (set in `.env` as `GEMINI_API_KEY`)
- Upstash Redis credentials (for visit tracking)

### Setup
```bash
npm install
cp .env.example .env
# Fill in your API keys in .env
```

### Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run check`: Run Svelte-check for type and syntax errors
- `npm run format`: Format code with Prettier
- `npm run lint`: Run ESLint and Prettier checks

## 🧪 Testing
```bash
npx playwright install
npm run test
```

## 📄 License
This project is private. All rights reserved.
