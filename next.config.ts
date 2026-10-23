import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O gerador de PDF (recibos) roda no Node como está, sem passar pelo empacotador.
  serverExternalPackages: ["@react-pdf/renderer"],
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
