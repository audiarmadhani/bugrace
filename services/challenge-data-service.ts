import { createAdminClient } from '@/lib/db/admin';
import { applyInjection } from '@/lib/bug-engine/injection-points';

export type ChallengeProfile = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type ChallengeOrder = {
  id: string;
  username: string;
  status: string;
  total: number;
  createdAt: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
};

function mapProfile(row: {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}): ChallengeProfile {
  return {
    id: row.id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
  };
}

export async function getChallengeProfile(
  activeBug: string | null,
  username: string,
  cachedProfile?: ChallengeProfile | null
): Promise<ChallengeProfile | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('challenge_profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (!data) return null;
  const profile = mapProfile(data);

  const result = applyInjection(
    activeBug,
    'store.profile.read',
    () => profile,
    { profile, cachedProfile }
  );

  if (typeof result === 'object' && result !== null && 'username' in result) {
    const r = result as ChallengeProfile & { password?: string };
    return {
      id: r.id ?? profile.id,
      username: r.username,
      firstName: r.firstName ?? profile.firstName,
      lastName: r.lastName ?? profile.lastName,
      email: r.email ?? profile.email,
    };
  }
  return profile;
}

export async function updateChallengeProfile(
  activeBug: string | null,
  username: string,
  updates: Partial<Pick<ChallengeProfile, 'firstName' | 'lastName' | 'email'>>
): Promise<{ success: boolean; error?: string }> {
  const injected = applyInjection(
    activeBug,
    'store.profile.update',
    () => ({ success: true, persisted: true }),
    { sessionUsername: username, updates: { ...updates, username } }
  ) as { success: boolean; persisted?: boolean; username?: string; lastName?: string };

  if (injected.persisted === false) {
    return { success: true };
  }

  const targetUser = injected.username ?? username;
  const lastName =
    injected.lastName !== undefined ? injected.lastName : updates.lastName;

  const admin = createAdminClient();
  const { error } = await admin
    .from('challenge_profiles')
    .update({
      first_name: updates.firstName,
      last_name: lastName,
      email: updates.email,
    })
    .eq('username', targetUser);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getOrdersForUser(
  activeBug: string | null,
  username: string,
  cachedOrders?: ChallengeOrder[] | null
): Promise<ChallengeOrder[]> {
  const admin = createAdminClient();

  const listResult = applyInjection(
    activeBug,
    'store.orders.list',
    async () => {
      const { data: orders } = await admin
        .from('challenge_orders')
        .select('*')
        .eq('username', username)
        .order('created_at', { ascending: false });

      if (!orders) return [];

      const result: ChallengeOrder[] = [];
      for (const order of orders) {
        const { data: items } = await admin
          .from('challenge_order_items')
          .select('*')
          .eq('order_id', order.id);

        result.push({
          id: order.id,
          username: order.username,
          status: order.status,
          total: Number(order.total),
          createdAt: order.created_at,
          items: (items ?? []).map((i) => ({
            productId: i.product_id,
            quantity: i.quantity,
            unitPrice: Number(i.unit_price),
          })),
        });
      }
      return result;
    },
    { username, orders: [], cachedOrders }
  );

  const orders = await Promise.resolve(listResult);
  const processed = Array.isArray(orders) ? orders : [];

  return processed.map((order) => ({
    ...order,
    total: applyInjection(
      activeBug,
      'store.orders.displayTotal',
      () => order.total,
      order
    ) as number,
  }));
}

export async function createChallengeOrder(
  activeBug: string | null,
  username: string,
  items: { productId: string; quantity: number; unitPrice: number }[],
  cartTotal: number
): Promise<{ orderId: string; clearCart: boolean }> {
  const submitResult = applyInjection(
    activeBug,
    'store.checkout.submit',
    () => ({ username, total: cartTotal, duplicate: false, clearCart: true }),
    { username, cartTotal, items }
  ) as {
    username: string;
    total: number;
    duplicate?: boolean;
    clearCart?: boolean;
    orders?: unknown[];
  };

  const admin = createAdminClient();
  const orderUser = submitResult.username;
  const orderTotal = submitResult.total;

  async function insertOne() {
    const { data: order, error } = await admin
      .from('challenge_orders')
      .insert({
        username: orderUser,
        status: 'Processing',
        total: orderTotal,
      })
      .select('id')
      .single();

    if (error || !order) throw new Error(error?.message ?? 'Order failed');

    await admin.from('challenge_order_items').insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        quantity: i.quantity,
        unit_price: i.unitPrice,
      }))
    );

    return order.id as string;
  }

  const orderId = await insertOne();
  if (submitResult.duplicate) {
    await insertOne();
  }

  return {
    orderId,
    clearCart: submitResult.clearCart !== false,
  };
}

export async function handleProfileLogout(activeBug: string | null) {
  applyInjection(activeBug, 'store.profile.onLogout', () => ({ invalidated: true }), {});
}

export async function handleCartLogout(activeBug: string | null) {
  const result = applyInjection(
    activeBug,
    'store.cart.onLogout',
    () => ({ cleared: true }),
    {}
  ) as { cleared: boolean };
  return result.cleared !== false;
}
