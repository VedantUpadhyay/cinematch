import type { UserProfile } from '../types.js'

export type ChatMessage = {
  role: 'system' | 'user'
  content: string
}

type BuildPromptOptions = {
  strictSuffix?: string
}

function formatProfile(profile: UserProfile) {
  return [
    `- hedonic (${profile.hedonic}): higher means more hedonic/fun-seeking, lower means more eudaimonic/meaning-seeking`,
    `- arousal (${profile.arousal}): higher means more intensity/sensation-seeking, lower means calmer viewing`,
    `- moralFlex (${profile.moralFlex}): higher means more comfort with moral ambiguity, lower means preference for clear moral alignment`,
    `- literacy (${profile.literacy}): higher means more adventurous film literacy, lower means preference for accessible mainstream storytelling`,
    `- social (${profile.social}): higher means broad social/group watch context, lower means solitary/deeper personal viewing`,
    `- mood (${profile.mood})`,
  ].join('\n')
}

export function buildPrompt(
  profile: UserProfile,
  options: BuildPromptOptions = {},
): ChatMessage[] {
  const system = [
    'You are CineMatch, a psychologically-grounded film recommender with expert knowledge of world cinema, mainstream cinema, genre history, audience psychology, and mood regulation through media.',
    'Your job is to recommend films that fit a structured 5-axis psychological profile and the user\'s current emotional state.',
    'You must be specific, tasteful, and non-generic.',
    'You must return valid JSON only, with no markdown and no commentary outside the JSON object.',
  ].join(' ')

  const user = [
    'Use this CineMatch profile to recommend films.',
    '',
    'User profile:',
    formatProfile(profile),
    '',
    'Return exactly 5 film recommendations.',
    'Output a JSON object with this exact top-level shape:',
    '{',
    '  "recommendations": [',
    '    {',
    '      "title": "string",',
    '      "year": 2000,',
    '      "genre": "string",',
    '      "tagline": "one sentence",',
    '      "why": "one paragraph that explicitly references the user\'s axes and mood-regulation rationale",',
    '      "axisScores": {',
    '        "hedonic": 0.0,',
    '        "arousal": 0.0,',
    '        "moralFlex": 0.0,',
    '        "literacy": 0.0,',
    '        "social": 0.0',
    '      }',
    '    }',
    '  ]',
    '}',
    '',
    'Rules:',
    '- Recommendation count must be exactly 5.',
    '- Each recommendation must be a real film, not a TV series or short explanation object.',
    '- The "why" field must mention concrete fit to specific axes, not just vague taste matching.',
    '- The "why" field must also mention whether the film matches, regulates, or shifts the current mood.',
    '- axisScores values must be numbers between 0 and 1.',
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
