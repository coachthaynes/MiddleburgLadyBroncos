import type { Config } from "@netlify/functions";
import { db } from "../lib/core.mts";

export default async (req: Request) => {
  const key = decodeURIComponent(new URL(req.url).pathname.replace(/^\/img\//, ""));
  if (!key || key.includes("..")) return new Response("Not found", { status: 404 });
  const found = await db().getWithMetadata(`images/${key}`, { type: "arrayBuffer" });
  if (!found) return new Response("Not found", { status: 404 });
  return new Response(found.data as ArrayBuffer, {
    headers: {
      "content-type": String(found.metadata?.contentType || "image/jpeg"),
      // Keys are unique per upload, so a long cache is safe.
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};

export const config: Config = { path: "/img/*", preferStatic: true };
