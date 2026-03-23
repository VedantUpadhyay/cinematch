import { mkdir, readFile, writeFile } from 'node:fs/promises'

type EnvMap = Record<string, string>

type TmdbListResponse = {
  page: number
  results: Array<{
    id: number
  }>
}

type TmdbMovieDetails = {
  id: number
  title: string
  original_title: string
  release_date: string
  overview: string
  genres: Array<{ id: number; name: string }>
  original_language: string
  runtime: number | null
  vote_average: number
  vote_count: number
  poster_path: string | null
}

type FilmRecord = {
  tmdb_id: number
  title: string
  original_title: string
  year: number
  overview: string
  genres: string[]
  original_language: string
  runtime: number
  vote_average: number
  vote_count: number
  poster_path: string
}

type LanguageConfig = {
  code: string
  label: string
}

type DecadeConfig = {
  label: string
  start: string
  end: string
}

type DiscoveryPass = {
  name: string
  languageVoteCountFloor: number
  languagePages: number
  languageTargetPerLanguage: number
  decadeVoteCountFloor: number
  decadePages: number
  decadeTargetPerDecade: number
}

const TARGET_FILM_COUNT = 500
const REQUEST_DELAY_MS = 250
const TMDB_API_VERSION = '3'
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

const languageConfigs: LanguageConfig[] = [
  { code: 'ko', label: 'Korean cinema' },
  { code: 'ja', label: 'Japanese cinema' },
  { code: 'fr', label: 'French cinema' },
  { code: 'hi', label: 'Hindi cinema' },
  { code: 'es', label: 'Spanish cinema' },
  { code: 'de', label: 'German cinema' },
  { code: 'it', label: 'Italian cinema' },
  { code: 'fa', label: 'Farsi cinema' },
  { code: 'zh', label: 'Chinese cinema' },
]

const decadeConfigs: DecadeConfig[] = [
  { label: '1950s', start: '1950-01-01', end: '1959-12-31' },
  { label: '1960s', start: '1960-01-01', end: '1969-12-31' },
  { label: '1970s', start: '1970-01-01', end: '1979-12-31' },
  { label: '1980s', start: '1980-01-01', end: '1989-12-31' },
  { label: '1990s', start: '1990-01-01', end: '1999-12-31' },
  { label: '2000s', start: '2000-01-01', end: '2009-12-31' },
  { label: '2010s', start: '2010-01-01', end: '2019-12-31' },
  { label: '2020s', start: '2020-01-01', end: '2029-12-31' },
]

const discoveryPasses: DiscoveryPass[] = [
  {
    name: 'initial thresholds',
    languageVoteCountFloor: 100,
    languagePages: 1,
    languageTargetPerLanguage: 20,
    decadeVoteCountFloor: 200,
    decadePages: 1,
    decadeTargetPerDecade: 15,
  },
  {
    name: 'fallback thresholds',
    languageVoteCountFloor: 50,
    languagePages: 2,
    languageTargetPerLanguage: 40,
    decadeVoteCountFloor: 100,
    decadePages: 2,
    decadeTargetPerDecade: 30,
  },
  {
    name: 'expanded fallback thresholds',
    languageVoteCountFloor: 20,
    languagePages: 3,
    languageTargetPerLanguage: 60,
    decadeVoteCountFloor: 50,
    decadePages: 3,
    decadeTargetPerDecade: 45,
  },
]

let lastRequestStartedAt = 0

function sleep(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function parseEnvFile(contents: string): EnvMap {
  const env: EnvMap = {}

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (line.length === 0 || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

async function loadTmdbApiKey() {
  const envPath = new URL('../.env.local', import.meta.url)
  let fileEnv: EnvMap = {}

  try {
    fileEnv = parseEnvFile(await readFile(envPath, 'utf8'))
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      throw error
    }
  }

  const apiKey = fileEnv.TMDB_API_KEY ?? process.env.TMDB_API_KEY

  if (!apiKey) {
    throw new Error(
      'TMDB_API_KEY is not set in .env.local. Add TMDB_API_KEY=your_key_here before running this script.',
    )
  }

  return apiKey
}

async function fetchTmdbJson<T>(
  apiKey: string,
  pathname: string,
  params: Record<string, string | number | boolean>,
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${pathname}`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('language', 'en-US')

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }

  const elapsedSinceLastRequest = Date.now() - lastRequestStartedAt

  if (elapsedSinceLastRequest < REQUEST_DELAY_MS) {
    await sleep(REQUEST_DELAY_MS - elapsedSinceLastRequest)
  }

  lastRequestStartedAt = Date.now()

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url)

    if (response.ok) {
      return (await response.json()) as T
    }

    const body = await response.text()

    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      await sleep(REQUEST_DELAY_MS * attempt * 4)
      continue
    }

    throw new Error(
      `TMDB request failed for ${pathname} (${response.status}): ${body.slice(0, 300)}`,
    )
  }

  throw new Error(`TMDB request failed for ${pathname} after retries.`)
}

function takeIds(response: TmdbListResponse, limit: number) {
  return response.results.slice(0, limit).map((movie) => movie.id)
}

async function fetchPagedIds(
  apiKey: string,
  pathname: string,
  baseParams: Record<string, string | number | boolean>,
  pages: number,
  maxItems: number,
) {
  const ids: number[] = []

  for (let page = 1; page <= pages; page += 1) {
    const response = await fetchTmdbJson<TmdbListResponse>(apiKey, pathname, {
      ...baseParams,
      page,
    })

    ids.push(...takeIds(response, response.results.length))

    if (ids.length >= maxItems) {
      return ids.slice(0, maxItems)
    }
  }

  return ids.slice(0, maxItems)
}

function addIds(target: Set<number>, ids: number[]) {
  for (const id of ids) {
    target.add(id)
  }
}

function parseReleaseYear(releaseDate: string) {
  const year = Number.parseInt(releaseDate.slice(0, 4), 10)
  return Number.isFinite(year) ? year : null
}

function toFilmRecord(details: TmdbMovieDetails): FilmRecord | null {
  const overview = details.overview.trim()
  const year = parseReleaseYear(details.release_date)
  const genres = details.genres.map((genre) => genre.name.trim()).filter(Boolean)

  if (!overview || !year) {
    return null
  }

  if (details.vote_count < 50) {
    return null
  }

  if (genres.length < 2) {
    return null
  }

  if (!details.runtime || details.runtime <= 60) {
    return null
  }

  return {
    tmdb_id: details.id,
    title: details.title.trim(),
    original_title: details.original_title.trim() || details.title.trim(),
    year,
    overview,
    genres,
    original_language: details.original_language,
    runtime: details.runtime,
    vote_average: details.vote_average,
    vote_count: details.vote_count,
    poster_path: details.poster_path ?? '',
  }
}

function eligibleFilmsFromCache(cache: Map<number, FilmRecord | null>) {
  const films: FilmRecord[] = []

  for (const film of cache.values()) {
    if (film) {
      films.push(film)
    }
  }

  return films
}

function compositeScore(film: FilmRecord) {
  return film.vote_average * Math.log10(film.vote_count)
}

function decadeLabel(year: number) {
  return `${Math.floor(year / 10) * 10}s`
}

async function fetchBaseCandidateIds(apiKey: string) {
  const ids = new Set<number>()

  addIds(
    ids,
    await fetchPagedIds(apiKey, '/movie/top_rated', {}, 5, 100),
  )
  addIds(
    ids,
    await fetchPagedIds(apiKey, '/movie/popular', {}, 5, 100),
  )

  return ids
}

async function fetchLanguageDiscoveryIds(apiKey: string, pass: DiscoveryPass) {
  const ids = new Set<number>()

  for (const language of languageConfigs) {
    const languageIds = await fetchPagedIds(
      apiKey,
      '/discover/movie',
      {
        include_adult: false,
        sort_by: 'vote_average.desc',
        'vote_count.gte': pass.languageVoteCountFloor,
        with_original_language: language.code,
      },
      pass.languagePages,
      pass.languageTargetPerLanguage,
    )

    addIds(ids, languageIds)
  }

  return ids
}

async function fetchDecadeDiscoveryIds(apiKey: string, pass: DiscoveryPass) {
  const ids = new Set<number>()

  for (const decade of decadeConfigs) {
    const decadeIds = await fetchPagedIds(
      apiKey,
      '/discover/movie',
      {
        include_adult: false,
        sort_by: 'vote_average.desc',
        'vote_count.gte': pass.decadeVoteCountFloor,
        'primary_release_date.gte': decade.start,
        'primary_release_date.lte': decade.end,
      },
      pass.decadePages,
      pass.decadeTargetPerDecade,
    )

    addIds(ids, decadeIds)
  }

  return ids
}

async function hydrateFilmDetails(
  apiKey: string,
  ids: Iterable<number>,
  cache: Map<number, FilmRecord | null>,
) {
  for (const id of ids) {
    if (cache.has(id)) {
      continue
    }

    const details = await fetchTmdbJson<TmdbMovieDetails>(apiKey, `/movie/${id}`, {})
    cache.set(id, toFilmRecord(details))
  }
}

function printSummary(films: FilmRecord[]) {
  const languageCounts = new Map<string, number>()
  const decadeCounts = new Map<string, number>()

  for (const film of films) {
    languageCounts.set(
      film.original_language,
      (languageCounts.get(film.original_language) ?? 0) + 1,
    )
    decadeCounts.set(decadeLabel(film.year), (decadeCounts.get(decadeLabel(film.year)) ?? 0) + 1)
  }

  const topLanguages = [...languageCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10)

  const sortedDecades = [...decadeCounts.entries()].sort((left, right) =>
    left[0].localeCompare(right[0]),
  )

  const lowestVoteCountFilms = [...films]
    .sort(
      (left, right) =>
        left.vote_count - right.vote_count ||
        left.year - right.year ||
        left.title.localeCompare(right.title),
    )
    .slice(0, 10)

  console.log(`Total films fetched: ${films.length}`)
  console.log('Breakdown by original_language (top 10):')

  for (const [language, count] of topLanguages) {
    console.log(`- ${language}: ${count}`)
  }

  console.log('Breakdown by decade:')

  for (const [decade, count] of sortedDecades) {
    console.log(`- ${decade}: ${count}`)
  }

  console.log('Films with lowest vote counts (bottom 10):')

  for (const film of lowestVoteCountFilms) {
    console.log(
      `- ${film.title} (${film.year}) [${film.original_language}] - ${film.vote_count} votes`,
    )
  }
}

async function main() {
  const dataDirectory = new URL('../data/', import.meta.url)
  const outputPath = new URL('../data/films_raw.json', import.meta.url)

  await mkdir(dataDirectory, { recursive: true })

  const apiKey = await loadTmdbApiKey()
  const candidateIds = await fetchBaseCandidateIds(apiKey)
  const detailsCache = new Map<number, FilmRecord | null>()

  console.log(`Fetched ${candidateIds.size} base candidate ids from top_rated and popular.`)

  await hydrateFilmDetails(apiKey, candidateIds, detailsCache)

  let eligibleFilms = eligibleFilmsFromCache(detailsCache)
  console.log(`Eligible films after base lists: ${eligibleFilms.length}`)

  for (const pass of discoveryPasses) {
    if (eligibleFilms.length >= TARGET_FILM_COUNT) {
      break
    }

    console.log(`Applying ${pass.name}...`)

    const beforeCount = candidateIds.size
    addIds(candidateIds, [...(await fetchLanguageDiscoveryIds(apiKey, pass))])
    addIds(candidateIds, [...(await fetchDecadeDiscoveryIds(apiKey, pass))])

    const afterCount = candidateIds.size
    console.log(`Candidate pool size: ${beforeCount} -> ${afterCount}`)

    await hydrateFilmDetails(apiKey, candidateIds, detailsCache)
    eligibleFilms = eligibleFilmsFromCache(detailsCache)
    console.log(`Eligible films after ${pass.name}: ${eligibleFilms.length}`)
  }

  if (eligibleFilms.length < TARGET_FILM_COUNT) {
    throw new Error(
      `Unable to gather ${TARGET_FILM_COUNT} eligible films after fallback passes. Found ${eligibleFilms.length}.`,
    )
  }

  const finalFilms = [...eligibleFilms]
    .sort(
      (left, right) =>
        compositeScore(right) - compositeScore(left) ||
        right.vote_count - left.vote_count ||
        left.title.localeCompare(right.title),
    )
    .slice(0, TARGET_FILM_COUNT)
    .sort((left, right) => left.year - right.year || left.title.localeCompare(right.title))

  await writeFile(
    outputPath,
    JSON.stringify(
      {
        metadata: {
          count: finalFilms.length,
          fetched_at: new Date().toISOString(),
          sources: [
            'top_rated',
            'popular',
            'discover_by_language',
            'discover_by_decade',
          ],
          tmdb_api_version: TMDB_API_VERSION,
        },
        films: finalFilms,
      },
      null,
      2,
    ),
    'utf8',
  )

  printSummary(finalFilms)
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
