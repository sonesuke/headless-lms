import path from "path";
import { defineConfig } from "vite";
import EnvironmentPlugin from "vite-plugin-environment";

export default defineConfig({
  plugins: [
    EnvironmentPlugin({
      NODE_ENV: "development",
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "lib/main.ts"),
      name: "HeadLessLMS",
      formats: ["umd"],
      fileName: "headless-lms",
    },
  },
});
