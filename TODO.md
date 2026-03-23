# CineMatch — Roadmap & TODO

## 🔴 High Priority

### Corpus Expansion Pipeline (Post-Migration)
- The runtime scoring-engine migration is now complete: CineMatch selects films from a bundled 500-film corpus using weighted distance + mood affinity + MMR
- Next step: expand the corpus from 500 to 1,000-5,000 films using the existing TMDB fetch + offline tagging pipeline
- Keep the same data model: tmdb_id, title, year, scores, mood_affinities, reasoning, model_version, tagged_date
- Re-run cross-validation after each expansion wave so new films are not trusted from a single model pass
- Reference: TMDB API docs at https://developer.themoviedb.org/

### Calibration Review Pass
- Manually review the 55 GPT-5.4 × Gemini 3 conflicted films in `data/reconciliation_conflicts.json`
- Spot-check the 236 calibration-flagged films for floor/ceiling effects
- Focus especially on moralFlex floor compression, comedy under-tagging, and world-cinema literacy scoring
- After review, regenerate `films_final.json` and refresh the bundled `src/data/films.json`

### Explanation Layer Hardening
- Keep film selection fully deterministic, but improve the explanation layer
- Cache explanation responses by profile hash + film set to cut latency and Groq cost
- Explore pre-generating short explanation templates for common profile clusters as a no-LLM fallback beyond the current generic copy

### "Why Not This Film?" Feature
- User types a film title, system explains why it wasn't recommended based on their profile
- Single additional LLM call with: user profile + selected film set + candidate film metadata + instruction to explain the mismatch
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
- Steers the scoring engine toward the user's preferred cinema tradition using reweighting or post-filtering
- Addresses the Western bias in both LLM training data and the research literature we drew from
- Low friction (single optional question), high impact on recommendation diversity

### Profile Sharing via URL
- Encode the 5-axis profile + mood + coping style as URL parameters
- Shareable link: cinemmatch.vercel.app?h=0.65&a=0.9&m=0.85&l=0.7&s=0.6&mood=restless&cope=lean-in
- Enables "share your taste fingerprint" social feature
- Also enables bookmarking a profile to revisit later

### "Explore More" Button
- After seeing 5 recommendations, button to regenerate with same profile
- Pass previous titles as an exclusion set to the scoring engine before the MMR pass
- Keep the explanation LLM scoped to the newly selected films only
- Shows the system has depth beyond its first 5 picks while preserving deterministic selection

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

### Scoring Calibration for Comedy and World Cinema
- T9 (comedy stress test) showed that pure comedy tagging still needs work for high-hedonic, low-literacy profiles
- T6 (world cinema) showed that corpus composition and literacy tags still bias toward safe prestige picks unless explicitly corrected
- Revisit the film-level tags and mood affinities now that genre diversity is enforced by MMR instead of prompt constraints
- Consider per-axis calibration curves instead of a single global weighting scheme

### Cross-Cultural Validation
- Cited research is predominantly Western (U.S./European samples)
- Film literacy, moral schema flexibility, and mood regulation vary cross-culturally
- Consider partnering with non-Western film communities for evaluation

## 🔧 Technical Debt

### Source Corpus Generation
- `src/data/films.json` is generated from `data/films_final.json` and then committed so the app can bundle it at build time
- Automate that copy step with a dedicated script to avoid manual drift between the reconciled dataset and the runtime corpus
- Add a checksum or metadata assertion so the app can detect stale bundled data

### Test Suite Heuristics
- Non-English film detection uses a lookup set of ~80 known titles — should be expanded or replaced with TMDB language metadata once batch tagging is in place
- Comedy detection checks genre string only — misses films like Shaun of the Dead tagged as "Horror"
- The quality suite still evaluates recommendation outputs, but the explanation layer and selection layer now fail in different ways and should be tested separately

### Groq Rate Limits
- Free tier: 8000 TPM for GPT-OSS-120B
- The app is now resilient because film selection no longer depends on Groq, but explanation latency and test throughput still do
- Options: upgrade Groq plan ($5/month dev tier), cache explanations, or pre-generate explanation text for common profiles

### Reconciliation Audit Trail
- Gemini output had heavy `tmdb_id` drift and required title + batch-position fallback during reconciliation
- Preserve the reconciliation logic as a standalone script rather than a one-off data step
- Add explicit provenance fields if future datasets merge more than two model taggers

---

*Generated from development session notes. Last updated: 2026-03-23.*
