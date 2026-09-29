import type { Config } from "@netlify/functions";
import { authed, catalog, json, fail, listPlayers, listAssets, deleteAssetData, unindexMedia, SLUG, type Player } from "../lib/core.mts";

// GET    /api/players                      list player sites
// POST   /api/players { slug, name, ... }  create or update a player site
// DELETE /api/players?slug=...             remove a player site and all of its media
export default async (req: Request) => {
  if (!authed(req)) return fail("Sign in required", 401);

  if (req.method === "GET") return json({ players: await listPlayers() });

  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    const slug = String(body?.slug || "").trim().toLowerCase();
    const name = String(body?.name || "").trim();
    if (!SLUG.test(slug) || slug.length > 60) return fail("Slug must be lowercase letters and numbers, for example kennedy-jeffress");
    if (!name) return fail("Name is required");
    const existing: Player | null = await catalog().get(`player/${slug}`, { type: "json" });
    const player: Player = {
      slug, name,
      siteUrl: String(body?.siteUrl || "").trim(),
      school: String(body?.school || "").trim(),
      classYear: String(body?.classYear || "").trim(),
      created: existing?.created || new Date().toISOString()
    };
    await catalog().setJSON(`player/${slug}`, player);
    return json({ player });
  }

  if (req.method === "DELETE") {
    const slug = new URL(req.url).searchParams.get("slug") || "";
    if (!SLUG.test(slug)) return fail("Unknown player");
    for (const a of await listAssets(slug)) { await deleteAssetData(a); await unindexMedia(a.id); }
    await catalog().delete(`player/${slug}`);
    return json({ ok: true });
  }

  return fail("Method not allowed", 405);
};

export const config: Config = { path: "/api/players" };
