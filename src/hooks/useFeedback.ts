import { useCallback, useState } from 'react'
import { profileHash } from '../lib/utils'
import type {
  FeedbackPayload,
  FeedbackRating,
  Recommendation,
  UserProfile,
} from '../types'

type SessionRatings = Map<number, FeedbackRating>

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function useFeedback() {
  const [sessionId] = useState(createSessionId)
  const [ratings, setRatings] = useState<SessionRatings>(() => new Map())

  const getRating = useCallback(
    (tmdbId: number): FeedbackRating | null => {
      return ratings.get(tmdbId) ?? null
    },
    [ratings],
  )

  const hasRated = useCallback(
    (tmdbId: number) => {
      return ratings.has(tmdbId)
    },
    [ratings],
  )

  const submitFeedback = useCallback(
    async (
      film: Recommendation,
      rating: FeedbackRating,
      profile: UserProfile,
    ) => {
      if (profile.copingStyle === null || ratings.has(film.tmdbId)) {
        return
      }

      setRatings((current) => {
        if (current.has(film.tmdbId)) {
          return current
        }

        const next = new Map(current)
        next.set(film.tmdbId, rating)
        return next
      })

      const payload: FeedbackPayload = {
        sessionId,
        filmTitle: film.title,
        filmYear: film.year,
        tmdbId: film.tmdbId,
        rating,
        profileHash: profileHash(profile),
        profile,
        mood: profile.mood,
        copingStyle: profile.copingStyle,
        timestamp: new Date().toISOString(),
      }

      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
      } catch {
        // Feedback is best-effort and should never block the UI.
      }
    },
    [ratings, sessionId],
  )

  return {
    submitFeedback,
    getRating,
    hasRated,
  }
}

export default useFeedback
