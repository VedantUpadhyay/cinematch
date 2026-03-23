import type { Question } from '../types'

export const questions: Question[] = [
  {
    axis: 'hedonic',
    label: 'Why do you watch movies?',
    description: 'Hedonic ↔ Eudaimonic Motivation',
    research:
      'Oliver & Raney (2011) — hedonic motivation predicts preference for action/comedy; eudaimonic predicts drama and cognitive elaboration during viewing.',
    options: [
      { label: 'To feel good — fun, escape, pleasure', value: 0.85, emoji: '🍿' },
      { label: 'A bit of both, leaning toward fun', value: 0.65, emoji: '🎬' },
      { label: 'A bit of both, leaning toward meaning', value: 0.4, emoji: '🎭' },
      { label: 'To think, reflect, or feel something real', value: 0.2, emoji: '💭' },
    ],
  },
  {
    axis: 'arousal',
    label: 'How much intensity do you want right now?',
    description: 'Arousal Tolerance / Sensation Seeking',
    research:
      'Zuckerman (1994), Banerjee et al. (2008) — sensation seeking predicts preference for high-arousal genres. Bartsch & Hartmann (2017) showed challenge perception is viewer-dependent.',
    options: [
      { label: 'Crank it up — I want to feel alive', value: 0.9, emoji: '⚡' },
      { label: 'Some tension is good, but not relentless', value: 0.65, emoji: '🌊' },
      { label: 'Moderate — engaging but not overwhelming', value: 0.45, emoji: '🌤️' },
      { label: 'Calm and quiet — I want to settle in', value: 0.2, emoji: '🕯️' },
    ],
  },
  {
    axis: 'moralFlex',
    label: 'How do you feel about morally grey characters?',
    description: 'Moral Ambiguity Tolerance',
    research:
      "Zillmann's Affective Disposition Theory — enjoyment depends on moral evaluation of characters. Raney (2004) showed viewers with higher tolerance for moral ambiguity enjoy antihero narratives more.",
    options: [
      { label: 'Love them — give me the messy humans', value: 0.85, emoji: '🐺' },
      {
        label: 'Fine with complexity, but I need someone to root for',
        value: 0.6,
        emoji: '⚖️',
      },
      { label: "Prefer clear stakes — I want to know who's good", value: 0.35, emoji: '🛡️' },
      { label: 'I need a hero I can believe in', value: 0.15, emoji: '✨' },
    ],
  },
  {
    axis: 'literacy',
    label: 'How much narrative complexity do you enjoy?',
    description: 'Complexity Tolerance',
    research:
      'Bordwell (1985) — Cognitive Film Theory. Viewers develop narrative schemas that determine their tolerance for structural complexity, non-linear storytelling, and unconventional filmmaking techniques.',
    options: [
      {
        label:
          'I love non-linear stories, visual symbolism, and experimental filmmaking',
        value: 0.9,
        emoji: '🎥',
      },
      {
        label:
          "I appreciate complex storytelling but don't need it every time",
        value: 0.65,
        emoji: '📽️',
      },
      {
        label:
          "I prefer clear, well-told stories but I'm open to some complexity",
        value: 0.4,
        emoji: '🍿',
      },
      {
        label: 'Keep it straightforward — I want to follow along easily',
        value: 0.2,
        emoji: '📺',
      },
    ],
  },
  {
    axis: 'social',
    label: "Who's watching with you?",
    description: 'Social vs. Solitary Viewing Function',
    research:
      'Uses & Gratifications Theory — social viewing shifts preferences toward shared-experience films with broader appeal. Solitary viewing allows for more challenging, personal content.',
    options: [
      { label: 'Group watch — needs to work for everyone', value: 0.9, emoji: '👥' },
      { label: 'With one other person', value: 0.6, emoji: '👫' },
      { label: 'Solo but want something sociable in tone', value: 0.45, emoji: '🛋️' },
      { label: 'Just me — go deep', value: 0.15, emoji: '🎧' },
    ],
  },
]

export default questions
