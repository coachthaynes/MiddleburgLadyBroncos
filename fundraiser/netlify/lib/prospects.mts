// Sponsor prospects: local businesses found near Middleburg, the coach's own outreach to them, and the
// players assigned to visit them. The coach sends each prospect email herself, one tap at a time, through the
// team email (Resend) or her own Gmail. Nothing here emails a business on its own.
import { createHash } from "node:crypto";
import { clean, cleanUrl, db, listSponsors } from "./core.mts";
import { DIRECTORY } from "./directory.mts";


export const STATUSES = ["new", "assigned", "emailed", "visited", "interested", "signed", "notnow"] as const;
export type ProspectStatus = (typeof STATUSES)[number];

export interface Prospect {
  id: string; // "osm:node/123" or "google:abc"
  name: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  emailFrom: string; // "listing", "website", "coach" or ""
  emailChecked: boolean; // the website has been looked at for an email
  chain: boolean;
  distance: number; // miles from Middleburg
  status: ProspectStatus;
  playerId: string;
  playerName: string;
  notes: string;
  playerNote: string;
  ask?: "sponsor" | "meals"; // what the coach asks for; food places default to team meals
  emails: { step: number; at: string }[]; // coach's own emails, by step
  addedAt: string;
  updatedAt: string;
  source: string;
}

// Kinds of business in the team directory.
export const GROUPS: Record<string, { label: string }> = {
  food: { label: "Food and drink" },
  auto: { label: "Auto" },
  health: { label: "Health and beauty" },
  trades: { label: "Home services and trades" },
  shops: { label: "Shops" },
  offices: { label: "Professional offices" },
  fun: { label: "Fitness and fun" },
  community: { label: "Community groups and members" },
};

const key = (id: string) => `prospects/${createHash("sha256").update(id).digest("hex").slice(0, 32)}`;
const norm = (s: string) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
const EMAIL_RE = /[A-Z0-9._%+]+@[A-Z0-9.]+\.[A-Z]{2,}/gi;
const goodEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e) && !/\.(png|jpe?g|gif|webp|svg)$/i.test(e)
  && !/(@example\.|@sentry|wixpress|@domain\.com|@email\.com|yourname|@godaddy|@squarespace|@wordpress|schema\.org|^(name|user|you|your)@)/i.test(e);

// Food places are asked to feed the team on game days instead of buying a sponsorship.
const FOOD = /restaurant|cafe|coffee|bakery|fast food|ice cream|pizza|bbq|bar b q|barbecue|grill|sushi|seafood|brunch|diner|kitchen|cocina|taco|wings|deli|bistro|smoothie|nutrition|treats|sweet|toppings|culver|mcdonald|chick|subway|jeremiah|meal takeaway|food|eatery|steak|burger|donut|bagel/i;
export function askFor(p: Pick<Prospect, "name" | "category" | "ask">): "sponsor" | "meals" {
  if (p.ask === "sponsor" || p.ask === "meals") return p.ask;
  return FOOD.test(`${p.name} ${p.category}`) ? "meals" : "sponsor";
}

export async function listProspects(): Promise<Prospect[]> {
  const store = db();
  const { blobs } = await store.list({ prefix: "prospects/" });
  const all = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean) as Prospect[];
  return all.sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name));
}
export async function getProspect(id: string) {
  return (await db().get(key(id), { type: "json" })) as Prospect | null;
}
async function saveProspect(p: Prospect) {
  p.updatedAt = new Date().toISOString();
  await db().setJSON(key(p.id), p);
}

// ---------- finding businesses ----------

export const searchSource = () => "the team directory";

// Add businesses from the team directory, skipping any already on the list or already sponsors.
export async function findBusinesses(body: any) {
  const groups = (Array.isArray(body?.groups) ? body.groups : Object.keys(GROUPS)).filter((g: string) => GROUPS[g]);
  if (!groups.length) return { error: "Pick at least one kind of business." };
  const found = DIRECTORY.filter((d) => groups.includes(d.group));
  const [have, sponsors] = await Promise.all([listProspects(), listSponsors()]);
  const existing = new Map(have.map((p) => [norm(p.name), p] as const));
  const seen = new Set([...existing.keys(), ...sponsors.map((s) => norm(s.business))]);
  const now = new Date().toISOString();
  let added = 0, updated = 0, skippedKnown = 0;
  for (const d of found) {
    // Already on the list: fill in anything it is missing and keep what the coach has.
    const old = existing.get(norm(d.name));
    if (old) {
      const fill: Partial<Prospect> = {};
      if (!old.email && d.email) Object.assign(fill, { email: d.email, emailFrom: "listing", emailChecked: true });
      if (!old.phone && d.phone) fill.phone = d.phone;
      if (!old.address && d.address) fill.address = d.address;
      if (!old.website && d.website) fill.website = d.website;
      const note = d.contact ? `Contact: ${d.contact}` : "";
      if (note && !(old.notes || "").includes(note)) fill.notes = old.notes ? `${old.notes}\n${note}` : note;
      if (Object.keys(fill).length) { await saveProspect({ ...old, ...fill, updatedAt: now }); updated++; } else skippedKnown++;
      continue;
    }
    if (seen.has(norm(d.name))) { skippedKnown++; continue; }
    seen.add(norm(d.name));
    await saveProspect({
      id: `dir:${norm(d.name)}`, name: d.name, category: GROUPS[d.group].label, address: d.address, phone: d.phone,
      website: d.website, email: d.email, emailFrom: d.email ? "listing" : "", emailChecked: !!d.email || !d.website,
      chain: false, distance: 0, status: "new", playerId: "", playerName: "", notes: d.contact ? `Contact: ${d.contact}` : "",
      playerNote: "", emails: [], addedAt: now, updatedAt: now, source: "directory",
    });
    added++;
  }
  return { added, updated, found: found.length, skippedChains: 0, skippedKnown, source: searchSource() };
}

// How many directory businesses there are of each kind.
export const groupLabels = () => Object.fromEntries(Object.entries(GROUPS).map(([k, g]) => [k, `${g.label} (${DIRECTORY.filter((d) => d.group === k).length})`]));

// ---------- pulling an email address from a business website ----------
async function fetchText(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; mhsladybroncos.com sponsor finder)" } });
    if (!r.ok || !/text\/html/i.test(r.headers.get("content-type") || "")) return "";
    return (await r.text()).slice(0, 400_000);
  } catch { return ""; } finally { clearTimeout(t); }
}

export async function findEmail(id: string) {
  const p = await getProspect(id);
  if (!p) return null;
  if (p.email || !p.website) { p.emailChecked = true; await saveProspect(p); return { ...p, ask: askFor(p) }; }
  let host = "";
  try { host = new URL(p.website).hostname.replace(/^www\./, ""); } catch { /* bad link */ }
  const base = p.website.replace(/\/+$/, "");
  const pages = [base, `${base}/contact`, `${base}/contact-us`, `${base}/about`];
  const found: string[] = [];
  for (const url of pages) {
    const html = await fetchText(url);
    if (!html) continue;
    const mailtos = [...html.matchAll(/mailto:([^"'?>\s]+)/gi)].map((m) => decodeURIComponent(m[1]));
    const plain = html.replace(/<[^>]+>/g, " ").match(EMAIL_RE) || [];
    found.push(...mailtos, ...plain);
    if (found.some(goodEmail)) break;
  }
  const list = [...new Set(found.map((e) => e.trim().toLowerCase()).filter(goodEmail))];
  // Prefer an address on the business's own domain.
  const pick = list.find((e) => host && e.endsWith("@" + host)) || list[0] || "";
  p.emailChecked = true;
  if (pick) { p.email = pick; p.emailFrom = "website"; }
  await saveProspect(p);
  return { ...p, ask: askFor(p) };
}

// ---------- coach and player updates ----------
export async function updateProspect(id: string, body: any) {
  const p = await getProspect(id);
  if (!p) return null;
  if (body.status && (STATUSES as readonly string[]).includes(body.status)) p.status = body.status;
  if (body.notes !== undefined) p.notes = clean(body.notes, 800);
  if (body.ask === "sponsor" || body.ask === "meals") p.ask = body.ask;
  if (body.email !== undefined) {
    const e = clean(body.email, 120).toLowerCase();
    if (!e || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) { p.email = e; p.emailFrom = e ? "coach" : ""; }
  }
  if (body.phone !== undefined) p.phone = clean(body.phone, 30);
  if (body.player !== undefined) {
    p.playerId = clean(body.player?.id, 40);
    p.playerName = p.playerId ? clean(body.player?.name, 60) : "";
    if (p.playerId && p.status === "new") p.status = "assigned";
    if (!p.playerId && p.status === "assigned") p.status = "new";
  }
  // The coach opened her own email to this business: record which step it was.
  if (body.emailed) {
    const step = Math.max(1, Math.min(3, Math.round(Number(body.emailed))));
    p.emails = [...p.emails.filter((e) => e.step !== step), { step, at: new Date().toISOString() }].sort((a, b) => a.step - b.step);
    if (["new", "assigned"].includes(p.status)) p.status = "emailed";
  }
  await saveProspect(p);
  return { ...p, ask: askFor(p) };
}

export async function addProspect(body: any) {
  const name = clean(body?.name, 100);
  if (name.length < 2) return { error: "Enter the business name." };
  const now = new Date().toISOString();
  const email = clean(body?.email, 120).toLowerCase();
  const p: Prospect = {
    id: `manual:${Date.now()}`, name, category: clean(body?.category, 40) || "business", address: clean(body?.address, 160),
    phone: clean(body?.phone, 30), website: cleanUrl(body?.website || ""), email: goodEmail(email) ? email : "", emailFrom: goodEmail(email) ? "coach" : "",
    emailChecked: true, chain: false, distance: 0, status: "new", playerId: "", playerName: "", notes: "", playerNote: "", emails: [], addedAt: now, updatedAt: now, source: "coach",
  };
  await saveProspect(p);
  return { ok: true, prospect: { ...p, ask: askFor(p) } };
}

// Paste a list: one business per line, with the name first and then any of address, phone, email
// and website in any order, separated by commas or tabs (a copied spreadsheet works).
export async function importProspects(text: unknown) {
  const lines = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 300);
  const existing = new Map((await listProspects()).map((p) => [norm(p.name), p] as const));
  const have = new Set([...existing.keys(), ...(await listSponsors()).map((s) => norm(s.business))]);
  let added = 0, updated = 0, skipped = 0;
  for (const [i, line] of lines.entries()) {
    const cells = line.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim()).filter(Boolean);
    const name = clean(cells.shift(), 100);
    if (name.length < 2 || /^(business|name)$/i.test(name)) { skipped++; continue; }
    // "Contact: Jane Smith" names the person to ask for; it goes in the notes.
    const ci = cells.findIndex((c) => /^contact\s*:/i.test(c));
    const contact = ci >= 0 ? clean(cells.splice(ci, 1)[0].replace(/^contact\s*:\s*/i, ""), 80) : "";
    const notes = contact ? `Contact: ${contact}` : "";
    const email = cells.find((c) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(c)) || "";
    const website = cells.find((c) => c !== email && /^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(c)) || "";
    const phone = cells.find((c) => c !== email && c !== website && (c.replace(/\D/g, "").length >= 10 && c.replace(/\D/g, "").length <= 11) && !/[a-z]{3}/i.test(c)) || "";
    const address = cells.filter((c) => ![email, website, phone].includes(c)).join(", ");
    const now = new Date().toISOString();
    const site = website ? cleanUrl(/^https?:\/\//i.test(website) ? website : `https://${website}`) : "";
    // Already on the list: fill in anything it is missing, and keep everything the coach already has.
    const old = existing.get(norm(name));
    if (old) {
      const fill: Partial<Prospect> = {};
      if (!old.phone && phone) fill.phone = clean(phone, 30);
      if (!old.address && address) fill.address = clean(address, 160);
      if (!old.website && site) { fill.website = site; if (!old.email) fill.emailChecked = false; }
      if (!old.email && email) { fill.email = email.toLowerCase(); fill.emailFrom = "coach"; fill.emailChecked = true; }
      if (notes && !(old.notes || "").includes(notes)) fill.notes = old.notes ? `${old.notes}\n${notes}` : notes;
      if (Object.keys(fill).length) { await saveProspect({ ...old, ...fill, updatedAt: now }); updated++; } else skipped++;
      continue;
    }
    if (have.has(norm(name))) { skipped++; continue; }
    await saveProspect({
      id: `manual:${Date.now()}${i}`, name, category: "business", address: clean(address, 160), phone: clean(phone, 30),
      website: site,
      email: email.toLowerCase(), emailFrom: email ? "coach" : "", emailChecked: !!email || !website, chain: false, distance: 0,
      status: "new", playerId: "", playerName: "", notes, playerNote: "", emails: [], addedAt: now, updatedAt: now, source: "coach",
    });
    have.add(norm(name));
    added++;
  }
  return { added, updated, skipped };
}

// The coach's own wording for the emails to businesses on her list. Blank means the built in wording.
type EmailText = { subject: string; body: string };
export type ProspectEmails = { sponsor: (EmailText | null)[]; meals: (EmailText | null)[] };
export async function getProspectEmails(): Promise<ProspectEmails> {
  const v = (await db().get("coach/prospect-emails", { type: "json" })) as ProspectEmails | null;
  return { sponsor: v?.sponsor || [null, null, null], meals: v?.meals || [null, null, null] };
}
export async function saveProspectEmails(body: any) {
  const one = (t: any): EmailText | null => {
    const subject = clean(t?.subject, 200), text = String(t?.body || "").replace(/\r/g, "").trim().slice(0, 6000);
    return subject && text ? { subject, body: text } : null;
  };
  const list = (a: any) => [0, 1, 2].map((i) => (Array.isArray(a) ? one(a[i]) : null));
  const v: ProspectEmails = { sponsor: list(body?.sponsor), meals: list(body?.meals) };
  await db().setJSON("coach/prospect-emails", v);
  return v;
}

export async function deleteProspect(id: string) {
  await db().delete(key(id));
}

// What a player sees: only the businesses assigned to her, without the coach's notes.
export async function playerProspects(playerId: string) {
  return (await listProspects()).filter((p) => p.playerId === playerId).map((p) => ({
    id: p.id, name: p.name, category: p.category, address: p.address, phone: p.phone, website: p.website, status: p.status, playerNote: p.playerNote, ask: askFor(p),
  }));
}

export async function playerUpdate(playerId: string, id: string, body: any) {
  const p = await getProspect(id);
  if (!p || p.playerId !== playerId) return null;
  if (["visited", "interested", "signed", "notnow"].includes(body?.status)) p.status = body.status;
  if (body?.note !== undefined) p.playerNote = clean(body.note, 400);
  await saveProspect(p);
  return { ok: true };
}
