import type { Config } from "@netlify/functions";
import { db } from "../lib/core.mts";
import { verifyUnsub } from "../lib/messaging.mts";

const page = (title: string, body: string) => new Response(
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><link rel="icon" href="/brand/logo.png"><link rel="stylesheet" href="/css/styles.css"></head><body><div class="backdrop" aria-hidden="true"><span></span><span></span><span></span></div><main class="wrap"><div class="glass center-card"><img class="hero-logo" src="/brand/logo.png" alt="" style="width:72px;height:72px"><h2>${title}</h2><p class="muted">${body}</p><a class="btn btn-primary" href="/">Visit the team page</a></div></main></body></html>`,
  { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
);

async function optOut(req: Request) {
  const token = new URL(req.url).pathname.split("/")[2] || "";
  const hash = await verifyUnsub(token);
  if (hash) await db().set(`optout/email/${hash}`, new Date().toISOString());
  return hash;
}

export default async (req: Request) => {
  // Email apps use a one click POST from the List Unsubscribe header.
  if (req.method === "POST") {
    await optOut(req);
    return new Response("ok");
  }
  if (!(await optOut(req))) {
    return page("Link not recognized", "This unsubscribe link did not work. Reply to any of our emails and we will remove you.");
  }
  return page("You are unsubscribed", "You will not get any more fundraiser emails from us. Thank you for supporting the Lady Broncos!");
};

export const config: Config = { path: "/u/*" };
