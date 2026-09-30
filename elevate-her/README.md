# Elevate Her · Illumination Package

Everything needed to build and run Illumination player sites.

| Folder | What it is |
| --- | --- |
| `illumination-template/` | The player site template. Every Illumination site is these files plus its own `site.js`. |
| `madi-visuals-dashboard/` | The Madi Visuals media dashboard (its own Netlify site: https://madivisuals.netlify.app). Madi uploads photos, video and marketing material here and it appears on the player sites. |
| `new-site.sh` | Starts a new player site from the template, already linked to the dashboard. |
| `sync-template.sh` | Copies template updates into every player site in this repo. Never touches `site.js` or `media/`. |

## How the pieces connect

```
Madi uploads in the dashboard  ──►  madivisuals.netlify.app/api/sites/<slug>  ──►  player site loads it on every visit
```

Each player site's `site.js` has:

```js
media: { dashboard: "https://madivisuals.netlify.app", slug: "kennedy-jeffress" }
```

The template's starter `site.js` already points at the dashboard, so every future build is linked automatically. Anything Madi marks **Live** shows up on the site within about a minute. Anything not in the dashboard falls back to the files in that site's `media/` folder.

## Launch a new Illumination site

1. `elevate-her/new-site.sh first-last` creates `first-last/` at the repo root.
2. Fill in `first-last/site.js` (bio, stats, schedule, film links, NIL copy, contact approver).
3. In the dashboard, **Add player site** with the same slug and the live site address.
4. Madi uploads the opening video, poster still, portrait, photo vault and marketing kit.
5. Deploy the `first-last/` folder to its Netlify site and turn on form detection so the NIL inquiry and contact request forms work. Add an email notification for both forms in Netlify (Forms, then Form notifications).

## Current sites

| Player | Folder | Live site | Dashboard slug |
| --- | --- | --- | --- |
| Kennedy Jeffress #2 | `kennedy-jeffress/` | https://kennedyjeffress.netlify.app | `kennedy-jeffress` |
| Aiyana Haynes #20 | `aiyana-haynes/` | https://aiyanahaynes2027.netlify.app | `aiyana-haynes` |
