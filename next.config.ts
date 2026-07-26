import type { NextConfig } from "next";

// Do not set `output: "standalone"` here — that breaks Vercel routing (404 NOT_FOUND).
// The Docker web image sets DOCKER_BUILD=1 and can override via env if needed.
const nextConfig: NextConfig = {};

export default nextConfig;
