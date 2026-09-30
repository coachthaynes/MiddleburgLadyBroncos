# Madi Visuals Dashboard

Media dashboard for Elevate Her Illumination player sites. Live at https://madivisuals.netlify.app (Netlify project `madivisuals`).

## What Madi can do

* Sign in with the dashboard password.
* Add a player site (name, slug, live site address, school, class).
* Drag in photos, video and PDFs of any size. Large files upload in 4 MB pieces with automatic retries.
* Place each file: Opening video, Highlight reel, Poster still, Portrait, Photo vault NIL Ready, Photo vault Editorial, or Marketing kit.
* Switch each file between Draft and Live, rename it, set its gallery tile size, download it or delete it.
* See a readiness checklist for each site.

## How player sites read it

`GET /api/sites/<slug>` returns the live media for one player (opening video sources, highlight reel, poster, portrait, photo vault, marketing kit). It is the only endpoint open to other sites. Files are served from `/media/<id>` with byte range support so video streams and seeks.

## Settings (Netlify environment variables, functions scope)

| Name | Purpose |
| --- | --- |
| `DASHBOARD_PASSWORD` | The sign in password. Change it any time; everyone must sign in again. |
| `DASHBOARD_SECRET` | Signs sign in sessions (14 days). Changing it signs everyone out. |

## Storage

Netlify Blobs. Store `catalog` holds player and file records, store `media` holds file pieces. Production uses global stores; deploy previews use their own deploy scoped stores so test uploads never reach live sites.

## Develop

`npm install`, then `netlify dev`. Accepted files: JPG, PNG, WEBP, GIF, AVIF, MP4, MOV, WEBM, PDF up to 1.5 GB. Export iPhone HEIC photos as JPG first.
