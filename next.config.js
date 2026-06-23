/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mapbox GL requires these webpack tweaks
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'mapbox-gl',
    };
    return config;
  },
};

module.exports = nextConfig;
