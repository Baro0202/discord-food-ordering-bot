/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": __dirname,
    };

    // Add fallbacks for Node.js modules in browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        "node:crypto": false,
        "node:buffer": false,
        "node:stream": false,
        "node:util": false,
        "node:url": false,
        "node:net": false,
        "node:tls": false,
        "node:zlib": false,
        "node:http": false,
        "node:https": false,
        "node:fs": false,
        "node:path": false,
        "node:os": false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        os: false,
        path: false,
        querystring: false,
        punycode: false,
        buffer: false,
        events: false,
        string_decoder: false,
      };
    }

    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
