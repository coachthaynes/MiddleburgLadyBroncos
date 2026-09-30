#!/usr/bin/env bash
# Copy the latest template files into every Illumination site in this repo.
# A folder counts as an Illumination site when it has both site.js and illumination.js.
# site.js and media/ are never touched.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/.." && pwd)"
for dir in "$root"/*/; do
  dir="${dir%/}"
  [[ -f "$dir/site.js" && -f "$dir/illumination.js" ]] || continue
  cp "$here/illumination-template/"{index.html,illumination.css,illumination.js} "$dir/"
  echo "Updated $(basename "$dir")"
done
