# CineMatch

**Psychologically-grounded film recommendations.** Five questions backed by personality psychology and media motivation research, plus your current emotional state, produce explainable movie suggestions — not collaborative filtering, not "people who liked X also liked Y," but a structured model of *who you are right now* mapped to cinema.

**Live:** [cinemmatch.vercel.app](https://cinemmatch.vercel.app)

---

## Why This Exists

Every recommendation engine you use — Netflix, Spotify, Amazon — runs on collaborative filtering: find users similar to you, suggest what they consumed. This works, but it's a black box. You never know *why* something was recommended, and the system optimizes for engagement, not for what you actually need right now.

CineMatch takes a different approach. Instead of mining your watch history, it builds a real-time psychological profile using research-backed dimensions, scores a pre-tagged film corpus with pure math, and then uses an LLM only to explain *why these already-selected films fit you right now*.

The result: a sad, meaning-seeking solo viewer gets a quiet, melancholic spread like *Yearning*, *The Color of Paradise*, and *Shoah*. A restless, high-energy viewer gets a kinetic set like *Andhadhun*, *Akira*, and *Memento*. Same system, radically different output, and you can see exactly why.

---

## Research Basis

The profiling system draws on five established frameworks in personality psychology, media psychology, and cognitive film studies:

### The 5-Axis Model

| Axis | Measures | Research Basis |
|------|----------|---------------|
| **Hedonic ↔ Eudaimonic** | Are you watching for pleasure or meaning? | Oliver & Raney (2011) — hedonic motivation predicts preference for action/comedy; eudaimonic motivation predicts drama and deeper cognitive elaboration during viewing |
| **Arousal Tolerance** | How much pacing intensity and sensory stimulation do you want? | Zuckerman (1994) — sensation seeking as a predictor of media preference; Banerjee et al. (2008) — film mood and arousal as selection drivers |
| **Moral Ambiguity Tolerance** | Do you need clear heroes, or do you enjoy moral ambiguity? | Zillmann's Affective Disposition Theory — enjoyment depends on moral evaluation of characters; Raney (2004) showed viewers with higher tolerance for moral ambiguity enjoy antihero narratives more |
| **Complexity Tolerance** | How much narrative complexity do you enjoy? | Bordwell (1985) — Cognitive Film Theory; viewers develop narrative schemas that shape their tolerance for structural complexity, non-linear storytelling, and unconventional filmmaking techniques |
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
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                      │
│                                                             │
│  ┌──────────────┐  ┌─────────────────────┐  ┌────────────┐ │
│  │ User Profile │→ │ Scoring Engine      │→ │ LLM        │→│
│  │ (5 axes +    │  │ (math, ~2ms)        │  │ explanations│ │
│  │ mood + cope) │  │ weighted distance + │  │ only        │ │
│  │              │  │ mood affinity + MMR │  │             │ │
│  └──────────────┘  └─────────────────────┘  └────────────┘ │
│                                                             │
│                             ↓                               │
│                    Results View / Display                   │
└─────────────────────────────────────────────────────────────┘
```

The major architectural decision now is: **film selection is deterministic, explanations are generative.** The recommendation engine scores a bundled corpus of 500 pre-tagged films using weighted Euclidean distance on the 5 axes, combines that with mood×coping affinity, and then applies MMR (Maximal Marginal Relevance) to ensure the final 5 are diverse across genre, decade, and region.

The LLM is still useful, but its role is narrower and safer: once the math engine has already selected 5 real TMDB-backed films, GPT-OSS writes the taglines and "why this film" explanations. That removes hallucinated titles from the critical path, makes selection effectively instant, and gives the app a graceful fallback path when the explanation layer is rate-limited.

---

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- **Backend**: Vercel Edge Functions
- **Scoring Engine**: weighted Euclidean distance + mood affinity + MMR diversification
- **Film Corpus**: 500 pre-tagged, cross-validated films bundled into the app at build time
- **LLM**: OpenAI GPT-OSS-120B via Groq for explanation generation only
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
# Without it, CineMatch still returns the 5 selected films with generic fallback explanations.
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
│   └── recommend.ts            # Math-first selector + explanation proxy
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Shell, header, progress bar, grain overlay
│   │   ├── QuestionCard.tsx    # Single axis question with research citation
│   │   ├── MoodSelector.tsx    # Mood grid + coping style sub-question
│   │   ├── ResultsView.tsx     # Recommendation cards with explainability
│   │   ├── ProfileSummary.tsx  # 5-axis profile visualization
│   │   └── AxisBar.tsx         # Per-axis match bar
│   ├── data/
│   │   ├── films.json          # 500-film reconciled corpus (runtime source of truth)
│   │   ├── questions.ts        # 5 questions with research citations
│   │   └── moods.ts            # 6 moods + 2 coping styles
│   ├── hooks/
│   │   └── useQuestionnaire.ts # Questionnaire state machine
│   └── lib/
│       ├── scoringEngine.ts    # Weighted matching + MMR film selection
│       ├── buildPrompt.ts      # Explanation-only prompt for the selected 5 films
│       └── api.ts              # Client fetch to /api/recommend
└── AGENTS.md                   # Codex agent instructions
```

The most important runtime file is `src/lib/scoringEngine.ts` — this is where the profile becomes a ranked, diversified film set. The most important data asset is `src/data/films.json`, a bundled corpus of 500 TMDB-backed films whose scores were tagged offline and then reconciled across GPT-5.4 and Gemini 3.

---

## How Selection Works

Each film in the corpus carries:
- 5 axis scores: `hedonic`, `arousal`, `moralFlex`, `literacy`, `social`
- 12 mood×coping affinities: `sad_lean_in`, `sad_shift_away`, etc.
- TMDB-backed metadata: title, year, genres, language, overview, poster

At runtime, CineMatch computes:
- **Axis distance**: weighted Euclidean distance between the user profile and each film’s 5-axis score vector
- **Mood affinity**: direct lookup using `mood + copingStyle`
- **Match score**: `moodAffinity * 1.5 - axisDistance`

Then it uses **Maximal Marginal Relevance (MMR)** to choose the final 5, so the set does not collapse into one genre, one decade, or one region. Similarity is penalized if two films share the same primary genre, decade, or original language.

The practical effect is that diversity is now enforced by math rather than prompt compliance.

## How Prompt Engineering Works Now

Prompt engineering is now scoped to the explanation layer only. Once 5 films are selected, the edge function sends the user profile plus those exact films to GPT-OSS-120B and asks it to do one job only: write taglines and distinct, concrete explanations for why each film matches this person right now.

If the LLM call fails, the API still returns the same 5 films with generic fallback copy. Selection never depends on provider uptime.

---

## What I Learned

**The biggest quality win was taking film selection away from the LLM.** The prompt mattered, but no amount of prompt tuning was as reliable as moving recommendation choice into a deterministic scoring engine with a pre-tagged corpus.

**Coping style is the most underrated dimension.** Most recommendation systems ignore whether you want mood-congruent or mood-incongruent content. Adding one binary question ("lean into this feeling or shift away?") produced the most dramatic difference in recommendation quality across all the changes made during development.

**Cross-validation matters when you turn taste into numbers.** Reconciling GPT-5.4 and Gemini 3 scores forced the project to confront disagreements explicitly instead of trusting a single model’s tagging priors.

**Explainability still matters, but it is now decoupled from selection.** The system can select robustly even if the explanation model is down, which is a much better reliability boundary.

---

## License

MIT
