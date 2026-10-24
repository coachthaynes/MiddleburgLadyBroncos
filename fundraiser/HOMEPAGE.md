# mhsladybroncos.com home page

The main team home page lives in this folder, on the same Netlify site as the fundraiser (site id `d088a79e-2a7f-4d97-bf8c-dcffc20e6afa`, primary domain mhsladybroncos.com).

* **Edit:** `fundraiser/public/index.html` (layout), `public/css/home.css` (black, red, white and grey look on top of `styles.css`) and `public/js/site.js` (rendering). Extra pages, images and scripts go in `fundraiser/public/` too.
* **Coaches dashboard:** `/coach` (same coach password as before) has three tabs. **Hub** links every login and admin page, plus coach only My links. **Home page** edits everything below and publishes it right away (saved in Blobs at `home/content`, served by `/api/home`). **Fundraiser** is the original gifts, sponsors, players and outreach dashboard. The editor flags hyphens and dashes in page text.
* **Content:** the starting content lives in `public/js/home-data.js`. Once a coach saves on the dashboard, the saved version replaces it, so edit on the dashboard from then on:
  * `schedule`: games, times, notes and results (`"W 54 41"`). Add away games with `home: false` and an optional `location`.
  * `highlights`: six slots. Paste a YouTube link into `url`; empty slots show Coming soon. Set `youtube.channel` to the team channel.
  * `spotlights`, `rosterExtras`, `coaches`, `recruiting`: player spotlight cards, class year and height on roster cards, staff and the recruiting email.
  * `instagram.handle`: the team account, no @.
* **Roster and sponsors are live:** player cards come from the coach dashboard (`/api/public`, active players with consent). Sponsors come from `/api/sponsors` (committed or paid, Show on wall checked): Horsepower Title and Herd Champion show near the top, Stallion Partners and Bronco Backers near the bottom.
* **Instagram feed:** set `INSTAGRAM_TOKEN` on the Netlify site to an Instagram API with Instagram Login access token for the team professional account. `/api/instagram` then shows the latest posts, cached 30 minutes, and refreshes the token weekly. Without a token the page shows any post links in `instagram.posts` as Instagram embeds.
* **Player Hub:** `/players` (`public/players.html`) links the player recruiting sites (from `spotlights`), Athlete Monitor, the Secret Binder, Bronco Life Skills and the player login.
* **Do not move or rename** these, they are live:

| Address | File |
| --- | --- |
| `/donate` | `public/donate.html` (team donation page) |
| `/donate/name` | `public/player.html` (player donation pages) |
| `/sponsor` | `public/sponsor.html` |
| `/portal`, `/coach` | `public/portal.html`, `public/coach.html` |
| `/sponsor-report/...`, `/sponsor-packet.pdf` | sponsor tools |
| `/api/*`, `/go/*`, `/img/*`, `/u/*` | Netlify Functions |
| `/players` | `public/players.html` (Player Hub) |
| `/athletemonitor/` | proxy to the `athletemonitor` Netlify site (source: `coachthaynes/social_scheduler`, `performance/`) |
| `/secretbinder/` | proxy to the `mhssecretbinder` Netlify site |

Athlete Monitor loads its files and calls its API with page relative paths (`api/...`, not `/api/...`), so it works both at athletemonitor.netlify.app and inside `/athletemonitor/` without touching this site's `/api`. Keep it that way when editing it.

* **Links the home page should carry:** Donate (`/donate`), Sponsor (`/sponsor`), Team Store (https://ladybroncosstore.netlify.app), Player login (`/portal`).
* **Shared look:** `/css/styles.css` (soft glass, Middleburg red and white, Outfit and Plus Jakarta Sans fonts) and `/brand/logo.png` (horseshoe). Reusing them keeps the home page matching the donate and sponsor pages.
* **Routes** are in `fundraiser/netlify.toml`. Add new rewrites there, above nothing that catches `/donate` or `/sponsor`.
* **Deploy:** pushes do not deploy on their own. Upload a folder that contains a `fundraiser/` folder (the site's base directory is `fundraiser`) with the Netlify `deploy-site` tool. Copy `netlify.toml package.json package-lock.json public netlify README.md .gitignore` into `<tmp>/fundraiser/` and run the deploy command from `<tmp>`. Never include `fundraiser/.env`.
* **Text style:** no hyphens or dashes in any visible text.
