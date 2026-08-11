import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];

export default defineConfig({
  root: "pages",
  base: repositoryName ? `/${repositoryName}/` : "/",
  plugins: [react()],
  publicDir: "../public",
  build: {
    outDir: "../pages-dist",
    emptyOutDir: true,
  },
});
