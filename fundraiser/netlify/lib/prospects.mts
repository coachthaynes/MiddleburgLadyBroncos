// Sponsor prospects: local businesses found near Middleburg, the coach's own outreach to them, and the
// players assigned to visit them. Nothing here emails a business. The coach sends every prospect email
// herself from her own email account; the site only writes the message and keeps track.
import { createHash } from "node:crypto";
import { clean, cleanUrl, db, listSponsors } from "./core.mts";

// Middleburg, Florida.
export const HOME = { lat: 30.0686, lng: -81.8604 };

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
  emails: { step: number; at: string }[]; // coach's own emails, by step
  addedAt: string;
  updatedAt: string;
  source: string;
}

// Business groups the coach can search, mapped to map database tags and Google place types.
export const GROUPS: Record<string, { label: string; tomtom: string[]; osm: string[]; google: string[] }> = {
  food: { label: "Food and drink", tomtom: ["restaurant", "cafe", "bakery"], osm: ['amenity~"^(restaurant|cafe|fast_food|ice_cream|bar|pub)$"', 'shop~"^(bakery|butcher|deli|confectionery|beverages|alcohol)$"'], google: ["restaurant", "cafe", "bakery", "meal_takeaway", "ice_cream_shop"] },
  auto: { label: "Auto", tomtom: ["auto repair", "car wash", "car dealer"], osm: ['shop~"^(car|car_repair|tyres|car_parts|motorcycle)$"', 'amenity~"^(car_wash|fuel)$"', 'craft~"^(car_repair)$"'], google: ["car_repair", "car_dealer", "car_wash", "gas_station"] },
  health: { label: "Health and beauty", tomtom: ["dentist", "doctor", "veterinarian", "hair salon", "beauty salon"], osm: ['amenity~"^(dentist|doctors|clinic|veterinary|pharmacy)$"', 'healthcare', 'shop~"^(hairdresser|beauty|massage|optician|cosmetics)$"'], google: ["dentist", "doctor", "veterinary_care", "beauty_salon", "hair_salon", "physiotherapist"] },
  trades: { label: "Home services and trades", tomtom: ["plumber", "electrician", "contractor", "landscaping", "hardware store"], osm: ['craft', 'shop~"^(hardware|doityourself|garden_centre|trade|appliance)$"'], google: ["plumber", "electrician", "roofing_contractor", "general_contractor", "landscaping"] },
  shops: { label: "Shops", tomtom: ["clothing store", "florist", "pet store", "furniture store", "sporting goods", "gift shop"], osm: ['shop~"^(clothes|shoes|sports|gift|florist|jewelry|furniture|pet|books|toys|convenience|variety_store|second_hand|farm)$"'], google: ["clothing_store", "florist", "pet_store", "furniture_store", "sporting_goods_store", "jewelry_store"] },
  offices: { label: "Professional offices", tomtom: ["insurance", "real estate", "accountant", "lawyer", "bank"], osm: ["office"], google: ["insurance_agency", "real_estate_agency", "accounting", "lawyer", "bank"] },
  fun: { label: "Fitness and fun", tomtom: ["gym", "dance studio", "bowling", "child care"], osm: ['leisure~"^(fitness_centre|sports_centre|bowling_alley|dance)$"', 'amenity~"^(cinema|childcare)$"'], google: ["gym", "bowling_alley", "child_care_agency", "amusement_center"] },
};

const key = (id: string) => `prospects/${createHash("sha256").update(id).digest("hex").slice(0, 32)}`;
const norm = (s: string) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
const miles = (lat: number, lng: number) => {
  const r = 3958.8, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat - HOME.lat), dLng = toRad(lng - HOME.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(HOME.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * r * Math.asin(Math.sqrt(a)) * 10) / 10;
};
const EMAIL_RE = /[A-Z0-9._%+]+@[A-Z0-9.]+\.[A-Z]{2,}/gi;
const goodEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e) && !/\.(png|jpe?g|gif|webp|svg)$/i.test(e)
  && !/(@example\.|@sentry|wixpress|@domain\.com|@email\.com|yourname|@godaddy|@squarespace|@wordpress|schema\.org|^(name|user|you|your)@)/i.test(e);

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
type Found = Omit<Prospect, "status" | "playerId" | "playerName" | "notes" | "playerNote" | "emails" | "addedAt" | "updatedAt" | "emailChecked">;

async function searchOsm(radiusMi: number, groups: string[]): Promise<Found[]> {
  const r = Math.round(radiusMi * 1609);
  const parts = groups.flatMap((g) => GROUPS[g]?.osm || []).flatMap((t) => [`node[${t}][name](around:${r},${HOME.lat},${HOME.lng});`, `way[${t}][name](around:${r},${HOME.lat},${HOME.lng});`]);
  const q = `[out:json][timeout:15];(${parts.join("")});out center tags 300;`;
  // The free directory runs on volunteer servers that are often busy, so try a few in turn.
  const servers = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
  const started = Date.now();
  let data: { elements: any[] } | null = null, last = "";
  for (const url of servers) {
    const left = 9000 - (Date.now() - started);
    if (left < 1500) break;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), Math.min(left, 6000));
    try {
      const res = await fetch(url, {
        method: "POST", signal: ctrl.signal,
        headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "mhsladybroncos.com sponsor finder" },
        body: "data=" + encodeURIComponent(q),
      });
      if (res.ok) { data = (await res.json()) as { elements: any[] }; break; }
      last = `answered ${res.status}`;
    } catch { last = "did not answer"; } finally { clearTimeout(timer); }
  }
  if (!data) throw new Error(`The business directory is busy right now (${last}). Try again in a minute.`);
  return data.elements.map((e) => {
    const t = e.tags || {};
    const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon;
    const addr = [[t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" "), t["addr:city"]].filter(Boolean).join(", ");
    const email = clean(t.email || t["contact:email"] || "", 120).toLowerCase();
    return {
      id: `osm:${e.type}/${e.id}`,
      name: clean(t.name, 100),
      category: clean((t.shop || t.amenity || t.craft || t.office || t.healthcare || t.leisure || "business").replace(/_/g, " "), 40),
      address: clean(addr, 160),
      phone: clean(t.phone || t["contact:phone"] || "", 30),
      website: cleanUrl(t.website || t["contact:website"] || ""),
      email: goodEmail(email) ? email : "",
      emailFrom: goodEmail(email) ? "listing" : "",
      chain: !!(t.brand || t["brand:wikidata"]),
      distance: lat && lng ? miles(lat, lng) : 0,
      source: "map",
    };
  });
}

async function searchGoogle(radiusMi: number, groups: string[], apiKey: string): Promise<Found[]> {
  const types = [...new Set(groups.flatMap((g) => GROUPS[g]?.google || []))];
  const out: Found[] = [];
  // Google allows up to 50 types and 20 results a call, so ask a few types at a time.
  for (let i = 0; i < types.length; i += 4) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "content-type": "application/json", "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.primaryTypeDisplayName,places.location",
      },
      body: JSON.stringify({ includedTypes: types.slice(i, i + 4), maxResultCount: 20, locationRestriction: { circle: { center: { latitude: HOME.lat, longitude: HOME.lng }, radius: Math.min(50000, radiusMi * 1609) } } }),
    });
    if (!res.ok) throw new Error(`Google search failed (${res.status}). Check the Google key.`);
    const data = (await res.json()) as { places?: any[] };
    for (const p of data.places || []) {
      out.push({
        id: `google:${p.id}`, name: clean(p.displayName?.text, 100), category: clean(p.primaryTypeDisplayName?.text || "business", 40),
        address: clean(p.formattedAddress, 160), phone: clean(p.nationalPhoneNumber, 30), website: cleanUrl(p.websiteUri || ""),
        email: "", emailFrom: "", chain: false, distance: p.location ? miles(p.location.latitude, p.location.longitude) : 0, source: "google",
      });
    }
  }
  return out;
}

// TomTom: a free developer key with no card, business listings with phone numbers and websites.
async function searchTomTom(radiusMi: number, groups: string[], apiKey: string): Promise<Found[]> {
  const words = [...new Set(groups.flatMap((g) => GROUPS[g]?.tomtom || []))];
  const radius = Math.min(50000, Math.round(radiusMi * 1609));
  const lists = await Promise.all(words.map(async (w) => {
    const url = `https://api.tomtom.com/search/2/categorySearch/${encodeURIComponent(w)}.json?key=${encodeURIComponent(apiKey)}&lat=${HOME.lat}&lon=${HOME.lng}&radius=${radius}&limit=100&countrySet=US`;
    const res = await fetch(url).catch(() => null);
    if (!res) return [];
    if (res.status === 403 || res.status === 401) throw new Error("TomTom did not accept the key. Check the TomTom key.");
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: any[] };
    return (data.results || []).map((r): Found => {
      const site = String(r.poi?.url || "").trim();
      return {
        id: `tomtom:${r.id}`,
        name: clean(r.poi?.name, 100),
        category: clean((r.poi?.categories || [w])[0], 40),
        address: clean(r.address?.freeformAddress, 160),
        phone: clean(r.poi?.phone, 30),
        website: site ? cleanUrl(/^https?:\/\//i.test(site) ? site : `https://${site}`) : "",
        email: "", emailFrom: "",
        chain: !!(r.poi?.brands || []).length,
        distance: r.position ? miles(r.position.lat, r.position.lon) : 0,
        source: "tomtom",
      };
    });
  }));
  return lists.flat();
}

// Which directory to use: Google or TomTom when their key is set, otherwise the free map directory.
export function searchSource() {
  if (Netlify.env.get("GOOGLE_PLACES_KEY")) return "Google";
  if (Netlify.env.get("TOMTOM_KEY")) return "TomTom";
  return "the free map directory";
}

// Search, then add only businesses we do not already have or already work with as sponsors.
export async function findBusinesses(body: any) {
  const radius = [3, 5, 10, 15, 25].includes(Number(body?.radius)) ? Number(body.radius) : 10;
  const groups = (Array.isArray(body?.groups) ? body.groups : Object.keys(GROUPS)).filter((g: string) => GROUPS[g]);
  if (!groups.length) return { error: "Pick at least one kind of business." };
  const localOnly = body?.localOnly !== false;
  const googleKey = Netlify.env.get("GOOGLE_PLACES_KEY") || "", tomtomKey = Netlify.env.get("TOMTOM_KEY") || "";
  const found = googleKey ? await searchGoogle(radius, groups, googleKey)
    : tomtomKey ? await searchTomTom(radius, groups, tomtomKey)
    : await searchOsm(radius, groups);
  const [have, sponsors] = await Promise.all([listProspects(), listSponsors()]);
  const seen = new Set([...have.map((p) => norm(p.name)), ...sponsors.map((s) => norm(s.business))]);
  const haveIds = new Set(have.map((p) => p.id));
  const now = new Date().toISOString();
  let added = 0, skippedChains = 0, skippedKnown = 0;
  for (const f of found) {
    if (!f.name) continue;
    if (localOnly && f.chain) { skippedChains++; continue; }
    if (haveIds.has(f.id) || seen.has(norm(f.name))) { skippedKnown++; continue; }
    seen.add(norm(f.name));
    await saveProspect({ ...f, emailChecked: !!f.email, status: "new", playerId: "", playerName: "", notes: "", playerNote: "", emails: [], addedAt: now, updatedAt: now });
    added++;
  }
  return { added, found: found.length, skippedChains, skippedKnown, source: searchSource() };
}

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
  if (p.email || !p.website) { p.emailChecked = true; await saveProspect(p); return p; }
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
  return p;
}

// ---------- coach and player updates ----------
export async function updateProspect(id: string, body: any) {
  const p = await getProspect(id);
  if (!p) return null;
  if (body.status && (STATUSES as readonly string[]).includes(body.status)) p.status = body.status;
  if (body.notes !== undefined) p.notes = clean(body.notes, 800);
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
  return p;
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
  return { ok: true, prospect: p };
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
      if (Object.keys(fill).length) { await saveProspect({ ...old, ...fill, updatedAt: now }); updated++; } else skipped++;
      continue;
    }
    if (have.has(norm(name))) { skipped++; continue; }
    await saveProspect({
      id: `manual:${Date.now()}${i}`, name, category: "business", address: clean(address, 160), phone: clean(phone, 30),
      website: site,
      email: email.toLowerCase(), emailFrom: email ? "coach" : "", emailChecked: !!email || !website, chain: false, distance: 0,
      status: "new", playerId: "", playerName: "", notes: "", playerNote: "", emails: [], addedAt: now, updatedAt: now, source: "coach",
    });
    have.add(norm(name));
    added++;
  }
  return { added, updated, skipped };
}

export async function deleteProspect(id: string) {
  await db().delete(key(id));
}

// What a player sees: only the businesses assigned to her, without the coach's notes.
export async function playerProspects(playerId: string) {
  return (await listProspects()).filter((p) => p.playerId === playerId).map((p) => ({
    id: p.id, name: p.name, category: p.category, address: p.address, phone: p.phone, website: p.website, status: p.status, playerNote: p.playerNote,
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
