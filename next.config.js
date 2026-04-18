/** @type {import('next').NextConfig} */
// v2 app-router rebuild // trigger deploy
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {},
}

export default nextConfig
