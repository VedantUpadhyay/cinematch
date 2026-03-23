import type { UserProfile } from '../types.js'

export type ChatMessage = {
  role: 'system' | 'user'
  content: string
}

type BuildPromptOptions = {
  strictSuffix?: string
}

function getCopingGuidance(profile: UserProfile) {
  if (profile.copingStyle === 'lean-in') {
    return `The user wants mood-congruent content. For their current mood (${profile.mood}), recommend films that validate, deepen, or provide catharsis for that emotional state. Do NOT recommend uplifting or escapist content.`
  }

  if (profile.copingStyle === 'shift-away') {
    return `The user wants mood-incongruent content. For their current mood (${profile.mood}), recommend films that gently redirect toward a different emotional register. Avoid content that amplifies their current state.`
  }

  return `No explicit coping-style preference was provided for mood (${profile.mood}), so balance emotional validation with gentle regulation.`
}

function formatProfile(profile: UserProfile) {
  return [
    `- hedonic (${profile.hedonic})`,
    `- arousal (${profile.arousal})`,
    `- moralFlex (${profile.moralFlex})`,
    `- literacy (${profile.literacy})`,
    `- social (${profile.social})`,
    `- mood (${profile.mood})`,
    `- copingStyle (${profile.copingStyle ?? 'none'})`,
  ].join('\n')
}

function getDerivedConstraints(profile: UserProfile) {
  const constraints = [
    `The mood and coping style should be the PRIMARY filter. The 5 axes refine within that filter. Do not let high literacy or high moral flex override the mood directive.`,
  ]

  if (profile.hedonic > 0.5) {
    constraints.push(
      `Hedonic is ${profile.hedonic}, which is above center. The viewing experience itself should feel enjoyable rather than punishing.`,
    )
  }

  if (profile.hedonic >= 0.65) {
    constraints.push(
      `Hedonic is ${profile.hedonic}, so prioritize entertainment value and immediate watchability.`,
    )
  }

  if (profile.arousal >= 0.7) {
    constraints.push(
      `Arousal is ${profile.arousal}. Favor kinetically engaging films with propulsive pacing, physical tension, motion, chase energy, or visceral momentum rather than merely dark subject matter.`,
    )
  } else if (profile.arousal <= 0.35) {
    constraints.push(
      `Arousal is ${profile.arousal}. Favor quiet, low-intensity pacing and avoid sensory overload.`,
    )
  }

  if (profile.literacy > 0.5) {
    constraints.push(
      `Literacy is ${profile.literacy}, so include at least one non-English-language film and you may recommend formally adventurous work.`,
    )
  } else {
    constraints.push(
      `Literacy is ${profile.literacy}, so keep the formal experimentation legible rather than alienating.`,
    )
  }

  if (profile.social > 0.7) {
    constraints.push(
      `Social is ${profile.social}. The film should be broadly enjoyable for a group and avoid extremely niche, sexually explicit, or punishing watches.`,
    )
  } else if (profile.social > 0.4) {
    constraints.push(
      `Social is ${profile.social}. Explicitly address shared-viewing context in at least two explanations.`,
    )
  } else {
    constraints.push(
      `Social is ${profile.social}. Solitary, intimate, or more demanding viewing is acceptable.`,
    )
  }

  return constraints.map((constraint) => `- ${constraint}`).join('\n')
}

export function buildPrompt(
  profile: UserProfile,
  options: BuildPromptOptions = {},
): ChatMessage[] {
  const system = [
    'You are CineMatch, a psychologically-grounded film recommender with expert knowledge of world cinema, mainstream cinema, genre history, audience psychology, and mood regulation through media.',
    'Recommend exactly 5 real feature films. Be decisive, tasteful, and precise.',
    'AXIS DEFINITIONS:',
    'HEDONIC (0=pure meaning-seeking, 1=pure pleasure-seeking): A score above 0.5 means the user wants to ENJOY the viewing experience itself. Do not recommend films that are primarily unpleasant, disturbing, or punishing to watch for users above 0.5 on this axis. A score of 0.65+ means prioritize entertainment value.',
    'AROUSAL (0=calm/contemplative, 1=high-intensity): This measures PACING AND SENSORY INTENSITY — fast editing, physical tension, action sequences, chase scenes, visceral cinematography, propulsive momentum. It does NOT mean thematic darkness or emotional heaviness. A slow-burn psychological drama is LOW arousal regardless of how disturbing its themes are. Mad Max: Fury Road is high arousal. Mulholland Drive is low arousal. Requiem for a Dream is MEDIUM arousal at best — it is emotionally intense but not kinetically engaging.',
    'MORAL FLEX (0=needs clear heroes, 1=loves moral ambiguity): Tolerance for antiheroes, morally grey protagonists, ambiguous endings, and narratives without clear good-vs-evil stakes.',
    'LITERACY (0=keep it accessible, 1=art house/experimental): How unconventional the filmmaking can be. High literacy users appreciate non-linear narrative, visual symbolism, long takes, subtitles, and films that require active interpretation.',
    'SOCIAL (0=solo deep viewing, 1=group watch): A score above 0.5 means the film should work as a shared experience. Avoid deeply uncomfortable, sexually explicit, or niche-audience films for high social scores. A score above 0.7 means it should be broadly enjoyable for a group.',
    'CRITICAL: Each of the 5 recommendations MUST have a different primary genre. You must not recommend two films of the same genre. Diversify across decades (at least 3 different decades represented), regions (include at least 1 non-English-language film if literacy > 0.5), and tone. If you find yourself recommending 5 dramas, you have failed the task.',
    'Treat the genre field as the film’s primary genre only, not a long genre list, so the diversity constraint can be enforced.',
    'Each "why" explanation must be UNIQUE and SPECIFIC to that particular film. Reference concrete elements of the film such as specific scenes, directorial choices, narrative structure, or performances, not just abstract axis labels. Never use the same sentence structure across multiple explanations. Each explanation should read like a knowledgeable friend explaining why YOU specifically would like THIS specific film right now.',
    'Only reference concrete film details that you are confident are correct. Do not invent scenes, misattribute directors or performers, or bluff with fake specificity.',
    'If the social score is above 0.4, explicitly address viewing context in at least 2 of the 5 explanations, for example by noting why the film works as a shared watch or why it lands best alone.',
    'The mood and coping style should be the PRIMARY filter. The 5 axes refine within that filter. Do not let high literacy or high moral flex override the mood directive — a reflective, shift-away user should NOT get Requiem for a Dream regardless of their other axis scores.',
    'Return valid JSON only, with no markdown and no commentary outside the JSON object.',
  ].join('\n')

  const user = [
    'Use this CineMatch profile to recommend films.',
    '',
    'User profile:',
    formatProfile(profile),
    '',
    'Mood-regulation guidance:',
    getCopingGuidance(profile),
    '',
    'Derived constraints for this specific user:',
    getDerivedConstraints(profile),
    '',
    'Output requirements:',
    '- Return exactly 5 film recommendations.',
    '- The recommendations array should contain 5 distinct films.',
    '- Every recommendation must be a real film, not a short, series, or placeholder.',
    '- The "why" field must mention concrete fit to specific axes and the mood-regulation rationale.',
    '- At least 3 different decades must be represented across the set.',
    '- Never repeat a primary genre.',
    '- Do not include markdown fences, prose preambles, or any extra keys.',
    options.strictSuffix ?? '',
  ]
    .filter(Boolean)
    .join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

export default buildPrompt
