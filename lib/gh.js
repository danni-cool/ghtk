const { execSync, spawnSync } = require("child_process");
const os = require("os");

/**
 * Check if gh CLI is installed
 */
function isGhInstalled() {
  try {
    execSync("gh --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Install gh CLI automatically based on platform
 */
function installGh() {
  const platform = os.platform();

  if (platform === "darwin") {
    console.log("Installing gh via Homebrew...");
    try {
      execSync("brew --version", { stdio: "ignore" });
    } catch {
      console.error(
        "Homebrew is not installed. Please install Homebrew first: https://brew.sh"
      );
      process.exit(1);
    }
    spawnSync("brew", ["install", "gh"], { stdio: "inherit" });
  } else if (platform === "linux") {
    console.log("Installing gh on Linux...");
    try {
      // Try apt-based install (Debian/Ubuntu)
      execSync("apt-get --version", { stdio: "ignore" });
      spawnSync(
        "bash",
        [
          "-c",
          `(type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y)) \
&& sudo mkdir -p -m 755 /etc/apt/keyrings \
&& out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
&& cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
&& sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
&& sudo apt update \
&& sudo apt install gh -y`,
        ],
        { stdio: "inherit" }
      );
    } catch {
      try {
        // Try yum-based install (RHEL/CentOS/Fedora)
        execSync("yum --version", { stdio: "ignore" });
        spawnSync(
          "bash",
          [
            "-c",
            `sudo dnf install 'dnf-command(config-manager)' -y \
&& sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo \
&& sudo dnf install gh -y`,
          ],
          { stdio: "inherit" }
        );
      } catch {
        console.error(
          "Could not detect a supported package manager (apt or yum/dnf)."
        );
        process.exit(1);
      }
    }
  } else if (platform === "win32") {
    console.log("Installing gh via winget...");
    spawnSync("winget", ["install", "--id", "GitHub.cli"], {
      stdio: "inherit",
    });
  } else {
    console.error(
      `Unsupported platform: ${platform}. Please install gh manually: https://cli.github.com`
    );
    process.exit(1);
  }

  if (!isGhInstalled()) {
    console.error("Failed to install gh CLI. Please install it manually: https://cli.github.com");
    process.exit(1);
  }

  console.log("gh CLI installed successfully.\n");
}

/**
 * Ensure gh is installed, install if not
 */
function ensureGh() {
  if (isGhInstalled()) {
    return;
  }
  console.log("gh CLI not found. Installing automatically...\n");
  installGh();
}

/**
 * Run gh auth login with required scopes
 */
function authLogin(scopes) {
  console.log(`\nAuthenticating with GitHub (scopes: ${scopes})...\n`);
  const result = spawnSync("gh", ["auth", "login", "--scopes", scopes], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.error("gh auth login failed.");
    process.exit(1);
  }
}

/**
 * Get the current gh auth token
 */
function getToken() {
  try {
    const token = execSync("gh auth token", { encoding: "utf-8" }).trim();
    if (!token) {
      throw new Error("Empty token");
    }
    return token;
  } catch {
    console.error("Failed to get gh auth token. Please run auth login first.");
    process.exit(1);
  }
}

module.exports = {
  isGhInstalled,
  installGh,
  ensureGh,
  authLogin,
  getToken,
};
