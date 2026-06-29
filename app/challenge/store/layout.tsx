import { getChallengeSession } from '@/lib/auth/challenge-session';
import { ActiveBugProvider } from '@/components/providers/ActiveBugProvider';
import { StoreNavbar } from '@/components/store/StoreNavbar';
import { getTodayChallengeSafe } from '@/lib/db/queries/challenges';
import { redirect } from 'next/navigation';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const session = await getChallengeSession();
  const challenge = await getTodayChallengeSafe();

  if (challenge && challenge.status !== 'OPEN') {
    redirect('/challenge');
  }

  return (
    <ActiveBugProvider>
      <div className="min-h-screen bg-gray-50">
        {session && <StoreNavbar username={session.username} />}
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    </ActiveBugProvider>
  );
}
