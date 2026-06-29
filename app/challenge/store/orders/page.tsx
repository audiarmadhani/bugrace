'use client';

import { useEffect, useState } from 'react';
import { getStoreOrdersAction } from '@/app/actions/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { ChallengeOrder } from '@/services/challenge-data-service';

const ORDERS_CACHE_KEY = 'bugrace_orders_cache';

export default function OrdersPage() {
  const [orders, setOrders] = useState<ChallengeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cachedOrders, setCachedOrders] = useState<ChallengeOrder[] | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(ORDERS_CACHE_KEY);
    if (raw) {
      try {
        setCachedOrders(JSON.parse(raw) as ChallengeOrder[]);
      } catch {
        setCachedOrders(null);
      }
    }
  }, []);

  useEffect(() => {
    async function load() {
      const data = await getStoreOrdersAction(cachedOrders);
      setOrders(data);
      if (data.length > 0) {
        sessionStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(data));
      }
      setLoading(false);
    }
    load();
  }, [cachedOrders]);

  if (loading) {
    return <p className="text-gray-500">Loading orders...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No orders yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-mono text-sm text-gray-500">#{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(order.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="secondary">{order.status}</Badge>
                <p className="font-bold text-emerald-700">${order.total.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
