'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart-store';
import { calculateCartTotalAction } from '@/app/actions/store';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCartStore();
  const [total, setTotal] = useState(0);

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
    calc();
  }, [items]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Shopping Cart</h1>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Your cart is empty.{' '}
            <Link href="/challenge/store/catalog" className="text-emerald-600 hover:underline">
              Continue shopping
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.productId}>
                <CardContent className="flex gap-4 p-4">
                  <div className="relative h-20 w-20 shrink-0 bg-gray-100 rounded overflow-hidden">
                    <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500">${item.unitPrice.toFixed(2)} each</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        className="px-2 py-0.5 border rounded text-sm"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="text-sm w-8 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        className="px-2 py-0.5 border rounded text-sm"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="text-sm text-red-600 ml-auto hover:underline"
                        onClick={() => removeItem(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-semibold">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <span className="font-semibold text-lg">Grand Total</span>
              <span className="font-bold text-xl text-emerald-700">${total.toFixed(2)}</span>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Link
              href="/challenge/store/catalog"
              className={buttonVariants({ variant: 'outline' })}
            >
              Continue Shopping
            </Link>
            <Link
              href="/challenge/store/checkout"
              className={buttonVariants({ className: 'bg-emerald-600 hover:bg-emerald-700 text-white' })}
            >
              Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
