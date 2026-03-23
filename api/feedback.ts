import type { CopingStyle, FeedbackPayload, FeedbackRating, UserProfile } from '../src/types.js'
import { getDb } from '../src/lib/db.js'

export const config = {
  runtime: 'edge',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
}

type FeedbackRequestBody = Omit<FeedbackPayload, 'profile'> & {
  profile?: UserProfile
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  })
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNormalizedScore(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 1
}

function isCopingStyle(value: unknown): value is CopingStyle {
  return value === 'lean-in' || value === 'shift-away'
}

function isProfile(value: unknown): value is UserProfile {
  if (!isObject(value)) {
    return false
  }

  return (
    isNormalizedScore(value.hedonic) &&
    isNormalizedScore(value.arousal) &&
    isNormalizedScore(value.moralFlex) &&
    isNormalizedScore(value.literacy) &&
    isNormalizedScore(value.social) &&
    typeof value.mood === 'string' &&
    value.mood.trim().length > 0 &&
    isCopingStyle(value.copingStyle)
  )
}

function isFeedbackRating(value: unknown): value is FeedbackRating {
  return value === 'up' || value === 'down'
}

function isFeedbackRequestBody(value: unknown): value is FeedbackRequestBody {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.sessionId === 'string' &&
    value.sessionId.trim().length > 0 &&
    typeof value.filmTitle === 'string' &&
    value.filmTitle.trim().length > 0 &&
    typeof value.filmYear === 'number' &&
    Number.isInteger(value.filmYear) &&
    typeof value.tmdbId === 'number' &&
    Number.isInteger(value.tmdbId) &&
    value.tmdbId > 0 &&
    isFeedbackRating(value.rating) &&
    typeof value.profileHash === 'string' &&
    value.profileHash.trim().length > 0 &&
    typeof value.mood === 'string' &&
    value.mood.trim().length > 0 &&
    isCopingStyle(value.copingStyle) &&
    (!('profile' in value) || value.profile === undefined || isProfile(value.profile)) &&
    (!('timestamp' in value) ||
      value.timestamp === undefined ||
      (typeof value.timestamp === 'string' && value.timestamp.trim().length > 0))
  )
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'bigint') {
    return Number(value)
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

async function insertFeedback(body: FeedbackRequestBody) {
  const db = await getDb()

  if (!db) {
    return
  }

  const profile = body.profile

  await db.execute({
    sql: `INSERT OR IGNORE INTO feedback (
      session_id,
      tmdb_id,
      film_title,
      film_year,
      rating,
      profile_hash,
      mood,
      coping_style,
      hedonic,
      arousal,
      moral_flex,
      literacy,
      social,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      body.sessionId,
      body.tmdbId,
      body.filmTitle,
      body.filmYear,
      body.rating,
      body.profileHash,
      body.mood,
      body.copingStyle,
      profile?.hedonic ?? null,
      profile?.arousal ?? null,
      profile?.moralFlex ?? null,
      profile?.literacy ?? null,
      profile?.social ?? null,
      body.timestamp ?? new Date().toISOString(),
    ],
  })
}

async function readAggregateStats() {
  const db = await getDb()

  if (!db) {
    return {
      total: { up: 0, down: 0 },
      rating: 0,
    }
  }

  try {
    const result = await db.execute(
      'SELECT rating, COUNT(*) as count FROM feedback GROUP BY rating',
    )
    const totals = { up: 0, down: 0 }

    for (const row of result.rows) {
      const rating = row.rating

      if (rating === 'up' || rating === 'down') {
        totals[rating] = toNumber(row.count)
      }
    }

    const totalCount = totals.up + totals.down

    return {
      total: totals,
      rating: totalCount > 0 ? totals.up / totalCount : 0,
    }
  } catch {
    return {
      total: { up: 0, down: 0 },
      rating: 0,
    }
  }
}

async function readFilmStats(tmdbId: number) {
  const db = await getDb()

  if (!db) {
    return {
      tmdbId,
      total: { up: 0, down: 0 },
      rating: 0,
    }
  }

  try {
    const result = await db.execute({
      sql: 'SELECT rating, COUNT(*) as count FROM feedback WHERE tmdb_id = ? GROUP BY rating',
      args: [tmdbId],
    })
    const totals = { up: 0, down: 0 }

    for (const row of result.rows) {
      const rating = row.rating

      if (rating === 'up' || rating === 'down') {
        totals[rating] = toNumber(row.count)
      }
    }

    const totalCount = totals.up + totals.down

    return {
      tmdbId,
      total: totals,
      rating: totalCount > 0 ? totals.up / totalCount : 0,
    }
  } catch {
    return {
      tmdbId,
      total: { up: 0, down: 0 },
      rating: 0,
    }
  }
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  if (request.method === 'GET') {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')

    if (type === 'stats') {
      return jsonResponse(await readAggregateStats())
    }

    if (type === 'film') {
      const rawTmdbId = url.searchParams.get('tmdbId')
      const tmdbId = rawTmdbId ? Number(rawTmdbId) : NaN

      if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
        return jsonResponse({ error: 'tmdbId must be a positive integer.' }, 400)
      }

      return jsonResponse(await readFilmStats(tmdbId))
    }

    return jsonResponse({ error: 'Unsupported feedback query.' }, 400)
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON request body.' }, 400)
  }

  if (!isFeedbackRequestBody(body)) {
    return jsonResponse({ error: 'Invalid feedback payload.' }, 400)
  }

  try {
    await insertFeedback(body)
  } catch {
    // Feedback is best-effort and should not block the experience.
  }

  return jsonResponse({ success: true })
}
