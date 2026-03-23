import type { UserProfile } from '../types.js'
import type { ScoredFilm } from './scoringEngine.js'

export type ChatMessage = {
  role: 'system' | 'user'
  content: string
}

type BuildPromptOptions = {
  strictSuffix?: string
}

function getCopingGuidance(profile: UserProfile) {
  if (profile.copingStyle === 'lean-in') {
    return `The user wants mood-congruent content for their current mood (${profile.mood}), so explain how each film validates, deepens, or provides catharsis for that state.`
  }

  if (profile.copingStyle === 'shift-away') {
    return `The user wants mood-incongruent content for their current mood (${profile.mood}), so explain how each film gently redirects them toward a different emotional register.`
  }

  return `No explicit coping-style preference was provided for mood (${profile.mood}), so balance emotional validation with gentle regulation in your explanations.`
}

function formatProfile(profile: UserProfile) {
  return [
    `- HEDONIC (${profile.hedonic})`,
    `- AROUSAL (${profile.arousal})`,
    `- MORAL AMBIGUITY TOLERANCE / moralFlex (${profile.moralFlex})`,
    `- COMPLEXITY TOLERANCE / literacy (${profile.literacy})`,
    `- SOCIAL (${profile.social})`,
    `- MOOD (${profile.mood})`,
    `- COPING STYLE (${profile.copingStyle ?? 'none'})`,
  ].join('\n')
}

function formatSelectedFilms(films: ScoredFilm[]) {
  return films
    .map((film, index) => {
      return [
        `${index + 1}. ${film.title} (${film.year})`,
        `   Primary genre: ${film.genres[0] ?? 'Unknown'}`,
        `   Genres: ${film.genres.join(', ')}`,
        `   Language: ${film.original_language}`,
        `   Overview: ${film.overview}`,
        `   Pre-tagged axis scores: HEDONIC=${film.scores.hedonic}, AROUSAL=${film.scores.arousal}, MORAL AMBIGUITY TOLERANCE / moralFlex=${film.scores.moralFlex}, COMPLEXITY TOLERANCE / literacy=${film.scores.literacy}, SOCIAL=${film.scores.social}`,
        `   Selector stats: matchScore=${film.matchScore}, axisDistance=${film.axisDistance}, moodAffinity=${film.moodAffinity}, diversityBonus=${film.diversityBonus}`,
      ].join('\n')
    })
    .join('\n\n')
}

export function buildExplanationPrompt(
  profile: UserProfile,
  films: ScoredFilm[],
  options: BuildPromptOptions = {},
): ChatMessage[] {
  const system = [
    'You are a film expert writing personalized explanations for pre-selected movies in CineMatch.',
    'You are NOT choosing the films. You must write about the exact 5 films provided, in the same order, with no substitutions.',
    'For each film, write a unique 2-3 sentence explanation of why it matches this user right now. Reference concrete film elements such as scenes, performances, directorial style, structure, tone, pacing, or emotional texture.',
    'Each explanation must sound different in structure and emphasis. Do not repeat sentence patterns.',
    'Use the provided pre-tagged axis scores as the baseline. You may refine them slightly, but keep them close to the supplied values and do not invent radically different scores.',
    'Return valid JSON only, with no markdown and no commentary outside the JSON object.',
  ].join('\n')

  const user = [
    'Explain why these pre-selected films match this CineMatch profile.',
    '',
    'User profile:',
    formatProfile(profile),
    '',
    'Mood-regulation context:',
    getCopingGuidance(profile),
    '',
    'Selected films to explain:',
    formatSelectedFilms(films),
    '',
    'Output requirements:',
    '- Return exactly 5 items in recommendations.',
    '- Use the exact same 5 films and keep the same order.',
    '- Every item must include title, year, genre, tagline, why, and axisScores.',
    '- The genre field should be the film’s primary genre only.',
    '- The tagline should be a single sentence.',
    '- The why field should explain the psychological fit for this user right now, not offer general praise.',
    '- Do not include markdown fences, prose preambles, or any extra top-level keys.',
    options.strictSuffix ?? '',
  ]
    .filter(Boolean)
    .join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

export default buildExplanationPrompt
