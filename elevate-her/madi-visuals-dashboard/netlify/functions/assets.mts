import type { Config } from "@netlify/functions";
import { authed, json, fail, listAssets, getAsset, saveAsset, deleteAssetData, unindexMedia, ROLES, SLUG, type Role } from "../lib/core.mts";

// GET    /api/assets?slug=...                         list a player's media
// PATCH  /api/assets { slug, id, title?, role?, layout?, live?, order? }
// DELETE /api/assets?slug=...&id=...
export default async (req: Request) => {
  if (!authed(req)) return fail("Sign in required", 401);
  const url = new URL(req.url);

  if (req.method === "GET") {
    const slug = url.searchParams.get("slug") || "";
    if (!SLUG.test(slug)) return fail("Unknown player");
    return json({ assets: await listAssets(slug) });
  }

  if (req.method === "PATCH") {
    const body = await req.json().catch(() => null);
    const a = body && SLUG.test(body.slug) ? await getAsset(body.slug, String(body.id)) : null;
    if (!a) return fail("Asset not found", 404);
    if (typeof body.title === "string") a.title = body.title.slice(0, 120);
    if (ROLES.includes(body.role)) a.role = body.role as Role;
    if (["", "tall", "wide"].includes(body.layout)) a.layout = body.layout;
    if (typeof body.live === "boolean") a.live = body.live;
    if (Number.isFinite(body.order)) a.order = body.order;
    await saveAsset(a);
    return json({ asset: a });
  }

  if (req.method === "DELETE") {
    const slug = url.searchParams.get("slug") || "", id = url.searchParams.get("id") || "";
    const a = SLUG.test(slug) ? await getAsset(slug, id) : null;
    if (!a) return fail("Asset not found", 404);
    await deleteAssetData(a);
    await unindexMedia(a.id);
    return json({ ok: true });
  }

  return fail("Method not allowed", 405);
};

export const config: Config = { path: "/api/assets" };
