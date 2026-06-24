import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packagePath = resolve(scriptDir, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const tagName = `v${packageJson.version}`;

try {
  execSync(`git rev-parse --verify refs/tags/${tagName}`, { stdio: "ignore" });
  console.error(`Tag ${tagName} already exists.`);
  process.exit(1);
} catch {
  // Tag does not exist yet.
}

execSync(`git tag ${tagName}`, { stdio: "inherit" });
execSync(`git push origin ${tagName}`, { stdio: "inherit" });
