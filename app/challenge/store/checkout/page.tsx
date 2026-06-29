'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart-store';
import { checkoutAction, calculateCartTotalAction } from '@/app/actions/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CheckoutPage() {
  const router = useRouter();
  const idempotencyKey = useId();
  const { items, clearCart } = useCartStore();
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function calc() {
      const t = await calculateCartTotalAction(
        items.map((i) => ({
          productId: i.productId,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        }))
      );
      setTotal(t);
    }
    if (items.length) calc();
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Cart is empty.{' '}
        <button
          type="button"
          className="text-emerald-600 hover:underline"
          onClick={() => router.push('/challenge/store/catalog')}
        >
          Go to catalog
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      fullName: String(fd.get('fullName') ?? ''),
      email: String(fd.get('email') ?? ''),
      address: String(fd.get('address') ?? ''),
      city: String(fd.get('city') ?? ''),
      postalCode: String(fd.get('postalCode') ?? ''),
      phone: String(fd.get('phone') ?? ''),
    };

    const result = await checkoutAction(
      items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      total,
      data,
      idempotencyKey
    );

    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.clearCart !== false) {
      clearCart();
    }
    toast.success('Order placed successfully!');
    router.push('/challenge/store/orders');
  }

  return (
    <div className="max-w-2xl mx-auto grid gap-6 md:grid-cols-5">
      <div className="md:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(
                [
                  ['fullName', 'Full Name'],
                  ['email', 'Email'],
                  ['address', 'Address'],
                  ['city', 'City'],
                  ['postalCode', 'Postal Code'],
                  ['phone', 'Phone Number'],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <Label htmlFor={field}>{label}</Label>
                  <Input
                    id={field}
                    name={field}
                    type={field === 'email' ? 'email' : 'text'}
                  />
                </div>
              ))}
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Place Order'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span className="truncate mr-2">
                  {item.name} × {item.quantity}
                </span>
                <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-emerald-700">${total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
