# Social Scheduler

A Buffer style scheduler you host yourself. Write a post once, pick your accounts, and it publishes automatically at the time you choose.

This folder is its own app. It does not touch the lesson site in the rest of this repository.

## What it does

* Connect Facebook Pages, Instagram professional accounts, and X accounts
* Write a post once and send it to several accounts, with an optional shorter version for X
* Attach a photo (resized and converted automatically; Instagram requires one)
* Add to queue (next open time slot), pick an exact time, post now, or save a draft
* Weekly queue times you control on the Settings page
* Live previews and character counters for each network
* Queue, Drafts, Sent, and Needs attention views, with links to live posts and clear error messages
* A background job on Netlify checks every 5 minutes and publishes anything that is due
* Password protected dashboard; account tokens never leave the server

## Try it on your computer first

Needs Node 20 or newer.

```
cd social
npm install
npm run dev
```

Open http://localhost:8888 and sign in with `letmein`. Three demo accounts are loaded and publishing is simulated, so nothing is really posted.

## Put it online (Netlify, free tier works)

1. In Netlify choose **Add new site**, then **Import an existing project**, and pick this GitHub repository.
2. Set **Base directory** to `social`. Netlify reads the rest from `social/netlify.toml`.
3. Under **Site configuration**, **Environment variables**, add:

| Variable | What to put |
| --- | --- |
| `ADMIN_PASSWORD` | The password you will use to sign in |
| `SESSION_SECRET` | Any long random string (40+ characters) |
| `META_APP_ID` | From your Meta app (step below) |
| `META_APP_SECRET` | From your Meta app |
| `X_CLIENT_ID` | From your X app (step below) |
| `X_CLIENT_SECRET` | From your X app |

Optional: `META_CONFIG_ID` if your Meta app uses Facebook Login for Business, `META_GRAPH_VERSION` to pin a Graph API version (default `v23.0`), and `PUBLIC_URL` if you use a custom domain.

4. Deploy, then open your site address (for example `https://your-site.netlify.app`).

Scheduled publishing only runs on the live Netlify site, not in the local preview.

## Connect Facebook and Instagram

1. Your Instagram account must be a **Business** or **Creator** account and be linked to your Facebook Page (Instagram app, Settings, Account type and tools).
2. Go to https://developers.facebook.com/apps and create an app (type **Business**).
3. Add the **Facebook Login** product. In its settings, add this Valid OAuth Redirect URI:
   `https://YOUR-SITE.netlify.app/oauth/meta/callback`
4. Request these permissions: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `business_management`, `instagram_basic`, `instagram_content_publish`.
5. Copy the App ID and App Secret (App settings, Basic) into Netlify.
6. In the scheduler, open **Channels** and click **Connect** under Facebook and Instagram. Pick your Page and Instagram account when Facebook asks.

While the Meta app is in **Development** mode it works for anyone listed as an admin or tester on the app, which is all you need to post to your own Page. To let other people connect their accounts you must complete Meta App Review and business verification.

## Connect X

1. Go to https://developer.x.com and create a Project and App.
2. In **User authentication settings**: turn on OAuth 2.0, app type **Web App**, permissions **Read and write**.
3. Callback URL: `https://YOUR-SITE.netlify.app/oauth/x/callback`. Website URL: your site address.
4. Copy the OAuth 2.0 Client ID and Client Secret into Netlify.
5. In the scheduler, open **Channels** and click **Connect** under X.

Note: X limits how many posts the free API tier can create each month, and may require a paid tier for heavier use. Check your plan in the X developer portal.

## Networks not included yet

* **TikTok**: its posting API only allows private posts until TikTok audits the app.
* **LinkedIn company pages**: need LinkedIn Community Management API approval.
* **Threads**: possible to add with the Threads API; ask if you want it.

## How it is built

* `public/` is the dashboard (plain HTML, CSS, and JavaScript, no build step)
* `netlify/functions/api.mjs` handles posts, settings, image uploads, and sign in
* `netlify/functions/oauth.mjs` handles connecting accounts
* `netlify/functions/scheduler.mjs` runs every 5 minutes and publishes posts that are due
* `netlify/functions/media.mjs` serves uploaded images at public addresses so Instagram and Facebook can fetch them
* `lib/platforms/` holds the Facebook, Instagram, and X publishing code
* Data (posts, accounts, settings, images) lives in Netlify Blobs, so there is no database to set up
