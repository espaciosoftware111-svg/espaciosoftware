/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@prisma/client",
      "clsx",
      "tailwind-merge",
      "zod",
    ],
  },
};

export default nextConfig;
