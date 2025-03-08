/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure we're not using any custom runtimes that might cause issues
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

export default nextConfig

