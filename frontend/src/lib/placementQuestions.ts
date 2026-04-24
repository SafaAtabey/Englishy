import type { PlacementQuestion } from '../types'

const ALL_QUESTIONS: PlacementQuestion[] = [
  // ── A1 ───────────────────────────────────────────────────────────────────────
  { id: 101, question: 'What ___ your name?', options: ['is', 'are', 'am', 'be'], correct: 0, level: 'A1' },
  { id: 102, question: 'She ___ a teacher.', options: ['is', 'are', 'am', 'be'], correct: 0, level: 'A1' },
  { id: 103, question: 'I have ___ apple.', options: ['a', 'an', 'the', 'some'], correct: 1, level: 'A1' },
  { id: 104, question: 'They ___ at school now.', options: ['is', 'are', 'am', 'be'], correct: 1, level: 'A1' },
  { id: 105, question: 'How ___ you today?', options: ['is', 'are', 'am', 'be'], correct: 1, level: 'A1' },
  { id: 106, question: 'I ___ from Turkey.', options: ['is', 'are', 'am', 'be'], correct: 2, level: 'A1' },
  { id: 107, question: 'There ___ two cats on the sofa.', options: ['is', 'are', 'am', 'has'], correct: 1, level: 'A1' },
  { id: 108, question: 'This is ___ book. (one book)', options: ['a', 'an', 'the', '—'], correct: 0, level: 'A1' },
  { id: 109, question: 'My brother ___ twelve years old.', options: ['has', 'have', 'is', 'are'], correct: 2, level: 'A1' },
  { id: 110, question: '___ you like coffee?', options: ['Does', 'Do', 'Is', 'Are'], correct: 1, level: 'A1' },

  // ── A2 ───────────────────────────────────────────────────────────────────────
  { id: 201, question: 'I ___ to the gym every day.', options: ['go', 'goes', 'going', 'went'], correct: 0, level: 'A2' },
  { id: 202, question: 'She has ___ visited Paris before.', options: ['never', 'ever', 'always', 'just'], correct: 0, level: 'A2' },
  { id: 203, question: 'What does "grateful" mean?', options: ['angry', 'thankful', 'lonely', 'tired'], correct: 1, level: 'A2' },
  { id: 204, question: 'We ___ dinner when he called.', options: ['had', 'were having', 'have had', 'are having'], correct: 1, level: 'A2' },
  { id: 205, question: 'She ___ English since 2019.', options: ['learns', 'is learning', 'has learned', 'learned'], correct: 2, level: 'A2' },
  { id: 206, question: '___ he finish the homework yet?', options: ['Did', 'Has', 'Does', 'Is'], correct: 1, level: 'A2' },
  { id: 207, question: 'What does "exhausted" mean?', options: ['excited', 'very tired', 'hungry', 'lost'], correct: 1, level: 'A2' },
  { id: 208, question: 'I ___ TV when the lights went out.', options: ['watched', 'was watching', 'have watched', 'watch'], correct: 1, level: 'A2' },
  { id: 209, question: 'She ___ to work by bus every morning.', options: ['go', 'goes', 'going', 'gone'], correct: 1, level: 'A2' },
  { id: 210, question: 'What does "curious" mean?', options: ['bored', 'wanting to know', 'frightened', 'helpful'], correct: 1, level: 'A2' },

  // ── B1 ───────────────────────────────────────────────────────────────────────
  { id: 301, question: 'If I ___ more time, I would travel more.', options: ['have', 'had', 'will have', 'would have'], correct: 1, level: 'B1' },
  { id: 302, question: 'The report ___ by the manager yesterday.', options: ['wrote', 'was written', 'has written', 'is writing'], correct: 1, level: 'B1' },
  { id: 303, question: 'What does "persevere" mean?', options: ['give up', 'continue despite difficulty', 'forget easily', 'act quickly'], correct: 1, level: 'B1' },
  { id: 304, question: 'She suggested ___ a break.', options: ['take', 'to take', 'taking', 'took'], correct: 2, level: 'B1' },
  { id: 305, question: 'He ___ in Paris for three years before moving to London.', options: ['lived', 'has lived', 'had lived', 'lives'], correct: 2, level: 'B1' },
  { id: 306, question: 'The window ___ broken by the storm.', options: ['is', 'was', 'were', 'has'], correct: 1, level: 'B1' },
  { id: 307, question: 'What does "reluctant" mean?', options: ['eager', 'unwilling', 'confused', 'cheerful'], correct: 1, level: 'B1' },
  { id: 308, question: 'You look tired. You ___ go to bed early.', options: ['must', 'should', 'would', 'could'], correct: 1, level: 'B1' },
  { id: 309, question: 'I wish I ___ more languages.', options: ['speak', 'spoke', 'will speak', 'speaking'], correct: 1, level: 'B1' },
  { id: 310, question: 'The film ___ when we arrived at the cinema.', options: ['started', 'was starting', 'had already started', 'starts'], correct: 2, level: 'B1' },

  // ── B2 ───────────────────────────────────────────────────────────────────────
  { id: 401, question: 'By the time he arrived, we ___ waiting for an hour.', options: ['had been', 'have been', 'were', 'are'], correct: 0, level: 'B2' },
  { id: 402, question: 'What does "ambiguous" mean?', options: ['clear', 'open to multiple interpretations', 'direct', 'confident'], correct: 1, level: 'B2' },
  { id: 403, question: 'The project, ___ had been delayed twice, was finally completed.', options: ['that', 'who', 'which', 'what'], correct: 2, level: 'B2' },
  { id: 404, question: '"To beat around the bush" means to:', options: ['discuss clearly', 'avoid the main topic', 'work hard', 'fail completely'], correct: 1, level: 'B2' },
  { id: 405, question: 'She spoke as if she ___ the answer all along.', options: ['knows', 'knew', 'had known', 'will know'], correct: 2, level: 'B2' },
  { id: 406, question: 'What does "meticulous" mean?', options: ['careless', 'showing great attention to detail', 'very fast', 'generous'], correct: 1, level: 'B2' },
  { id: 407, question: 'Not only ___ he arrive late, but he also forgot the documents.', options: ['did', 'had', 'was', 'has'], correct: 0, level: 'B2' },
  { id: 408, question: 'What does "pragmatic" mean?', options: ['idealistic', 'dealing with things practically', 'stubborn', 'emotional'], correct: 1, level: 'B2' },
  { id: 409, question: 'She demanded that he ___ an explanation.', options: ['gives', 'gave', 'give', 'will give'], correct: 2, level: 'B2' },
  { id: 410, question: '"To take something with a pinch of salt" means to:', options: ['believe it completely', 'be sceptical about it', 'enjoy it fully', 'share it with others'], correct: 1, level: 'B2' },

  // ── C1 ───────────────────────────────────────────────────────────────────────
  { id: 501, question: 'What does "fastidious" mean?', options: ['careless', 'very attentive to details', 'extremely fast', 'overly generous'], correct: 1, level: 'C1' },
  { id: 502, question: 'Had she known about the risk, she ___ differently.', options: ['acts', 'would act', 'would have acted', 'has acted'], correct: 2, level: 'C1' },
  { id: 503, question: '"A pyrrhic victory" refers to:', options: ['an easy win', 'a win that costs too much', 'an unexpected defeat', 'a long battle'], correct: 1, level: 'C1' },
  { id: 504, question: 'What does "equivocate" mean?', options: ['to speak clearly', 'to use vague language to avoid commitment', 'to exaggerate', 'to remain silent'], correct: 1, level: 'C1' },
  { id: 505, question: 'The minister denied ___ about the scandal in advance.', options: ['to know', 'knowing', 'to have known', 'have known'], correct: 1, level: 'C1' },
  { id: 506, question: 'What does "tenacious" mean?', options: ['weak', 'holding firmly to a purpose', 'timid', 'impulsive'], correct: 1, level: 'C1' },
  { id: 507, question: '"Scarcely had the meeting begun ___ the fire alarm went off."', options: ['than', 'then', 'when', 'while'], correct: 2, level: 'C1' },
  { id: 508, question: 'What does "inveterate" mean?', options: ['inexperienced', 'having a habit that is unlikely to change', 'inventive', 'shy'], correct: 1, level: 'C1' },

  // ── C2 ───────────────────────────────────────────────────────────────────────
  { id: 601, question: '"Perspicacious" most closely means:', options: ['confused', 'having a ready insight', 'overly cautious', 'emotionally volatile'], correct: 1, level: 'C2' },
  { id: 602, question: 'What does "obfuscate" mean?', options: ['to clarify', 'to make unclear or confusing', 'to simplify', 'to memorise'], correct: 1, level: 'C2' },
  { id: 603, question: '"Recondite" knowledge is:', options: ['common knowledge', 'known only to a few experts', 'recently discovered', 'easily forgotten'], correct: 1, level: 'C2' },
  { id: 604, question: 'What does "sanguine" mean?', options: ['pessimistic', 'optimistic even when faced with difficulty', 'indifferent', 'nervous'], correct: 1, level: 'C2' },
  { id: 605, question: '"Specious" reasoning appears correct but is:', options: ['genuinely logical', 'actually flawed', 'deeply complex', 'unsupported'], correct: 1, level: 'C2' },
  { id: 606, question: 'What does "laconic" mean?', options: ['talkative', 'using very few words', 'comical', 'melancholy'], correct: 1, level: 'C2' },
]

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const PER_LEVEL = { A1: 4, A2: 4, B1: 4, B2: 4, C1: 3, C2: 2 }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getPlacementTest(): PlacementQuestion[] {
  return LEVELS.flatMap(level => {
    const pool = ALL_QUESTIONS.filter(q => q.level === level)
    const count = PER_LEVEL[level as keyof typeof PER_LEVEL]
    return shuffle(pool).slice(0, count)
  })
}

export function getLevelUpTest(currentLevel: string): PlacementQuestion[] {
  const idx = LEVELS.indexOf(currentLevel)
  const nextLevel = LEVELS[idx + 1]
  if (!nextLevel) return []
  const pool = ALL_QUESTIONS.filter(q => q.level === currentLevel || q.level === nextLevel)
  return shuffle(pool).slice(0, 10)
}

export function calculateCEFR(answers: number[], questions: PlacementQuestion[]): string {
  const correctByLevel: Record<string, { correct: number; total: number }> = {}
  LEVELS.forEach(l => { correctByLevel[l] = { correct: 0, total: 0 } })
  questions.forEach((q, i) => {
    correctByLevel[q.level].total++
    if (answers[i] === q.correct) correctByLevel[q.level].correct++
  })
  let level = 'A1'
  for (const l of LEVELS) {
    const { correct, total } = correctByLevel[l]
    if (total === 0) continue
    if (correct / total >= 0.6) level = l
    else break
  }
  return level
}

export function calculateLevelUp(answers: number[], questions: PlacementQuestion[], nextLevel: string): boolean {
  const nextQ = questions.filter(q => q.level === nextLevel)
  const correct = nextQ.filter((q, _i) => {
    const idx = questions.indexOf(q)
    return answers[idx] === q.correct
  }).length
  return nextQ.length > 0 && correct / nextQ.length >= 0.7
}

export const placementQuestions = getPlacementTest()
