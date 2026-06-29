import { addDays } from 'date-fns';
import { getBugsForApplication } from '@/lib/bug-engine/registry';
import type {
  ApplicationId,
  SeasonChallenge,
} from '@/lib/bug-engine/types';
import { SEASON_LENGTH_DAYS } from '@/lib/constants';

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return result;
}

export function generateSeason(
  application: ApplicationId,
  startDate: Date,
  seasonLength = SEASON_LENGTH_DAYS
): SeasonChallenge[] {
  const pool = getBugsForApplication(application);
  if (pool.length < seasonLength) {
    throw new Error(
      `Need ${seasonLength} bugs for season, registry has ${pool.length}`
    );
  }
  const selected = shuffle(pool).slice(0, seasonLength);
  return selected.map((bug, i) => ({
    challengeDate: addDays(startDate, i),
    bugId: bug.id,
    bugTitle: bug.title,
    correctPage: bug.page,
    correctCategory: bug.category,
    correctSeverity: bug.severity,
    rootCause: bug.rootCause,
  }));
}
