// Storage layer. Uses Netlify Blobs in production and a local folder
// when LOCAL_STORE_DIR is set (see scripts/dev-server.mjs).
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const STORE_NAME = "social-scheduler";

function localStore(dir) {
  const file = (key) => path.join(dir, encodeURIComponent(key));
  return {
    async get(key, opts = {}) {
      try {
        const buf = await fs.readFile(file(key));
        if (opts.type === "json") return JSON.parse(buf.toString("utf8"));
        if (opts.type === "arrayBuffer") return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        return buf.toString("utf8");
      } catch {
        return null;
      }
    },
    async getMetadata(key) {
      try {
        const meta = JSON.parse(await fs.readFile(file(key) + ".meta", "utf8"));
        return { metadata: meta };
      } catch {
        return null;
      }
    },
    async set(key, value, opts = {}) {
      await fs.mkdir(dir, { recursive: true });
      const data = value instanceof ArrayBuffer ? Buffer.from(value) : value;
      await fs.writeFile(file(key), data);
      if (opts.metadata) await fs.writeFile(file(key) + ".meta", JSON.stringify(opts.metadata));
    },
    async setJSON(key, value) {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(file(key), JSON.stringify(value));
    },
    async delete(key) {
      await fs.rm(file(key), { force: true });
      await fs.rm(file(key) + ".meta", { force: true });
    },
    async list({ prefix = "" } = {}) {
      let names = [];
      try { names = await fs.readdir(dir); } catch { /* empty store */ }
      const blobs = names
        .filter((n) => !n.endsWith(".meta"))
        .map((n) => decodeURIComponent(n))
        .filter((k) => k.startsWith(prefix))
        .map((key) => ({ key }));
      return { blobs };
    }
  };
}

let cached;
export async function store() {
  if (cached) return cached;
  if (process.env.LOCAL_STORE_DIR) {
    cached = localStore(process.env.LOCAL_STORE_DIR);
  } else {
    const { getStore } = await import("@netlify/blobs");
    cached = getStore({ name: STORE_NAME, consistency: "strong" });
  }
  return cached;
}

export const newId = (bytes = 9) => crypto.randomBytes(bytes).toString("base64url");

// Posts
export async function listPosts() {
  const s = await store();
  const { blobs } = await s.list({ prefix: "posts/" });
  const posts = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
  return posts.filter(Boolean);
}
export async function getPost(id) {
  return (await store()).get(`posts/${id}`, { type: "json" });
}
export async function savePost(post) {
  post.updatedAt = new Date().toISOString();
  await (await store()).setJSON(`posts/${post.id}`, post);
  return post;
}
export async function deletePost(id) {
  await (await store()).delete(`posts/${id}`);
}

// Channels (connected social accounts, including their tokens)
export async function listChannels() {
  const s = await store();
  const { blobs } = await s.list({ prefix: "channels/" });
  const items = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
  return items.filter(Boolean);
}
export async function getChannel(id) {
  return (await store()).get(`channels/${id}`, { type: "json" });
}
export async function saveChannel(ch) {
  ch.updatedAt = new Date().toISOString();
  await (await store()).setJSON(`channels/${ch.id}`, ch);
  return ch;
}
export async function deleteChannel(id) {
  await (await store()).delete(`channels/${id}`);
}
// Strip secrets before sending a channel to the browser.
export function publicChannel(ch) {
  const { token, refreshToken, ...rest } = ch;
  return rest;
}

// Settings
export const DEFAULT_SETTINGS = {
  // Queue slots in your local time, by weekday (0 is Sunday).
  slots: {
    0: ["17:00"],
    1: ["07:30", "18:30"],
    2: ["07:30", "18:30"],
    3: ["07:30", "18:30"],
    4: ["07:30", "18:30"],
    5: ["07:30", "12:00", "18:30"],
    6: ["10:00"]
  }
};
export async function getSettings() {
  const saved = await (await store()).get("settings", { type: "json" });
  return { ...DEFAULT_SETTINGS, ...(saved || {}) };
}
export async function saveSettings(next) {
  const merged = { ...(await getSettings()), ...next };
  await (await store()).setJSON("settings", merged);
  return merged;
}

// Media (images served publicly at /media/:id so Instagram can fetch them)
export async function saveMedia(buf, contentType) {
  const id = newId(16);
  await (await store()).set(`media/${id}`, buf, { metadata: { contentType, createdAt: new Date().toISOString() } });
  return id;
}
export async function getMedia(id) {
  const s = await store();
  const data = await s.get(`media/${id}`, { type: "arrayBuffer" });
  if (!data) return null;
  const meta = await s.getMetadata(`media/${id}`);
  return { data, contentType: meta?.metadata?.contentType || "image/jpeg" };
}
export async function deleteMedia(id) {
  await (await store()).delete(`media/${id}`);
}
