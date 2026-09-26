// Public image URLs. Instagram and Facebook download post images from here.
import { getMedia } from "../../lib/store.mjs";

export default async (req) => {
  const id = new URL(req.url).pathname.split("/").pop().replace(/\.(jpg|jpeg|png)$/, "");
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(id)) return new Response("Not found", { status: 404 });
  const media = await getMedia(id);
  if (!media) return new Response("Not found", { status: 404 });
  return new Response(media.data, {
    headers: { "content-type": media.contentType, "cache-control": "public, max-age=31536000, immutable" }
  });
};

export const config = { path: "/media/*" };
