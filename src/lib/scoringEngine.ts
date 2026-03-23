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

export function getTopFilms(profile: UserProfile): ScoredFilm[] {
  const candidates = allFilms
    .map((film) => scoreFilm(film, profile))
    .sort((left, right) => right.matchScore - left.matchScore)

  const selected: ScoredFilm[] = []

  while (selected.length < 5 && candidates.length > 0) {
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
    })
  }

  return selected
}
