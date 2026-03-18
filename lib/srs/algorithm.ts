/**
 * Spaced Repetition System (SRS) — Algoritmo SM-2 adaptado para OAB
 *
 * Baseado no SuperMemo SM-2 com ajustes para questões de múltipla escolha:
 * - quality 0-2: Errou (reset interval)
 * - quality 3: Difícil (mantém, mas reduz ease)
 * - quality 4: Bom (progride normalmente)
 * - quality 5: Fácil (progride rápido)
 */

export interface SRSResult {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
}

export function calculateSRS(
  isCorrect: boolean,
  timeSpent: number,  // seconds
  currentEase: number,
  currentInterval: number,
  currentRepetitions: number
): SRSResult {
  // Map answer to quality (0-5)
  let quality: number;
  if (!isCorrect) {
    quality = 1; // Wrong answer
  } else if (timeSpent > 120) {
    quality = 3; // Correct but slow (>2min) = difficult
  } else if (timeSpent > 60) {
    quality = 4; // Correct, normal speed
  } else {
    quality = 5; // Correct, fast (<1min) = easy
  }

  let newEase = currentEase;
  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Failed: reset
    newRepetitions = 0;
    newInterval = 1; // Review tomorrow
    newEase = Math.max(1.3, currentEase - 0.2);
  } else {
    // Success
    newRepetitions = currentRepetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1; // 1 day
    } else if (newRepetitions === 2) {
      newInterval = 3; // 3 days
    } else if (newRepetitions === 3) {
      newInterval = 7; // 1 week
    } else {
      newInterval = Math.round(currentInterval * currentEase);
    }

    // Adjust ease factor
    newEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEase = Math.max(1.3, Math.min(5.0, newEase));
  }

  // Cap interval at 180 days (6 months)
  newInterval = Math.min(newInterval, 180);

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEase * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt,
  };
}

/**
 * Creates a new review card for a wrong answer
 */
export function createInitialCard(): Pick<SRSResult, 'easeFactor' | 'interval' | 'repetitions'> {
  return {
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
  };
}
