# CineMatch

**Psychologically-grounded film recommendations.** Five questions backed by personality psychology and media motivation research, plus your current emotional state, produce explainable movie suggestions — not collaborative filtering, not "people who liked X also liked Y," but a structured model of *who you are right now* mapped to cinema.

**Live:** [cinemmatch.vercel.app](https://cinemmatch.vercel.app)

---

## Why This Exists

Every recommendation engine you use — Netflix, Spotify, Amazon — runs on collaborative filtering: find users similar to you, suggest what they consumed. This works, but it's a black box. You never know *why* something was recommended, and the system optimizes for engagement, not for what you actually need right now.

CineMatch takes a different approach. Instead of mining your watch history, it builds a real-time psychological profile using research-backed dimensions, then uses an LLM as a film knowledge engine — steered by that profile — to generate recommendations with transparent, per-film explanations of *why this film fits you right now*.

The result: a sad, meaning-seeking solo viewer gets Manchester by the Sea and In the Mood for Love. A restless, high-energy viewer watching with friends gets Mad Max: Fury Road and Oldboy. Same system, radically different output, and you can see exactly why.

---

## Research Basis

The profiling system draws on five established frameworks in personality psychology, media psychology, and cognitive film studies:

### The 5-Axis Model

| Axis | Measures | Research Basis |
|------|----------|---------------|
| **Hedonic ↔ Eudaimonic** | Are you watching for pleasure or meaning? | Oliver & Raney (2011) — hedonic motivation predicts preference for action/comedy; eudaimonic motivation predicts drama and deeper cognitive elaboration during viewing |
| **Arousal Tolerance** | How much pacing intensity and sensory stimulation do you want? | Zuckerman (1994) — sensation seeking as a predictor of media preference; Banerjee et al. (2008) — film mood and arousal as selection drivers |
| **Moral Schema Flexibility** | Do you need clear heroes, or do you enjoy moral ambiguity? | Zillmann's Affective Disposition Theory — enjoyment depends on moral evaluation of characters; Raney (2004) — flexible schemas predict antihero narrative enjoyment |
| **Film Literacy** | How unconventional can the filmmaking be? | Bordwell (1985) — cognitive film theory; experienced viewers develop richer narrative schemas that modulate film processing |
| **Social Context** | Who's watching with you? | Uses & Gratifications Theory — social viewing shifts preferences toward shared-experience films with broader appeal |

### Mood + Coping Style

After profiling, CineMatch captures your current emotional state and — critically — your **coping style**: do you want to lean into that feeling (mood-congruent content, catharsis) or shift away from it (mood-incongruent content, escape)?

This is grounded in **Mood Management Theory** (Zillmann, 1988), extended by the insight that mood regulation isn't purely hedonistic — people sometimes seek media that deepens rather than corrects their emotional state (Oliver & Raney, 2011).

The coping style question produces meaningfully different recommendations:
- **Sad + lean-in** → Manchester by the Sea, In the Mood for Love, Grave of the Fireflies
- **Sad + shift-away** → Amélie, The Grand Budapest Hotel, Moonrise Kingdom

### Key References

- Oliver, M.B. & Raney, A.A. (2011). Entertainment as Pleasurable and Meaningful: Identifying Hedonic and Eudaimonic Motivations for Entertainment Consumption. *Journal of Communication*, 61, 984–1004.
- Zillmann, D. (1988). Mood Management Through Communication Choices. *American Behavioral Scientist*, 31(3), 327–340.
- Zillmann, D. & Cantor, J. (1976). A Disposition Theory of Humor and Mirth. In *Humor and Laughter: Theory, Research and Applications*.
- Raney, A.A. (2004). Expanding Disposition Theory: Reconsidering Character Liking, Moral Evaluations, and Enjoyment. *Communication Theory*, 14(4), 348–369.
- Bordwell, D. (1985). *Narration in the Fiction Film*. University of Wisconsin Press.
- Zuckerman, M. (1994). *Behavioral Expressions and Biosocial Bases of Sensation Seeking*. Cambridge University Press.
- Banerjee, S.C., Greene, K., Krcmar, M. & Bagdasarov, Z. (2008). Who Watches What? Film Preferences. *Journal of Media Psychology*, 20(3), 87–95.
- Mukta, M.S.H., Ali, M.E. & Mahmud, J. (2017). Predicting Movie Genre Preferences from Personality and Values of Social Media Users. *ICWSM 2017*.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                 │
│                                                     │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐ │
│  │ 5-Axis   │→ │ Mood +    │→ │ Results View      │ │
│  │ Questions│  │ Coping    │  │ (explainability   │ │
│  │          │  │ Style     │  │  per film)        │ │
│  └──────────┘  └───────────┘  └───────────────────┘ │
│                      │                    ↑         │
│                      ▼                    │         │
│              ┌──────────────┐             │         │
│              │ buildPrompt  │             │         │
│              │ (structured  │             │         │
│              │  profile →   │             │         │
│              │  LLM prompt) │             │         │
│              └──────┬───────┘             │         │
└─────────────────────┼─────────────────────┼─────────┘
                      │                     │
                      ▼                     │
              ┌──────────────┐              │
              │ Vercel Edge  │──────────────┘
              │ Function     │
              │ /api/recommend│
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Groq API     │
              │ GPT-OSS-120B │
              │ (structured  │
              │  JSON output)│
              └──────────────┘
```

The key design decision: **the research framework is the prompt, not the model.** The LLM serves as an infinite film knowledge base — it knows thousands of films across decades, genres, and regions. The 5-axis profile + mood + coping style become a structured prompt that steers the LLM's knowledge toward psychologically appropriate recommendations. The LLM also self-rates each recommendation on the 5 axes, enabling the visual axis-match display.

This is a hybrid architecture: structured psychological profiling (deterministic) × LLM film knowledge (generative), with explainability surfaced through both the "why this film" prose and the per-axis match bars.

---

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- **Backend**: Vercel Edge Functions
- **LLM**: OpenAI GPT-OSS-120B via Groq (structured JSON output with `json_schema` mode)
- **Deployment**: Vercel

---

## Running Locally

```bash
# Clone
git clone https://github.com/VedantUpadhyay/cinematch.git
cd cinematch

# Install
pnpm install

# Add your Groq API key (get one free at console.groq.com)
echo "GROQ_API_KEY=gsk_your_key_here" > .env.local

# Run with Vercel dev (needed for edge functions)
pnpm dlx vercel dev --local --listen 127.0.0.1:3000 --yes

# Open http://localhost:3000
```

---

## Project Structure

```
cinematch/
├── api/
│   └── recommend.ts            # Vercel Edge Function — LLM proxy + validation
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Shell, header, progress bar, grain overlay
│   │   ├── QuestionCard.tsx    # Single axis question with research citation
│   │   ├── MoodSelector.tsx    # Mood grid + coping style sub-question
│   │   ├── ResultsView.tsx     # Recommendation cards with explainability
│   │   ├── ProfileSummary.tsx  # 5-axis profile visualization
│   │   └── AxisBar.tsx         # Per-axis match bar
│   ├── data/
│   │   ├── questions.ts        # 5 questions with research citations
│   │   └── moods.ts            # 6 moods + 2 coping styles
│   ├── hooks/
│   │   └── useQuestionnaire.ts # Questionnaire state machine
│   └── lib/
│       ├── buildPrompt.ts      # Profile → structured LLM prompt (core IP)
│       └── api.ts              # Client fetch to /api/recommend
└── AGENTS.md                   # Codex agent instructions
```

The most important file is `src/lib/buildPrompt.ts` — this is where the research framework is operationalized into a prompt. It defines each axis with explicit behavioral examples (e.g., "Mad Max: Fury Road is high arousal. Mulholland Drive is low arousal."), enforces genre/decade/region diversity, integrates mood-regulation guidance with coping style, and requires per-film explanations that reference concrete film elements rather than abstract axis labels.

---

## How the Prompt Engineering Works

The system prompt encodes each axis with **contrastive definitions** — not just what high/low means, but explicit film examples to anchor the LLM's interpretation:

> *AROUSAL measures pacing and sensory intensity — fast editing, physical tension, action sequences, chase scenes, visceral cinematography. It does NOT mean thematic darkness. A slow-burn psychological drama is LOW arousal regardless of how disturbing its themes are.*

This distinction — arousal-as-pacing vs. arousal-as-thematic-intensity — was the single biggest quality improvement. Without it, an LLM defaults to recommending dark arthouse films for any profile with high arousal + high literacy, because "intense prestigious film" is a strong prior in training data.

The diversity constraint is enforced both in the prompt ("each recommendation MUST have a different primary genre") and in server-side validation (the edge function checks for duplicate genres and retries if the constraint is violated).

---

## What I Learned

**The research framework matters more than the model.** Swapping from Llama 3.3 70B to GPT-OSS-120B improved quality, but the biggest improvement came from tightening the axis definitions in the prompt. A smarter model with a vague prompt still produces generic output. A well-defined prompt with contrastive examples produces good output even on smaller models.

**Coping style is the most underrated dimension.** Most recommendation systems ignore whether you want mood-congruent or mood-incongruent content. Adding one binary question ("lean into this feeling or shift away?") produced the most dramatic difference in recommendation quality across all the changes made during development.

**Explainability changes how people evaluate recommendations.** When users can see *why* a film was recommended — which axes matched, how the mood-regulation logic worked — they evaluate recommendations more charitably and engage more with films they wouldn't normally choose.

---

## License

MIT
