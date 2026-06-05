import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : ["localhost:3000"],
    },
  },
  // Evita logs do Prisma no bundle do cliente
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
