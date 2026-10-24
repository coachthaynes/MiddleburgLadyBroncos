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
  sponsorPrep: Record<string, boolean>; // "Before you sell sponsorships" checklist
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
  // Team donation item on MySchoolBucks. The coach dashboard can replace it.
  donateUrl: "https://www.myschoolbucks.com/ver2/prdembd?ref=ZZH4WPLXJ8082OZ_ZZ68I7E4C5HH19W",
  logoKey: "",
  requirePhotoApproval: true,
  sponsorPrep: {},
  updatedAt: "",
};

export async function getSettings(): Promise<Settings> {
  const s = await db().get("settings", { type: "json" });
  const merged = { ...DEFAULT_SETTINGS, ...(s || {}) };
  // A blank saved link falls back to the team's MySchoolBucks link.
  if (!merged.donateUrl) merged.donateUrl = DEFAULT_SETTINGS.donateUrl;
  return merged;
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

// ---------- gifts (donation form entries) ----------

export interface Gift {
  id: string;
  slug: string; // "team" or a player slug
  amount: number;
  name: string;
  anonymous: boolean;
  email: string;
  status: "pledged" | "confirmed" | "removed";
  source: "form" | "coach";
  createdAt: string;
  confirmedAt: string;
}

// Each gift is its own blob so two donors at once never overwrite each other.
export async function listGifts(): Promise<Gift[]> {
  const store = db();
  const { blobs } = await store.list({ prefix: "gifts/" });
  const all = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  return (all.filter(Boolean) as Gift[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveGift(g: Gift) {
  await db().setJSON(`gifts/${g.id}`, g);
}

export function confirmedTotals(gifts: Gift[]) {
  const bySlug: Record<string, number> = {};
  let all = 0;
  for (const g of gifts) {
    if (g.status !== "confirmed") continue;
    all += g.amount;
    bySlug[g.slug] = (bySlug[g.slug] || 0) + g.amount;
  }
  return { all, bySlug };
}

// "Sarah Johnson" becomes "Sarah J." on public pages.
export function publicDonorName(g: Gift) {
  if (g.anonymous) return "Anonymous";
  const parts = g.name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : parts[0];
}

export function recentSupporters(gifts: Gift[], players: Player[], slug?: string, limit = 12) {
  const names = new Map(players.map((p) => [p.slug, displayName(p)]));
  return gifts
    .filter((g) => g.status === "confirmed" && (!slug || g.slug === slug))
    .sort((a, b) => (b.confirmedAt || b.createdAt).localeCompare(a.confirmedAt || a.createdAt))
    .slice(0, limit)
    .map((g) => ({ name: publicDonorName(g), amount: g.amount, for: g.slug === "team" ? "the team" : names.get(g.slug) || "the team", at: g.confirmedAt || g.createdAt }));
}

export function publicPlayer(p: Player, stats?: Stats, giftTotal = 0) {
  return {
    slug: p.slug,
    name: displayName(p),
    first: p.first,
    number: p.number,
    position: p.position,
    message: p.message,
    personalGoal: p.personalGoal,
    raised: (p.raised || 0) + giftTotal,
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
  let v = await store.get(`meta/${key}`, { type: "text" });
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

// ---------- sponsors ----------

export type SponsorLevel = "backer" | "stallion" | "herd" | "title";
export const SPONSOR_LEVELS: Record<SponsorLevel, { name: string; price: number; rank: number }> = {
  backer: { name: "Bronco Backer", price: 750, rank: 1 },
  stallion: { name: "Stallion Partner", price: 1500, rank: 2 },
  herd: { name: "Herd Champion", price: 2500, rank: 3 },
  title: { name: "Horsepower Title Sponsor", price: 5000, rank: 4 },
};

export interface SponsorTask {
  id: string;
  text: string;
  done: boolean;
  date: string; // when it happened, YYYY-MM-DD
  link: string; // proof link (post, video, photo album)
  photoKey: string; // proof photo
  note: string;
}

export interface Sponsor {
  id: string;
  token: string; // private link for the proof of benefits report
  business: string;
  contact: string;
  email: string;
  phone: string;
  website: string;
  level: SponsorLevel;
  message: string;
  status: "interested" | "committed" | "paid" | "declined";
  amount: number;
  logoKey: string;
  showOnWall: boolean;
  createdAt: string;
  tasks: SponsorTask[];
}

// What has to be delivered at each level. Higher levels include everything below them.
const TASKS: { id: string; text: string; min: number }[] = [
  { id: "thankyou", text: "Send the thank you email and ask for their logo", min: 1 },
  { id: "wall", text: "Add them to the website sponsor wall (turn on Show on wall)", min: 1 },
  { id: "pa1", text: "PA thank you at a home game (enter the date)", min: 1 },
  { id: "social1", text: "Thank you post on team social media (add the post link)", min: 1 },
  { id: "certificate", text: "Print and frame the team photo certificate, then deliver it", min: 1 },
  { id: "logo", text: "Get their logo file (upload it here)", min: 2 },
  { id: "banner", text: "Add their logo to the game day entry banner", min: 2 },
  { id: "paall", text: "Give the announcer their PA mention for every home game", min: 2 },
  { id: "social2", text: "Two social posts, including a player spotlight presented by them", min: 2 },
  { id: "store", text: "Add their logo to the Team Store sponsor strip", min: 2 },
  { id: "bannerlarge", text: "Make their logo large on the entry banner", min: 3 },
  { id: "shirts", text: "Add their logo to the warmup shooting shirts (order before the season)", min: 3 },
  { id: "presented", text: "Pick the home game presented by them", min: 3 },
  { id: "halftime", text: "Halftime recognition at their game", min: 3 },
  { id: "featured", text: "Featured spot on the entry banner at their game", min: 3 },
  { id: "reel", text: "Player shout out reel on Instagram", min: 3 },
  { id: "passes", text: "Give them four season passes (if the school charges for them, buy them with the sponsorship money)", min: 3 },
  { id: "approval", text: "Get school approval and parent permission forms for Business Day", min: 4 },
  { id: "bizday", text: "Schedule Business Day with the owner", min: 4 },
  { id: "film", text: "Film and edit the 60 second ad and three short clips", min: 4 },
  { id: "deliver", text: "Deliver the video files to the business", min: 4 },
  { id: "toplogo", text: "Top logo spot on the entry banner and shooting shirts", min: 4 },
  { id: "fieldbanner", text: "Order their year round banner and hang it on the football field fence (get school approval)", min: 4 },
  { id: "naming", text: "Senior Night or tournament naming", min: 4 },
  { id: "homepage", text: "Homepage feature on the fundraiser site (turn on Show on wall)", min: 4 },
  { id: "jersey", text: "Order a plain jersey in Middleburg colors with the logo for players to sign", min: 4 },
  { id: "jerseyframe", text: "Have players sign the jersey, frame it and deliver it", min: 4 },
  { id: "proof", text: "Send the proof of benefits report (copy the report link)", min: 1 },
];

// Adds any tasks the sponsor's level needs that are not on their list yet. Keeps finished work.
export function syncSponsorTasks(s: Sponsor) {
  const rank = SPONSOR_LEVELS[s.level]?.rank || 1;
  const have = new Set(s.tasks.map((t) => t.id));
  for (const t of TASKS) {
    if (t.min <= rank && !have.has(t.id)) s.tasks.push({ id: t.id, text: t.text, done: false, date: "", link: "", photoKey: "", note: "" });
  }
  // Keep the proof report as the last step.
  s.tasks.sort((a, b) => (a.id === "proof" ? 1 : 0) - (b.id === "proof" ? 1 : 0));
}

export async function listSponsors(): Promise<Sponsor[]> {
  const store = db();
  const { blobs } = await store.list({ prefix: "sponsors/" });
  const all = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  return (all.filter(Boolean) as Sponsor[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSponsor(id: string): Promise<Sponsor | null> {
  return (await db().get(`sponsors/${id.replace(/[^a-z0-9]/gi, "")}`, { type: "json" })) as Sponsor | null;
}

export async function saveSponsor(s: Sponsor) {
  await db().setJSON(`sponsors/${s.id}`, s);
}

export function isSponsorLevel(v: unknown): v is SponsorLevel {
  return typeof v === "string" && v in SPONSOR_LEVELS;
}

export function cleanUrl(v: unknown) {
  let u = String(v ?? "").trim().slice(0, 300);
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const x = new URL(u);
    return x.protocol === "https:" || x.protocol === "http:" ? x.toString() : "";
  } catch {
    return "";
  }
}

// How each benefit reads on the sponsor's report. Internal steps (logo request, approvals, filming) are left off.
export const REPORT_LABELS: Record<string, string> = {
  wall: "Featured on the website sponsor wall",
  pa1: "PA thank you at a home game",
  social1: "Thank you post on team social media",
  certificate: "Framed team photo certificate delivered",
  banner: "Logo on the game day entry banner",
  paall: "PA mention at every home game",
  social2: "Two social posts, including a player spotlight",
  store: "Logo on the Team Store sponsor strip",
  bannerlarge: "Large logo on the entry banner",
  shirts: "Logo on the warmup shooting shirts",
  presented: "Home game presented by your business",
  halftime: "Halftime recognition",
  featured: "Featured entry banner spot",
  reel: "Player shout out reel on Instagram",
  passes: "Season passes",
  deliver: "Business Day video and clips delivered",
  toplogo: "Top logo spot on the entry banner and shooting shirts",
  fieldbanner: "Year round banner on the football field fence",
  naming: "Senior Night or tournament named for your business",
  homepage: "Homepage feature on the fundraiser site",
  jerseyframe: "Framed jersey signed by the team",
};
export const INTERNAL_TASKS = new Set(["thankyou", "logo", "approval", "bizday", "film", "jersey", "proof"]);
