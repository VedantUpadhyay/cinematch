export type ProfileAxis = 'hedonic' | 'arousal' | 'moralFlex' | 'literacy' | 'social'

export type AxisScores = {
  hedonic: number
  arousal: number
  moralFlex: number
  literacy: number
  social: number
}

export type UserProfile = AxisScores & {
  mood: string
}

export type QuestionOption = {
  label: string
  value: number
  emoji: string
}

export type Question = {
  axis: keyof Omit<UserProfile, 'mood'>
  label: string
  description: string
  research: string
  options: QuestionOption[]
}

export type MoodOption = {
  label: string
  key: string
  emoji: string
  color: string
}

export type Recommendation = {
  title: string
  year: number
  genre: string
  tagline: string
  why: string
  axisScores: AxisScores
}

export type APIResponse = {
  recommendations: Recommendation[]
}
