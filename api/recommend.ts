import buildPrompt from '../src/lib/buildPrompt.js'
import type { Recommendation, UserProfile } from '../src/types.js'

export const config = {
  runtime: 'edge',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
}

const strictRetrySuffix = [
  'This is a retry because your previous answer failed JSON parsing or schema validation.',
  'Return valid JSON only.',
  'The JSON must contain exactly one key: "recommendations".',
  'That array must contain exactly 5 items.',
  'Every item must include title, year, genre, tagline, why, and axisScores with all five numeric axis values.',
].join(' ')

// `vercel dev` may read local envs from `.vercel/` rather than injecting `.env.local`
// into edge runtimes, so we fall back to those files when `process.env` is empty.
const localEnvPaths = ['.vercel/.env.development.local', '.env.local']

type GroqMessage = {
  role: 'system' | 'user'
  content: string
}

class ProviderResponseError extends Error {}

class ModelOutputError extends Error {}

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

function isCopingStyle(value: unknown): value is UserProfile['copingStyle'] {
  return value === null || value === 'lean-in' || value === 'shift-away'
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
    (!('copingStyle' in value) || isCopingStyle(value.copingStyle))
  )
}

function isRecommendation(value: unknown): value is Recommendation {
  if (!isObject(value) || !isObject(value.axisScores)) {
    return false
  }

  return (
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    typeof value.year === 'number' &&
    Number.isInteger(value.year) &&
    typeof value.genre === 'string' &&
    value.genre.trim().length > 0 &&
    typeof value.tagline === 'string' &&
    value.tagline.trim().length > 0 &&
    typeof value.why === 'string' &&
    value.why.trim().length > 0 &&
    isNormalizedScore(value.axisScores.hedonic) &&
    isNormalizedScore(value.axisScores.arousal) &&
    isNormalizedScore(value.axisScores.moralFlex) &&
    isNormalizedScore(value.axisScores.literacy) &&
    isNormalizedScore(value.axisScores.social)
  )
}

function parseRecommendations(payload: unknown): Recommendation[] {
  if (
    !isObject(payload) ||
    !Array.isArray(payload.recommendations) ||
    payload.recommendations.length !== 5 ||
    !payload.recommendations.every(isRecommendation)
  ) {
    throw new ModelOutputError(
      'Model response did not match the expected recommendation schema.',
    )
  }

  return payload.recommendations
}

function extractProviderError(payload: unknown): string | null {
  if (
    isObject(payload) &&
    isObject(payload.error) &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }

  if (isObject(payload) && typeof payload.error === 'string') {
    return payload.error
  }

  return null
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

async function getGroqApiKey(): Promise<string | null> {
  if (process.env.GROQ_API_KEY) {
    return process.env.GROQ_API_KEY
  }

  return getLocalDevEnvValue('GROQ_API_KEY')
}

async function callGroq(
  apiKey: string,
  messages: GroqMessage[],
  temperature: number,
): Promise<Recommendation[]> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages,
    }),
  })

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ProviderResponseError(
      extractProviderError(payload) ?? 'Groq request failed.',
    )
  }

  if (
    !isObject(payload) ||
    !Array.isArray(payload.choices) ||
    !isObject(payload.choices[0]) ||
    !isObject(payload.choices[0].message) ||
    typeof payload.choices[0].message.content !== 'string'
  ) {
    throw new ModelOutputError('Groq returned an unexpected response payload.')
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(payload.choices[0].message.content)
  } catch {
    throw new ModelOutputError('Groq returned invalid JSON content.')
  }

  return parseRecommendations(parsed)
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
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

  if (!isProfile(body)) {
    return jsonResponse(
      { error: 'Request body must include all five axes and a mood.' },
      400,
    )
  }

  const apiKey = await getGroqApiKey()

  if (!apiKey) {
    return jsonResponse({ error: 'GROQ_API_KEY is not configured.' }, 500)
  }

  try {
    const recommendations = await callGroq(apiKey, buildPrompt(body), 0.8)
    return jsonResponse({ recommendations })
  } catch (error) {
    if (error instanceof ModelOutputError) {
      try {
        const recommendations = await callGroq(
          apiKey,
          buildPrompt(body, { strictSuffix: strictRetrySuffix }),
          0.5,
        )
        return jsonResponse({ recommendations })
      } catch (retryError) {
        const message =
          retryError instanceof Error
            ? retryError.message
            : 'Failed to parse recommendation response.'
        return jsonResponse({ error: message }, 502)
      }
    }

    const message =
      error instanceof Error ? error.message : 'Recommendation request failed.'
    return jsonResponse({ error: message }, 502)
  }
}
