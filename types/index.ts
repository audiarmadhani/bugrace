export type {
  ApplicationId,
  BugCategory,
  BugDefinition,
  BugPage,
  BugSeverity,
  ChallengeStatus,
  InjectionPoint,
} from '@/lib/bug-engine/types';

export type { Product } from '@/data/products';

export type SubmissionResult = {
  success: boolean;
  score?: number;
  rank?: number;
  error?: string;
};

export type SafeDailyChallenge = {
  id: string;
  seasonId: string;
  challengeDate: string;
  status: 'OPEN' | 'REVEALED';
  revealedAt: string | null;
  dayNumber: number;
  seasonNumber: number;
};

export type RevealedDailyChallenge = SafeDailyChallenge & {
  bugTitle: string;
  correctPage: string;
  correctCategory: string;
  correctSeverity: string;
  rootCause: string;
};
