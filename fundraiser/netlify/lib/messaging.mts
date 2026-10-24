import { createHash, createHmac, randomBytes } from "node:crypto";
import { confirmedTotals, db, displayName, getSettings, listGifts, listPlayers, Player, Settings } from "./core.mts";

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
  trigger: { type: "after" | "beforeEnd"; days: number };
  subject: string;
  email: string;
  sms: string;
  donateButton: boolean;
}

export const DEFAULT_WAVES: Wave[] = [
  {
    id: "kickoff", name: "Kickoff", enabled: true, approved: false, donateButton: true,
    trigger: { type: "after", days: 0 },
    subject: "{player} needs your help this season",
    email: "Hi {first},\n\nIt's {player}! This season I'm playing for the {school} {team}, and our team is raising {goal} to cover tournaments, travel, uniforms and gear.\n\nWould you support me with a gift of any size? Every dollar goes straight to our school through the official MySchoolBucks portal.\n\nThank you for being in my corner!\n{player}",
    sms: "Hi {first}, it's {player}! The {school} {team} are raising {goal} for our season. Would you support me? {link}",
  },
  {
    id: "checkin", name: "One week check in", enabled: true, approved: false, donateButton: true,
    trigger: { type: "after", days: 7 },
    subject: "A quick update from {player}",
    email: "Hi {first},\n\nThank you for being part of my season! Our team has raised {raised} so far toward our {goal} goal.\n\nIf you have not had a chance yet, you can support me with the button below. Every gift helps.\n\nGo Broncos!\n{player}",
    sms: "Hi {first}, {player} here with a quick update! Our team has raised {raised} of our {goal} goal. Can you help? {link}",
  },
  {
    id: "halfway", name: "Big push", enabled: true, approved: false, donateButton: true,
    trigger: { type: "after", days: 21 },
    subject: "We are {percent} of the way there!",
    email: "Hi {first},\n\nGreat news! The {team} are {percent} of the way to our {goal} goal, with {days} days to go.\n\nA gift of $25 or $50 makes a real difference for me and my teammates. Would you help us close the gap?\n\nThank you!\n{player}",
    sms: "Hi {first}, it's {player}! We are {percent} of the way to our {goal} goal with {days} days left. Would you help us finish strong? {link}",
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

export async function getWaves(): Promise<Wave[]> {
  const saved = (await db().get("waves", { type: "json" })) as Wave[] | null;
  return saved && saved.length ? saved : DEFAULT_WAVES;
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
    // "After approval" reminders stop once the fundraiser is over.
    .filter((x) => !(x.w.trigger.type === "after" && Date.now() > endPlus))
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
    link: `${origin}/p/${p.slug}`,
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
