import { mkdir, writeFile } from 'node:fs/promises'

type CopingStyle = 'lean-in' | 'shift-away'

type ProfilePayload = {
  hedonic: number
  arousal: number
  moralFlex: number
  literacy: number
  social: number
  mood: string
  copingStyle: CopingStyle
}

type Recommendation = {
  title: string
  year: number
  genre: string
  tagline: string
  why: string
  axisScores: {
    hedonic: number
    arousal: number
    moralFlex: number
    literacy: number
    social: number
  }
}

type ValidationRules = {
  genreDiversity?: boolean
  decadeDiversity?: number
  regionDiversity?: boolean
  banList?: string[]
  mustNotAllBe?: string
  flagIfSubtitled?: boolean
  minNonEnglish?: number
  mustIncludeGenre?: string
  minComedyCount?: number
  notes: string
}

type TestCase = {
  name: string
  profile: ProfilePayload
  validate: ValidationRules
  pairWith?: string
}

type ApiSuccessResponse = {
  recommendations: Recommendation[]
}

type RawResult = {
  name: string
  profile: ProfilePayload
  response: unknown
  httpStatus: number | null
  endpoint: string
  error?: string
}

type CheckStatus = 'pass' | 'warn' | 'fail'

type CheckResult = {
  label: string
  status: CheckStatus
  detail: string
}

type TestEvaluation = {
  name: string
  films: string[]
  genres: string[]
  checks: CheckResult[]
  status: CheckStatus
  notes: string
}

const tests: TestCase[] = [
  {
    name: 'T1: The Contradiction (high hedonic + high literacy)',
    profile: {
      hedonic: 0.85,
      arousal: 0.6,
      moralFlex: 0.5,
      literacy: 0.85,
      social: 0.4,
      mood: 'joyful',
      copingStyle: 'lean-in',
    },
    validate: {
      genreDiversity: true,
      decadeDiversity: 3,
      banList: [],
      mustNotAllBe: 'Drama',
      notes:
        'Should recommend films that are BOTH crafted and pleasurable. Not 5 arthouse. Not 5 blockbusters.',
    },
  },
  {
    name: 'T2: The Grandparent (low everything, max hedonic, group watch)',
    profile: {
      hedonic: 0.9,
      arousal: 0.2,
      moralFlex: 0.15,
      literacy: 0.15,
      social: 0.85,
      mood: 'joyful',
      copingStyle: 'lean-in',
    },
    validate: {
      genreDiversity: true,
      decadeDiversity: 2,
      banList: [
        'Mulholland Drive',
        'Dogtooth',
        'The Lighthouse',
        'Requiem for a Dream',
        'Irreversible',
      ],
      mustNotAllBe: 'Drama',
      flagIfSubtitled: true,
      notes: 'Should be warm, accessible, group-friendly. Zero arthouse or disturbing content.',
    },
  },
  {
    name: "T3: Adrenaline Junkie Who's Sad (high arousal + sad + shift-away)",
    profile: {
      hedonic: 0.7,
      arousal: 0.9,
      moralFlex: 0.5,
      literacy: 0.4,
      social: 0.7,
      mood: 'sad',
      copingStyle: 'shift-away',
    },
    validate: {
      genreDiversity: true,
      decadeDiversity: 2,
      banList: [
        'Manchester by the Sea',
        'Requiem for a Dream',
        'Melancholia',
        'Grave of the Fireflies',
      ],
      mustNotAllBe: 'Drama',
      notes:
        'Must be high-energy, kinetic. Shift-away from sadness means NO sad films. Should feel like an emotional rescue.',
    },
  },
  {
    name: 'T4: The Numb Nihilist (numb + lean-in + high moral flex + solo)',
    profile: {
      hedonic: 0.2,
      arousal: 0.7,
      moralFlex: 0.9,
      literacy: 0.8,
      social: 0.1,
      mood: 'numb',
      copingStyle: 'lean-in',
    },
    validate: {
      genreDiversity: true,
      decadeDiversity: 3,
      regionDiversity: true,
      mustNotAllBe: 'Psychological Drama',
      notes:
        'Should shatter numbness through visceral confrontation. Diverse regions/decades. NOT the same prestige arthouse list every time.',
    },
  },
  {
    name: 'T5: The Anxious Escapist (anxious + shift-away + very low arousal)',
    profile: {
      hedonic: 0.75,
      arousal: 0.15,
      moralFlex: 0.3,
      literacy: 0.5,
      social: 0.5,
      mood: 'anxious',
      copingStyle: 'shift-away',
    },
    validate: {
      genreDiversity: true,
      decadeDiversity: 2,
      banList: [
        'Hereditary',
        'Se7en',
        'Zodiac',
        'No Country for Old Men',
        'The Shining',
        'Black Swan',
      ],
      mustNotAllBe: 'Drama',
      notes: 'Must be genuinely soothing. NO suspense, horror, or sustained tension. Warm and low-stakes.',
    },
  },
  {
    name: 'T6: Non-Western Cinephile (max literacy + solo + reflective)',
    profile: {
      hedonic: 0.3,
      arousal: 0.4,
      moralFlex: 0.7,
      literacy: 0.95,
      social: 0.1,
      mood: 'reflective',
      copingStyle: 'lean-in',
    },
    validate: {
      genreDiversity: true,
      decadeDiversity: 3,
      regionDiversity: true,
      minNonEnglish: 3,
      banList: [],
      notes:
        'Should go deep into world cinema. NOT just Parasite + Amélie + Cinema Paradiso. Expect Iran, Taiwan, India, Senegal, etc.',
    },
  },
  {
    name: 'T7: Group Movie Night Peacemaker (max social + moderate everything)',
    profile: {
      hedonic: 0.7,
      arousal: 0.6,
      moralFlex: 0.4,
      literacy: 0.4,
      social: 0.95,
      mood: 'joyful',
      copingStyle: 'lean-in',
    },
    validate: {
      genreDiversity: true,
      decadeDiversity: 2,
      banList: [
        'Dogtooth',
        'The Piano Teacher',
        'Irreversible',
        'A Clockwork Orange',
        'Antichrist',
      ],
      mustNotAllBe: 'Drama',
      notes:
        'Every film must be group-safe. No niche, divisive, sexually explicit, or extremely violent content.',
    },
  },
  {
    name: 'T8a: Coping A/B — Sad + Lean-in',
    profile: {
      hedonic: 0.5,
      arousal: 0.5,
      moralFlex: 0.5,
      literacy: 0.5,
      social: 0.5,
      mood: 'sad',
      copingStyle: 'lean-in',
    },
    validate: {
      genreDiversity: true,
      decadeDiversity: 2,
      notes: 'Pair with T8b. Expect melancholic, emotionally honest films.',
    },
    pairWith: 'T8b',
  },
  {
    name: 'T8b: Coping A/B — Sad + Shift-away',
    profile: {
      hedonic: 0.5,
      arousal: 0.5,
      moralFlex: 0.5,
      literacy: 0.5,
      social: 0.5,
      mood: 'sad',
      copingStyle: 'shift-away',
    },
    validate: {
      genreDiversity: true,
      decadeDiversity: 2,
      notes: 'Pair with T8a. Expect warm, uplifting, absorbing films.',
    },
    pairWith: 'T8a',
  },
  {
    name: 'T9: Comedy Stress Test (max hedonic + low everything + joyful)',
    profile: {
      hedonic: 0.95,
      arousal: 0.3,
      moralFlex: 0.2,
      literacy: 0.2,
      social: 0.8,
      mood: 'joyful',
      copingStyle: 'lean-in',
    },
    validate: {
      genreDiversity: true,
      decadeDiversity: 2,
      mustIncludeGenre: 'Comedy',
      minComedyCount: 2,
      mustNotAllBe: 'Drama',
      notes: "Should include actual laugh-out-loud comedies. Not indie dramedies critics call 'comedies'.",
    },
  },
]

const varianceProfile = tests.find((test) => test.name.startsWith('T3:'))?.profile

if (!varianceProfile) {
  throw new Error('Variance profile could not be resolved from the test set.')
}

const delayMs = 3000

function sleep(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function normalizeEndpoint(input?: string) {
  if (!input) {
    return 'http://localhost:3000/api/recommend'
  }

  const trimmed = input.trim().replace(/\/+$/, '')

  if (trimmed.endsWith('/api/recommend')) {
    return trimmed
  }

  return `${trimmed}/api/recommend`
}

function formatDate(date: Date) {
  return date.toISOString()
}

function getDecade(year: number) {
  return Math.floor(year / 10) * 10
}

function normalizeTitle(title: string) {
  return title.trim().toLowerCase()
}

function normalizeGenre(genre: string) {
  return genre.trim().toLowerCase()
}

function containsNonAscii(value: string) {
  return /[^\x00-\x7F]/.test(value)
}

function likelyNonEnglish(recommendation: Recommendation) {
  const combined = `${recommendation.genre} ${recommendation.title} ${recommendation.why}`.toLowerCase()
  const languageSignals = [
    'subtitle',
    'subtitled',
    'non-english',
    'foreign-language',
    'foreign language',
    'korean',
    'japanese',
    'french',
    'spanish',
    'mandarin',
    'cantonese',
    'taiwanese',
    'iranian',
    'persian',
    'italian',
    'german',
    'hindi',
    'bengali',
    'senegal',
    'hong kong',
    'korea',
    'japan',
    'taiwan',
    'iran',
    'india',
    'france',
    'italy',
  ]

  return (
    containsNonAscii(recommendation.title) ||
    combined.includes('foreign') ||
    languageSignals.some((signal) => combined.includes(signal))
  )
}

function inferOverallStatus(checks: CheckResult[]): CheckStatus {
  if (checks.some((check) => check.status === 'fail')) {
    return 'fail'
  }

  if (checks.some((check) => check.status === 'warn')) {
    return 'warn'
  }

  return 'pass'
}

function iconFor(status: CheckStatus) {
  if (status === 'pass') {
    return '✅'
  }

  if (status === 'warn') {
    return '⚠️'
  }

  return '❌'
}

function arrowFor(status: CheckStatus) {
  if (status === 'pass') {
    return 'PASS'
  }

  if (status === 'warn') {
    return 'WARN'
  }

  return 'FAIL'
}

function safeRecommendations(payload: unknown): Recommendation[] {
  if (
    payload &&
    typeof payload === 'object' &&
    'recommendations' in payload &&
    Array.isArray(payload.recommendations)
  ) {
    return payload.recommendations as Recommendation[]
  }

  return []
}

function extractResponseError(payload: unknown) {
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

function extractRetryDelayMs(payload: unknown) {
  const message = extractResponseError(payload)

  if (!message || !message.toLowerCase().includes('rate limit')) {
    return null
  }

  const secondsMatch = message.match(/Please try again in ([0-9.]+)s/i)

  if (secondsMatch?.[1]) {
    return Math.ceil(Number(secondsMatch[1]) * 1000)
  }

  const millisecondsMatch = message.match(/Please try again in ([0-9.]+)ms/i)

  if (millisecondsMatch?.[1]) {
    return Math.ceil(Number(millisecondsMatch[1]))
  }

  return delayMs
}

async function postProfile(endpoint: string, profile: ProfilePayload): Promise<{
  httpStatus: number
  json: unknown
}> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    })

    const text = await response.text()
    let json: unknown = text

    try {
      json = JSON.parse(text)
    } catch {
      json = { raw: text }
    }

    const retryDelay = extractRetryDelayMs(json)

    if (!response.ok && retryDelay !== null && attempt < 3) {
      await sleep(Math.max(delayMs, retryDelay + 500))
      continue
    }

    return {
      httpStatus: response.status,
      json,
    }
  }

  return {
    httpStatus: 599,
    json: { error: 'Unexpected retry exhaustion.' },
  }
}

function unavailableCheck(label: string, responseError: string | null, count: number): CheckResult {
  return {
    label,
    status: 'fail',
    detail:
      responseError !== null
        ? `Not evaluated: ${responseError}`
        : `Not evaluated: endpoint returned ${count} recommendations`,
  }
}

function evaluateSingleTest(
  test: TestCase,
  recommendations: Recommendation[],
  responseError: string | null,
): TestEvaluation {
  const checks: CheckResult[] = []
  const genres = recommendations.map((recommendation) => recommendation.genre)
  const titles = recommendations.map((recommendation) => recommendation.title)
  const hasCompleteSet = recommendations.length === 5

  if (responseError) {
    checks.push({
      label: 'Endpoint response',
      status: 'fail',
      detail: responseError,
    })
  }

  if (!hasCompleteSet) {
    checks.push({
      label: 'Recommendation count',
      status: 'fail',
      detail: `Expected 5 recommendations, received ${recommendations.length}`,
    })
  } else {
    checks.push({
      label: 'Recommendation count',
      status: 'pass',
      detail: 'Returned 5 recommendations',
    })
  }

  if (test.validate.genreDiversity) {
    checks.push({
      label: 'Genre diversity',
      ...(hasCompleteSet
        ? (() => {
            const uniqueGenres = new Set(genres.map((genre) => normalizeGenre(genre)))
            return {
              status: uniqueGenres.size === recommendations.length ? 'pass' : 'fail',
              detail: `${uniqueGenres.size}/${recommendations.length} unique primary genres`,
            }
          })()
        : unavailableCheck('Genre diversity', responseError, recommendations.length)),
    })
  }

  if (typeof test.validate.decadeDiversity === 'number') {
    checks.push({
      label: 'Decade diversity',
      ...(hasCompleteSet
        ? (() => {
            const uniqueDecades = new Set(
              recommendations.map((recommendation) => getDecade(recommendation.year)),
            )
            return {
              status:
                uniqueDecades.size >= test.validate.decadeDiversity ? 'pass' : 'fail',
              detail: `${uniqueDecades.size} decades`,
            }
          })()
        : unavailableCheck('Decade diversity', responseError, recommendations.length)),
    })
  }

  if (test.validate.banList && test.validate.banList.length > 0) {
    checks.push({
      label: 'Ban list',
      ...(hasCompleteSet
        ? (() => {
            const bannedMatches = titles.filter((title) =>
              test.validate.banList?.some(
                (banned) => normalizeTitle(banned) === normalizeTitle(title),
              ),
            )
            return {
              status: bannedMatches.length === 0 ? 'pass' : 'fail',
              detail:
                bannedMatches.length === 0
                  ? 'No banned titles found'
                  : `Banned titles present: ${bannedMatches.join(', ')}`,
            }
          })()
        : unavailableCheck('Ban list', responseError, recommendations.length)),
    })
  }

  if (test.validate.mustNotAllBe) {
    checks.push({
      label: `Genre concentration (${test.validate.mustNotAllBe})`,
      ...(hasCompleteSet
        ? (() => {
            const target = test.validate.mustNotAllBe.toLowerCase()
            const matchingCount = genres.filter((genre) =>
              genre.toLowerCase().includes(target),
            ).length
            return {
              status: matchingCount >= 4 ? 'fail' : 'pass',
              detail: `${matchingCount}/5 matched ${test.validate.mustNotAllBe}`,
            }
          })()
        : unavailableCheck(
            `Genre concentration (${test.validate.mustNotAllBe})`,
            responseError,
            recommendations.length,
          )),
    })
  }

  if (test.validate.regionDiversity) {
    checks.push({
      label: 'Region diversity heuristic',
      ...(hasCompleteSet
        ? (() => {
            const nonEnglishCount = recommendations.filter(likelyNonEnglish).length
            return {
              status: nonEnglishCount >= 1 ? 'pass' : 'warn',
              detail: `${nonEnglishCount}/5 likely non-English films`,
            }
          })()
        : unavailableCheck('Region diversity heuristic', responseError, recommendations.length)),
    })
  }

  if (typeof test.validate.minNonEnglish === 'number') {
    checks.push({
      label: 'Non-English heuristic',
      ...(hasCompleteSet
        ? (() => {
            const nonEnglishCount = recommendations.filter(likelyNonEnglish).length
            return {
              status:
                nonEnglishCount >= test.validate.minNonEnglish ? 'pass' : 'warn',
              detail: `${nonEnglishCount}/5 likely non-English films`,
            }
          })()
        : unavailableCheck('Non-English heuristic', responseError, recommendations.length)),
    })
  }

  if (test.validate.flagIfSubtitled) {
    checks.push({
      label: 'Subtitled content heuristic',
      ...(hasCompleteSet
        ? (() => {
            const nonEnglishCount = recommendations.filter(likelyNonEnglish).length
            return {
              status: nonEnglishCount > 0 ? 'warn' : 'pass',
              detail:
                nonEnglishCount > 0
                  ? `${nonEnglishCount}/5 likely non-English films for a highly accessible profile`
                  : 'No likely non-English films detected',
            }
          })()
        : unavailableCheck(
            'Subtitled content heuristic',
            responseError,
            recommendations.length,
          )),
    })
  }

  if (test.validate.mustIncludeGenre) {
    checks.push({
      label: `Must include genre (${test.validate.mustIncludeGenre})`,
      ...(hasCompleteSet
        ? (() => {
            const matchingCount = genres.filter((genre) =>
              genre.toLowerCase().includes(
                test.validate.mustIncludeGenre!.toLowerCase(),
              ),
            ).length
            return {
              status: matchingCount > 0 ? 'pass' : 'warn',
              detail: `${matchingCount}/5 ${test.validate.mustIncludeGenre.toLowerCase()} genres`,
            }
          })()
        : unavailableCheck(
            `Must include genre (${test.validate.mustIncludeGenre})`,
            responseError,
            recommendations.length,
          )),
    })
  }

  if (typeof test.validate.minComedyCount === 'number') {
    checks.push({
      label: 'Comedy count',
      ...(hasCompleteSet
        ? (() => {
            const comedyCount = genres.filter((genre) =>
              genre.toLowerCase().includes('comedy'),
            ).length
            return {
              status: comedyCount >= test.validate.minComedyCount ? 'pass' : 'warn',
              detail: `${comedyCount}/5 comedy genres`,
            }
          })()
        : unavailableCheck('Comedy count', responseError, recommendations.length)),
    })
  }

  return {
    name: test.name,
    films: titles,
    genres,
    checks,
    status: inferOverallStatus(checks),
    notes: test.validate.notes,
  }
}

function buildPairEvaluation(a: TestEvaluation, b: TestEvaluation): TestEvaluation {
  const overlap = a.films.filter((title) => b.films.some((other) => normalizeTitle(other) === normalizeTitle(title)))
  const checks: CheckResult[] = [
    ...a.checks.map((check) => ({ ...check, label: `${check.label} (lean-in)` })),
    ...b.checks.map((check) => ({ ...check, label: `${check.label} (shift-away)` })),
    {
      label: 'Coping-style differentiation',
      status: overlap.length >= 3 ? 'fail' : overlap.length === 2 ? 'warn' : 'pass',
      detail: `Overlap: ${overlap.length}/5 titles shared${overlap.length > 0 ? ` (${overlap.join(', ')})` : ''}`,
    },
  ]

  return {
    name: 'T8: Coping A/B Test',
    films: [
      `Lean-in: ${a.films.join(', ')}`,
      `Shift-away: ${b.films.join(', ')}`,
    ],
    genres: [
      `Lean-in genres: [${a.genres.join(', ')}]`,
      `Shift-away genres: [${b.genres.join(', ')}]`,
    ],
    checks,
    status: inferOverallStatus(checks),
    notes: 'Compares sad + lean-in against sad + shift-away for title overlap.',
  }
}

function buildVarianceEvaluation(titleRuns: string[][]): TestEvaluation {
  const flattened = titleRuns.flat()
  const uniqueTitles = new Set(flattened.map((title) => normalizeTitle(title)))
  const uniqueCount = uniqueTitles.size
  const status: CheckStatus = uniqueCount >= 8 && uniqueCount <= 13 ? 'pass' : 'warn'

  return {
    name: 'T10: Variance Test (3 runs, same profile)',
    films: titleRuns.map((titles, index) => `Run ${index + 1}: ${titles.join(', ')}`),
    genres: [],
    checks: [
      {
        label: 'Variance',
        status,
        detail:
          uniqueCount >= 8 && uniqueCount <= 13
            ? `Unique titles: ${uniqueCount}/15 — good variance`
            : `Unique titles: ${uniqueCount}/15 — outside preferred 8-13 range`,
      },
    ],
    status,
    notes: 'Runs the T3 profile three times to check whether the system is over-deterministic or too random.',
  }
}

function borderLine(left: string, fill: string, right: string, width = 62) {
  return `${left}${fill.repeat(width)}${right}`
}

function padLine(content: string, width = 62) {
  const trimmed = content.length > width ? content.slice(0, width) : content
  return `║ ${trimmed.padEnd(width - 1)}║`
}

async function main() {
  const endpoint = normalizeEndpoint(process.argv[2])
  const generatedAt = new Date()
  const rawResults: Record<string, RawResult> = {}
  const evaluations = new Map<string, TestEvaluation>()
  const pairMembers = new Set(['T8a', 'T8b'])

  for (let index = 0; index < tests.length; index += 1) {
    const test = tests[index]

    try {
      const { httpStatus, json } = await postProfile(endpoint, test.profile)
      rawResults[test.name] = {
        name: test.name,
        profile: test.profile,
        response: json,
        httpStatus,
        endpoint,
      }

      const recommendations = safeRecommendations(json)
      const evaluation = evaluateSingleTest(
        test,
        recommendations,
        extractResponseError(json),
      )
      evaluations.set(test.name, evaluation)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request failure'
      rawResults[test.name] = {
        name: test.name,
        profile: test.profile,
        response: null,
        httpStatus: null,
        endpoint,
        error: message,
      }

      evaluations.set(test.name, {
        name: test.name,
        films: [],
        genres: [],
        checks: [
          {
            label: 'Endpoint request',
            status: 'fail',
            detail: message,
          },
        ],
        status: 'fail',
        notes: test.validate.notes,
      })
    }

    if (index < tests.length - 1) {
      await sleep(delayMs)
    }
  }

  const t8a = evaluations.get('T8a: Coping A/B — Sad + Lean-in')
  const t8b = evaluations.get('T8b: Coping A/B — Sad + Shift-away')

  if (!t8a || !t8b) {
    throw new Error('T8 pair evaluations were not available.')
  }

  const varianceRuns: string[][] = []

  for (let run = 0; run < 3; run += 1) {
    const { httpStatus, json } = await postProfile(endpoint, varianceProfile)
    rawResults[`T10 Run ${run + 1}`] = {
      name: `T10 Run ${run + 1}`,
      profile: varianceProfile,
      response: json,
      httpStatus,
      endpoint,
    }

    varianceRuns.push(safeRecommendations(json).map((recommendation) => recommendation.title))

    if (run < 2) {
      await sleep(delayMs)
    }
  }

  const logicalEvaluations: TestEvaluation[] = []

  for (const test of tests) {
    const caseId = test.name.split(':')[0]

    if (pairMembers.has(caseId)) {
      continue
    }

    const evaluation = evaluations.get(test.name)

    if (evaluation) {
      logicalEvaluations.push(evaluation)
    }
  }

  logicalEvaluations.push(buildPairEvaluation(t8a, t8b))
  logicalEvaluations.push(buildVarianceEvaluation(varianceRuns))

  await mkdir(new URL('../scripts', import.meta.url), { recursive: true })
  await writeFile(
    new URL('../scripts/test-results.json', import.meta.url),
    JSON.stringify(
      {
        endpoint,
        generatedAt: formatDate(generatedAt),
        rawResults,
      },
      null,
      2,
    ),
    'utf8',
  )

  const passCount = logicalEvaluations.filter((evaluation) => evaluation.status === 'pass').length
  const warnCount = logicalEvaluations.filter((evaluation) => evaluation.status === 'warn').length
  const failCount = logicalEvaluations.filter((evaluation) => evaluation.status === 'fail').length

  const lines: string[] = [
    borderLine('╔', '═', '╗'),
    padLine('                  CINEMATCH QUALITY REPORT'),
    borderLine('╠', '═', '╣'),
    padLine(`Endpoint: ${endpoint}`),
    padLine(`Date: ${formatDate(generatedAt)}`),
    borderLine('╠', '═', '╣'),
  ]

  for (const evaluation of logicalEvaluations) {
    lines.push(evaluation.name)
    for (const filmLine of evaluation.films) {
      if (filmLine.startsWith('Lean-in:') || filmLine.startsWith('Shift-away:') || filmLine.startsWith('Run ')) {
        lines.push(filmLine)
      } else {
        lines.push(`Films: ${evaluation.films.join(', ')}`)
        break
      }
    }

    if (evaluation.genres.length > 0) {
      for (const genreLine of evaluation.genres) {
        if (genreLine.startsWith('Lean-in genres:') || genreLine.startsWith('Shift-away genres:')) {
          lines.push(genreLine)
        }
      }

      if (!evaluation.genres[0]?.startsWith('Lean-in genres:')) {
        lines.push(`Genres: [${evaluation.genres.join(', ')}]`)
      }
    }

    for (const check of evaluation.checks) {
      lines.push(`${iconFor(check.status)} ${check.label}: ${check.detail}`)
    }

    lines.push(`Notes: ${evaluation.notes}`)
    lines.push(`→ ${arrowFor(evaluation.status)}`)
    lines.push('')
  }

  if (lines[lines.length - 1] === '') {
    lines.pop()
  }

  lines.push(borderLine('╠', '═', '╣'))
  lines.push(
    padLine(
      `SUMMARY: ${passCount}/10 PASS  |  ${warnCount}/10 WARN  |  ${failCount}/10 FAIL`,
    ),
  )
  lines.push(borderLine('╚', '═', '╝'))

  console.log(lines.join('\n'))
}

void main().catch(async (error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
