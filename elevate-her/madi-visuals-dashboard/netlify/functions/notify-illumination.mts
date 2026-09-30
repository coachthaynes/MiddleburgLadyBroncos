import type { Config } from "@netlify/functions";
import { authed, getPlayer, json, fail } from "../lib/core.mts";

// POST /api/notify-illumination { slug }
// Tells Elevate Her Hoops Report that this player's design is ready for review.
// This never publishes anything by itself, it only queues the item for the
// coach to approve on their end before her Illumination site goes live.
export default async (req: Request) => {
  if (!authed(req)) return fail("Sign in required", 401);
  if (req.method !== "POST") return fail("Method not allowed", 405);

  const body = await req.json().catch(() => null);
  const slug = String(body?.slug || "").trim().toLowerCase();
  if (!slug) return fail("slug is required");

  const player = await getPlayer(slug);
  if (!player) return fail("Unknown player", 404);

  const secret = Netlify.env.get("MADI_WEBHOOK_SECRET");
  if (!secret) return fail("MADI_WEBHOOK_SECRET is not set on this site", 500);

  const previewUrl = `${new URL(req.url).origin}/?player=${encodeURIComponent(slug)}`;

  let upstream: Response;
  try {
    upstream = await fetch("https://elevateherhoopsreport.com/.netlify/functions/madi-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Madi-Secret": secret },
      body: JSON.stringify({ slug, playerName: player.name, previewUrl })
    });
  } catch (e) {
    return fail("Could not reach Elevate Her Hoops Report right now, try again in a moment", 502);
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return fail(`Elevate Her did not accept the notification (${upstream.status})${detail ? `: ${detail}` : ""}`, 502);
  }

  return json({ ok: true });
};

export const config: Config = { path: "/api/notify-illumination" };
