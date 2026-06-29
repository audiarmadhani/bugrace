import type { NextConfig } from 'next';

const isStoreMode = process.env.APP_MODE === 'store';

const storeRewrites = isStoreMode
  ? [
      { source: '/login', destination: '/challenge/store/login' },
      { source: '/catalog', destination: '/challenge/store/catalog' },
      { source: '/cart', destination: '/challenge/store/cart' },
      { source: '/checkout', destination: '/challenge/store/checkout' },
      { source: '/orders', destination: '/challenge/store/orders' },
      { source: '/profile', destination: '/challenge/store/profile' },
      { source: '/product/:id', destination: '/challenge/store/product/:id' },
    ]
  : [];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },
  async rewrites() {
    return storeRewrites;
  },
};

export default nextConfig;
