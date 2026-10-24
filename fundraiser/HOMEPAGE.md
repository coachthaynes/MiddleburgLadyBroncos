# mhsladybroncos.com home page

The main team home page lives in this folder, on the same Netlify site as the fundraiser (site id `d088a79e-2a7f-4d97-bf8c-dcffc20e6afa`, primary domain mhsladybroncos.com).

* **Edit:** `fundraiser/public/index.html` (right now a simple placeholder). Extra pages, images and scripts go in `fundraiser/public/` too.
* **Do not move or rename** these, they are live:

| Address | File |
| --- | --- |
| `/donate` | `public/donate.html` (team donation page) |
| `/donate/name` | `public/player.html` (player donation pages) |
| `/sponsor` | `public/sponsor.html` |
| `/portal`, `/coach` | `public/portal.html`, `public/coach.html` |
| `/sponsor-report/...`, `/sponsor-packet.pdf` | sponsor tools |
| `/api/*`, `/go/*`, `/img/*`, `/u/*` | Netlify Functions |

* **Links the home page should carry:** Donate (`/donate`), Sponsor (`/sponsor`), Team Store (https://ladybroncosstore.netlify.app), Player login (`/portal`).
* **Shared look:** `/css/styles.css` (soft glass, Middleburg red and white, Outfit and Plus Jakarta Sans fonts) and `/brand/logo.png` (horseshoe). Reusing them keeps the home page matching the donate and sponsor pages.
* **Routes** are in `fundraiser/netlify.toml`. Add new rewrites there, above nothing that catches `/donate` or `/sponsor`.
* **Deploy:** pushes do not deploy on their own. Upload a folder that contains a `fundraiser/` folder (the site's base directory is `fundraiser`) with the Netlify `deploy-site` tool. Copy `netlify.toml package.json package-lock.json public netlify README.md .gitignore` into `<tmp>/fundraiser/` and run the deploy command from `<tmp>`. Never include `fundraiser/.env`.
* **Text style:** no hyphens or dashes in any visible text.
