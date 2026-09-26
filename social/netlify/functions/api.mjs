// JSON API used by the dashboard. Everything except login needs the admin session.
import { checkPassword, cookie, isLoggedIn, json, sessionCookie, SESSION_COOKIE, siteUrl } from "../../lib/http.mjs";
import {
  deleteChannel, deleteMedia, deletePost, getPost, getSettings, listChannels, listPosts,
  newId, publicChannel, saveMedia, savePost, saveSettings
} from "../../lib/store.mjs";
import { publishDue, publishPost } from "../../lib/publish.mjs";
import { metaConfigured } from "../../lib/platforms/meta.mjs";

const MAX_MEDIA_BYTES = 5 * 1024 * 1024;
const EDITABLE = ["text", "variants", "channels", "mediaId", "link", "scheduledAt", "status", "title", "source"];

function cleanPost(input, existing = {}) {
  const post = { ...existing };
  for (const k of EDITABLE) if (k in input) post[k] = input[k];
  post.text = String(post.text || "").slice(0, 63000);
  post.channels = Array.isArray(post.channels) ? post.channels.map(String) : [];
  post.variants = post.variants && typeof post.variants === "object" ? post.variants : {};
  if (!["draft", "scheduled"].includes(post.status)) post.status = "draft";
  if (post.status === "scheduled") {
    if (!post.channels.length) throw new Error("Pick at least one channel before scheduling.");
    if (!post.scheduledAt || isNaN(Date.parse(post.scheduledAt))) throw new Error("Pick a date and time.");
    post.scheduledAt = new Date(post.scheduledAt).toISOString();
    post.results = {};
  }
  return post;
}

async function body(req) {
  try { return await req.json(); } catch { return {}; }
}

export default async (req) => {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const [resource, id, action] = parts;
  const method = req.method;

  try {
    if (resource === "login" && method === "POST") {
      if (!process.env.ADMIN_PASSWORD) return json({ error: "ADMIN_PASSWORD is not set on the server yet. See the setup guide." }, 500);
      const { password } = await body(req);
      if (!checkPassword(password)) return json({ error: "Wrong password" }, 401);
      return json({ ok: true }, 200, { "set-cookie": sessionCookie(req) });
    }
    if (resource === "logout" && method === "POST") {
      return json({ ok: true }, 200, { "set-cookie": cookie(req, SESSION_COOKIE, "", 0) });
    }
    if (resource === "me") {
      return json({
        loggedIn: isLoggedIn(req),
        passwordSet: !!process.env.ADMIN_PASSWORD,
        providers: { meta: metaConfigured() }
      });
    }

    if (!isLoggedIn(req)) return json({ error: "Please sign in" }, 401);

    if (resource === "state" && method === "GET") {
      const [posts, channels, settings] = await Promise.all([listPosts(), listChannels(), getSettings()]);
      return json({ posts, channels: channels.map(publicChannel), settings, siteUrl: siteUrl(req) });
    }

    if (resource === "posts") {
      if (!id && method === "POST") {
        const post = cleanPost(await body(req), { id: newId(), createdAt: new Date().toISOString() });
        return json(await savePost(post), 201);
      }
      if (id === "bulk" && method === "POST") {
        const { posts = [] } = await body(req);
        const saved = [];
        for (const p of posts.slice(0, 100)) saved.push(await savePost(cleanPost(p, { id: newId(), createdAt: new Date().toISOString() })));
        return json({ posts: saved }, 201);
      }
      const existing = id ? await getPost(id) : null;
      if (!existing) return json({ error: "Post not found" }, 404);
      if (action === "publish" && method === "POST") {
        if (!existing.channels?.length) return json({ error: "Pick at least one channel first." }, 400);
        if (existing.status !== "partial") existing.results = {};
        return json(await publishPost(existing, siteUrl(req)));
      }
      if (method === "PUT") {
        if (existing.status === "publishing") return json({ error: "This post is being published right now." }, 409);
        return json(await savePost(cleanPost(await body(req), existing)));
      }
      if (method === "DELETE") {
        await deletePost(id);
        return json({ ok: true });
      }
    }

    if (resource === "channels" && id && method === "DELETE") {
      await deleteChannel(id);
      return json({ ok: true });
    }

    if (resource === "settings" && method === "PUT") {
      const input = await body(req);
      const allowed = ["slots", "timezone"];
      const next = Object.fromEntries(Object.entries(input).filter(([k]) => allowed.includes(k)));
      return json(await saveSettings(next));
    }

    if (resource === "media") {
      if (!id && method === "POST") {
        const type = req.headers.get("content-type") || "";
        if (!/^image\/(jpeg|png)$/.test(type)) return json({ error: "Upload a JPEG or PNG image." }, 400);
        const buf = await req.arrayBuffer();
        if (buf.byteLength > MAX_MEDIA_BYTES) return json({ error: "Image is larger than 5 MB." }, 413);
        return json({ id: await saveMedia(buf, type) }, 201);
      }
      if (id && method === "DELETE") {
        await deleteMedia(id);
        return json({ ok: true });
      }
    }

    if (resource === "run-scheduler" && method === "POST") {
      const done = await publishDue(siteUrl(req));
      return json({ published: done.length });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    return json({ error: String(err.message || err) }, 400);
  }
};

export const config = { path: "/api/*" };
