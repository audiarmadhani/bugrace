'use server';

import { redirect } from 'next/navigation';
import { applyInjection } from '@/lib/bug-engine/injection-points';
import { getTodayBugId } from '@/lib/db/queries/challenges';
import {
  setChallengeSession,
  clearChallengeSession,
  getChallengeSession,
} from '@/lib/auth/challenge-session';
import { CHALLENGE_ACCOUNTS, validateChallengeCredentials } from '@/data/challenge-accounts';
import {
  createChallengeOrder,
  getChallengeProfile,
  getOrdersForUser,
  handleCartLogout,
  handleProfileLogout,
  updateChallengeProfile,
  type ChallengeProfile,
} from '@/services/challenge-data-service';

export async function storeLoginAction(formData: FormData) {
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;
  const activeBug = await getTodayBugId();

  const validation = applyInjection(
    activeBug,
    'store.login.validate',
    () => {
      const account = validateChallengeCredentials(username, password);
      if (!account) return { success: false as const };
      return { success: true as const, username: account.username, role: account.role };
    },
    {
      username,
      password,
      accounts: Object.fromEntries(
        Object.entries(CHALLENGE_ACCOUNTS).map(([k, v]) => [k, v.password])
      ),
    }
  ) as { success: boolean; username?: string; role?: 'customer' | 'admin' };

  if (!validation.success || !validation.username || !validation.role) {
    const errorMsg = applyInjection(
      activeBug,
      'store.login.errorMessage',
      () => 'Invalid username or password.',
      { username, password }
    ) as string;
    return { error: errorMsg };
  }

  await setChallengeSession({
    username: validation.username,
    role: validation.role,
  });

  redirect('/challenge/store/catalog');
}

export async function storeLogoutAction() {
  const activeBug = await getTodayBugId();
  await handleProfileLogout(activeBug);
  await handleCartLogout(activeBug);
  await clearChallengeSession();
  redirect('/challenge/store/login');
}

export async function getStoreProfileAction(cachedProfile?: ChallengeProfile | null) {
  const session = await getChallengeSession();
  if (!session) return null;
  const activeBug = await getTodayBugId();
  return getChallengeProfile(activeBug, session.username, cachedProfile ?? null);
}

export async function updateStoreProfileAction(updates: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const session = await getChallengeSession();
  if (!session) return { error: 'Not logged in' };
  const activeBug = await getTodayBugId();
  return updateChallengeProfile(activeBug, session.username, updates);
}

export async function getStoreOrdersAction(cachedOrders?: unknown) {
  const session = await getChallengeSession();
  if (!session) return [];
  const activeBug = await getTodayBugId();
  return getOrdersForUser(activeBug, session.username, cachedOrders as never);
}

export async function checkoutAction(
  items: { productId: string; quantity: number; unitPrice: number }[],
  cartTotal: number,
  form: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  }
) {
  const session = await getChallengeSession();
  if (!session) return { error: 'Not logged in' };

  const activeBug = await getTodayBugId();

  const validation = applyInjection(
    activeBug,
    'store.checkout.validate',
    () => {
      if (!form.fullName || !form.email || !form.address || !form.city || !form.postalCode) {
        return { valid: false, error: 'All fields are required.' };
      }
      if (!form.phone) {
        return { valid: false, error: 'Phone number is required.' };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        return { valid: false, error: 'Invalid email address.' };
      }
      if (!/^[a-zA-Z\s'-]+$/.test(form.city)) {
        return { valid: false, error: 'Invalid city name.' };
      }
      return { valid: true, data: form };
    },
    form
  ) as { valid: boolean; error?: string };

  if (!validation.valid) {
    return { error: validation.error ?? 'Validation failed.' };
  }

  try {
    const result = await createChallengeOrder(
      activeBug,
      session.username,
      items,
      cartTotal
    );
    return { success: true, clearCart: result.clearCart };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Checkout failed.' };
  }
}

export async function filterCatalogAction(
  products: {
    id: string;
    name: string;
    description: string;
    price: number;
    rating: number;
    stock: number;
    category: string;
    image: string;
  }[],
  options: { query?: string; category?: string; sort?: string }
) {
  const activeBug = await getTodayBugId();
  let result = [...products];

  if (options.query) {
    const q = options.query.toLowerCase();
    result = applyInjection(
      activeBug,
      'store.catalog.search',
      () =>
        result.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        ),
      { products: result, query: options.query }
    ) as typeof result;
  }

  if (options.category && options.category !== 'all') {
    result = applyInjection(
      activeBug,
      'store.catalog.filter',
      () => result.filter((p) => p.category === options.category),
      { products: result, category: options.category }
    ) as typeof result;
  }

  if (options.sort === 'price-asc') {
    result = applyInjection(
      activeBug,
      'store.catalog.sort',
      () => [...result].sort((a, b) => a.price - b.price),
      { products: result, sort: options.sort }
    ) as typeof result;
  } else if (options.sort === 'price-desc') {
    result = applyInjection(
      activeBug,
      'store.catalog.sort',
      () => [...result].sort((a, b) => b.price - a.price),
      { products: result, sort: options.sort }
    ) as typeof result;
  } else if (options.sort === 'rating') {
    result = applyInjection(
      activeBug,
      'store.catalog.sort',
      () => [...result].sort((a, b) => b.rating - a.rating),
      { products: result, sort: options.sort }
    ) as typeof result;
  }

  return result;
}

export async function calculateCartTotalAction(
  items: { productId: string; unitPrice: number; quantity: number }[]
) {
  const activeBug = await getTodayBugId();
  const total = applyInjection(
    activeBug,
    'store.cart.calculateTotal',
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    { items }
  );

  if (typeof total === 'object' && total !== null && 'total' in total) {
    return (total as { total: number }).total;
  }
  return total as number;
}

export async function validateProductQuantityAction(quantity: number, stock: number) {
  const activeBug = await getTodayBugId();
  return applyInjection(
    activeBug,
    'store.product.quantity',
    () => (quantity >= 1 && quantity <= stock && quantity <= 99 ? quantity : null),
    { quantity, stock }
  ) as number | null;
}
