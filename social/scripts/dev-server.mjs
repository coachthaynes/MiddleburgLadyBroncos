// Local preview without a Netlify account: `npm run dev`, then open http://localhost:8888
// Data is kept in .local-store. Publishing is simulated unless LIVE=1 is set.
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.LOCAL_STORE_DIR ||= path.join(root, ".local-store");
process.env.ADMIN_PASSWORD ||= "letmein";
process.env.SESSION_SECRET ||= "local dev secret";
if (!process.env.LIVE) process.env.MOCK_PUBLISH = "1";
const PORT = Number(process.env.PORT || 8888);
process.env.PUBLIC_URL ||= `http://localhost:${PORT}`;

const api = (await import("../netlify/functions/api.mjs")).default;
const oauth = (await import("../netlify/functions/oauth.mjs")).default;
const media = (await import("../netlify/functions/media.mjs")).default;
const scheduler = (await import("../netlify/functions/scheduler.mjs")).default;
const { saveChannel, listChannels } = await import("../lib/store.mjs");

// Sample channels so the dashboard can be tried before real accounts are connected.
if (process.env.MOCK_PUBLISH && !(await listChannels()).length) {
  for (const ch of [
    { id: "facebook_demo", platform: "facebook", remoteId: "demo", name: "Demo Facebook Page" },
    { id: "instagram_demo", platform: "instagram", remoteId: "demo", name: "@demo_instagram" },
    { id: "x_demo", platform: "x", remoteId: "demo", name: "@demo_x" }
  ]) await saveChannel({ ...ch, avatar: null, token: "demo", connectedAt: new Date().toISOString() });
}

const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json" };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const handler = url.pathname.startsWith("/api/") ? api
    : url.pathname.startsWith("/oauth/") ? oauth
    : url.pathname.startsWith("/media/") ? media
    : null;
  if (handler) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks)
    });
    const out = await handler(request);
    const headers = Object.fromEntries(out.headers);
    res.writeHead(out.status, headers);
    res.end(Buffer.from(await out.arrayBuffer()));
    return;
  }
  const file = path.join(root, "public", url.pathname === "/" ? "index.html" : url.pathname);
  if (!file.startsWith(path.join(root, "public"))) { res.writeHead(403); res.end(); return; }
  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Social Scheduler running at http://localhost:${PORT} (password: ${process.env.ADMIN_PASSWORD})`);
  console.log(process.env.MOCK_PUBLISH ? "Publishing is simulated. Set LIVE=1 to post for real." : "LIVE mode: posts will really publish.");
});
setInterval(() => scheduler().catch((e) => console.error(e)), 30000);
