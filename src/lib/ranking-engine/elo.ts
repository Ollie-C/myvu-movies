import type { RankingItem } from '@/schemas/ranking-item.schema';

export const K_FACTOR = 32; // Standard K-factor, adjust based on your needs

export interface EloCalculation {
  winnerNewRating: number;
  loserNewRating: number;
  winnerChange: number;
  loserChange: number;
}

export function calculateElo(
  winnerRating: number,
  loserRating: number,
  kFactor: number = K_FACTOR
): EloCalculation {
  // Calculate expected scores
  const expectedWinner =
    1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser =
    1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  // Calculate new ratings
  const winnerNewRating = winnerRating + kFactor * (1 - expectedWinner);
  const loserNewRating = loserRating + kFactor * (0 - expectedLoser);

  return {
    winnerNewRating: Math.round(winnerNewRating * 10) / 10, // Round to 1 decimal
    loserNewRating: Math.round(loserNewRating * 10) / 10,
    winnerChange: winnerNewRating - winnerRating,
    loserChange: loserNewRating - loserRating,
  };
}

// Dynamic K-factor based on rating difference (optional enhancement)
export function getDynamicKFactor(ratingDiff: number): number {
  const absDiff = Math.abs(ratingDiff);
  if (absDiff > 400) return 40; // Big upset
  if (absDiff > 200) return 32; // Moderate upset
  return 24; // Expected result
}

export function calculateEloFromReorder(
  items: RankingItem[],
  oldPositions: Map<string, number>,
  newPositions: Map<string, number>
): Map<string, number> {
  const newEloScores = new Map<string, number>();

  // Initialize with current scores
  items.forEach((item) => {
    newEloScores.set(item.id, item.elo_score || 1500);
  });

  // For each item that moved
  items.forEach((item) => {
    const oldPos = oldPositions.get(item.id)!;
    const newPos = newPositions.get(item.id)!;

    if (oldPos !== newPos) {
      // Simulate battles against items it "passed"
      const start = Math.min(oldPos, newPos);
      const end = Math.max(oldPos, newPos);

      for (let i = start; i <= end; i++) {
        if (i === oldPos) continue;

        const otherItem = items.find((it) => newPositions.get(it.id) === i);
        if (!otherItem) continue;

        const currentElo = newEloScores.get(item.id)!;
        const otherElo = newEloScores.get(otherItem.id)!;

        if (newPos < i) {
          // Item moved up, it "won"
          const result = calculateElo(currentElo, otherElo, K_FACTOR / 4); // Reduced K for drag-drop
          newEloScores.set(item.id, result.winnerNewRating);
          newEloScores.set(otherItem.id, result.loserNewRating);
        } else {
          // Item moved down, it "lost"
          const result = calculateElo(otherElo, currentElo, K_FACTOR / 4);
          newEloScores.set(otherItem.id, result.winnerNewRating);
          newEloScores.set(item.id, result.loserNewRating);
        }
      }
    }
  });

  return newEloScores;
}

// Calculate ELO from direct rating
export function calculateEloFromRating(
  movieElo: number,
  userRating: number, // 1-10 scale
  averageUserRating: number = 5.5
): number {
  // Convert rating to expected score (0-1)
  const expectedScore = userRating / 10;
  const currentExpected = 0.5; // Neutral expectation

  // Use ELO formula with rating as "battle result"
  const newElo = movieElo + K_FACTOR * (expectedScore - currentExpected);

  return Math.round(newElo * 10) / 10;
}
