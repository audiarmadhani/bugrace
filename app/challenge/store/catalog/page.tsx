'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PRODUCTS, type Product } from '@/data/products';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { filterCatalogAction } from '@/app/actions/store';
import { useCartStore } from '@/store/cart-store';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('default');
  const [isPending, startTransition] = useTransition();
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    startTransition(async () => {
      const filtered = await filterCatalogAction(PRODUCTS, {
        query: query || undefined,
        category: category !== 'all' ? category : undefined,
        sort: sort !== 'default' ? sort : undefined,
      });
      setProducts(filtered as Product[]);
    });
  }, [query, category, sort]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
        <p className="text-gray-500">Browse our collection</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={category} onValueChange={(v) => setCategory(v ?? 'all')}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {PRODUCT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v ?? 'default')}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending && <p className="text-sm text-gray-400">Updating...</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <CardContent className="p-4 space-y-2">
              <Badge variant="secondary" className="text-xs">{product.category}</Badge>
              <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-xs text-gray-600">{product.rating}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-700">${product.price.toFixed(2)}</span>
                <span className="text-xs text-gray-500">{product.stock} in stock</span>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 gap-2">
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() =>
                  addItem(
                    {
                      productId: product.id,
                      name: product.name,
                      unitPrice: product.price,
                      image: product.image,
                    },
                    1
                  )
                }
              >
                Add to Cart
              </Button>
              <Link
                href={`/challenge/store/product/${product.id}`}
                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'flex-1 text-center' })}
              >
                Details
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
