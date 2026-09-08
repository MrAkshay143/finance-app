#!/usr/bin/env bash
# scripts/check-placeholders.sh
# Executable shell script wrapper for Zero-Placeholder & Emoji Grep Gate
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Run Node.js cross-platform runner if node is available
if command -v node >/dev/null 2>&1; then
  exec node "${SCRIPT_DIR}/check-placeholders.cjs" "$@"
fi

# Fallback: pure shell / grep implementation if Node.js is not present
echo "Node.js not found in PATH. Running POSIX grep fallback..."
cd "${REPO_ROOT}"

VIOLATIONS=0
BANNED_REGEX='coming soon|coming in v2|beta \(v2\)|preview|TODO|sample data|demo data|lorem ipsum'

echo "Scanning apps/ and packages/ for banned copy..."
if grep -r -i -n -E "${BANNED_REGEX}" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=.git \
  --exclude-dir=Plan \
  --exclude-dir="UI Snaps" \
  --exclude-dir=coverage \
  --exclude-dir=.turbo \
  --exclude-dir=.next \
  --exclude-dir=build \
  --exclude="*.map" \
  --exclude="pnpm-lock.yaml" \
  --exclude="package-lock.json" \
  --exclude="prd.md" \
  apps packages; then
    echo "ERROR: Banned placeholder copy found above!"
    VIOLATIONS=$((VIOLATIONS + 1))
fi

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "Grep gate failed with violations."
  exit 1
fi

echo "Zero-placeholder grep gate passed."
exit 0
