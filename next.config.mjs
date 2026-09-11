/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    workerThreads: true,
    serverActions: {
      // Default is 1MB, far too small for the PDF/image lampiran uploads (finance,
      // tax, invoice) that go through server actions bound directly to <form action>.
      bodySizeLimit: '50mb',
    },
  },
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.1.7'],
};

export default nextConfig;

