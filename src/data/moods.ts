import type { CopingOption, MoodOption } from '../types'

export const moods: MoodOption[] = [
  { label: 'Sad or melancholic', key: 'sad', emoji: '🌧️', color: '#6B8DAE' },
  { label: 'Anxious or restless mind', key: 'anxious', emoji: '💫', color: '#C4956A' },
  { label: 'Physically restless / need energy', key: 'restless', emoji: '🔥', color: '#D4654A' },
  { label: 'Reflective / contemplative', key: 'reflective', emoji: '🌙', color: '#8B7EC8' },
  { label: 'Happy / want to sustain it', key: 'joyful', emoji: '☀️', color: '#D4A843' },
  { label: 'Numb / want to feel something', key: 'numb', emoji: '🫥', color: '#7A8B8B' },
]

export const COPING_OPTIONS: CopingOption[] = [
  {
    label: 'Lean into this feeling',
    key: 'lean-in',
    emoji: '🌊',
    description: 'I want a film that meets me where I am',
  },
  {
    label: 'Shift away from it',
    key: 'shift-away',
    emoji: '🔄',
    description: 'I want a film that takes me somewhere different',
  },
]

export default moods
