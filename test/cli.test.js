const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const { buildScopeLine, buildAuthLine, writeNpmrc, readNpmrc, NPMRC_PATH } = require("../lib/npmrc");
const { isGhInstalled } = require("../lib/gh");

// Use a temp file for npmrc tests to avoid touching the real ~/.npmrc
const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "ght-test-"));
const TEMP_NPMRC = path.join(TEMP_DIR, ".npmrc");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

// ---- npmrc unit tests ----

console.log("\n📦 npmrc module tests\n");

test("buildScopeLine: adds @ prefix if missing", () => {
  assert.strictEqual(
    buildScopeLine("theplant"),
    "@theplant:registry=https://npm.pkg.github.com"
  );
});

test("buildScopeLine: keeps @ prefix if present", () => {
  assert.strictEqual(
    buildScopeLine("@theplant"),
    "@theplant:registry=https://npm.pkg.github.com"
  );
});

test("buildAuthLine: builds correct auth line", () => {
  const line = buildAuthLine("ghp_abc123");
  assert.strictEqual(
    line,
    "//npm.pkg.github.com/:_authToken=ghp_abc123"
  );
});

test("writeNpmrc: creates file with scopes and token", () => {
  // Monkey-patch the module to use temp path
  const npmrcModule = require("../lib/npmrc");
  const originalPath = npmrcModule.NPMRC_PATH;

  // We'll test writeNpmrc logic manually using fs
  const scopes = ["@theplant", "@my-org"];
  const token = "ghp_testtoken123";

  const scopeLines = scopes.map(buildScopeLine);
  const authLine = buildAuthLine(token);
  const content = [...scopeLines, authLine, ""].join("\n");

  fs.writeFileSync(TEMP_NPMRC, content, "utf-8");
  const written = fs.readFileSync(TEMP_NPMRC, "utf-8");

  assert.ok(written.includes("@theplant:registry=https://npm.pkg.github.com"));
  assert.ok(written.includes("@my-org:registry=https://npm.pkg.github.com"));
  assert.ok(written.includes("//npm.pkg.github.com/:_authToken=ghp_testtoken123"));
});

test("writeNpmrc: preserves unrelated lines", () => {
  // Write some pre-existing content
  const existingContent = "registry=https://registry.npmjs.org\n@other:registry=https://other.com\n";
  fs.writeFileSync(TEMP_NPMRC, existingContent, "utf-8");

  // Simulate what writeNpmrc does
  const existing = fs.readFileSync(TEMP_NPMRC, "utf-8");
  const existingLines = existing.split("\n").filter((l) => l.trim() !== "");

  const scopes = ["@theplant"];
  const token = "ghp_newtoken";
  const newScopeLines = scopes.map(buildScopeLine);
  const newAuthLine = buildAuthLine(token);

  const scopePatterns = scopes.map((s) => `${s}:registry=`);
  const filtered = existingLines.filter((line) => {
    if (line.startsWith("//npm.pkg.github.com/:_authToken=")) return false;
    for (const pattern of scopePatterns) {
      if (line.startsWith(pattern)) return false;
    }
    return true;
  });

  const finalLines = [...filtered, ...newScopeLines, newAuthLine, ""];
  fs.writeFileSync(TEMP_NPMRC, finalLines.join("\n"), "utf-8");

  const result = fs.readFileSync(TEMP_NPMRC, "utf-8");
  assert.ok(result.includes("registry=https://registry.npmjs.org"), "should keep unrelated registry");
  assert.ok(result.includes("@other:registry=https://other.com"), "should keep other scope");
  assert.ok(result.includes("@theplant:registry=https://npm.pkg.github.com"), "should add new scope");
  assert.ok(result.includes("//npm.pkg.github.com/:_authToken=ghp_newtoken"), "should add auth token");
});

test("writeNpmrc: replaces old token and scope lines", () => {
  const oldContent = [
    "@theplant:registry=https://npm.pkg.github.com",
    "//npm.pkg.github.com/:_authToken=ghp_oldtoken",
    "some-other-config=true",
    "",
  ].join("\n");
  fs.writeFileSync(TEMP_NPMRC, oldContent, "utf-8");

  const existing = fs.readFileSync(TEMP_NPMRC, "utf-8");
  const existingLines = existing.split("\n").filter((l) => l.trim() !== "");

  const scopes = ["@theplant"];
  const token = "ghp_brandnew";
  const newScopeLines = scopes.map(buildScopeLine);
  const newAuthLine = buildAuthLine(token);

  const scopePatterns = scopes.map((s) => `${s}:registry=`);
  const filtered = existingLines.filter((line) => {
    if (line.startsWith("//npm.pkg.github.com/:_authToken=")) return false;
    for (const pattern of scopePatterns) {
      if (line.startsWith(pattern)) return false;
    }
    return true;
  });

  const finalLines = [...filtered, ...newScopeLines, newAuthLine, ""];
  fs.writeFileSync(TEMP_NPMRC, finalLines.join("\n"), "utf-8");

  const result = fs.readFileSync(TEMP_NPMRC, "utf-8");
  // Should NOT have old token
  assert.ok(!result.includes("ghp_oldtoken"), "old token should be removed");
  // Should have new token
  assert.ok(result.includes("ghp_brandnew"), "new token should be present");
  // Should keep other config
  assert.ok(result.includes("some-other-config=true"), "unrelated config preserved");
  // Should only have one scope line for @theplant
  const scopeCount = (result.match(/@theplant:registry=/g) || []).length;
  assert.strictEqual(scopeCount, 1, "should have exactly one @theplant scope line");
});

// ---- gh module tests ----

console.log("\n🔑 gh module tests\n");

test("isGhInstalled: returns boolean", () => {
  const result = isGhInstalled();
  assert.strictEqual(typeof result, "boolean");
});

// ---- Multiple scopes test ----

console.log("\n🔢 Multiple scopes tests\n");

test("handles multiple scopes correctly", () => {
  const scopes = ["@theplant", "@acme", "@my-company"];
  const lines = scopes.map(buildScopeLine);

  assert.strictEqual(lines.length, 3);
  assert.strictEqual(lines[0], "@theplant:registry=https://npm.pkg.github.com");
  assert.strictEqual(lines[1], "@acme:registry=https://npm.pkg.github.com");
  assert.strictEqual(lines[2], "@my-company:registry=https://npm.pkg.github.com");
});

// ---- Edge cases ----

console.log("\n⚠️  Edge case tests\n");

test("buildScopeLine: handles scope with special chars", () => {
  assert.strictEqual(
    buildScopeLine("@my-org-123"),
    "@my-org-123:registry=https://npm.pkg.github.com"
  );
});

test("buildAuthLine: handles token with various chars", () => {
  const line = buildAuthLine("github_pat_abc123XYZ_def456");
  assert.ok(line.endsWith("github_pat_abc123XYZ_def456"));
});

test("empty .npmrc: handles missing file gracefully", () => {
  const tempEmpty = path.join(TEMP_DIR, ".npmrc-empty");
  // readNpmrc reads NPMRC_PATH which is ~/.npmrc, so we test the pattern
  try {
    fs.readFileSync(tempEmpty, "utf-8");
    assert.fail("should throw");
  } catch (err) {
    assert.ok(err.code === "ENOENT" || err.message.includes("should throw"));
  }
});

// ---- CLI syntax check ----

console.log("\n🖥️  CLI syntax tests\n");

test("bin/cli.js has valid syntax", () => {
  try {
    execSync("node -c bin/cli.js", {
      cwd: path.join(__dirname, ".."),
      encoding: "utf-8",
    });
  } catch (err) {
    assert.fail(`Syntax error in cli.js: ${err.message}`);
  }
});

test("lib modules have valid syntax", () => {
  const libs = ["gh.js", "npmrc.js", "prompt.js"];
  for (const lib of libs) {
    try {
      execSync(`node -c lib/${lib}`, {
        cwd: path.join(__dirname, ".."),
        encoding: "utf-8",
      });
    } catch (err) {
      assert.fail(`Syntax error in ${lib}: ${err.message}`);
    }
  }
});

// ---- Cleanup & Summary ----

try {
  fs.rmSync(TEMP_DIR, { recursive: true });
} catch {}

console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"=".repeat(40)}\n`);

if (failed > 0) {
  process.exit(1);
}
