# AGENTS.md — CineMatch

## Project Overview

CineMatch is a psychologically-grounded movie recommendation web app. Users answer 5 research-backed profiling questions (based on Big Five personality traits, Oliver & Raney's hedonic/eudaimonic motivation model, Zillmann's Affective Disposition Theory, and Cognitive Film Theory) plus a current emotional state selector. The resulting 5-axis profile + mood is sent as a structured prompt to an LLM API, which returns personalized film recommendations with per-axis explainability.

**Architecture: Hybrid**
- Frontend: structured questionnaire captures a numerical psychological profile
- Backend proxy: Vercel Edge Function forwards the profile to an LLM (Groq API serving Llama) and returns structured recommendations
- The LLM is the film knowledge engine; the research framework is the structured prompt that makes output non-generic
- Recommendations include per-axis match explanations and mood-regulation rationale

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- **Backend**: Vercel Edge Functions (`/api` directory)
- **LLM Provider**: Groq API (model: `llama-3.3-70b-versatile` or latest available)
- **Deployment**: Vercel (handles both static frontend + edge functions)
- **Package Manager**: pnpm

## Project Structure

```
cinematch/
├── AGENTS.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json
├── tailwind.config.ts
├── postcss.config.js
├── index.html
├── .env.local                  # GROQ_API_KEY (never committed)
├── .gitignore
├── api/
│   └── recommend.ts            # Vercel Edge Function — LLM proxy
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css               # Tailwind base + custom styles
│   ├── types.ts                # Shared types (Profile, Movie, Recommendation)
│   ├── data/
│   │   ├── questions.ts        # 5-axis question definitions with research citations
│   │   └── moods.ts            # Mood options
│   ├── lib/
│   │   ├── buildPrompt.ts      # Constructs the structured LLM prompt from profile
│   │   └── api.ts              # Client-side fetch to /api/recommend
│   ├── components/
│   │   ├── QuestionCard.tsx     # Single axis question with options
│   │   ├── MoodSelector.tsx     # Mood grid
│   │   ├── ResultsView.tsx     # Recommendation cards with explainability
│   │   ├── ProfileSummary.tsx  # Shows the 5-axis profile + mood
│   │   ├── AxisBar.tsx         # Mini match visualization bar
│   │   └── Layout.tsx          # Header, progress bar, grain overlay
│   └── hooks/
│       └── useQuestionnaire.ts # State machine for questionnaire flow
└── public/
    └── favicon.svg
```

## Commands

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Preview production build: `pnpm preview`
- Deploy: `vercel` (or `vercel --prod` for production)
- Type check: `pnpm tsc --noEmit`

## Conventions

- Use functional components with hooks. No class components.
- All components are TypeScript (`.tsx`). All logic files are `.ts`.
- Use Tailwind utility classes for styling. Avoid inline styles.
- Keep components focused — one component per file, one job per component.
- State management: React useState/useReducer only. No external state library.
- The questionnaire flow is a simple step-based state machine, not a router.
- All LLM interaction goes through the `/api/recommend` edge function. The frontend NEVER holds API keys.
- The structured prompt in `buildPrompt.ts` is the core IP — it encodes the research framework.

## Design Language

- **Palette**: Dark background (#0D0D0D to #1A1510), gold accent (#D4A843), warm copper (#C4956A), muted lavender for research citations (#8B7EC8), text on dark (#E8E0D4)
- **Typography**: `'Courier New', monospace` for labels/metadata, `'Georgia', serif` for body/questions
- **Aesthetic**: Film-noir editorial. Grain texture overlay. Subtle fade transitions between steps. No emoji in UI chrome (emojis only in option labels). Not playful — quietly sophisticated.
- **Formatting**: Progress bar at top. Research citations shown in muted card below each question. Results show per-film explainability cards.

## LLM Prompt Contract

The prompt sent to the LLM must:
1. Include the full 5-axis numerical profile with axis labels
2. Include the current mood state
3. Request exactly 5 film recommendations
4. Require each recommendation to include: title, year, genre, a 1-sentence tagline, a "why this film" paragraph referencing specific axes, and self-rated axis scores (0-1 scale for each of the 5 axes)
5. Request JSON output — no markdown, no preamble
6. Include a system message establishing the recommender persona with film expertise

## Error Handling

- If the LLM API call fails, show a graceful error with a retry button.
- If the response doesn't parse as valid JSON, retry once with a stricter prompt, then show error.
- Loading state: show skeleton cards with a film-themed loading message.

## Testing

- After making changes to any component, verify the dev server still runs without errors.
- After modifying the API route, test with `curl` or the dev server's fetch.
- Verify the full flow: landing → 5 questions → mood → loading → results with explanations.

## What NOT To Do

- Do not use `localStorage` or `sessionStorage`.
- Do not add authentication or user accounts.
- Do not add a database. This is a stateless app.
- Do not add more than 5 profiling questions.
- Do not hardcode movie data in the frontend for recommendations (the whole point is LLM-generated).
- Do not expose API keys in client-side code.
- Do not use Next.js — this is Vite + Vercel Edge Functions.
