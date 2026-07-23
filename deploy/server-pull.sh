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
