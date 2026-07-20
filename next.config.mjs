/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    workerThreads: true,
  },
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.1.7'],
};

export default nextConfig;

