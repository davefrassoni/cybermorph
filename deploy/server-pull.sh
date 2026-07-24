#!/usr/bin/env bash
set -euo pipefail

REPOSITORY=https://github.com/davefrassoni/cybermorph.git
TARGET=/var/www/davefrassoni/cybermorph
MARKER=$TARGET/.deployed-commit
LOCK=/tmp/cybermorph-server-pull.lock

exec 9>"$LOCK"
flock -n 9 || exit 0

REMOTE_SHA="$(git ls-remote "$REPOSITORY" refs/heads/main | awk '{print $1}')"
if [ -z "$REMOTE_SHA" ]; then
  echo "Could not resolve the CyberMorph main branch."
  exit 1
fi
if [[ ! "$REMOTE_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Refusing unexpected commit identifier: $REMOTE_SHA"
  exit 1
fi

CURRENT_SHA="$(cat "$MARKER" 2>/dev/null || true)"

sync_desktop_update() {
  local release_url="https://github.com/davefrassoni/cybermorph/releases/download/desktop-latest"
  local update_temp="/tmp/cybermorph-desktop-update"
  local cache_bust
  local update_path

  cache_bust="$(date +%s)"
  rm -rf "$update_temp"
  mkdir -p "$update_temp" "$TARGET/downloads"
  if ! curl -fsSL --retry 3 "$release_url/latest.yml?commit=$REMOTE_SHA&time=$cache_bust" -o "$update_temp/latest.yml"; then
    echo "The rolling desktop update is not available yet; it will be retried."
    rm -rf "$update_temp"
    return 0
  fi
  update_path="$(sed -n 's/^path:[[:space:]]*//p' "$update_temp/latest.yml" | head -n 1)"
  if [[ ! "$update_path" =~ ^CyberMorph-Setup-[0-9]+\.[0-9]+\.[0-9]+\.exe$ ]]; then
    echo "Refusing unexpected desktop update path: $update_path"
    rm -rf "$update_temp"
    return 0
  fi
  curl -fsSL --retry 3 "$release_url/$update_path?commit=$REMOTE_SHA&time=$cache_bust" -o "$update_temp/$update_path"
  curl -fsSL --retry 3 "$release_url/$update_path.blockmap?commit=$REMOTE_SHA&time=$cache_bust" -o "$update_temp/$update_path.blockmap"
  install -m 0644 "$update_temp/latest.yml" "$TARGET/downloads/latest.yml"
  install -m 0644 "$update_temp/$update_path" "$TARGET/downloads/$update_path"
  install -m 0644 "$update_temp/$update_path.blockmap" "$TARGET/downloads/$update_path.blockmap"
  install -m 0644 "$update_temp/$update_path" "$TARGET/downloads/CyberMorph-Setup.exe"
  rm -rf "$update_temp"
  echo "Desktop update synchronized: $update_path"
}

sync_desktop_update

if [ "$CURRENT_SHA" = "$REMOTE_SHA" ]; then
  echo "CyberMorph is already at $REMOTE_SHA."
  exit 0
fi

RELEASE="/tmp/cybermorph-$REMOTE_SHA"
cleanup() {
  rm -rf "$RELEASE"
}
trap cleanup EXIT

rm -rf "$RELEASE"
git clone --depth 1 --branch main "$REPOSITORY" "$RELEASE"
cd "$RELEASE"
npm ci
npm test
npm run build

mkdir -p "$TARGET/downloads"
rsync -az --delete --exclude 'downloads/' apps/studio/dist/ "$TARGET/"
printf '%s\n' "$REMOTE_SHA" > "$MARKER"
chown -R deploy:deploy "$TARGET"

nginx -t
systemctl reload nginx
curl -fsS https://davefrassoni.com/cybermorph/ >/dev/null
echo "CyberMorph deployed at $REMOTE_SHA."
