/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Lint checks enabled for build time error detection
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Type checking enabled for build time error detection
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
