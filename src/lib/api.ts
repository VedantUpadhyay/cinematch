import type { APIResponse, Recommendation, UserProfile } from '../types'

function parseErrorMessage(payload: unknown): string | null {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof payload.error === 'string'
  ) {
    return payload.error
  }

  return null
}

function isRecommendationArray(value: unknown): value is Recommendation[] {
  return Array.isArray(value)
}

export async function getRecommendations(
  profile: UserProfile,
): Promise<Recommendation[]> {
  const response = await fetch('/api/recommend', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(profile),
  })

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      parseErrorMessage(payload) ?? 'Unable to fetch recommendations.',
    )
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    !('recommendations' in payload) ||
    !isRecommendationArray(payload.recommendations)
  ) {
    throw new Error('Invalid recommendation response.')
  }

  return (payload as APIResponse).recommendations
}
