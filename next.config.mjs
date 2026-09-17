/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gpojnwfacfqbguxrhdsd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  eslint: {
    dirs: ["src"],
    // Build ke waqt ESLint errors ignore karne ke liye:
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript build errors ko skip karne ke liye:
    ignoreBuildErrors: true,
  },
  async headers() {
    // Defense in depth only - the real authorization boundary is
    // Supabase RLS, not these headers.
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;