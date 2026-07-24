#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
COMMIT="${2:-}"
STAGING="${3:-}"

if [[ ! "$TARGET" =~ ^/var/www/[A-Za-z0-9._/-]+$ ]]; then
  echo "Refusing unexpected deployment target: $TARGET"
  exit 1
fi
if [[ ! "$COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Refusing unexpected commit identifier: $COMMIT"
  exit 1
fi
if [[ "$STAGING" != "/tmp/cybermorph-deploy-$COMMIT" ]]; then
  echo "Refusing unexpected staging directory: $STAGING"
  exit 1
fi
if [ ! -d "$STAGING/web" ] || [ ! -d "$STAGING/windows" ]; then
  echo "Deployment artifacts are incomplete."
  exit 1
fi

MANIFEST="$STAGING/windows/latest.yml"
if [ ! -f "$MANIFEST" ]; then
  echo "The desktop update manifest is missing."
  exit 1
fi

UPDATE_PATH="$(sed -n 's/^path:[[:space:]]*//p' "$MANIFEST" | head -n 1)"
EXPECTED_SHA="$(sed -n 's/^[[:space:]]*sha512:[[:space:]]*//p' "$MANIFEST" | head -n 1)"
if [[ ! "$UPDATE_PATH" =~ ^CyberMorph-Setup-[0-9]+\.[0-9]+\.[0-9]+\.exe$ ]]; then
  echo "Refusing unexpected desktop update path: $UPDATE_PATH"
  exit 1
fi
if [ ! -f "$STAGING/windows/$UPDATE_PATH" ] ||
   [ ! -f "$STAGING/windows/$UPDATE_PATH.blockmap" ]; then
  echo "The versioned installer or its blockmap is missing."
  exit 1
fi

ACTUAL_SHA="$(openssl dgst -sha512 -binary "$STAGING/windows/$UPDATE_PATH" | base64 -w 0)"
if [ -z "$EXPECTED_SHA" ] || [ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]; then
  echo "The Windows installer checksum does not match latest.yml."
  exit 1
fi

mkdir -p "$TARGET/downloads"
rsync -a --delete --delay-updates --exclude "downloads/" "$STAGING/web/" "$TARGET/"
install -m 0644 "$MANIFEST" "$TARGET/downloads/latest.yml"
install -m 0644 "$STAGING/windows/$UPDATE_PATH" "$TARGET/downloads/$UPDATE_PATH"
install -m 0644 "$STAGING/windows/$UPDATE_PATH.blockmap" "$TARGET/downloads/$UPDATE_PATH.blockmap"
install -m 0644 "$STAGING/windows/$UPDATE_PATH" "$TARGET/downloads/CyberMorph-Setup.exe"
printf '%s\n' "$COMMIT" > "$TARGET/.deployed-commit"
chown -R deploy:deploy "$TARGET"

nginx -t
systemctl reload nginx
curl -fsS "https://davefrassoni.com/cybermorph/" >/dev/null
curl -fsS "https://davefrassoni.com/cybermorph/downloads/latest.yml" >/dev/null
curl -fsSI "https://davefrassoni.com/cybermorph/downloads/$UPDATE_PATH" >/dev/null

systemctl disable --now cybermorph-pull.timer
rm -rf "$STAGING"
echo "CyberMorph deployed directly from GitHub Actions at $COMMIT."
