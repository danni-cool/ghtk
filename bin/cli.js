#!/usr/bin/env node

const { ensureGh, authLogin, getToken } = require("../lib/gh");
const { writeNpmrc } = require("../lib/npmrc");
const { promptScopes } = require("../lib/prompt");

const GH_AUTH_SCOPES = "read:packages,repo";

async function main() {
  console.log("🔧 Quick setup for GitHub Packages — no more 403 errors!\n");

  // Step 1: Ensure gh CLI is available (auto-install if missing)
  ensureGh();
  console.log("✅ gh CLI is available.\n");

  // Step 2: Prompt user for org scopes
  const scopes = await promptScopes();
  console.log(`\nConfiguring scopes: ${scopes.join(", ")}`);

  // Step 3: gh auth login with required scopes
  authLogin(GH_AUTH_SCOPES);

  // Step 4: Get token
  const token = getToken();

  // Step 5: Write ~/.npmrc
  const npmrcPath = writeNpmrc(scopes, token);

  console.log(`\n✅ Done! ~/.npmrc has been configured at: ${npmrcPath}`);
  console.log("\nConfigured registries:");
  scopes.forEach((s) => {
    console.log(`  ${s}:registry=https://npm.pkg.github.com`);
  });
  console.log("\nYou can now install packages from these GitHub Package registries.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
