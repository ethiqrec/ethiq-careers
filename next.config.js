/** @type {import('next').NextConfig} */
const nextConfig = {
  // No 'output: export' -- we need server-side API routes + ISR
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Revalidate pages every 15 minutes by default
  experimental: {},
}

export default nextConfig
