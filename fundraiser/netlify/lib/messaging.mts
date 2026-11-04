import { createHash, createHmac, randomBytes } from "node:crypto";
import { confirmedTotals, db, displayName, getSettings, listGifts, listPlayers, listSponsors, Player, saveSponsor, Settings, Sponsor, SPONSOR_LEVELS } from "./core.mts";

// ================= contacts =================

export interface Contact { id: string; name: string; email: string; phone: string }

export async function getContacts(playerId: string): Promise<Contact[]> {
  return ((await db().get(`contacts/${playerId}`, { type: "json" })) as Contact[]) || [];
}

export async function saveContacts(playerId: string, list: Contact[]) {
  await db().setJSON(`contacts/${playerId}`, list);
}

const EMAIL_RE = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[a-z]{2,}$/i;

export function normalizeEmail(v: unknown) {
  const e = String(v ?? "").trim().toLowerCase();
  return EMAIL_RE.test(e) && e.length <= 120 ? e : "";
}

export function normalizePhone(v: unknown) {
  const d = String(v ?? "").replace(/\D/g, "");
  if (d.length === 10 && /^[2-9]/.test(d)) return "+1" + d;
  if (d.length === 11 && d.startsWith("1") && /^[2-9]/.test(d.slice(1))) return "+" + d;
  return "";
}

// Cleans what the player typed. Returns good contacts plus a list of rows we could not use.
export function cleanContacts(input: unknown) {
  const rows = Array.isArray(input) ? input.slice(0, 400) : [];
  const out: Contact[] = [];
  const problems: string[] = [];
  const seen = new Set<string>();
  rows.forEach((r: any, i: number) => {
    const name = String(r?.name ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
    const rawEmail = String(r?.email ?? "").trim();
    const rawPhone = String(r?.phone ?? "").trim();
    if (!name && !rawEmail && !rawPhone) return;
    const email = normalizeEmail(rawEmail);
    const phone = normalizePhone(rawPhone);
    const label = name || rawEmail || rawPhone || `Row ${i + 1}`;
    if (!name) return problems.push(`${label}: add a name`);
    if (rawEmail && !email) return problems.push(`${label}: that email does not look right`);
    if (rawPhone && !phone) return problems.push(`${label}: use a 10 digit US phone number`);
    if (!email && !phone) return problems.push(`${label}: add an email or a phone number`);
    const key = email || phone;
    if (seen.has(key) || (email && phone && seen.has(phone))) return;
    if (email) seen.add(email);
    if (phone) seen.add(phone);
    out.push({ id: String(r?.id || "").match(/^[a-f0-9]{12}$/) ? r.id : randomBytes(6).toString("hex"), name, email, phone });
  });
  return { contacts: out, problems };
}

// ================= waves (the message series) =================

export interface Wave {
  id: string;
  name: string;
  enabled: boolean;
  approved: boolean;
  // "after": days after the coach approves a player. "beforeEnd": days before the end date (negative means after).
  // "date": a set calendar day (YYYY-MM-DD), the same for every player.
  trigger: { type: "after" | "beforeEnd" | "date"; days: number; date?: string };
  subject: string;
  email: string;
  sms: string;
  donateButton: boolean;
}

// The season's messages: a kickoff when each player's list is approved, then about two emails a week on set
// dates through the end of the fundraiser, a last call and a thank you. Only a few carry a text for players to send.
export const DEFAULT_WAVES: Wave[] = [
  {
    id: "kickoff", name: "Kickoff", enabled: true, approved: false, donateButton: true,
    trigger: { type: "after", days: 0 },
    subject: "{player} needs your help this season",
    email: "Hi {first},\n\nIt's {player}! This season I'm playing for the {school} {team}, and our team is raising {goal} to cover tournaments, travel, uniforms and gear.\n\nWould you support me with a gift of any size? Every dollar goes straight to our school through the official MySchoolBucks portal.\n\nThank you for being in my corner!\n{player}",
    sms: "Hi {first}, it's {player}! The {school} {team} are raising {goal} for our season. Would you support me? {link}",
  },
  {
    id: "meet-team", name: "Meet the team", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-11-09" },
    subject: "Meet the 2026 to 2027 Lady Broncos",
    email: "Hi {first},\n\nI wanted you to meet my team! This year's {school} {team} are Bronco Built: hard working, close and ready to Fear the Herd.\n\nOur season is just getting started, and your support helps cover tournaments, travel, uniforms and gear.\n\nThank you for cheering me on!\n{player}",
    sms: "",
  },
  {
    id: "why-it-matters", name: "Why it matters", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-11-12" },
    subject: "Where your gift goes",
    email: "Hi {first},\n\nA lot of people ask where the money goes. Every gift helps pay for tournament entry fees, bus travel, uniforms, shoes and practice gear, plus our Saturday Bronco Brainstorm life skills sessions.\n\nWe are trying to raise {goal} this season, and we have raised {raised} so far. A gift of any size helps me and my teammates.\n\nThank you!\n{player}",
    sms: "",
  },
  {
    id: "home-opener", name: "First home game", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-11-16" },
    subject: "Come see our first home game!",
    email: "Hi {first},\n\nOur first home game is Tuesday, November 17 against Tocoi Creek at the Middleburg High School gym. I would love to see you in the stands!\n\nIf you cannot make it, you can still be part of the season by supporting me below.\n\nGo Broncos!\n{player}",
    sms: "",
  },
  {
    id: "season-update", name: "Season update", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-11-19" },
    subject: "Our first season update",
    email: "Hi {first},\n\nQuick update from the gym: practices are tough, the team is working hard and we are getting better every day.\n\nSo far our team has raised {raised} toward our {goal} goal. Thank you to everyone who has already given. If you have not yet, now is a great time to jump in.\n\n{player}",
    sms: "",
  },
  {
    id: "thankful", name: "Thankful for you", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-11-23" },
    subject: "Thankful for you this week",
    email: "Hi {first},\n\nWith Thanksgiving this week, I wanted to say thank you for being someone I can count on. It means a lot to have you in my corner this season.\n\nHappy Thanksgiving!\n{player}",
    sms: "",
  },
  {
    id: "giving-tuesday", name: "Giving Tuesday", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-12-01" },
    subject: "Today is Giving Tuesday",
    email: "Hi {first},\n\nToday is Giving Tuesday, a day when people around the world give to causes they care about. Would you make the Lady Broncos one of yours?\n\nWe have raised {raised} of our {goal} goal. A gift today of $25, $50 or any amount helps us close the gap.\n\nThank you so much!\n{player}",
    sms: "Hi {first}, it's {player}! Today is Giving Tuesday. Would you support the Lady Broncos? We have raised {raised} of our {goal} goal. {link}",
  },
  {
    id: "team-store", name: "Holiday gear", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-12-03" },
    subject: "Holiday gifts that help our team",
    email: "Hi {first},\n\nLooking for holiday gifts? Our Team Store has Lady Broncos tees, hoodies, warmups and hats, and 30% of every purchase goes back to the team. You can find it at mhsladybroncos.com/store.\n\nOr you can give directly with the button below. Either way, thank you for supporting me!\n\n{player}",
    sms: "",
  },
  {
    id: "halfway", name: "Halfway update", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-12-07" },
    subject: "We are {percent} of the way there!",
    email: "Hi {first},\n\nWe are {percent} of the way to our {goal} goal with {days} days to go. Thank you to everyone who has helped get us here!\n\nIf you have not had a chance yet, a gift of any size helps me and my teammates finish the season strong.\n\nGo Broncos!\n{player}",
    sms: "Hi {first}, {player} here! We are {percent} of the way to our {goal} goal. Can you help us keep going? {link}",
  },
  {
    id: "day-in-life", name: "A day as a Lady Bronco", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-12-10" },
    subject: "A day in the life of a Lady Bronco",
    email: "Hi {first},\n\nBeing a Lady Bronco means early mornings, hard practices, film study, schoolwork and Saturday sessions where we learn life skills like budgeting and leadership. My coaches expect a lot, and they give a lot back.\n\nYour support makes all of it possible. Thank you for being part of my season!\n\n{player}",
    sms: "",
  },
  {
    id: "clay-game", name: "County rivalry night", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-12-14" },
    subject: "Tonight we play Clay",
    email: "Hi {first},\n\nTonight we take on Clay in a big county rivalry game at home. Come pack the gym and bring your loudest cheer!\n\nIf you cannot be there, you can still support me with the button below.\n\nFear the Herd!\n{player}",
    sms: "",
  },
  {
    id: "gift-idea", name: "Give in someone's name", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-12-17" },
    subject: "A holiday gift idea",
    email: "Hi {first},\n\nStill looking for a gift for the person who has everything? You can give to the Lady Broncos in their name. It is a gift that supports young women working hard on and off the court.\n\nThank you for thinking of us this season!\n{player}",
    sms: "",
  },
  {
    id: "happy-holidays", name: "Happy holidays", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-12-22" },
    subject: "Happy holidays from {player}",
    email: "Hi {first},\n\nHappy holidays! I am so thankful for everyone who has supported me and my team this year. Together we have raised {raised} so far.\n\nI hope you have a wonderful break with your family.\n\n{player}",
    sms: "",
  },
  {
    id: "year-end", name: "Year end gifts", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2026-12-29" },
    subject: "One more chance to give in 2026",
    email: "Hi {first},\n\nIf you would like to make a gift before the year ends, there is still time. Gifts go straight to Middleburg High School through the official MySchoolBucks portal.\n\nWe have raised {raised} of our {goal} goal. Thank you for helping us finish 2026 strong!\n\n{player}",
    sms: "",
  },
  {
    id: "new-year", name: "New year, big games", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2027-01-04" },
    subject: "A big week for the Lady Broncos",
    email: "Hi {first},\n\nHappy New Year! We are back in the gym, and this week is a big one: on Thursday, January 7 we play county rival Fleming Island.\n\nThe second half of our season is where it all comes together. Thank you for sticking with me!\n\n{player}",
    sms: "",
  },
  {
    id: "fleming-game", name: "Rivalry night", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2027-01-07" },
    subject: "Rivalry night at Fleming Island",
    email: "Hi {first},\n\nTonight we play Fleming Island, one of our biggest county rivals. If you are nearby, come cheer us on!\n\nEvery gift this week helps us close out the season strong. Thank you for being in my corner.\n\nFear the Herd!\n{player}",
    sms: "",
  },
  {
    id: "down-stretch", name: "Down the stretch", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2027-01-11" },
    subject: "{days} days left in our fundraiser",
    email: "Hi {first},\n\nWe are heading down the stretch with {days} days left in our fundraiser. We have raised {raised} of our {goal} goal.\n\nIf you have been meaning to give, this is a great time. Thank you!\n\n{player}",
    sms: "",
  },
  {
    id: "finish-strong", name: "Help us finish strong", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2027-01-14" },
    subject: "Help us finish strong",
    email: "Hi {first},\n\nWe are so close. A gift of $25 or $50 from a few more supporters could get us to our {goal} goal.\n\nWould you help me and my teammates finish strong?\n\nThank you!\n{player}",
    sms: "Hi {first}, it's {player}! We are so close to our {goal} goal. Would you help us finish strong? {link}",
  },
  {
    id: "senior-night", name: "Senior Night", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2027-01-18" },
    subject: "Senior Night is this Wednesday",
    email: "Hi {first},\n\nThis Wednesday, January 20 is Senior Night at the Middleburg High School gym, when we honor our seniors for everything they have given this program. I would love to see you there!\n\nThank you for supporting our team all season.\n\n{player}",
    sms: "",
  },
  {
    id: "thank-seniors", name: "Thank you seniors", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2027-01-21" },
    subject: "Thank you to our seniors",
    email: "Hi {first},\n\nLast night we celebrated our seniors, and it reminded me how much this team means to all of us. Your support has been a big part of our season.\n\nWe have raised {raised} of our {goal} goal. If you would like to help us finish, the button is below.\n\n{player}",
    sms: "",
  },
  {
    id: "one-week", name: "One week left", enabled: true, approved: false, donateButton: true,
    trigger: { type: "date", days: 0, date: "2027-01-25" },
    subject: "One week left to support {player}",
    email: "Hi {first},\n\nOur fundraiser ends on {endDate}, just one week from now. We have raised {raised} of our {goal} goal.\n\nIf you have been meaning to give, please do it this week. Thank you so much!\n\n{player}",
    sms: "Hi {first}, it's {player}! One week left in our fundraiser. Every gift gets us closer to {goal}. {link}",
  },
  {
    id: "final", name: "Final days", enabled: true, approved: false, donateButton: true,
    trigger: { type: "beforeEnd", days: 3 },
    subject: "Only {days} days left to support {player}",
    email: "Hi {first},\n\nOur fundraiser ends on {endDate}, and this is my last reminder. We have raised {raised} of our {goal} goal.\n\nIf you have been meaning to give, now is the perfect time. Thank you so much for supporting me!\n\n{player}",
    sms: "Hi {first}, last call from {player}! Our fundraiser ends {endDate}. Every gift gets us closer to {goal}. {link}",
  },
  {
    id: "thanks", name: "Thank you", enabled: true, approved: false, donateButton: false,
    trigger: { type: "beforeEnd", days: -1 },
    subject: "Thank you from {player}",
    email: "Hi {first},\n\nOur fundraiser is complete and I wanted to say thank you. Together we raised {raised} for the {school} {team}!\n\nWhether you gave, shared or cheered us on, you helped make this season possible. I'm so grateful.\n\nGo Broncos!\n{player}",
    sms: "Hi {first}, it's {player}. Thank you for supporting the {team}! Together we raised {raised}. We are so grateful!",
  },
];

// Saved message lists from before the dated schedule get the new messages added once. The two old
// "days after approval" reminders are turned off, since the dated emails cover those weeks.
const WAVES_VERSION = 2;
async function upgradeWaves(saved: Wave[]) {
  const store = db();
  const meta = ((await store.get("waves-meta", { type: "json" })) as { version: number } | null) || { version: 1 };
  if (meta.version >= WAVES_VERSION) return saved;
  const have = new Set(saved.map((w) => w.id));
  const out = saved.map((w) => (w.id === "checkin" ? { ...w, enabled: false } : w));
  // The old "Big push" used the id halfway; keep it, turned off, under a new id so the dated one can be added.
  const old = out.find((w) => w.id === "halfway" && w.trigger.type === "after");
  if (old) { old.id = "bigpush"; old.enabled = false; have.delete("halfway"); }
  const extra = DEFAULT_WAVES.filter((w) => !have.has(w.id));
  const finalAt = out.findIndex((w) => w.id === "final");
  if (finalAt >= 0) out.splice(finalAt, 0, ...extra.filter((w) => !["final", "thanks"].includes(w.id)));
  else out.push(...extra);
  await saveWaves(out);
  await store.setJSON("waves-meta", { version: WAVES_VERSION });
  return out;
}

export async function getWaves(): Promise<Wave[]> {
  const saved = (await db().get("waves", { type: "json" })) as Wave[] | null;
  return saved && saved.length ? upgradeWaves(saved) : DEFAULT_WAVES;
}

export async function saveWaves(w: Wave[]) {
  await db().setJSON("waves", w);
}

// Settings with confirmed gifts added to the raised total, so {raised} and {percent} match the site.
export async function liveSettings(): Promise<Settings> {
  const [s, gifts] = await Promise.all([getSettings(), listGifts()]);
  return { ...s, raised: (s.raised || 0) + confirmedTotals(gifts).all };
}

export function waveDueAt(w: Wave, p: Player, s: Settings): number {
  // Set dates go out from 9 AM Eastern that morning.
  if (w.trigger.type === "date") return Date.parse(`${w.trigger.date}T09:00:00-05:00`);
  if (w.trigger.type === "after") {
    const base = p.outreach?.status === "approved" ? Date.parse(p.outreach.at) : NaN;
    return base + w.trigger.days * 86400000;
  }
  // Morning of the target day, Eastern time.
  const end = Date.parse(`${s.endDate}T09:00:00-05:00`);
  return end - w.trigger.days * 86400000;
}

// The newest approved message that is due for this player. Each supporter only gets the newest one, never a backlog.
export function currentWave(waves: Wave[], p: Player, s: Settings): Wave | null {
  const endPlus = Date.parse(`${s.endDate}T23:59:59-05:00`);
  const due = waves
    .filter((w) => w.enabled && w.approved)
    .map((w) => ({ w, at: waveDueAt(w, p, s) }))
    .filter((x) => Number.isFinite(x.at) && x.at <= Date.now())
    // "After approval" and dated reminders stop once the fundraiser is over.
    .filter((x) => !(x.w.trigger.type !== "beforeEnd" && Date.now() > endPlus))
    .sort((a, b) => a.at - b.at);
  return due.length ? due[due.length - 1].w : null;
}

// ================= rendering =================

export function siteOrigin(fallback?: string) {
  return (Netlify.env.get("URL") || fallback || "").replace(/\/$/, "");
}

function money(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function mergeVars(s: Settings, p: Player, c: Pick<Contact, "name">, origin: string) {
  const daysLeft = Math.max(0, Math.ceil((Date.parse(`${s.endDate}T23:59:59-05:00`) - Date.now()) / 86400000));
  const pct = s.goal > 0 ? Math.min(100, Math.round((s.raised / s.goal) * 100)) : 0;
  return {
    first: (c.name || "").split(" ")[0] || "friend",
    player: p.first,
    playerName: displayName(p),
    team: s.teamName,
    school: s.schoolName,
    goal: money(s.goal),
    raised: money(s.raised),
    percent: pct + "%",
    days: String(daysLeft),
    endDate: new Date(`${s.endDate}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" }),
    link: `${origin}/donate/${p.slug}`,
  } as Record<string, string>;
}

export function fill(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

function escHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// The player sends this from her own phone, so no opt out line is needed.
export function renderSms(w: Wave, vars: Record<string, string>) {
  return fill(w.sms, vars).replace(/\s+/g, " ").trim();
}

export function renderEmail(w: Wave, s: Settings, p: Player, vars: Record<string, string>, origin: string, unsubUrl: string) {
  const subject = fill(w.subject, vars);
  const text = fill(w.email, vars);
  const logo = s.logoKey ? `${origin}/img/${encodeURIComponent(s.logoKey)}` : `${origin}/brand/logo.png`;
  const photo = p.photoKey ? `${origin}/img/${encodeURIComponent(p.photoKey)}` : "";
  const paras = text.split(/\n{2,}/).map((para) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2a1418">${escHtml(para).replace(/\n/g, "<br>")}</p>`).join("");
  const quote = p.message
    ? `<div style="margin:0 0 20px;padding:14px 18px;background:#fdf1f3;border-left:4px solid #c8102e;border-radius:10px;font-size:15px;line-height:1.55;color:#2a1418;font-style:italic">&ldquo;${escHtml(p.message)}&rdquo;</div>`
    : "";
  const button = w.donateButton
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px auto 18px"><tr><td style="border-radius:999px;background:#c8102e"><a href="${vars.link}?donate=1" style="display:inline-block;padding:16px 34px;font-size:17px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">Donate to support ${escHtml(p.first)}</a></td></tr></table>
       <p style="margin:0 0 8px;text-align:center;font-size:13px;color:#6f5a5e">Or visit <a href="${vars.link}" style="color:#c8102e">${escHtml(vars.link.replace(/^https?:\/\//, ""))}</a></p>`
    : "";
  const address = s.mailingAddress ? `<br>${escHtml(s.mailingAddress)}` : "";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#fbe9ec">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbe9ec;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:22px;overflow:hidden;font-family:Helvetica,Arial,sans-serif">
<tr><td style="background:linear-gradient(135deg,#e0213f,#8e0b20);background-color:#c8102e;padding:22px 26px" align="left">
<img src="${logo}" width="44" height="44" alt="" style="vertical-align:middle;background:#ffffff;border-radius:12px;padding:4px">
<span style="vertical-align:middle;margin-left:10px;font-size:18px;font-weight:700;color:#ffffff">${escHtml(s.schoolName)} ${escHtml(s.teamName)}</span></td></tr>
${photo ? `<tr><td align="center" style="padding:26px 26px 0"><img src="${photo}" width="220" alt="${escHtml(p.first)}" style="width:220px;max-width:100%;border-radius:18px;display:block"></td></tr>` : ""}
<tr><td style="padding:24px 28px 8px">${paras}${quote}${button}</td></tr>
<tr><td style="padding:18px 28px 26px;border-top:1px solid #f3dde1;font-size:12px;line-height:1.6;color:#8a7478" align="center">
Every gift goes straight to ${escHtml(s.schoolName)} through MySchoolBucks.<br>
You are getting this because ${escHtml(displayName(p))} added you as a supporter.${address}<br>
<a href="${unsubUrl}" style="color:#8a7478">Unsubscribe</a></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, text: `${text}\n\n${w.donateButton ? `Support ${p.first}: ${vars.link}\n\n` : ""}Unsubscribe: ${unsubUrl}` };
}

// ================= opt outs =================

export function addrHash(addr: string) {
  return createHash("sha256").update(addr.toLowerCase()).digest("hex").slice(0, 40);
}

async function unsubSecret() {
  const store = db();
  let v = await store.get("meta/unsub-secret", { type: "text" });
  if (!v) {
    v = randomBytes(32).toString("hex");
    await store.set("meta/unsub-secret", v);
  }
  return v as string;
}

export async function unsubUrl(origin: string, email: string) {
  const h = addrHash(email);
  const sig = createHmac("sha256", await unsubSecret()).update(h).digest("hex").slice(0, 24);
  return `${origin}/u/${h}.${sig}`;
}

export async function verifyUnsub(token: string) {
  const [h, sig] = token.split(".");
  if (!h || !sig) return "";
  const expect = createHmac("sha256", await unsubSecret()).update(h).digest("hex").slice(0, 24);
  return expect === sig ? h : "";
}

export async function isOptedOut(channel: "email" | "sms", addr: string) {
  return !!(await db().get(`optout/${channel}/${addrHash(addr)}`, { type: "text" }));
}

// ================= providers =================

// Emails go out through Resend. Texts are sent by each player from her own phone (see textsFor).
export function providerStatus() {
  return { email: !!(Netlify.env.get("RESEND_API_KEY") && Netlify.env.get("EMAIL_FROM")) };
}

export async function sendEmail(to: string, msg: { subject: string; html: string; text: string }, unsub: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${Netlify.env.get("RESEND_API_KEY")}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: Netlify.env.get("EMAIL_FROM"),
      to: [to],
      reply_to: Netlify.env.get("EMAIL_REPLY_TO") || undefined,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  if (!res.ok) throw new Error(`Email failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

// ================= send log =================

export type SendState = "sent" | "failed" | "optout" | "dup";
export type SendLog = Record<string, Record<string, { email?: SendState; sms?: SendState; at: string; error?: string }>>;

export async function getLog(playerId: string): Promise<SendLog> {
  return ((await db().get(`sendlog/${playerId}`, { type: "json" })) as SendLog) || {};
}

// ================= the sender =================

// Only send during friendly hours in Florida.
export function inSendWindow(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(now));
  return hour >= 9 && hour < 20;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runSend(origin: string, budgetMs = 13 * 60 * 1000) {
  const started = Date.now();
  const store = db();
  const lock = (await store.get("lock/send", { type: "json" })) as { at: number; id: string } | null;
  if (lock && Date.now() - lock.at < 14 * 60 * 1000) return { skipped: "Another send is already running." };
  const lockId = randomBytes(6).toString("hex");
  await store.setJSON("lock/send", { at: Date.now(), id: lockId });

  const summary = { sent: 0, failed: 0, waiting: 0 };
  try {
    const settings = await liveSettings();
    if (settings.sendingPaused) return { skipped: "Sending is paused." };
    if (!inSendWindow()) return { skipped: "Outside sending hours (9 AM to 8 PM Eastern)." };
    const providers = providerStatus();
    const waves = (await getWaves()).filter((w) => w.enabled && w.approved);
    const players = (await listPlayers()).filter(
      (p) => p.active && p.consent?.accepted && p.contactsDone && p.outreach?.status === "approved",
    );

    for (const p of players) {
      if (Date.now() - started > budgetMs) break;
      const wave = currentWave(waves, p, settings);
      if (!wave) continue;
      const contacts = await getContacts(p.id);
      const log = await getLog(p.id);
      let changed = false;

      for (const c of contacts) {
        if (Date.now() - started > budgetMs) break;
        const entry = (log[c.id] ||= {})[wave.id] ||= { at: "" };
        const vars = mergeVars(settings, p, c, origin);

        for (const channel of ["email"] as const) {
          const addr = c.email;
          if (!addr || entry[channel]) continue;
          if (!providers.email) { summary.waiting++; continue; }
          if (await isOptedOut(channel, addr)) { entry[channel] = "optout"; changed = true; continue; }
          // One message per wave per address, even if two players list the same grandma.
          const dupKey = `sent/${wave.id}/${channel}/${addrHash(addr)}`;
          if (await store.get(dupKey, { type: "text" })) { entry[channel] = "dup"; changed = true; continue; }
          await store.set(dupKey, p.id);
          entry.at = new Date().toISOString();
          changed = true;
          try {
            const u = await unsubUrl(origin, addr);
            await sendEmail(addr, renderEmail(wave, settings, p, vars, origin, u), u);
            await sleep(550);
            entry[channel] = "sent";
            summary.sent++;
          } catch (err: any) {
            entry[channel] = "failed";
            entry.error = String(err.message || err).slice(0, 200);
            summary.failed++;
          }
        }
      }
      if (changed) await store.setJSON(`sendlog/${p.id}`, log);
    }
    if (providers.email && Date.now() - started < budgetMs) await sponsorDrip(settings, origin, summary);
    return summary;
  } finally {
    const cur = (await store.get("lock/send", { type: "json" })) as { id: string } | null;
    if (cur?.id === lockId) await store.delete("lock/send");
  }
}

// Internal key so only our own functions can start a send.
export async function sendKey() {
  const store = db();
  let v = await store.get("meta/send-key", { type: "text" });
  if (!v) {
    v = randomBytes(24).toString("hex");
    await store.set("meta/send-key", v);
  }
  return v as string;
}

export async function kickSender(origin: string) {
  try {
    await fetch(`${origin}/.netlify/functions/send-background`, {
      method: "POST",
      headers: { "x-send-key": await sendKey() },
    });
  } catch (err) {
    console.error("Could not start sender", err);
  }
}

// ================= sponsor follow up =================
// Businesses that fill out the sponsor form asked to hear from us, so they get a short series of emails.
// Only businesses that sign up after the coach turns this on get it, and each email goes once.
export const SPONSOR_DRIP = [
  { id: "thanks", name: "Thank you for signing up", when: "Right after a business fills out the sponsor form", days: 0, statuses: ["interested", "committed", "paid"],
    subject: "Thank you for supporting the Lady Broncos",
    body: "Hi {contact},\n\nThank you for your interest in sponsoring Middleburg Lady Broncos Basketball as a {level}! Our coaching staff will reach out within a few days to confirm the details.\n\nIn the meantime, here is our sponsor packet with every level and benefit: {packet}\n\nWe are so grateful to businesses like {business} that help our girls compete.\n\nGo Broncos!\nCoach Tenise Haynes" },
  { id: "next", name: "Next steps", when: "3 days after sign up, if not committed yet", days: 3, statuses: ["interested"],
    subject: "Next steps for your Lady Broncos sponsorship",
    body: "Hi {contact},\n\nJust following up on your {level} sponsorship for {business}. Here is how it works:\n\n1. We confirm your level and the details for your banner, shout outs and social posts.\n2. Payment goes to Middleburg High School, and we send you the details.\n3. We start delivering your benefits right away and send you a report of everything we did.\n\nIf you have not sent your logo yet, just reply to this email with it attached. Any questions, reply here and I will get right back to you.\n\nCoach Tenise Haynes" },
  { id: "reminder", name: "Friendly reminder", when: "10 days after sign up, if not committed yet", days: 10, statuses: ["interested"],
    subject: "Still interested in sponsoring the Lady Broncos?",
    body: "Hi {contact},\n\nI wanted to check in one more time about sponsoring the Lady Broncos. Our season is in full swing, and we would love to have {business} on our sponsor wall and in our game day announcements.\n\nYou can see every level here: {link}\n\nIf now is not the right time, no problem at all. Just reply and let me know.\n\nCoach Tenise Haynes" },
  { id: "welcome", name: "Welcome to the herd", when: "When you mark a sponsor Paid", days: 0, statuses: ["paid"],
    subject: "Welcome to the herd, {business}!",
    body: "Hi {contact},\n\nThank you! Your {level} sponsorship is official, and the whole team is grateful.\n\nWe will start delivering your benefits right away and keep a record of everything we do for {business}, so you can see exactly what your sponsorship made possible.\n\nWe hope to see you at a game soon. Fear the Herd!\n\nCoach Tenise Haynes" },
] as const;

export async function getSponsorDrip() {
  return ((await db().get("sponsor-drip", { type: "json" })) as { on: boolean; onAt: string } | null) || { on: false, onAt: "" };
}
export async function setSponsorDrip(on: boolean) {
  const cur = await getSponsorDrip();
  const rec = { on, onAt: on ? cur.onAt || new Date().toISOString() : "" };
  await db().setJSON("sponsor-drip", rec);
  return rec;
}

export function renderSponsorEmail(step: (typeof SPONSOR_DRIP)[number], sp: Sponsor, s: Settings, origin: string, unsub: string) {
  const vars: Record<string, string> = {
    contact: (sp.contact || "").split(/\s+/)[0] || "there", business: sp.business, level: SPONSOR_LEVELS[sp.level]?.name || "sponsor",
    packet: `${origin}/sponsor-packet.pdf`, link: `${origin}/sponsor`,
  };
  const fillIn = (t: string) => t.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  const subject = fillIn(step.subject), text = fillIn(step.body);
  const logo = s.logoKey ? `${origin}/img/${encodeURIComponent(s.logoKey)}` : `${origin}/brand/logo.png`;
  const paras = text.split(/\n{2,}/).map((para) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2a1418">${escHtml(para).replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#c8102e">$1</a>')}</p>`).join("");
  const address = s.mailingAddress ? `<br>${escHtml(s.mailingAddress)}` : "";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#fbe9ec">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbe9ec;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:22px;overflow:hidden;font-family:Helvetica,Arial,sans-serif">
<tr><td style="background-color:#c8102e;padding:22px 26px"><img src="${logo}" width="44" height="44" alt="" style="vertical-align:middle;background:#ffffff;border-radius:12px;padding:4px">
<span style="vertical-align:middle;margin-left:10px;font-size:18px;font-weight:700;color:#ffffff">${escHtml(s.schoolName)} ${escHtml(s.teamName)}</span></td></tr>
<tr><td style="padding:24px 28px 8px">${paras}</td></tr>
<tr><td style="padding:18px 28px 26px;border-top:1px solid #f3dde1;font-size:12px;line-height:1.6;color:#8a7478" align="center">
You are getting this because ${escHtml(sp.business)} filled out our sponsor form.${address}<br><a href="${unsub}" style="color:#8a7478">Unsubscribe</a></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, text: `${text}\n\nUnsubscribe: ${unsub}` };
}

// A coach email to a local business on the prospect list, sent from the team address with replies to the coach.
export function renderProspectEmail(subject: string, body: string, business: string, s: Settings, origin: string, unsub: string) {
  const logo = s.logoKey ? `${origin}/img/${encodeURIComponent(s.logoKey)}` : `${origin}/brand/logo.png`;
  const paras = body.split(/\n{2,}/).map((para) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2a1418">${escHtml(para).replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#c8102e">$1</a>')}</p>`).join("");
  const address = s.mailingAddress ? `<br>${escHtml(s.mailingAddress)}` : "";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#fbe9ec">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbe9ec;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:22px;overflow:hidden;font-family:Helvetica,Arial,sans-serif">
<tr><td style="background-color:#c8102e;padding:22px 26px"><img src="${logo}" width="44" height="44" alt="" style="vertical-align:middle;background:#ffffff;border-radius:12px;padding:4px">
<span style="vertical-align:middle;margin-left:10px;font-size:18px;font-weight:700;color:#ffffff">${escHtml(s.schoolName)} ${escHtml(s.teamName)}</span></td></tr>
<tr><td style="padding:24px 28px 8px">${paras}</td></tr>
<tr><td style="padding:18px 28px 26px;border-top:1px solid #f3dde1;font-size:12px;line-height:1.6;color:#8a7478" align="center">
You are getting this because ${escHtml(business)} is a local business in our community. Just reply to reach Coach Haynes.${address}<br><a href="${unsub}" style="color:#8a7478">Unsubscribe</a></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, text: `${body}\n\nUnsubscribe: ${unsub}` };
}

async function sponsorDrip(settings: Settings, origin: string, summary: { sent: number; failed: number }) {
  const drip = await getSponsorDrip();
  if (!drip.on) return;
  const since = Date.parse(drip.onAt);
  for (const sp of await listSponsors()) {
    if (!sp.email || Date.parse(sp.createdAt) < since) continue;
    const sent = ((sp as any).drip ||= {}) as Record<string, string>;
    let changed = false;
    for (const step of SPONSOR_DRIP) {
      if (sent[step.id] || !(step.statuses as readonly string[]).includes(sp.status)) continue;
      if (Date.now() < Date.parse(sp.createdAt) + step.days * 86400000) continue;
      // A business that has already paid skips the sign up reminders.
      if (step.id === "next" || step.id === "reminder") { if (sp.status !== "interested") continue; }
      changed = true;
      if (await isOptedOut("email", sp.email)) { sent[step.id] = "optout"; continue; }
      try {
        const u = await unsubUrl(origin, sp.email);
        await sendEmail(sp.email, renderSponsorEmail(step, sp, settings, origin, u), u);
        sent[step.id] = new Date().toISOString();
        summary.sent++;
        await sleep(550);
      } catch (err) {
        sent[step.id] = "failed";
        summary.failed++;
      }
      // One email per business per run, so a business never gets two at once.
      break;
    }
    if (changed) await saveSponsor(sp);
  }
}
