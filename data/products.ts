import type { ProductCategory } from '@/lib/constants';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  stock: number;
  category: ProductCategory;
  image: string;
};

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Wireless Noise-Cancelling Headphones', description: 'Premium over-ear headphones with 30-hour battery life and active noise cancellation.', price: 249.99, rating: 4.7, stock: 45, category: 'Electronics', image: 'https://picsum.photos/seed/p1/400/400' },
  { id: 'p2', name: 'Smart Fitness Watch', description: 'Track heart rate, sleep, and workouts with GPS and water resistance.', price: 199.99, rating: 4.5, stock: 62, category: 'Electronics', image: 'https://picsum.photos/seed/p2/400/400' },
  { id: 'p3', name: '4K Ultra HD Monitor 27"', description: 'IPS panel with HDR support and USB-C connectivity for modern workspaces.', price: 449.99, rating: 4.6, stock: 28, category: 'Electronics', image: 'https://picsum.photos/seed/p3/400/400' },
  { id: 'p4', name: 'Mechanical Keyboard RGB', description: 'Hot-swappable switches with per-key RGB lighting and aluminum frame.', price: 129.99, rating: 4.8, stock: 55, category: 'Electronics', image: 'https://picsum.photos/seed/p4/400/400' },
  { id: 'p5', name: 'Portable Bluetooth Speaker', description: '360-degree sound with 12-hour playtime and IPX7 waterproof rating.', price: 79.99, rating: 4.4, stock: 80, category: 'Electronics', image: 'https://picsum.photos/seed/p5/400/400' },
  { id: 'p6', name: 'Classic Denim Jacket', description: 'Timeless medium-wash denim jacket with button closure and chest pockets.', price: 89.99, rating: 4.3, stock: 40, category: 'Clothing', image: 'https://picsum.photos/seed/p6/400/400' },
  { id: 'p7', name: 'Merino Wool Sweater', description: 'Soft, breathable merino wool crew neck sweater for all seasons.', price: 119.99, rating: 4.6, stock: 35, category: 'Clothing', image: 'https://picsum.photos/seed/p7/400/400' },
  { id: 'p8', name: 'Running Shoes Pro', description: 'Lightweight performance running shoes with responsive foam cushioning.', price: 139.99, rating: 4.7, stock: 50, category: 'Clothing', image: 'https://picsum.photos/seed/p8/400/400' },
  { id: 'p9', name: 'Cotton T-Shirt Pack', description: 'Set of 3 premium cotton tees in neutral colors, relaxed fit.', price: 39.99, rating: 4.2, stock: 100, category: 'Clothing', image: 'https://picsum.photos/seed/p9/400/400' },
  { id: 'p10', name: 'Leather Belt', description: 'Full-grain leather belt with brushed nickel buckle.', price: 49.99, rating: 4.5, stock: 60, category: 'Clothing', image: 'https://picsum.photos/seed/p10/400/400' },
  { id: 'p11', name: 'Ceramic Pour-Over Coffee Set', description: 'Handcrafted ceramic dripper with glass carafe for artisan coffee.', price: 54.99, rating: 4.6, stock: 30, category: 'Home', image: 'https://picsum.photos/seed/p11/400/400' },
  { id: 'p12', name: 'Memory Foam Pillow', description: 'Ergonomic contoured pillow for neck support and better sleep.', price: 69.99, rating: 4.4, stock: 75, category: 'Home', image: 'https://picsum.photos/seed/p12/400/400' },
  { id: 'p13', name: 'Scented Candle Collection', description: 'Set of 4 soy wax candles with lavender, cedar, citrus, and vanilla scents.', price: 34.99, rating: 4.3, stock: 90, category: 'Home', image: 'https://picsum.photos/seed/p13/400/400' },
  { id: 'p14', name: 'Stainless Steel Cookware Set', description: '10-piece tri-ply stainless steel pots and pans with lids.', price: 299.99, rating: 4.8, stock: 20, category: 'Home', image: 'https://picsum.photos/seed/p14/400/400' },
  { id: 'p15', name: 'Minimalist Desk Lamp', description: 'Adjustable LED desk lamp with touch dimmer and warm white light.', price: 44.99, rating: 4.5, stock: 55, category: 'Home', image: 'https://picsum.photos/seed/p15/400/400' },
  { id: 'p16', name: 'The Art of Software Testing', description: 'Comprehensive guide to modern QA practices and test automation strategies.', price: 49.99, rating: 4.7, stock: 42, category: 'Books', image: 'https://picsum.photos/seed/p16/400/400' },
  { id: 'p17', name: 'Clean Code', description: 'A handbook of agile software craftsmanship by Robert C. Martin.', price: 39.99, rating: 4.9, stock: 65, category: 'Books', image: 'https://picsum.photos/seed/p17/400/400' },
  { id: 'p18', name: 'Exploratory Testing Notes', description: 'Practical techniques for session-based exploratory testing in agile teams.', price: 29.99, rating: 4.4, stock: 38, category: 'Books', image: 'https://picsum.photos/seed/p18/400/400' },
  { id: 'p19', name: 'Design Patterns', description: 'Elements of reusable object-oriented software — the Gang of Four classic.', price: 54.99, rating: 4.6, stock: 50, category: 'Books', image: 'https://picsum.photos/seed/p19/400/400' },
  { id: 'p20', name: 'Agile Testing', description: 'A practical guide for testers and agile teams by Lisa Crispin.', price: 44.99, rating: 4.5, stock: 33, category: 'Books', image: 'https://picsum.photos/seed/p20/400/400' },
  { id: 'p21', name: 'Yoga Mat Premium', description: 'Non-slip eco-friendly yoga mat with alignment markers, 6mm thick.', price: 59.99, rating: 4.6, stock: 70, category: 'Sports', image: 'https://picsum.photos/seed/p21/400/400' },
  { id: 'p22', name: 'Adjustable Dumbbell Set', description: 'Pair of adjustable dumbbells ranging from 5 to 52.5 lbs each.', price: 349.99, rating: 4.8, stock: 15, category: 'Sports', image: 'https://picsum.photos/seed/p22/400/400' },
  { id: 'p23', name: 'Resistance Bands Kit', description: 'Set of 5 latex resistance bands with handles, door anchor, and bag.', price: 24.99, rating: 4.3, stock: 120, category: 'Sports', image: 'https://picsum.photos/seed/p23/400/400' },
  { id: 'p24', name: 'Insulated Water Bottle', description: '32oz stainless steel vacuum insulated bottle keeps drinks cold 24 hours.', price: 34.99, rating: 4.7, stock: 85, category: 'Sports', image: 'https://picsum.photos/seed/p24/400/400' },
  { id: 'p25', name: 'Limited Edition Film Camera', description: 'Restored 35mm point-and-shoot camera — currently unavailable for restock.', price: 189.99, rating: 4.5, stock: 0, category: 'Electronics', image: 'https://picsum.photos/seed/p25/400/400' },
];

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
