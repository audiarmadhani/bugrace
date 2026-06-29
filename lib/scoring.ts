import type { BugCategory, BugPage, BugSeverity } from '@/lib/bug-engine/types';

export type ScoreInput = {
  pageFound: BugPage;
  category: BugCategory;
  severity: BugSeverity;
};

export type ScoreAnswer = {
  correctPage: BugPage;
  correctCategory: BugCategory;
  correctSeverity: BugSeverity;
};

export function calculateAccuracyScore(
  submission: ScoreInput,
  answer: ScoreAnswer
): number {
  let score = 0;
  if (submission.pageFound === answer.correctPage) score += 10;
  if (submission.category === answer.correctCategory) score += 10;
  if (submission.severity === answer.correctSeverity) score += 5;
  return score;
}
