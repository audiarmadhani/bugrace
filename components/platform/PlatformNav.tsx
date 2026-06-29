import Link from 'next/link';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOutAction } from '@/app/actions/platform';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/history', label: 'History' },
  { href: '/profile', label: 'Profile' },
];

export function PlatformNav() {
  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Flag className="h-5 w-5 text-red-600" />
          BugRace
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOutAction}>
          <Button variant="outline" size="sm" type="submit">
            Logout
          </Button>
        </form>
      </div>
    </header>
  );
}
