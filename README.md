# ghtk（github packages token configurator）

One-click setup for GitHub Packages npm registry auth. No more annoying 403 errors when installing private packages during local development.

## What it does

1. **Auto-detects and installs `gh` CLI** if not present (macOS/Linux/Windows)
2. **Runs `gh auth login`** with `read:packages,repo` scopes (interactive GitHub auth)
3. **Prompts for org scopes** — enter one or more (e.g. `@theplant @my-org`)
4. **Writes `~/.npmrc`** with the correct registry and auth token, so `npm install` just works

## Install

```bash
npx ghtk
```

## Usage

```bash
ghtk
```

You'll see an interactive flow:

```
🔧 GitHub Packages npm registry configurator

✅ gh CLI is available.

Enter the GitHub org scopes to configure for npm.pkg.github.com.
You can enter one or more scopes separated by spaces.
Example: @theplant @my-org

Scopes: @theplant @another-org
```

After completing GitHub auth, your `~/.npmrc` will be configured:

```ini
@theplant:registry=https://npm.pkg.github.com
@another-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_xxxxxxxxxxxx
```

## Platform Compatibility

Auto-install `gh` CLI support:

- [x] **macOS** — via Homebrew (`brew install gh`)
- [ ] **Linux (Debian/Ubuntu)** — via apt
- [ ] **Linux (Fedora/RHEL/CentOS)** — via dnf
- [ ] **Windows** — via winget

## Test

```bash
npm test
```

## Links

- **npm**: https://www.npmjs.com/package/ghtk
- **GitHub**: https://github.com/danni-cool/github-packge-ght

## License

MIT
