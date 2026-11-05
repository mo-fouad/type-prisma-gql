#!/usr/bin/env bash
# Downloads the upstream libraries type-prisma-gql is based on into ./reference/
# at the exact commits listed below (the same ones recorded in UPSTREAM.md).
# reference/ is gitignored: it is read-only material, never edited or published.
#
# Usage:  npm run ref:sync
# To upgrade: change a commit below, run the script, then diff old..new
#             inside reference/<name> and port what matters (see UPSTREAM.md).

set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p reference

# name | git url | pinned commit
REFS=(
  "type-graphql|https://github.com/MichalLytek/type-graphql.git|58d187ef14c6e871356b78d57ab0972c67e4cb70"
  "typegraphql-prisma|https://github.com/mo-fouad/typegraphql-prisma.git|8d5a36ad0dd515871d1199f9e9235d5d50ec6858"
  "type-graphql-utils|https://github.com/mo-fouad/type-graphql-utils.git|67c7aac50c4d1ef8a426f2dbd7e7e0d16f8d4cf2"
)

for entry in "${REFS[@]}"; do
  IFS='|' read -r name url sha <<<"$entry"
  dir="reference/$name"
  if [ ! -d "$dir/.git" ]; then
    echo "→ cloning $name"
    git clone --quiet --filter=blob:none "$url" "$dir"
  else
    echo "→ updating $name"
    git -C "$dir" fetch --quiet origin
  fi
  git -C "$dir" -c advice.detachedHead=false checkout --quiet "$sha"
  echo "  $name @ $(git -C "$dir" log -1 --format='%h %cs %s')"
done
