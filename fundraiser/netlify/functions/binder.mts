import type { Config, Context } from "@netlify/functions";
import { createHmac } from "node:crypto";
import {
  clearAttempts, getSession, noteFailedAttempt, readCookie, safeEqual, sessionSecret, tooManyAttempts,
} from "../lib/core.mts";
import BINDER from "../lib/binder-page.mts";

// The MHS Secret Binder lives behind a team code (BINDER_CODE on Netlify). Signed in coaches go straight in.
const COOKIE = "mlb_binder";
const DAYS = 30;

async function pass(code: string) {
  return createHmac("sha256", await sessionSecret()).update(`binder:${code}`).digest("base64url");
}

function page(body: string, status = 200, headers: Record<string, string> = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
      ...headers,
    },
  });
}

function gate(error = "") {
  return page(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>MHS Secret Binder</title>
<meta name="theme-color" content="#0a0a0a">
<link rel="icon" href="/brand/logo.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/css/styles.css">
<link rel="stylesheet" href="/css/home.css">
<style>
  .binder-gate { max-width: 440px; margin: clamp(40px, 12vh, 120px) auto 40px; padding: clamp(26px, 6vw, 40px); text-align: center; border-top: 4px solid var(--red); }
  .binder-gate img { width: 72px; height: 72px; object-fit: contain; margin-bottom: 10px; }
  .binder-gate h1 { font: 700 2.4rem var(--print); text-transform: uppercase; margin: 10px 0 6px; line-height: 1; }
  .binder-gate h1 span { color: #ff2e4d; }
  .binder-gate input { width: 100%; text-align: center; font: 700 1.3rem var(--body); letter-spacing: 0.12em; padding: 14px; border-radius: 14px; border: 1px solid var(--glass-line); background: rgba(255, 255, 255, 0.06); color: #fff; margin: 16px 0 10px; }
  .binder-gate input:focus { outline: 2px solid #ff4d67; outline-offset: 2px; }
  .binder-gate .err { color: #ff6b80; font-weight: 700; min-height: 1.3em; margin: 0 0 10px; }
  .binder-gate .btn { width: 100%; }
</style>
</head>
<body class="dark">
<div class="backdrop" aria-hidden="true"><span></span><span></span><span></span></div>
<main class="wrap">
  <form class="glass binder-gate" method="post" action="/secretbinder/">
    <img src="/brand/logo.png" alt="">
    <span class="kicker">Lady Broncos players and coaches</span>
    <h1>MHS Secret <span>Binder</span></h1>
    <p class="muted" style="margin:0">Enter the team code to open the playbook.</p>
    <label for="code" class="kicker" style="position:absolute;left:-9999px">Team code</label>
    <input id="code" name="code" type="password" autocomplete="current-password" autocapitalize="none" spellcheck="false" required autofocus>
    <p class="err" role="alert">${error}</p>
    <button class="btn btn-primary btn-big" type="submit">Open the binder</button>
    <p class="muted" style="margin:16px 0 0;font-size:.88rem">Do not share the code outside the team. <a href="/">Back to the home page</a></p>
  </form>
</main>
</body>
</html>`, error ? 401 : 200);
}

export default async (req: Request, context: Context) => {
  // Everything the binder needs is inside one page, so every path inside /secretbinder shows it.
  const url = new URL(req.url);

  const code = Netlify.env.get("BINDER_CODE") || "";
  if (!code) return page("<p>The binder code has not been set up yet. Add BINDER_CODE in Netlify.</p>", 503);
  const expected = await pass(code);

  if (req.method === "POST") {
    if (await tooManyAttempts(req, context)) return gate("Too many tries. Please wait 15 minutes and try again.");
    const form = await req.formData().catch(() => null);
    const tried = String(form?.get("code") || "").trim();
    if (!safeEqual(tried.toLowerCase(), code.toLowerCase())) {
      await noteFailedAttempt(req, context);
      return gate("That code is not right.");
    }
    await clearAttempts(req, context);
    const secure = url.protocol === "https:" ? "; Secure" : "";
    return new Response(null, {
      status: 303,
      headers: {
        location: "/secretbinder/",
        "set-cookie": `${COOKIE}=${expected}; Path=/secretbinder; HttpOnly; SameSite=Lax; Max-Age=${DAYS * 86400}${secure}`,
        "cache-control": "no-store",
      },
    });
  }

  const ok = safeEqual(readCookie(req, COOKIE), expected) || (await getSession(req))?.role === "coach";
  return ok ? page(BINDER) : gate();
};

export const config: Config = { path: ["/secretbinder", "/secretbinder/*"] };
