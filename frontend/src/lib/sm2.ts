export type SM2Quality = 0 | 1 | 2 | 3  // Again | Hard | Good | Easy

export function sm2Update(
  easeFactor: number,
  intervalDays: number,
  quality: SM2Quality,
): { easeFactor: number; intervalDays: number; nextDate: string } {
  let ef = easeFactor
  let interval = intervalDays

  switch (quality) {
    case 0:
      interval = 1
      break
    case 1:
      interval = Math.max(1, Math.round(interval * 1.2))
      ef = Math.max(1.3, ef - 0.15)
      break
    case 2:
      interval = Math.max(1, Math.round(interval * ef))
      break
    case 3:
      interval = Math.max(1, Math.round(interval * ef * 1.3))
      ef = Math.min(3.0, ef + 0.1)
      break
  }

  const nextDate = new Date(Date.now() + interval * 86400000).toISOString().split('T')[0]
  return { easeFactor: ef, intervalDays: interval, nextDate }
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
