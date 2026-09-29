import type { Config, Context } from "@netlify/functions";
import {
  authed, json, fail, media, getAsset, saveAsset, getPlayer, indexMedia, newId,
  CHUNK_SIZE, MAX_FILE, ROLES, SLUG, type Asset, type Role
} from "../lib/core.mts";

const ALLOWED = /^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|webm|quicktime)|application\/pdf)$/;

// Uploads arrive in 4 MB pieces so any size file fits under the function payload limit.
// POST /api/upload/start  { slug, name, type, size, role?, title? } -> { id, chunkSize, chunks }
// PUT  /api/upload/chunk?slug=&id=&n=   raw bytes for piece n
// POST /api/upload/finish { slug, id }
export default async (req: Request, context: Context) => {
  if (!authed(req)) return fail("Sign in required", 401);
  const action = context.params.action;

  if (action === "start" && req.method === "POST") {
    const b = await req.json().catch(() => null);
    const slug = String(b?.slug || "");
    if (!SLUG.test(slug) || !(await getPlayer(slug))) return fail("Unknown player");
    const type = String(b?.type || "").toLowerCase();
    const size = Number(b?.size);
    if (!ALLOWED.test(type)) return fail("Use JPG, PNG, WEBP, MP4, MOV, WEBM or PDF files. iPhone HEIC photos need to be exported as JPG first.");
    if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE) return fail("Files must be under 1.5 GB");
    const name = String(b?.name || "file").slice(0, 160);
    const role: Role = ROLES.includes(b?.role) ? b.role : type.startsWith("video/") ? "film" : type === "application/pdf" ? "kit" : "editorial";
    const asset: Asset = {
      id: newId(), slug, name, type, size,
      chunks: Math.ceil(size / CHUNK_SIZE), chunkSize: CHUNK_SIZE,
      title: String(b?.title || name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")).slice(0, 120),
      role, layout: "", live: false, order: Date.now(), status: "uploading",
      created: new Date().toISOString()
    };
    await saveAsset(asset);
    return json({ id: asset.id, chunkSize: CHUNK_SIZE, chunks: asset.chunks });
  }

  if (action === "chunk" && req.method === "PUT") {
    const q = new URL(req.url).searchParams;
    const slug = q.get("slug") || "", id = q.get("id") || "", n = Number(q.get("n"));
    const a = SLUG.test(slug) ? await getAsset(slug, id) : null;
    if (!a || a.status !== "uploading") return fail("Upload not found", 404);
    if (!Number.isInteger(n) || n < 0 || n >= a.chunks) return fail("Bad piece number");
    const data = await req.arrayBuffer();
    const expected = n === a.chunks - 1 ? a.size - n * a.chunkSize : a.chunkSize;
    if (data.byteLength !== expected) return fail(`Piece ${n} should be ${expected} bytes`);
    await media().set(`${a.id}/${n}`, data);
    return new Response(null, { status: 204 });
  }

  if (action === "finish" && req.method === "POST") {
    const b = await req.json().catch(() => null);
    const a = b && SLUG.test(b.slug) ? await getAsset(b.slug, String(b.id)) : null;
    if (!a) return fail("Upload not found", 404);
    const { blobs } = await media().list({ prefix: `${a.id}/` });
    if (blobs.length !== a.chunks) return fail(`Upload incomplete: ${blobs.length} of ${a.chunks} pieces arrived`, 409);
    a.status = "ready";
    await saveAsset(a);
    await indexMedia(a.id, a.slug);
    return json({ asset: a });
  }

  return fail("Not found", 404);
};

export const config: Config = { path: "/api/upload/:action" };
