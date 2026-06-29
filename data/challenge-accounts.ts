export type ChallengeAccount = {
  username: string;
  password: string;
  role: 'customer' | 'admin';
  firstName: string;
  lastName: string;
  email: string;
};

export const CHALLENGE_ACCOUNTS: Record<string, ChallengeAccount> = {
  alice: {
    username: 'alice',
    password: 'Password123',
    role: 'customer',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@store.test',
  },
  bob: {
    username: 'bob',
    password: 'Password123',
    role: 'customer',
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@store.test',
  },
  charlie: {
    username: 'charlie',
    password: 'Password123',
    role: 'customer',
    firstName: 'Charlie',
    lastName: 'Davis',
    email: 'charlie@store.test',
  },
  admin: {
    username: 'admin',
    password: 'Password123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@store.test',
  },
};

export function validateChallengeCredentials(
  username: string,
  password: string
): ChallengeAccount | null {
  const account = CHALLENGE_ACCOUNTS[username.toLowerCase()];
  if (!account) return null;
  if (account.password !== password) return null;
  return account;
}
