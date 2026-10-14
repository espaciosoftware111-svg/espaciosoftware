import { defineConfig } from "vitest/config";
import path from "path";
import fs from "fs";

// Load .env if present
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...vals] = trimmed.split("=");
    let val = vals.join("=").trim().replace(/^["']|["']$/g, "");
    if (val.includes(" #")) {
      val = val.split(" #")[0].trim().replace(/^["']|["']$/g, "");
    }
    process.env[key.trim()] = val;
  }
}

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL || "",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
});
