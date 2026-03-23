# CineMatch — Roadmap & TODO

## 🔴 High Priority

### Batch Film Tagging Pipeline (Hybrid Architecture)
- Replace runtime LLM calls with a pre-tagged film database
- Fetch top 1,000-5,000 films from TMDB API (title, overview, genres, year, runtime, keywords)
- Batch-tag each film on the 5 psychological axes (hedonic, arousal, moralFlex, literacy, social) + 6 mood affinities using OpenAI API via ChatGPT Max subscription
- Use chain-of-thought prompting: model must reason before scoring, output JSON with both scores and reasoning
- Store in a JSON database or SQLite: film_id, tmdb_id, title, year, scores, mood_affinities, reasoning, model_version, tagged_date
- Runtime: pure weighted Euclidean distance matching (instant, deterministic, zero cost per request)
- Optionally keep LLM for generating "why" explanations, or pre-generate those in the batch job too
- Solves: hallucination risk, latency, cost, stochastic inconsistency
- Reference: TMDB API docs at https://developer.themoviedb.org/

### TMDB Verification Layer
- Cross-reference every LLM recommendation against TMDB to verify the film exists
- Prevents hallucinated film titles
- Can be implemented as middleware in the edge function even before full batch tagging migration
- Use TMDB search API: GET /search/movie?query={title}&year={year}

### "Why Not This Film?" Feature
- User types a film title, system explains why it wasn't recommended based on their profile
- Single additional LLM call with: user profile + film metadata + instruction to explain the mismatch
- Demonstrates discriminative reasoning — shows the system can reject films, not just accept them
- High differentiation from every other recommendation system

## 🟡 Medium Priority

### Feedback Collection (Thumbs Up/Down)
- Add thumbs up/down buttons per recommendation in ResultsView
- Store anonymously via Vercel KV or similar lightweight storage
- Schema: { profile_hash, film_title, rating (up/down), timestamp }
- After 100+ ratings: analyze which axis configurations produce the most positive ratings
- Lightweight validation without a formal user study

### Quick Mode (2-Question Fast Path)
- Offer a fast path: only hedonic/eudaimonic axis + mood + coping style (3 interactions total)
- These capture the highest-variance dimensions based on Oliver & Raney (2011)
- Full 5-axis profile available as "Go deeper" option
- Reduces user friction from 7 interactions to 3

### Cultural Context Preference
- Add optional question: "I primarily watch: Hollywood / European / East Asian / South Asian / Latin American / African / Global mix"
- Steers the LLM (or filters the tagged database) toward the user's preferred cinema tradition
- Addresses the Western bias in both LLM training data and the research literature we drew from
- Low friction (single optional question), high impact on recommendation diversity

### Profile Sharing via URL
- Encode the 5-axis profile + mood + coping style as URL parameters
- Shareable link: cinemmatch.vercel.app?h=0.65&a=0.9&m=0.85&l=0.7&s=0.6&mood=restless&cope=lean-in
- Enables "share your taste fingerprint" social feature
- Also enables bookmarking a profile to revisit later

### "Explore More" Button
- After seeing 5 recommendations, button to regenerate with same profile
- Pass previous titles as exclusion list to the LLM prompt
- Shows the system has depth beyond its first 5 picks

## 🟢 Low Priority / Research Directions

### Profile Comparison ("Movie Night Compromise")
- Two people take the quiz, system finds the midpoint profile
- Recommends films that work for both viewers
- Could use geometric mean of axis scores as the compromise profile

### Explanation Quality Labeling
- Label explanations as "reasoned suggestions" rather than implying algorithmic causality
- Based on feedback that LLM explanations are post-hoc rationalizations, not causal transparency
- Honest framing builds more trust long-term

### Validated Scale Integration
- Current questions are state-level proxies, not validated trait measures (by design)
- For research credibility: offer optional extended profiling using adapted items from Oliver & Raney's hedonic/eudaimonic scale and Zuckerman's Sensation Seeking Scale
- Would enable academic validation studies

### Film Literacy Bias Acknowledgment
- The literacy axis correlates with education and cultural access
- Add explicit acknowledgment in the UI or FAQ
- Consider reframing from "How adventurous are you with film?" to "How familiar are you with non-mainstream cinema?"

### Prompt Tuning for Comedy and World Cinema
- T9 (comedy stress test) showed the system under-recommends pure comedies for high-hedonic profiles
- T6 (world cinema) showed improvement with prompt additions but caused schema compliance issues
- Revisit after migrating to batch-tagged database (where genre diversity is enforced by the math, not the prompt)
- Note: prompt additions that fix T6/T9 currently break T1 JSON schema compliance — needs careful testing

### Cross-Cultural Validation
- Cited research is predominantly Western (U.S./European samples)
- Film literacy, moral schema flexibility, and mood regulation vary cross-culturally
- Consider partnering with non-Western film communities for evaluation

## 🔧 Technical Debt

### Test Suite Heuristics
- Non-English film detection uses a lookup set of ~80 known titles — should be expanded or replaced with TMDB language metadata once batch tagging is in place
- Comedy detection checks genre string only — misses films like Shaun of the Dead tagged as "Horror"
- T1 JSON schema failures may be rate-limit-induced rather than prompt issues — needs investigation with reliable API access

### Groq Rate Limits
- Free tier: 8000 TPM for GPT-OSS-120B
- Test suite requires ~36K tokens total — exceeds per-minute limit
- Options: upgrade Groq plan ($5/month dev tier), spread test runs over longer delays, or migrate to batch-tagged architecture (eliminates runtime LLM dependency)

### Build Configuration
- scripts/test-quality.ts has TypeScript issues that pnpm build catches but pnpm tsc --noEmit does not
- Needs tsconfig alignment or separate tsconfig for scripts/

---

*Generated from development session notes. Last updated: 2026-03-22.*
