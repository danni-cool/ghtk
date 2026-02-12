const readline = require("readline");

/**
 * Ask user a question and return the answer
 */
function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Prompt user to input scopes (e.g. @theplant @other-org)
 * Returns an array of normalized scope names (with @ prefix)
 */
async function promptScopes() {
  console.log("\nEnter the GitHub org scopes to configure for npm.pkg.github.com.");
  console.log("You can enter one or more scopes separated by spaces.");
  console.log('Example: @theplant @my-org\n');

  let raw;
  while (true) {
    const input = await ask("Scopes: ");
    if (!input) {
      console.log("Scopes cannot be empty. Please enter at least one scope.\n");
      continue;
    }
    raw = input.split(/[\s,]+/).filter(Boolean);
    if (raw.length === 0) {
      console.log("Scopes cannot be empty. Please enter at least one scope.\n");
      continue;
    }
    break;
  }

  // Normalize: ensure @ prefix
  return raw.map((s) => (s.startsWith("@") ? s : `@${s}`));
}

module.exports = {
  ask,
  promptScopes,
};
