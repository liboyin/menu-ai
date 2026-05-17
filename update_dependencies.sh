#!/usr/bin/env bash
# Run monthly to keep dependencies and browser compat data up to date.
set -euo pipefail

echo "==> Updating caniuse-lite (Browserslist data)..."
npx update-browserslist-db@latest

echo "==> Updating npm packages within semver ranges..."
npm update

echo "==> Fixing known security vulnerabilities..."
npm audit fix

echo "==> Running tests to verify nothing broke..."
npm run test:coverage

echo "==> Checking for outdated packages with major-version upgrades available..."
npm outdated

echo ""
echo "Done!"
