/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Support for buildathon template port 5173
  // Next.js will use PORT environment variable if set, otherwise defaults to 3000
}

module.exports = nextConfig
