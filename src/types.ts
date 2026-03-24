export type AxisScores = {
  hedonic: number
  arousal: number
  moralFlex: number
  literacy: number
  social: number
}

export type ProfileAxis = keyof AxisScores

export type CopingStyle = 'lean-in' | 'shift-away'
export type FeedbackRating = 'up' | 'down'

export type UserProfile = AxisScores & {
  mood: string
  copingStyle: CopingStyle | null
}

export type QuestionOption = {
  label: string
  value: number
  emoji: string
}

export type Question = {
  axis: keyof AxisScores
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

export type CopingOption = {
  label: string
  key: CopingStyle
  emoji: string
  description: string
}

export type Recommendation = {
  tmdbId: number
  tier?: number
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

export type FeedbackPayload = {
  sessionId: string
  filmTitle: string
  filmYear: number
  tmdbId: number
  rating: FeedbackRating
  profileHash: string
  profile?: UserProfile
  mood: string
  copingStyle: CopingStyle
  timestamp?: string
}
