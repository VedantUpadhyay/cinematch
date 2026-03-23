import { createClient, type Client } from '@libsql/client/web'

const localEnvPaths = ['.vercel/.env.development.local', '.env.local']

function createDbClient(url: string, authToken: string): Client {
  return createClient({
    url,
    authToken,
  })
}

export const db =
  process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
    ? createDbClient(process.env.TURSO_DATABASE_URL, process.env.TURSO_AUTH_TOKEN)
    : null

let localDb: Client | null = null

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
    const absolutePath = path.resolve(currentDirectory, '..', '..', relativePath)

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

export async function getDb(): Promise<Client | null> {
  if (db) {
    return db
  }

  if (localDb) {
    return localDb
  }

  const [url, authToken] = await Promise.all([
    getLocalDevEnvValue('TURSO_DATABASE_URL'),
    getLocalDevEnvValue('TURSO_AUTH_TOKEN'),
  ])

  if (!url || !authToken) {
    return null
  }

  localDb = createDbClient(url, authToken)
  return localDb
}

