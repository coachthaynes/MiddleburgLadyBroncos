#!/usr/bin/env bash
# Start a new Elevate Her Illumination player site from the template.
# Usage: elevate-her/new-site.sh first-last
# Creates ./first-last/ at the repo root, linked to the Madi Visuals dashboard.
set -euo pipefail
slug="${1:-}"
if [[ ! "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Usage: $0 first-last   (lowercase letters, numbers and single hyphens)" >&2
  exit 1
fi
here="$(cd "$(dirname "$0")" && pwd)"
dest="$(cd "$here/.." && pwd)/$slug"
if [[ -e "$dest" ]]; then echo "$dest already exists" >&2; exit 1; fi
mkdir -p "$dest/media/photos"
cp "$here/illumination-template/"{index.html,illumination.css,illumination.js,site.js} "$dest/"
touch "$dest/media/photos/.gitkeep"
sed -i "s/slug: \"first-last\"/slug: \"$slug\"/" "$dest/site.js"
echo "Created $dest"
echo "Next:"
echo "  1. Fill in $slug/site.js"
echo "  2. In the Madi Visuals dashboard, add a player site with slug: $slug"
echo "  3. Deploy the $slug folder to its Netlify site and turn on form detection"
