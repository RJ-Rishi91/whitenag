#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$DIR/.." && pwd)"

echo "==> Building Nagfani Foods Tally Gateway Windows Setup..."
MAKENSIS="/tmp/nsis/nsis-bundle/linux/x64/makensis"

if [ ! -f "$MAKENSIS" ]; then
  echo "Error: makensis not found at $MAKENSIS"
  exit 1
fi

cd "$DIR"
"$MAKENSIS" nagfani_installer.nsi

if [ -f "Nagfani_Tally_Gateway_Setup.exe" ]; then
  cp "Nagfani_Tally_Gateway_Setup.exe" "$PROJECT_ROOT/web/public/Nagfani_Tally_Gateway_Setup.exe"
  cp "Nagfani_Tally_Gateway_Setup.exe" "$PROJECT_ROOT/web/public/Setup.exe"
  cp "Nagfani_Tally_Gateway_Setup.exe" "$PROJECT_ROOT/web/dist/Nagfani_Tally_Gateway_Setup.exe"
  cp "Nagfani_Tally_Gateway_Setup.exe" "$PROJECT_ROOT/web/dist/Setup.exe"
  echo "==> Successfully built and deployed Nagfani_Tally_Gateway_Setup.exe"
fi
