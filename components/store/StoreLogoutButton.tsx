'use client';

import { useRouter } from 'next/navigation';
import { storeLogoutAction } from '@/app/actions/store';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';

export function StoreLogoutButton() {
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);

  async function handleLogout() {
    const result = await storeLogoutAction();
    if (result.clearCart) {
      clearCart();
    }
    const loginPath = window.location.pathname.includes('/challenge/store')
      ? '/challenge/store/login'
      : '/login';
    router.push(loginPath);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" type="button" onClick={handleLogout}>
      Logout
    </Button>
  );
}
