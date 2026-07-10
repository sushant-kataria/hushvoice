import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is only for the Docker web image — Vercel must use the default output.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
