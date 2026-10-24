# Lady Broncos Fundraiser

A donation site for the Middleburg High School Lady Broncos. Every Donate button sends supporters to the school's MySchoolBucks page, so all money goes straight to the school. This site never handles payments.

## Pages

| Address | Who uses it | What it does |
| --- | --- | --- |
| `/` | Everyone | Team page with goal progress, countdown, roster, leaderboard and share buttons |
| `/p/name` | Everyone | A player's personal page with her photo, message, Donate button, share buttons and QR code |
| `/portal` | Players | Log in with a 6 character code, give permission, upload a photo, edit her message, see her numbers |
| `/coach` | Coach | Add players and get codes, approve photos, paste the MySchoolBucks link, update totals, upload the logo, download stats |

## How tracking works

MySchoolBucks does not tell this site when someone pays, so the site counts what it can see:

* **Donation clicks:** each time someone taps Donate on a player page (counted once per phone every 12 hours).
* **Page visits** and **shares** for each player.
* **Dollars raised:** the coach types the team total (and optional player totals) from MySchoolBucks reports. When any player total is entered, the leaderboard ranks by dollars. Otherwise it ranks by donation clicks.

## Player safety

* Players only appear on the site after they log in and complete the permission step with a parent or guardian's name. The coach dashboard shows who gave permission and when.
* Pages show first name and last initial only.
* With photo approval turned on (the default), new photos wait for the coach before going live.
* Login codes are stored scrambled and are shown only once. The coach can issue a new code at any time, which retires the old one.

## Setting it up on Netlify

1. In Netlify, add a new site from this GitHub repository.
2. Set **Base directory** to `fundraiser`. Netlify reads the rest from `netlify.toml`.
3. Under **Environment variables**, add `ADMIN_PASSWORD` with the coach password.
4. Deploy, open `/coach`, log in, paste the MySchoolBucks link, upload the school logo and add players.

Data and photos are saved in Netlify Blobs, which is included with every Netlify site. There is nothing else to sign up for.

## Running it on your computer

```
cd fundraiser
npm install
echo "ADMIN_PASSWORD=pickapassword" > .env
npx netlify dev
```

## Sponsors

* `/sponsors` is the public sponsor page: four levels (Bronco Backer $750, Stallion Partner $1,500, Herd Champion $2,500, Horsepower Title $5,000), the Business Day video, how to pay (MySchoolBucks or check to Middleburg High School), the sponsor wall and an interest form. Edit levels and benefits in `public/js/sponsors.js`.
* `/sponsor-packet.pdf` is the one page handout. Its source is `sponsor-packet/packet.html`; the QR code points to the sponsor page.
* On the coach dashboard, interest forms land under **Sponsors**. Marking a sponsor Committed or Paid creates that level's to do list (including ordering the plain jersey for Title sponsors and sending the proof report). Each item can hold a date, a proof link and a proof photo.
* Each sponsor has a private report link (`/sponsor-report/...`) that shows what was delivered, for sending to the business.
* `sponsor-packet/email-drip.md` holds the seven sponsor emails, which are also saved as Gmail drafts.
* Game nights: Herd Champion and Title sponsors pick from the 2026/27 home games listed in `HOME_GAMES` in `netlify/lib/core.mts` (Senior Night only for Title). Once a sponsor is Committed or Paid, their game is no longer offered to others. Update that list if the schedule changes.
