import { getStore, getDeployStore } from "@netlify/blobs";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// ---------- storage ----------

export function db() {
  const ctx = (globalThis as any).Netlify?.context?.deploy?.context;
  // Deploy previews and branch deploys get their own sandbox so test data never touches the live fundraiser.
  if (ctx === "deploy-preview" || ctx === "branch-deploy") {
    return getDeployStore({ name: "fundraiser", consistency: "strong" } as any);
  }
  return getStore({ name: "fundraiser", consistency: "strong" });
}

export interface Settings {
  teamName: string;
  schoolName: string;
  tagline: string;
  story: string;
  goal: number;
  raised: number;
  endDate: string; // YYYY-MM-DD
  donateUrl: string;
  logoKey: string;
  requirePhotoApproval: boolean;
  updatedAt: string;
}

export const DEFAULT_SETTINGS: Settings = {
  teamName: "Lady Broncos",
  schoolName: "Middleburg High School",
  tagline: "Help our girls chase a championship season.",
  story:
    "Every dollar goes straight to our team through the official Middleburg High School payment portal. Your gift covers tournament fees, travel, uniforms and equipment so every player can compete without worrying about the cost. Thank you for standing behind the Lady Broncos!",
  goal: 10000,
  raised: 0,
  endDate: "2027-02-01",
  donateUrl: "",
  logoKey: "",
  requirePhotoApproval: true,
  updatedAt: "",
};

export async function getSettings(): Promise<Settings> {
  const s = await db().get("settings", { type: "json" });
  return { ...DEFAULT_SETTINGS, ...(s || {}) };
}

export interface Player {
  id: string;
  slug: string;
  first: string;
  last: string;
  number: string;
  position: string;
  message: string;
  personalGoal: number;
  raised: number;
  photoKey: string;
  pendingPhotoKey: string;
  consent: { accepted: boolean; guardianName: string; at: string } | null;
  active: boolean;
  createdAt: string;
}

export async function listPlayers(): Promise<Player[]> {
  const store = db();
  const { blobs } = await store.list({ prefix: "players/" });
  const all = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  return (all.filter(Boolean) as Player[]).sort((a, b) => a.first.localeCompare(b.first));
}

export async function getPlayer(id: string): Promise<Player | null> {
  return (await db().get(`players/${id}`, { type: "json" })) as Player | null;
}

export async function savePlayer(p: Player) {
  await db().setJSON(`players/${p.id}`, p);
}

export function displayName(p: Player) {
  return `${p.first} ${p.last ? p.last.charAt(0).toUpperCase() + "." : ""}`.trim();
}

export function isLive(p: Player) {
  return p.active && !!p.consent?.accepted;
}

export function photoUrl(key: string) {
  return key ? `/img/${encodeURIComponent(key)}` : "";
}

export function publicPlayer(p: Player, stats?: Stats) {
  return {
    slug: p.slug,
    name: displayName(p),
    first: p.first,
    number: p.number,
    position: p.position,
    message: p.message,
    personalGoal: p.personalGoal,
    raised: p.raised || 0,
    photo: photoUrl(p.photoKey),
    stats: stats || emptyStats(),
  };
}

// ---------- events (views, shares, donate clicks) ----------

export type EventType = "view" | "share" | "donate";
export interface Stats { view: number; share: number; donate: number }
export const emptyStats = (): Stats => ({ view: 0, share: 0, donate: 0 });

export async function recordEvent(type: EventType, slug: string) {
  const key = `ev/${type}/${slug || "team"}/${Date.now()}${randomBytes(4).toString("hex")}`;
  await db().set(key, "1");
}

// Every event is its own blob so simultaneous clicks never overwrite each other.
export async function allStats(): Promise<Record<string, Stats>> {
  const { blobs } = await db().list({ prefix: "ev/" });
  const out: Record<string, Stats> = {};
  for (const b of blobs) {
    const [, type, slug] = b.key.split("/");
    if (!out[slug]) out[slug] = emptyStats();
    if (type in out[slug]) out[slug][type as EventType]++;
  }
  return out;
}

export function sumStats(all: Record<string, Stats>): Stats {
  const t = emptyStats();
  for (const s of Object.values(all)) {
    t.view += s.view;
    t.share += s.share;
    t.donate += s.donate;
  }
  return t;
}

// ---------- secrets and sessions ----------

async function meta(key: string) {
  const store = db();
  let v = await store.get(`meta/${key}`);
  if (!v) {
    v = randomBytes(32).toString("hex");
    await store.set(`meta/${key}`, v);
  }
  return v as string;
}

async function sessionSecret() {
  return Netlify.env.get("SESSION_SECRET") || (await meta("session-secret"));
}

export async function codeHash(code: string) {
  const pepper = await meta("code-pepper");
  return createHmac("sha256", pepper).update(normalizeCode(code)).digest("hex");
}

export function normalizeCode(code: string) {
  return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newCode() {
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export interface Session { role: "player" | "coach"; id: string; exp: number }

const COOKIE = "mlb_session";

export async function makeSessionCookie(s: Omit<Session, "exp">, req: Request) {
  const body: Session = { ...s, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = createHmac("sha256", await sessionSecret()).update(payload).digest("base64url");
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${payload}.${sig}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${secure}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readCookie(req: Request, name: string) {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return "";
}

export async function getSession(req: Request): Promise<Session | null> {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expect = createHmac("sha256", await sessionSecret()).update(payload).digest("base64url");
  if (!safeEqual(sig, expect)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    return s.exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// ---------- login throttling ----------

function clientKey(req: Request, context: any) {
  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "local";
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

export async function tooManyAttempts(req: Request, context: any) {
  const rec = (await db().get(`rl/${clientKey(req, context)}`, { type: "json" })) as
    | { n: number; t: number }
    | null;
  return !!rec && rec.n >= 10 && Date.now() - rec.t < 15 * 60 * 1000;
}

export async function noteFailedAttempt(req: Request, context: any) {
  const key = `rl/${clientKey(req, context)}`;
  const rec = (await db().get(key, { type: "json" })) as { n: number; t: number } | null;
  const fresh = !rec || Date.now() - rec.t > 15 * 60 * 1000;
  await db().setJSON(key, { n: fresh ? 1 : rec!.n + 1, t: fresh ? Date.now() : rec!.t });
}

export async function clearAttempts(req: Request, context: any) {
  await db().delete(`rl/${clientKey(req, context)}`);
}

// ---------- helpers ----------

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

export function slugify(first: string, last: string) {
  const base = (first + (last ? last.charAt(0) : "")).toLowerCase().replace(/[^a-z0-9]/g, "");
  return base || "player";
}

export function clean(v: unknown, max = 500) {
  return String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

export function money(v: unknown) {
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 10_000_000) : 0;
}

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function saveImage(req: Request, prefix: string) {
  const type = (req.headers.get("content-type") || "").split(";")[0].trim();
  if (!IMAGE_TYPES[type]) return { error: "Please upload a JPG, PNG or WEBP image." };
  const buf = await req.arrayBuffer();
  if (buf.byteLength === 0) return { error: "That image looks empty." };
  if (buf.byteLength > 4 * 1024 * 1024) return { error: "That image is too large. Please pick one under 4 MB." };
  const key = `${prefix}${Date.now()}${randomBytes(4).toString("hex")}.${IMAGE_TYPES[type]}`;
  await db().set(`images/${key}`, buf, { metadata: { contentType: type } });
  return { key };
}

export async function deleteImage(key: string) {
  if (key) await db().delete(`images/${key}`);
}
