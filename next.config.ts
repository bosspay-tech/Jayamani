import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// Pre-migration Supabase project — product/category images may still reference this host.
const legacySupabaseHostname = "vbaopzltggkuffafqnpi.supabase.co";

const supabaseHostnames = [
  legacySupabaseHostname,
  ...(supabaseHostname ? [supabaseHostname] : []),
].filter((hostname, index, all) => all.indexOf(hostname) === index);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "luxeria.in",
        pathname: "/wp-content/uploads/**",
      },
      ...supabaseHostnames.map((hostname) => ({
        protocol: "https" as const,
        hostname,
        pathname: "/storage/v1/object/public/**",
      })),
    ],
  },
};

export default nextConfig;
