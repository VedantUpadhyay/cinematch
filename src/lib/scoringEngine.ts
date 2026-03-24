import filmsData from '../data/films.json'
import type { UserProfile } from '../types.js'

type AxisScores = {
  hedonic: number
  arousal: number
  moralFlex: number
  literacy: number
  social: number
}

export interface TaggedFilm {
  tmdb_id: number
  title: string
  year: number
  genres: string[]
  original_language: string
  overview: string
  poster_path: string
  scores: AxisScores
  mood_affinities: Record<string, number>
}

export interface ScoredFilm extends TaggedFilm {
  matchScore: number
  axisDistance: number
  moodAffinity: number
  diversityBonus: number
}

type RankedFilm = ScoredFilm & {
  mmrScore: number
}

type Tier = 1 | 2 | 3

type TieredSelection = {
  film: RankedFilm
  sourceTier: Tier
}

type TierPools = Record<Tier, RankedFilm[]>

type FilmsDataset = {
  films: TaggedFilm[]
}

const axisWeights: Record<keyof AxisScores, number> = {
  hedonic: 1.3,
  arousal: 1.2,
  moralFlex: 1.0,
  literacy: 0.9,
  social: 0.8,
}

const mmrLambda = 0.3
const allFilms = (filmsData as FilmsDataset).films

function toMoodAffinityKey(profile: UserProfile) {
  return `${profile.mood}_${profile.copingStyle ?? 'none'}`.replaceAll('-', '_')
}

function getPrimaryGenre(film: TaggedFilm) {
  return film.genres[0]?.trim().toLowerCase() ?? ''
}

function getDecade(year: number) {
  return Math.floor(year / 10)
}

function getAxisDistance(film: TaggedFilm, profile: UserProfile) {
  const squaredDistance = Object.entries(axisWeights).reduce(
    (sum, [axis, weight]) => {
      const key = axis as keyof AxisScores
      const difference = film.scores[key] - profile[key]
      return sum + weight * difference * difference
    },
    0,
  )

  return Math.sqrt(squaredDistance)
}

function getMoodAffinity(film: TaggedFilm, profile: UserProfile) {
  const key = toMoodAffinityKey(profile)
  return film.mood_affinities[key] ?? 0.5
}

function getSimilarity(left: TaggedFilm, right: TaggedFilm) {
  const genreSimilarity =
    getPrimaryGenre(left) !== '' && getPrimaryGenre(left) === getPrimaryGenre(right)
      ? 0.5
      : 0
  const decadeSimilarity = getDecade(left.year) === getDecade(right.year) ? 0.3 : 0
  const languageSimilarity =
    left.original_language === right.original_language ? 0.2 : 0

  return genreSimilarity + decadeSimilarity + languageSimilarity
}

function shuffle<T>(array: T[]): T[] {
  const next = [...array]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

function scoreFilm(film: TaggedFilm, profile: UserProfile): ScoredFilm {
  const axisDistance = getAxisDistance(film, profile)
  const moodAffinity = getMoodAffinity(film, profile)
  const matchScore = moodAffinity * 1.5 - axisDistance

  return {
    ...film,
    matchScore,
    axisDistance,
    moodAffinity,
    diversityBonus: 0,
  }
}

function selectMmrCandidates(profile: UserProfile, count: number): RankedFilm[] {
  const candidates = allFilms
    .map((film) => scoreFilm(film, profile))
    .sort((left, right) => right.matchScore - left.matchScore)

  const selected: RankedFilm[] = []

  while (selected.length < count && candidates.length > 0) {
    let bestIndex = 0
    let bestMmrScore = Number.NEGATIVE_INFINITY
    let bestRedundancy = 0

    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index]
      const redundancy =
        selected.length === 0
          ? 0
          : Math.max(
              ...selected.map((selectedFilm) =>
                getSimilarity(candidate, selectedFilm),
              ),
            )
      const mmrScore =
        (1 - mmrLambda) * candidate.matchScore - mmrLambda * redundancy

      if (mmrScore > bestMmrScore) {
        bestMmrScore = mmrScore
        bestIndex = index
        bestRedundancy = redundancy
      }
    }

    const [bestCandidate] = candidates.splice(bestIndex, 1)

    if (!bestCandidate) {
      break
    }

    selected.push({
      ...bestCandidate,
      diversityBonus: -(mmrLambda * bestRedundancy),
      mmrScore: bestMmrScore,
    })
  }

  return selected
}

function buildTierPools(candidates: RankedFilm[]) {
  const rankedCandidates = [...candidates].sort(
    (left, right) =>
      right.mmrScore - left.mmrScore || right.matchScore - left.matchScore,
  )

  return {
    1: rankedCandidates.slice(0, 5),
    2: rankedCandidates.slice(5, 15),
    3: rankedCandidates.slice(15, 30),
  } satisfies TierPools
}

function getReplacementPriority(left: TieredSelection, right: TieredSelection) {
  if (left.sourceTier !== right.sourceTier) {
    return left.sourceTier - right.sourceTier
  }

  return right.film.matchScore - left.film.matchScore
}

function takeReplacement(
  selected: TieredSelection[],
  replaceIndex: number,
  remainingByTier: TierPools,
  preferredTiers: Tier[],
  predicate: (candidate: RankedFilm, current: TieredSelection[]) => boolean,
) {
  const current = selected.filter((_, index) => index !== replaceIndex)

  for (const tier of preferredTiers) {
    const pool = remainingByTier[tier]
    const candidateIndex = pool.findIndex((candidate) => {
      return (
        current.every((entry) => entry.film.tmdb_id !== candidate.tmdb_id) &&
        predicate(candidate, current)
      )
    })

    if (candidateIndex === -1) {
      continue
    }

    const [film] = pool.splice(candidateIndex, 1)

    if (!film) {
      continue
    }

    return {
      film,
      sourceTier: tier,
    } satisfies TieredSelection
  }

  return null
}

function enforceGenreDiversity(
  selected: TieredSelection[],
  remainingByTier: TierPools,
) {
  const nextSelection = [...selected]

  while (true) {
    const duplicates = new Map<string, number[]>()

    nextSelection.forEach((entry, index) => {
      const genre = getPrimaryGenre(entry.film)

      if (!duplicates.has(genre)) {
        duplicates.set(genre, [])
      }

      duplicates.get(genre)?.push(index)
    })

    let replaced = false

    for (const indices of duplicates.values()) {
      if (indices.length < 2) {
        continue
      }

      const sorted = [...indices].sort((leftIndex, rightIndex) =>
        getReplacementPriority(
          nextSelection[leftIndex],
          nextSelection[rightIndex],
        ),
      )

      for (const duplicateIndex of sorted.slice(1)) {
        const sourceTier = nextSelection[duplicateIndex]?.sourceTier ?? 3
        const preferredTiers: Tier[] =
          sourceTier === 3 ? [3] : [sourceTier, 3]
        const replacement = takeReplacement(
          nextSelection,
          duplicateIndex,
          remainingByTier,
          preferredTiers,
          (candidate, current) =>
            current.every(
              (entry) =>
                getPrimaryGenre(entry.film) !== getPrimaryGenre(candidate),
            ),
        )

        if (replacement) {
          nextSelection[duplicateIndex] = replacement
          replaced = true
        }
      }
    }

    if (!replaced) {
      break
    }
  }

  return nextSelection
}

function enforceDecadeDiversity(
  selected: TieredSelection[],
  remainingByTier: TierPools,
) {
  const nextSelection = [...selected]
  const representedDecades = new Set(
    nextSelection.map((entry) => getDecade(entry.film.year)),
  )

  if (representedDecades.size >= 2) {
    return nextSelection
  }

  const replaceOrder = nextSelection
    .map((_, index) => index)
    .sort((leftIndex, rightIndex) =>
      getReplacementPriority(
        nextSelection[rightIndex],
        nextSelection[leftIndex],
      ),
    )

  for (const replaceIndex of replaceOrder) {
    const sourceTier = nextSelection[replaceIndex]?.sourceTier ?? 3
    const preferredTiers: Tier[] = sourceTier === 3 ? [3] : [sourceTier, 3]
    const replacement = takeReplacement(
      nextSelection,
      replaceIndex,
      remainingByTier,
      preferredTiers,
      (candidate, current) => {
        const decades = new Set(current.map((entry) => getDecade(entry.film.year)))

        return (
          current.every(
            (entry) =>
              getPrimaryGenre(entry.film) !== getPrimaryGenre(candidate),
          ) && !decades.has(getDecade(candidate.year))
        )
      },
    )

    if (replacement) {
      nextSelection[replaceIndex] = replacement
      break
    }
  }

  return nextSelection
}

function sampleTieredSelection(candidates: RankedFilm[]) {
  const tierPools = buildTierPools(candidates)
  const shuffledTier1 = shuffle(tierPools[1])
  const shuffledTier2 = shuffle(tierPools[2])
  const shuffledTier3 = shuffle(tierPools[3])

  const selected: TieredSelection[] = [
    ...shuffledTier1
      .slice(0, 3)
      .map((film) => ({ film, sourceTier: 1 as const })),
    ...shuffledTier2
      .slice(0, 2)
      .map((film) => ({ film, sourceTier: 2 as const })),
  ]

  const remainingByTier: TierPools = {
    1: shuffledTier1.slice(3),
    2: shuffledTier2.slice(2),
    3: shuffledTier3,
  }

  const withUniqueGenres = enforceGenreDiversity(selected, remainingByTier)
  const withDistinctDecades = enforceDecadeDiversity(
    withUniqueGenres,
    remainingByTier,
  )

  return enforceGenreDiversity(withDistinctDecades, remainingByTier)
}

export function getTopFilms(profile: UserProfile): ScoredFilm[] {
  // Keep scoring deterministic, then add variety only in the final sampling step.
  const candidates = selectMmrCandidates(profile, 30)
  const selected = sampleTieredSelection(candidates)

  return selected
    .map((entry) => entry.film)
    .sort((left, right) => right.matchScore - left.matchScore)
}
