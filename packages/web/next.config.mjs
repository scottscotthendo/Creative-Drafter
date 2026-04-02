/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@heidi/core"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.fal.media" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "fal.media" },
    ],
  },
};

export default nextConfig;
