import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize pdfkit and its dependencies for server-side
      config.externals = config.externals || [];
      config.externals.push({
        'pdfkit': 'commonjs pdfkit',
        'canvas': 'commonjs canvas',
      });

      // Copy font files from pdfkit
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdfkit': path.resolve('./node_modules/pdfkit'),
      };

      // Handle .afm files
      config.module.rules.push({
        test: /\.afm$/,
        type: 'asset/resource',
      });
    }

    return config;
  },
};

export default nextConfig;
