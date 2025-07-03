/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = {
  ...nextConfig,
  devIndicators: {
    buildActivity: false
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.output.publicPath = '/_next/';
    }
    return config;
  }
};
