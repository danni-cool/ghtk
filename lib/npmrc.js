const fs = require("fs");
const path = require("path");
const os = require("os");

const NPMRC_PATH = path.join(os.homedir(), ".npmrc");
const REGISTRY_URL = "https://npm.pkg.github.com";
const AUTH_LINE_PREFIX = "//npm.pkg.github.com/:_authToken=";

/**
 * Read existing .npmrc content, return empty string if not exists
 */
function readNpmrc() {
  try {
    return fs.readFileSync(NPMRC_PATH, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Build registry line for a scope, e.g. @theplant:registry=https://npm.pkg.github.com
 */
function buildScopeLine(scope) {
  const normalized = scope.startsWith("@") ? scope : `@${scope}`;
  return `${normalized}:registry=${REGISTRY_URL}`;
}

/**
 * Build auth token line
 */
function buildAuthLine(token) {
  return `${AUTH_LINE_PREFIX}${token}`;
}

/**
 * Write scopes + token into ~/.npmrc, preserving unrelated existing lines
 */
function writeNpmrc(scopes, token) {
  const existing = readNpmrc();
  const existingLines = existing
    ? existing.split("\n").filter((l) => l.trim() !== "")
    : [];

  // Scope lines we want to write
  const newScopeLines = scopes.map(buildScopeLine);
  const newAuthLine = buildAuthLine(token);

  // Filter out old scope lines for the same scopes and old auth token line
  const scopePatterns = scopes.map((s) => {
    const normalized = s.startsWith("@") ? s : `@${s}`;
    return `${normalized}:registry=`;
  });

  const filtered = existingLines.filter((line) => {
    if (line.startsWith(AUTH_LINE_PREFIX)) return false;
    for (const pattern of scopePatterns) {
      if (line.startsWith(pattern)) return false;
    }
    return true;
  });

  const finalLines = [...filtered, ...newScopeLines, newAuthLine, ""];
  const content = finalLines.join("\n");

  fs.writeFileSync(NPMRC_PATH, content, "utf-8");
  return NPMRC_PATH;
}

module.exports = {
  NPMRC_PATH,
  readNpmrc,
  buildScopeLine,
  buildAuthLine,
  writeNpmrc,
};
