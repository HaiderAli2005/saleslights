/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static site: `next build` emits ./out, servable from any CDN or file host.
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
