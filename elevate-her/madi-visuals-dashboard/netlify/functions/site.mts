import type { Config, Context } from "@netlify/functions";
import { listAssets, getPlayer, SLUG, type Asset } from "../lib/core.mts";

// GET /api/sites/:slug  public media feed read by the player's Illumination site.
// Only assets Madi has switched to Live are included. Player sites live on other
// domains, so this one endpoint allows cross origin reads.
export default async (req: Request, context: Context) => {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const slug = context.params.slug;
  const player = SLUG.test(slug) ? await getPlayer(slug) : null;
  if (!player) return Response.json({ error: "Unknown player" }, { status: 404, headers: cors });

  const origin = new URL(req.url).origin;
  const file = (a: Asset) => `${origin}/media/${a.id}`;
  const img = (a: Asset, w: number) => `${origin}/.netlify/images?url=${encodeURIComponent(`/media/${a.id}`)}&w=${w}&q=80`;
  const live = (await listAssets(slug)).filter(a => a.live && a.status === "ready");
  const newest = (role: string) => live.filter(a => a.role === role).sort((x, y) => y.created.localeCompare(x.created));
  // One source per video format, newest first; mp4 listed before webm so Safari picks it.
  const sources = (role: string) => {
    const seen = new Set<string>();
    return newest(role).filter(a => !seen.has(a.type) && seen.add(a.type))
      .sort((x, y) => (x.type === "video/webm" ? 1 : 0) - (y.type === "video/webm" ? 1 : 0))
      .map(a => ({ url: file(a), type: a.type === "video/quicktime" ? "video/mp4" : a.type }));
  };
  const poster = newest("poster")[0];
  const portrait = newest("portrait")[0];

  const feed = {
    player: { slug: player.slug, name: player.name },
    updated: new Date().toISOString(),
    hero: sources("hero"),
    film: sources("film"),
    poster: poster ? file(poster) : null,
    portrait: portrait ? file(portrait) : null,
    photos: live.filter(a => a.role === "nil" || a.role === "editorial").map(a => ({
      title: a.title, use: a.role, size: a.layout,
      src: file(a), thumb: img(a, 900), large: file(a), download: `${file(a)}?download=1`
    })),
    kit: live.filter(a => a.role === "kit").map(a => ({ title: a.title, type: a.type, url: file(a), download: `${file(a)}?download=1` }))
  };
  return Response.json(feed, { headers: { ...cors, "Cache-Control": "public, max-age=60" } });
};

export const config: Config = { path: "/api/sites/:slug" };
