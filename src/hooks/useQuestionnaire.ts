import { startTransition, useCallback, useState } from 'react'
import { getRecommendations } from '../lib/api'
import type { ProfileAxis, Recommendation, UserProfile } from '../types'

type QuestionnaireAnswers = Partial<Omit<UserProfile, 'mood'>>

const profileAxes: ProfileAxis[] = [
  'hedonic',
  'arousal',
  'moralFlex',
  'literacy',
  'social',
]

function buildProfile(
  answers: QuestionnaireAnswers,
  mood: string | null,
): UserProfile | null {
  if (!mood) {
    return null
  }

  const values = profileAxes.map((axis) => answers[axis])

  if (values.some((value) => typeof value !== 'number')) {
    return null
  }

  return {
    hedonic: answers.hedonic as number,
    arousal: answers.arousal as number,
    moralFlex: answers.moralFlex as number,
    literacy: answers.literacy as number,
    social: answers.social as number,
    mood,
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Unable to load recommendations right now.'
}

export function useQuestionnaire() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({})
  const [mood, setMood] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const requestRecommendations = useCallback(async (profile: UserProfile) => {
    setError(null)
    setLoading(true)
    setRecommendations(null)
    setStep(6)

    try {
      const [nextRecommendations] = await Promise.all([
        getRecommendations(profile),
        new Promise((resolve) => {
          window.setTimeout(resolve, 700)
        }),
      ])

      startTransition(() => {
        setRecommendations(nextRecommendations)
        setStep(7)
      })
    } catch (nextError) {
      setError(getErrorMessage(nextError))
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAnswer = useCallback((axis: ProfileAxis, value: number) => {
    setAnswers((current) => ({
      ...current,
      [axis]: value,
    }))
    setError(null)
    setStep((current) => (current < 4 ? current + 1 : 5))
  }, [])

  const handleMood = useCallback(
    async (key: string) => {
      const profile = buildProfile(answers, key)

      setMood(key)

      if (!profile) {
        setStep(5)
        setError('Complete all five questions before selecting a mood.')
        return
      }

      await requestRecommendations(profile)
    },
    [answers, requestRecommendations],
  )

  const retryRecommendations = useCallback(async () => {
    const profile = buildProfile(answers, mood)

    if (!profile) {
      setError('Complete all five questions before retrying.')
      return
    }

    await requestRecommendations(profile)
  }, [answers, mood, requestRecommendations])

  const reset = useCallback(() => {
    setStep(0)
    setAnswers({})
    setMood(null)
    setRecommendations(null)
    setError(null)
    setLoading(false)
  }, [])

  const getProfile = useCallback(() => {
    return buildProfile(answers, mood)
  }, [answers, mood])

  return {
    step,
    answers,
    mood,
    recommendations,
    error,
    loading,
    handleAnswer,
    handleMood,
    retryRecommendations,
    reset,
    getProfile,
  }
}
