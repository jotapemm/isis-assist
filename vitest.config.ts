import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // O mesmo atalho "@/" do tsconfig, para os testes importarem igual ao app.
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: { include: ["src/**/*.test.ts"] },
});
