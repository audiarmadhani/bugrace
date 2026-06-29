import Link from 'next/link';
import { StoreLogoutButton } from '@/components/store/StoreLogoutButton';

const links = [
  { href: '/challenge/store/catalog', label: 'Home' },
  { href: '/challenge/store/cart', label: 'Cart' },
  { href: '/challenge/store/orders', label: 'Orders' },
  { href: '/challenge/store/profile', label: 'Profile' },
];

export function StoreNavbar({ username }: { username: string }) {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/challenge/store/catalog" className="font-bold text-lg text-emerald-700">
          ShopVerse
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-600 hover:text-emerald-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:inline">{username}</span>
          <StoreLogoutButton />
        </div>
      </div>
    </header>
  );
}
