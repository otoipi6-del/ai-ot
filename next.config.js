/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth'],
  },
};

module.exports = nextConfig;
