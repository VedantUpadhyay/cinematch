import type { UserProfile } from '../types'

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right),
    )

    return `{${entries
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableSerialize(nestedValue)}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

export function profileHash(profile: UserProfile): string {
  const serialized = stableSerialize(profile)
  let hash = 5381

  for (let index = 0; index < serialized.length; index += 1) {
    hash = (hash * 33) ^ serialized.charCodeAt(index)
  }

  return `p_${(hash >>> 0).toString(36)}`
}

