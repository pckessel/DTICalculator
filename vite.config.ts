import { defineConfig } from "vite-plus";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [TanStackRouterVite({ routesDirectory: "./src/routes" }), react(), tailwindcss()],
  staged: {
    "*": "vp check --fix",
  },
  fmt: { ignorePatterns: ["src/routeTree.gen.ts"] },
  lint: { options: { typeAware: true, typeCheck: true } },
  test: {
    exclude: ["e2e/**", "node_modules/**"],
    passWithNoTests: true,
  },
});
