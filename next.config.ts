import type { NextConfig } from 'next';

// ShopVerse clean URLs (/login, /catalog, …) are rewritten in middleware when
// APP_MODE=store. next.config rewrites cannot override conflicting App Router
// pages such as app/(auth)/login and app/(platform)/profile.

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },
};

export default nextConfig;
