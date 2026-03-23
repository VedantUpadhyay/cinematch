import { getDb } from '../src/lib/db.js'

export const config = {
  runtime: 'edge',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  })
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  const db = await getDb()

  if (!db) {
    return jsonResponse(
      { error: 'Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.' },
      500,
    )
  }

  try {
    await db.batch(
      [
        `CREATE TABLE IF NOT EXISTS feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          tmdb_id INTEGER NOT NULL,
          film_title TEXT NOT NULL,
          film_year INTEGER,
          rating TEXT NOT NULL CHECK (rating IN ('up', 'down')),
          profile_hash TEXT NOT NULL,
          mood TEXT,
          coping_style TEXT,
          hedonic REAL,
          arousal REAL,
          moral_flex REAL,
          literacy REAL,
          social REAL,
          created_at TEXT DEFAULT (datetime('now')),
          UNIQUE(session_id, tmdb_id)
        )`,
        'CREATE INDEX IF NOT EXISTS idx_feedback_tmdb ON feedback(tmdb_id)',
        'CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating)',
      ],
      'write',
    )
  } catch (error) {
    return jsonResponse({ error: 'Failed to initialize tables.' }, 500)
  }

  return jsonResponse({ success: true, message: 'Tables initialized' })
}
