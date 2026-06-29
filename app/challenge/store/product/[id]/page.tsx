'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getProductById } from '@/data/products';
import { useCartStore } from '@/store/cart-store';
import { validateProductQuantityAction } from '@/app/actions/store';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { notFound } from 'next/navigation';

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = getProductById(id);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  if (!product) notFound();

  async function handleAddToCart() {
    const validQty = await validateProductQuantityAction(quantity, product!.stock);
    if (validQty === null || validQty < 1) {
      toast.error('Invalid quantity.');
      return;
    }
    addItem(
      {
        productId: product!.id,
        name: product!.name,
        unitPrice: product!.price,
        image: product!.image,
      },
      validQty
    );
    toast.success(`Added ${validQty} to cart.`);
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
      </div>
      <div className="space-y-4">
        <Badge variant="secondary">{product.category}</Badge>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <div className="flex items-center gap-1 text-amber-500">
          <Star className="h-4 w-4 fill-current" />
          <span className="text-sm text-gray-600">{product.rating} rating</span>
        </div>
        <p className="text-3xl font-bold text-emerald-700">${product.price.toFixed(2)}</p>
        <p className="text-gray-600 leading-relaxed">{product.description}</p>
        <p className="text-sm text-gray-500">{product.stock} in stock</p>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Quantity:</label>
          <div className="flex items-center border rounded-md">
            <button
              type="button"
              className="px-3 py-1 hover:bg-gray-100"
              onClick={() => setQuantity((q) => q - 1)}
            >
              −
            </button>
            <span className="px-4 py-1 min-w-[3rem] text-center">{quantity}</span>
            <button
              type="button"
              className="px-3 py-1 hover:bg-gray-100"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
          <Link
            href="/challenge/store/catalog"
            className={buttonVariants({ variant: 'outline' })}
          >
            Back to Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
