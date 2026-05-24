
import type { NextConfig } from "next";
import withPWA from 'next-pwa';



const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Empty turbopack config silences the webpack/Turbopack conflict warning
  // caused by next-pwa injecting a webpack config (next-pwa v5 is webpack-only).
  turbopack: {},
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
}) 

export default pwaConfig(nextConfig);
