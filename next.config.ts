import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/tips", destination: "/picks", permanent: true },
      { source: "/standings", destination: "/scoreboard", permanent: true },
      { source: "/tabell", destination: "/scoreboard", permanent: true },
    ];
  },
};

export default nextConfig;
