import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profiles = ["istanbul", "tokyo", "new-york", "sydney", "reykjavik"];
const argumentsList = process.argv.slice(2);
const liveGeneration = argumentsList.includes("--live");
const selectedProfile = argumentsList.find((argument) => !argument.startsWith("--")) ?? "istanbul";

if (!profiles.includes(selectedProfile)) {
  console.error(`Unknown profile: ${selectedProfile}`);
  console.error(`Available profiles: ${profiles.join(", ")}`);
  process.exit(1);
}

const profilePath = path.join(root, "fixtures", "locations", `${selectedProfile}.json`);
const wrangler = spawn(
  path.join(root, "node_modules", ".bin", "wrangler"),
  [
    "dev",
    ...(liveGeneration ? [] : ["--var", "GEO_PREVIEW:true"]),
    ...(liveGeneration ? ["--var", "GENERATION_SIGNING_KEY:local-development-only"] : []),
    "--port",
    "8787",
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      CLOUDFLARE_CF_FETCH_PATH: profilePath,
      WRANGLER_LOG_PATH: "/tmp/geoaware-preview.log",
    },
    stdio: "inherit",
  },
);

wrangler.on("error", (error) => {
  console.error("Unable to start Wrangler preview:", error);
  process.exit(1);
});

console.log(
  `Geo preview: http://127.0.0.1:8787 (${selectedProfile}, ${liveGeneration ? "live Fal generation" : "mock generation"})`,
);
console.log(`Profiles: ${profiles.join(", ")}`);
console.log("Press Ctrl+C to stop.");

wrangler.on("exit", (code) => process.exit(code ?? 0));
