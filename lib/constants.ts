export const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] as const;

export const SEASON_LENGTH_DAYS = 30;

export const BUG_PAGES = [
  'Login',
  'Catalog',
  'Product Details',
  'Cart',
  'Checkout',
  'Orders',
  'Profile',
] as const;

export const BUG_CATEGORIES = [
  'UI',
  'Functional',
  'Validation',
  'Authorization',
  'Session Management',
  'Security',
  'Calculation',
  'Data Persistence',
] as const;

export const BUG_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home',
  'Books',
  'Sports',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function getF1Points(rank: number): number {
  return F1_POINTS[rank - 1] ?? 0;
}
