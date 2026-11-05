/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];
    const destination = backendUrl.replace(/\/$/, '');
    return [
      { source: '/auth/:path*', destination: `${destination}/auth/:path*` },
      { source: '/api/:path*', destination: `${destination}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;
