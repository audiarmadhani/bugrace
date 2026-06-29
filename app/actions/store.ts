'use server';

import { redirect } from 'next/navigation';
import { applyInjection } from '@/lib/bug-engine/injection-points';
import { getTodayBugId } from '@/lib/db/queries/challenges';
import {
  setChallengeSession,
  clearChallengeSession,
  getChallengeSession,
  REMEMBER_ME_MAX_AGE,
} from '@/lib/auth/challenge-session';
import {
  clearStoreLoginFails,
  getStoreLoginFailCount,
  incrementStoreLoginFails,
  STORE_LOGIN_RATE_LIMIT,
} from '@/lib/auth/store-login-failures';
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

type CartLine = { productId: string; unitPrice: number; quantity: number };

export async function storeLoginAction(formData: FormData) {
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;
  const rememberMe = formData.get('rememberMe') === 'on';
  const activeBug = await getTodayBugId();
  const failedAttempts = await getStoreLoginFailCount();

  if (
    failedAttempts >= STORE_LOGIN_RATE_LIMIT &&
    activeBug !== 'LOGIN_NO_RATE_LIMITING'
  ) {
    return { error: 'Too many failed attempts. Please try again in 15 minutes.' };
  }

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
      rememberMe,
      failedAttempts,
      accounts: Object.fromEntries(
        Object.entries(CHALLENGE_ACCOUNTS).map(([k, v]) => [k, v.password])
      ),
    }
  ) as {
    success: boolean;
    username?: string;
    role?: 'customer' | 'admin';
    sessionMaxAge?: number;
  };

  if (!validation.success || !validation.username || !validation.role) {
    await incrementStoreLoginFails();
    const errorMsg = applyInjection(
      activeBug,
      'store.login.errorMessage',
      () => 'Invalid username or password.',
      { username, password }
    ) as string;
    return { error: errorMsg };
  }

  await clearStoreLoginFails();

  const forceSessionCookie =
    validation.sessionMaxAge === 0 ||
    (activeBug === 'LOGIN_REMEMBER_ME_IGNORED' && rememberMe);
  const maxAge = forceSessionCookie
    ? undefined
    : rememberMe
      ? REMEMBER_ME_MAX_AGE
      : undefined;

  await setChallengeSession(
    { username: validation.username, role: validation.role },
    { maxAge }
  );

  redirect('/challenge/store/catalog');
}

export async function storeLogoutAction(): Promise<{ clearCart: boolean }> {
  const activeBug = await getTodayBugId();
  await handleProfileLogout(activeBug);
  const clearCart = await handleCartLogout(activeBug);
  await clearChallengeSession();
  return { clearCart };
}

export async function getStoreProfileAction(
  cachedProfile?: Pick<ChallengeProfile, 'firstName' | 'lastName' | 'email'> | null
) {
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
  },
  idempotencyKey?: string
) {
  const session = await getChallengeSession();
  if (!session) return { error: 'Not logged in' };

  const activeBug = await getTodayBugId();

  const validation = applyInjection(
    activeBug,
    'store.checkout.validate',
    () => {
      if (!form.fullName?.trim()) {
        return { valid: false, error: 'Full name is required.' };
      }
      if (!/^[a-zA-Z\s'-]+$/.test(form.fullName)) {
        return { valid: false, error: 'Full name must contain letters.' };
      }
      if (!form.email?.trim()) {
        return { valid: false, error: 'Email is required.' };
      }
      if (!form.address?.trim() || form.address.length < 5) {
        return { valid: false, error: 'Address is required.' };
      }
      if (!form.city?.trim() || form.city.length < 2) {
        return { valid: false, error: 'City is required.' };
      }
      if (!form.postalCode?.trim() || form.postalCode.length < 3) {
        return { valid: false, error: 'Postal code is required.' };
      }
      if (!form.phone?.trim() || form.phone.length < 7) {
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
      cartTotal,
      idempotencyKey
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
  options: {
    query?: string;
    category?: string;
    sort?: string;
    priceMin?: number;
    priceMax?: number;
  }
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

  if (options.priceMin !== undefined || options.priceMax !== undefined) {
    const min = options.priceMin ?? 0;
    const max = options.priceMax ?? Number.POSITIVE_INFINITY;
    result = applyInjection(
      activeBug,
      'store.catalog.filter',
      () => result.filter((p) => p.price >= min && p.price <= max),
      { products: result, priceMin: min, priceMax: max }
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

export async function calculateCartTotalAction(items: CartLine[]) {
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

export async function getCartCheckoutStateAction(items: CartLine[]) {
  const activeBug = await getTodayBugId();
  const result = applyInjection(
    activeBug,
    'store.cart.calculateTotal',
    () => ({ total: 0, itemCount: items.length }),
    { items }
  );

  if (typeof result === 'object' && result !== null && 'itemCount' in result) {
    return { canCheckout: (result as { itemCount: number }).itemCount > 0 };
  }
  return { canCheckout: items.length > 0 };
}

export async function removeCartItemAction(
  items: CartLine[],
  productId: string,
  previousTotal: number
) {
  const activeBug = await getTodayBugId();
  const nextItems = applyInjection(
    activeBug,
    'store.cart.removeItem',
    () => items.filter((i) => i.productId !== productId),
    { items, productId, previousTotal }
  ) as CartLine[] | { items: CartLine[]; total: number };

  if (Array.isArray(nextItems)) {
    const total = await calculateCartTotalAction(nextItems);
    return { items: nextItems, total };
  }

  return { items: nextItems.items, total: nextItems.total ?? previousTotal };
}

export async function updateCartQuantityAction(
  items: CartLine[],
  productId: string,
  quantity: number
) {
  const activeBug = await getTodayBugId();
  const validQty = applyInjection(
    activeBug,
    'store.cart.updateQuantity',
    () => (quantity >= 1 && quantity <= 99 ? quantity : null),
    { items, productId, quantity }
  ) as number | { keepItem: boolean; quantity: number } | null;

  if (validQty === null) {
    return { error: 'Invalid quantity.', items };
  }

  const qty = typeof validQty === 'object' ? validQty.quantity : validQty;
  const keepZero = typeof validQty === 'object' && validQty.keepItem;

  let nextItems: CartLine[];
  if (qty <= 0 && !keepZero) {
    nextItems = items.filter((i) => i.productId !== productId);
  } else {
    nextItems = items.map((i) =>
      i.productId === productId ? { ...i, quantity: qty } : i
    );
  }

  const total = await calculateCartTotalAction(nextItems);
  return { items: nextItems, total };
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

export async function addToCartAction(
  productId: string,
  quantity: number,
  unitPrice: number,
  stock: number
) {
  const activeBug = await getTodayBugId();

  const validQty = applyInjection(
    activeBug,
    'store.product.quantity',
    () => (quantity >= 1 && quantity <= stock && quantity <= 99 ? quantity : null),
    { quantity, stock, productId }
  ) as number | null;

  if (validQty === null && quantity !== 0) {
    return { error: 'Invalid quantity.' };
  }

  const qty = validQty ?? quantity;

  const line = applyInjection(
    activeBug,
    'store.product.addToCart',
    () => ({ success: true, unitPrice, added: true }),
    { productId, quantity: qty, price: unitPrice, stock }
  ) as { success: boolean; unitPrice?: number; added?: boolean };

  if (line.success === false || line.added === false) {
    return { success: true, silent: true };
  }

  if (qty < 1 && activeBug !== 'PRODUCT_ZERO_QUANTITY_ADD' && activeBug !== 'PRODUCT_NEGATIVE_QUANTITY') {
    return { error: 'Invalid quantity.' };
  }

  return {
    success: true,
    unitPrice: line.unitPrice ?? unitPrice,
    quantity: qty,
  };
}
