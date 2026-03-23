import { createClient, kv, type VercelKV } from '@vercel/kv'
import type { CopingStyle, FeedbackPayload, FeedbackRating, UserProfile } from '../src/types.js'

export const config = {
  runtime: 'edge',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
}

const localEnvPaths = ['.vercel/.env.development.local', '.env.local']

let localKvClient: VercelKV | null = null

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

function isFeedbackPayload(value: unknown): value is FeedbackPayload {
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
    isProfile(value.profile) &&
    typeof value.mood === 'string' &&
    value.mood.trim().length > 0 &&
    isCopingStyle(value.copingStyle) &&
    typeof value.timestamp === 'string' &&
    value.timestamp.trim().length > 0 &&
    value.profile.mood === value.mood &&
    value.profile.copingStyle === value.copingStyle
  )
}

function parseDotenvValue(fileContents: string, key: string): string | null {
  const matcher = new RegExp(
    `^\\s*(?:export\\s+)?${escapeRegExp(key)}\\s*=\\s*(.*)\\s*$`,
    'm',
  )
  const match = fileContents.match(matcher)

  if (!match) {
    return null
  }

  const rawValue = match[1]?.trim() ?? ''

  if (!rawValue) {
    return null
  }

  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    return rawValue.slice(1, -1)
  }

  return rawValue.replace(/\s+#.*$/, '').trim() || null
}

async function readLocalEnvFile(relativePath: string): Promise<string | null> {
  try {
    const fsModuleName = 'node:fs/promises'
    const pathModuleName = 'node:path'
    const urlModuleName = 'node:url'
    const [{ readFile }, path, { fileURLToPath }] = await Promise.all([
      import(fsModuleName),
      import(pathModuleName),
      import(urlModuleName),
    ])

    const currentFile = fileURLToPath(import.meta.url)
    const currentDirectory = path.dirname(currentFile)
    const absolutePath = path.resolve(currentDirectory, '..', relativePath)

    return await readFile(absolutePath, 'utf8')
  } catch {
    return null
  }
}

async function getLocalDevEnvValue(key: string): Promise<string | null> {
  for (const relativePath of localEnvPaths) {
    const fileContents = await readLocalEnvFile(relativePath)

    if (!fileContents) {
      continue
    }

    const value = parseDotenvValue(fileContents, key)

    if (value) {
      return value
    }
  }

  return null
}

async function getKvClient(): Promise<VercelKV | null> {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return kv
  }

  if (localKvClient) {
    return localKvClient
  }

  const [url, token] = await Promise.all([
    getLocalDevEnvValue('KV_REST_API_URL'),
    getLocalDevEnvValue('KV_REST_API_TOKEN'),
  ])

  if (!url || !token) {
    return null
  }

  localKvClient = createClient({ url, token })
  return localKvClient
}

async function getCount(
  client: VercelKV,
  key: string,
): Promise<number> {
  const value = await client.get<number | string | null>(key)

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

async function getStoredRating(
  client: VercelKV,
  feedbackKey: string,
): Promise<FeedbackRating | null> {
  const value = await client.hget<string | null>(feedbackKey, 'rating')
  return isFeedbackRating(value) ? value : null
}

async function writeFeedback(
  client: VercelKV,
  payload: FeedbackPayload,
) {
  const feedbackKey = `feedback:${payload.sessionId}:${payload.tmdbId}`
  const existingRating = await getStoredRating(client, feedbackKey)

  if (existingRating) {
    return
  }

  await client.hset(feedbackKey, {
    sessionId: payload.sessionId,
    filmTitle: payload.filmTitle,
    filmYear: payload.filmYear,
    tmdbId: payload.tmdbId,
    rating: payload.rating,
    profileHash: payload.profileHash,
    mood: payload.mood,
    copingStyle: payload.copingStyle,
    timestamp: payload.timestamp,
    serverTimestamp: new Date().toISOString(),
    hedonic: payload.profile.hedonic,
    arousal: payload.profile.arousal,
    moralFlex: payload.profile.moralFlex,
    literacy: payload.profile.literacy,
    social: payload.profile.social,
    profile: JSON.stringify(payload.profile),
  })

  await Promise.all([
    client.incr(`stats:film:${payload.tmdbId}:${payload.rating}`),
    client.incr(`stats:total:${payload.rating}`),
  ])
}

async function readStats() {
  const client = await getKvClient()

  if (!client) {
    return {
      total: { up: 0, down: 0 },
      rating: 0,
    }
  }

  try {
    const [up, down] = await Promise.all([
      getCount(client, 'stats:total:up'),
      getCount(client, 'stats:total:down'),
    ])
    const total = up + down

    return {
      total: { up, down },
      rating: total > 0 ? up / total : 0,
    }
  } catch {
    return {
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

    if (url.searchParams.get('type') !== 'stats') {
      return jsonResponse({ error: 'Unsupported feedback query.' }, 400)
    }

    return jsonResponse(await readStats())
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

  if (!isFeedbackPayload(body)) {
    return jsonResponse({ error: 'Invalid feedback payload.' }, 400)
  }

  try {
    const client = await getKvClient()

    if (client) {
      await writeFeedback(client, body)
    }
  } catch {
    // Feedback is best-effort and should not block the experience.
  }

  return jsonResponse({ success: true })
}
