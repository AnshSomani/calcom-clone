/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests to backend API in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
