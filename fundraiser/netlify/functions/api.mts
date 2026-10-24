import type { Config, Context } from "@netlify/functions";
import { randomBytes } from "node:crypto";
import {
  allStats, clean, clearAttempts, clearSessionCookie, codeHash, db, deleteImage, DEFAULT_SETTINGS,
  displayName, emptyStats, getPlayer, getSession, getSettings, isLive, json, listPlayers,
  makeSessionCookie, money, newCode, noteFailedAttempt, photoUrl, Player, publicPlayer,
  recordEvent, safeEqual, saveImage, savePlayer, Session, Settings, slugify, sumStats,
  tooManyAttempts, listGifts, saveGift, confirmedTotals, recentSupporters, Gift,
  listSponsors, getSponsor, saveSponsor, syncSponsorTasks, isSponsorLevel, cleanUrl, cleanSponsorDetails, HOME_GAMES, takenGames, Sponsor, SponsorLevel, SPONSOR_LEVELS, REPORT_LABELS, INTERNAL_TASKS,
} from "../lib/core.mts";
import {
  cleanContacts, currentWave, DEFAULT_WAVES, getContacts, getLog, getWaves, inSendWindow, kickSender, liveSettings, mergeVars,
  normalizeEmail, providerStatus, renderEmail, renderSms, saveContacts, saveWaves,
  sendEmail, SendLog, siteOrigin, unsubUrl, Wave,
} from "../lib/messaging.mts";
import { getHome, getLinks, saveHome, saveLinks, youtubeFeed } from "../lib/home.mts";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const method = req.method;

  try {
    // ----- public -----
    if (parts[0] === "public" && method === "GET") return publicData();
    if (parts[0] === "player" && parts[1] && method === "GET") return publicPlayerData(parts[1]);
    if (parts[0] === "track" && method === "POST") return track(req);
    if (parts[0] === "gift" && method === "POST") return createGift(req, context);
    if (parts[0] === "sponsor" && parts.length === 1 && method === "POST") return createSponsor(req);
    if (parts[0] === "sponsor" && parts[1] && parts[2] === "logo" && method === "POST") return sponsorLogoUpload(req, parts[1]);
    if (parts[0] === "sponsors" && method === "GET") return sponsorWall();
    if (parts[0] === "instagram" && method === "GET") return instagramFeed();
    if (parts[0] === "youtube" && method === "GET") return json(await youtubeFeed(url.searchParams.get("channel") || ""), 200, { "cache-control": "public, max-age=600" });
    if (parts[0] === "home" && method === "GET") return json({ content: (await getHome())?.content || null }, 200, { "cache-control": "public, max-age=60" });
    if (parts[0] === "sponsor-report" && parts[1] && method === "GET") return sponsorReport(parts[1]);

    // ----- sessions -----
    if (parts[0] === "login" && method === "POST") return playerLogin(req, context);
    if (parts[0] === "logout" && method === "POST") return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
    if (parts[0] === "coach" && parts[1] === "login" && method === "POST") return coachLogin(req, context);

    const session = await getSession(req);

    // ----- player portal -----
    if (parts[0] === "me") {
      if (!session || session.role !== "player") return json({ error: "Please log in." }, 401);
      const player = await getPlayer(session.id);
      if (!player || !player.active) return json({ error: "Your page is not active. Please see your coach." }, 403);
      return playerRoutes(req, parts.slice(1), player);
    }

    // ----- coach dashboard -----
    if (parts[0] === "coach") {
      if (!session || session.role !== "coach") return json({ error: "Please log in." }, 401);
      return coachRoutes(req, parts.slice(1), session);
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
};

export const config: Config = { path: "/api/*" };

// ================= public =================

function publicSettings(s: Settings, confirmed = 0) {
  return {
    teamName: s.teamName,
    schoolName: s.schoolName,
    tagline: s.tagline,
    story: s.story,
    goal: s.goal,
    raised: (s.raised || 0) + confirmed,
    endDate: s.endDate,
    donateReady: !!s.donateUrl,
    logo: photoUrl(s.logoKey),
  };
}

async function publicData() {
  const [settings, players, stats, gifts] = await Promise.all([getSettings(), listPlayers(), allStats(), listGifts()]);
  const t = confirmedTotals(gifts);
  const live = players.filter(isLive).map((p) => publicPlayer(p, stats[p.slug], t.bySlug[p.slug] || 0));
  return json({
    settings: publicSettings(settings, t.all),
    players: live,
    totals: { ...sumStats(stats), gifts: gifts.filter((g) => g.status === "confirmed").length },
    supporters: recentSupporters(gifts, players, undefined, 15),
    options: live.map((p) => ({ slug: p.slug, name: p.name })),
  });
}

async function publicPlayerData(slug: string) {
  const [settings, players, stats] = await Promise.all([getSettings(), listPlayers(), allStats()]);
  const p = players.find((x) => x.slug === slug.toLowerCase());
  if (!p || !isLive(p)) return json({ error: "We could not find that player page." }, 404);
  const gifts = await listGifts();
  const t = confirmedTotals(gifts);
  return json({
    settings: publicSettings(settings, t.all),
    player: publicPlayer(p, stats[p.slug], t.bySlug[p.slug] || 0),
    supporters: recentSupporters(gifts, players, p.slug, 15),
    options: players.filter(isLive).map((x) => ({ slug: x.slug, name: displayName(x) })),
  });
}

// ================= sponsors (public) =================

async function createSponsor(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (clean(body.company_hp, 50)) return json({ ok: true }); // spam trap
  const business = clean(body.business, 80);
  const contact = clean(body.contact, 60);
  const email = clean(body.email, 120).toLowerCase();
  const phone = clean(body.phone, 30);
  if (business.length < 2) return json({ error: "Please enter your business name." }, 400);
  if (contact.length < 2) return json({ error: "Please enter your name." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) && phone.replace(/\D/g, "").length < 10) {
    return json({ error: "Please enter an email or a phone number so we can reach you." }, 400);
  }
  const level: SponsorLevel = isSponsorLevel(body.level) ? body.level : "backer";
  const sponsor: Sponsor = {
    id: `${Date.now()}${randomBytes(4).toString("hex")}`,
    token: randomBytes(16).toString("hex"),
    business, contact, email, phone,
    website: cleanUrl(body.website),
    level,
    message: clean(body.message, 800),
    status: "interested",
    amount: SPONSOR_LEVELS[level].price,
    logoKey: "", showOnWall: false,
    createdAt: new Date().toISOString(),
    tasks: [],
    details: cleanSponsorDetails(body, clean),
    uploadToken: randomBytes(16).toString("hex"),
    uploadUntil: Date.now() + 60 * 60 * 1000,
  };
  await saveSponsor(sponsor);
  return json({ ok: true, id: sponsor.id, uploadToken: sponsor.uploadToken });
}

// The business can attach its logo once, right after sending the form.
async function sponsorLogoUpload(req: Request, id: string) {
  const s = await getSponsor(id);
  const key = req.headers.get("x-upload-token") || "";
  if (!s || !s.uploadToken || !safeEqual(key, s.uploadToken) || Date.now() > (s.uploadUntil || 0)) {
    return json({ error: "That upload link has expired. Please email your logo to the coach." }, 403);
  }
  const saved = await saveImage(req, `sl${s.id}_`);
  if ("error" in saved) return json({ error: saved.error }, 400);
  await deleteImage(s.logoKey);
  s.logoKey = saved.key;
  delete s.uploadToken;
  delete s.uploadUntil;
  await saveSponsor(s);
  return json({ ok: true });
}

async function sponsorWall() {
  const [sponsors, settings] = await Promise.all([listSponsors(), getSettings()]);
  const wall = sponsors
    .filter((s) => s.showOnWall && (s.status === "committed" || s.status === "paid"))
    .sort((a, b) => SPONSOR_LEVELS[b.level].rank - SPONSOR_LEVELS[a.level].rank || a.business.localeCompare(b.business))
    .map((s) => ({ business: s.business, website: s.website, level: s.level, levelName: SPONSOR_LEVELS[s.level].name, logo: photoUrl(s.logoKey) }));
  const taken = takenGames(sponsors);
  const homeGames = HOME_GAMES.map((g) => ({ ...g, taken: !!taken[g.id] }));
  return json({ sponsors: wall, payUrl: settings.donateUrl, homeGames }, 200, { "cache-control": "public, max-age=60" });
}

// ================= instagram (home page feed) =================

// Latest posts from the team Instagram professional account, cached for 30 minutes.
// Needs INSTAGRAM_TOKEN (an Instagram API with Instagram Login access token).
// Long lived tokens last 60 days, so the token is refreshed once a week and kept in Blobs.
async function instagramFeed() {
  const headers = { "cache-control": "public, max-age=300" };
  const store = db();
  const cached = (await store.get("cache/instagram", { type: "json" }).catch(() => null)) as { at: number; handle: string; posts: unknown[] } | null;
  if (cached && Date.now() - cached.at < 30 * 60 * 1000) return json({ handle: cached.handle, posts: cached.posts }, 200, headers);

  // A new INSTAGRAM_TOKEN on Netlify replaces the refreshed one kept in Blobs.
  const source = process.env.INSTAGRAM_TOKEN || "";
  if (!source) return json({ handle: "", posts: [] }, 200, headers);
  const kept = (await store.get("cache/instagram-token", { type: "json" }).catch(() => null)) as { token: string; at: number; source: string } | null;
  const saved = kept && kept.source === source ? kept : null;
  let token = saved?.token || source;

  try {
    if (!saved || Date.now() - saved.at > 7 * 864e5) {
      const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.access_token) token = d.access_token;
      await store.setJSON("cache/instagram-token", { token, at: Date.now(), source });
    }
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username";
    const r = await fetch(`https://graph.instagram.com/me/media?fields=${fields}&limit=12&access_token=${encodeURIComponent(token)}`);
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message || `Instagram ${r.status}`);
    const posts = (d.data || [])
      .map((m: any) => ({
        url: m.permalink,
        image: m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url,
        video: m.media_type === "VIDEO",
        caption: clean(m.caption || "", 300),
        at: m.timestamp,
      }))
      .filter((p: any) => p.url && p.image)
      .slice(0, 8);
    const handle = d.data?.[0]?.username || "";
    await store.setJSON("cache/instagram", { at: Date.now(), handle, posts });
    return json({ handle, posts }, 200, headers);
  } catch (err) {
    console.error("instagram", err);
    return json({ handle: cached?.handle || "", posts: cached?.posts || [] }, 200, headers);
  }
}

async function sponsorReport(token: string) {
  const t = token.replace(/[^a-f0-9]/gi, "");
  if (t.length < 20) return json({ error: "Report not found." }, 404);
  const s = (await listSponsors()).find((x) => x.token === t);
  if (!s || s.status === "declined") return json({ error: "Report not found." }, 404);
  return json({
    business: s.business,
    levelName: SPONSOR_LEVELS[s.level].name,
    logo: photoUrl(s.logoKey),
    delivered: s.tasks.filter((x) => x.done && !INTERNAL_TASKS.has(x.id)).map((x) => ({
      text: REPORT_LABELS[x.id] || x.text,
      date: x.date, link: x.link, photo: photoUrl(x.photoKey), note: x.note,
    })),
    upcoming: s.tasks.filter((x) => !x.done && !INTERNAL_TASKS.has(x.id)).length,
  });
}

// The donation form. Records who the gift is for and how much, then hands back the payment link.
async function createGift(req: Request, context: Context) {
  const body = await req.json().catch(() => ({}));
  if (clean(body.company, 50)) return json({ ok: true }); // spam trap
  const settings = await getSettings();
  if (!settings.donateUrl) return json({ error: "Online donations open soon. Please check back shortly." }, 503);
  const amount = Math.round(money(body.amount) * 100) / 100;
  if (amount < 1 || amount > 10000) return json({ error: "Please enter an amount between $1 and $10,000." }, 400);
  const name = clean(body.name, 60);
  if (name.length < 2) return json({ error: "Please enter your name." }, 400);
  const email = clean(body.email, 120).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return json({ error: "That email does not look right." }, 400);
  let slug = clean(body.slug, 40).toLowerCase().replace(/[^a-z0-9]/g, "") || "team";
  if (slug !== "team") {
    const p = (await listPlayers()).find((x) => x.slug === slug && isLive(x));
    if (!p) slug = "team";
  }
  const gift: Gift = {
    id: `${Date.now()}${randomBytes(4).toString("hex")}`,
    slug, amount, name, email,
    anonymous: !!body.anonymous,
    status: "pledged", source: "form",
    createdAt: new Date().toISOString(), confirmedAt: "",
  };
  await saveGift(gift);
  await recordEvent("donate", slug);
  return json({ ok: true, id: gift.id, url: settings.donateUrl });
}

async function track(req: Request) {
  const body = await req.json().catch(() => ({}));
  const type = body.type === "share" ? "share" : body.type === "view" ? "view" : null;
  if (!type) return json({ error: "Unknown event" }, 400);
  const slug = clean(body.slug, 40).toLowerCase().replace(/[^a-z0-9]/g, "") || "team";
  await recordEvent(type, slug);
  return json({ ok: true });
}

// ================= logins =================

async function playerLogin(req: Request, context: Context) {
  if (await tooManyAttempts(req, context)) {
    return json({ error: "Too many tries. Please wait 15 minutes and try again." }, 429);
  }
  const body = await req.json().catch(() => ({}));
  const hash = await codeHash(body.code);
  const id = hash ? await db().get(`codes/${hash}`, { type: "text" }) : null;
  const player = id ? await getPlayer(id) : null;
  if (!player || !player.active) {
    await noteFailedAttempt(req, context);
    return json({ error: "That code did not work. Double check it with your coach." }, 401);
  }
  await clearAttempts(req, context);
  return json({ ok: true }, 200, { "set-cookie": await makeSessionCookie({ role: "player", id: player.id }, req) });
}

async function coachLogin(req: Request, context: Context) {
  const expected = Netlify.env.get("ADMIN_PASSWORD");
  if (!expected) {
    return json({ error: "The coach password has not been set up yet. Add ADMIN_PASSWORD in Netlify." }, 503);
  }
  if (await tooManyAttempts(req, context)) {
    return json({ error: "Too many tries. Please wait 15 minutes and try again." }, 429);
  }
  const body = await req.json().catch(() => ({}));
  if (!safeEqual(String(body.password || ""), expected)) {
    await noteFailedAttempt(req, context);
    return json({ error: "That password is not right." }, 401);
  }
  await clearAttempts(req, context);
  return json({ ok: true }, 200, { "set-cookie": await makeSessionCookie({ role: "coach", id: "coach" }, req) });
}

// ================= player portal =================

async function playerRoutes(req: Request, parts: string[], player: Player) {
  const method = req.method;
  const settings = await getSettings();

  if (parts.length === 0 && method === "GET") {
    const stats = (await allStats())[player.slug] || emptyStats();
    const t = confirmedTotals(await listGifts());
    return json({
      player: {
        ...publicPlayer(player, stats, t.bySlug[player.slug] || 0),
        last: player.last,
        live: isLive(player),
        consent: player.consent,
        pendingPhoto: photoUrl(player.pendingPhotoKey),
        contactsDone: !!player.contactsDone,
        contactCount: (await getContacts(player.id)).length,
        outreach: player.outreach || null,
      },
      settings: { ...publicSettings(settings), requirePhotoApproval: settings.requirePhotoApproval, minContacts: settings.minContacts },
    });
  }

  if (parts.length === 0 && method === "PUT") {
    const body = await req.json().catch(() => ({}));
    player.message = clean(body.message, 600);
    player.personalGoal = money(body.personalGoal);
    player.number = clean(body.number, 3);
    player.position = clean(body.position, 30);
    await savePlayer(player);
    return json({ ok: true });
  }

  if (parts[0] === "consent" && method === "POST") {
    const body = await req.json().catch(() => ({}));
    const guardianName = clean(body.guardianName, 80);
    if (!body.guardianOk || !body.shareOk || !body.honestOk || guardianName.length < 3) {
      return json({ error: "Please check every box and type your parent or guardian's full name." }, 400);
    }
    player.consent = { accepted: true, guardianName, at: new Date().toISOString() };
    await savePlayer(player);
    return json({ ok: true });
  }

  if (parts[0] === "contacts" && method === "GET") {
    const [contacts, log] = await Promise.all([getContacts(player.id), getLog(player.id)]);
    return json({ contacts, status: contactStatus(log), min: settings.minContacts, done: !!player.contactsDone });
  }

  if (parts[0] === "contacts" && method === "PUT") {
    if (!player.consent?.accepted) return json({ error: "Please finish the permission step first." }, 400);
    const body = await req.json().catch(() => ({}));
    if (!body.promise) return json({ error: "Please check the box to confirm these are people you know." }, 400);
    const { contacts, problems } = cleanContacts(body.contacts);
    if (problems.length) return json({ error: "A few contacts need fixing.", problems }, 400);
    if (contacts.length < settings.minContacts) {
      return json({ error: `Please add at least ${settings.minContacts} supporters. You have ${contacts.length} so far.` }, 400);
    }
    await saveContacts(player.id, contacts);
    // A fixed list goes back to the coach for another look.
    if (!player.contactsDone || !player.outreach || player.outreach.status === "changes") {
      player.contactsDone = true;
      player.outreach = { status: "pending", note: "", at: new Date().toISOString() };
      await savePlayer(player);
    }
    return json({ ok: true, count: contacts.length });
  }

  if (parts[0] === "preview" && method === "GET") {
    const waves = await getWaves();
    const wave = waves.find((w) => w.id === new URL(req.url).searchParams.get("wave")) || waves[0];
    const first = (await getContacts(player.id))[0];
    return json(await preview(wave, player, await liveSettings(), siteOrigin(new URL(req.url).origin), first?.name || "Grandma"));
  }

  // Texts the player sends from her own phone: the newest approved message, written out for each supporter.
  if (parts[0] === "texts" && method === "GET") {
    if (player.outreach?.status !== "approved") return json({ ready: false, reason: "review" });
    const live = await liveSettings();
    const wave = currentWave(await getWaves(), player, live);
    if (!wave || !wave.sms) return json({ ready: false, reason: "none" });
    const [contacts, log] = await Promise.all([getContacts(player.id), getLog(player.id)]);
    const origin = siteOrigin(new URL(req.url).origin);
    return json({
      ready: true,
      wave: { id: wave.id, name: wave.name },
      texts: contacts.filter((c) => c.phone).map((c) => ({
        id: c.id, name: c.name, phone: c.phone,
        body: renderSms(wave, mergeVars(live, player, c, origin)),
        texted: log[c.id]?.[wave.id]?.sms === "sent",
      })),
    });
  }

  if (parts[0] === "texted" && method === "POST") {
    const body = await req.json().catch(() => ({}));
    const [contacts, log, waves] = await Promise.all([getContacts(player.id), getLog(player.id), getWaves()]);
    if (!contacts.some((c) => c.id === body.contact) || !waves.some((w) => w.id === body.wave)) return json({ error: "Not found" }, 404);
    const entry = ((log[body.contact] ||= {})[body.wave] ||= { at: "" });
    if (body.texted === false) delete entry.sms;
    else { entry.sms = "sent"; entry.at = new Date().toISOString(); }
    await db().setJSON(`sendlog/${player.id}`, log);
    return json({ ok: true });
  }

  if (parts[0] === "photo" && method === "POST") {
    if (!player.consent?.accepted) return json({ error: "Please finish the permission step first." }, 400);
    const saved = await saveImage(req, `p${player.id}_`);
    if ("error" in saved) return json({ error: saved.error }, 400);
    if (settings.requirePhotoApproval) {
      await deleteImage(player.pendingPhotoKey);
      player.pendingPhotoKey = saved.key;
    } else {
      await deleteImage(player.photoKey);
      await deleteImage(player.pendingPhotoKey);
      player.photoKey = saved.key;
      player.pendingPhotoKey = "";
    }
    await savePlayer(player);
    return json({ ok: true, pending: settings.requirePhotoApproval });
  }

  if (parts[0] === "photo" && method === "DELETE") {
    await deleteImage(player.photoKey);
    await deleteImage(player.pendingPhotoKey);
    player.photoKey = "";
    player.pendingPhotoKey = "";
    await savePlayer(player);
    return json({ ok: true });
  }

  return json({ error: "Not found" }, 404);
}

// ================= coach dashboard =================

async function coachRoutes(req: Request, parts: string[], _s: Session) {
  const method = req.method;

  // Home page content and the dashboard's own links
  if (parts[0] === "home" && method === "GET") return json((await getHome()) || { content: null, updatedAt: "" });
  if (parts[0] === "home" && method === "PUT") return json({ ok: true, ...(await saveHome(await req.json().catch(() => ({})))) });
  if (parts[0] === "links" && method === "GET") return json({ links: await getLinks() });
  if (parts[0] === "links" && method === "PUT") return json({ ok: true, links: await saveLinks(await req.json().catch(() => ({}))) });

  if (parts[0] === "overview" && method === "GET") {
    const [settings, players, stats, gifts] = await Promise.all([getSettings(), listPlayers(), allStats(), listGifts()]);
    const t = confirmedTotals(gifts);
    const counts = await Promise.all(players.map(async (p) => {
      const [contacts, log] = await Promise.all([getContacts(p.id), getLog(p.id)]);
      return { contacts: contacts.length, emails: contacts.filter((c) => c.email).length, phones: contacts.filter((c) => c.phone).length, sent: countSent(log) };
    }));
    return json({
      settings: { ...settings, logo: photoUrl(settings.logoKey) },
      players: players.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: displayName(p),
        first: p.first,
        last: p.last,
        number: p.number,
        position: p.position,
        active: p.active,
        live: isLive(p),
        raised: p.raised || 0,
        confirmed: t.bySlug[p.slug] || 0,
        consent: p.consent,
        photo: photoUrl(p.photoKey),
        pendingPhoto: photoUrl(p.pendingPhotoKey),
        stats: stats[p.slug] || emptyStats(),
        message: p.message,
        contactsDone: !!p.contactsDone,
        outreach: p.outreach || null,
        ...counts[players.indexOf(p)],
      })),
      teamStats: stats.team || emptyStats(),
      totals: sumStats(stats),
      sponsorTotals: await (async () => {
        const sp = await listSponsors();
        return {
          paid: sp.filter((x) => x.status === "paid").reduce((n, x) => n + x.amount, 0),
          committed: sp.filter((x) => x.status === "committed").reduce((n, x) => n + x.amount, 0),
          openTasks: sp.filter((x) => x.status === "committed" || x.status === "paid").reduce((n, x) => n + x.tasks.filter((t) => !t.done).length, 0),
          newCount: sp.filter((x) => x.status === "interested").length,
        };
      })(),
      giftTotals: {
        confirmed: t.all,
        teamOnly: t.bySlug.team || 0,
        pledged: gifts.filter((g) => g.status === "pledged").reduce((n, g) => n + g.amount, 0),
        pledgedCount: gifts.filter((g) => g.status === "pledged").length,
      },
    });
  }

  if (parts[0] === "sponsors") return coachSponsors(req, parts.slice(1));

  if (parts[0] === "gifts" && parts.length === 1 && method === "GET") {
    const [gifts, players] = await Promise.all([listGifts(), listPlayers()]);
    const names = new Map(players.map((p) => [p.slug, displayName(p)]));
    return json({ gifts: gifts.map((g) => ({ ...g, forName: g.slug === "team" ? "Whole team" : names.get(g.slug) || g.slug })) });
  }

  // Coach adds a gift by hand, like cash or a check.
  if (parts[0] === "gifts" && parts.length === 1 && method === "POST") {
    const body = await req.json().catch(() => ({}));
    const amount = money(body.amount);
    const name = clean(body.name, 60);
    if (amount <= 0) return json({ error: "Please enter an amount." }, 400);
    if (!name) return json({ error: "Please enter the donor's name." }, 400);
    const slug = clean(body.slug, 40).toLowerCase().replace(/[^a-z0-9]/g, "") || "team";
    const now = new Date().toISOString();
    await saveGift({ id: `${Date.now()}${randomBytes(4).toString("hex")}`, slug, amount, name, email: "", anonymous: !!body.anonymous, status: "confirmed", source: "coach", createdAt: now, confirmedAt: now });
    return json({ ok: true });
  }

  if (parts[0] === "gifts" && parts[1] && method === "POST") {
    const gift = (await db().get(`gifts/${parts[1].replace(/[^a-z0-9]/gi, "")}`, { type: "json" })) as Gift | null;
    if (!gift) return json({ error: "Gift not found." }, 404);
    const body = await req.json().catch(() => ({}));
    if (body.amount !== undefined) {
      const a = money(body.amount);
      if (a <= 0) return json({ error: "Please enter an amount." }, 400);
      gift.amount = a;
    }
    if (body.slug !== undefined) gift.slug = clean(body.slug, 40).toLowerCase().replace(/[^a-z0-9]/g, "") || "team";
    if (body.action === "confirm") { gift.status = "confirmed"; gift.confirmedAt = new Date().toISOString(); }
    if (body.action === "unconfirm" || body.action === "restore") { gift.status = "pledged"; gift.confirmedAt = ""; }
    if (body.action === "remove") gift.status = "removed";
    await saveGift(gift);
    return json({ ok: true });
  }

  if (parts[0] === "settings" && method === "PUT") {
    const body = await req.json().catch(() => ({}));
    const cur = await getSettings();
    const donateUrl = clean(body.donateUrl ?? cur.donateUrl, 1000);
    if (donateUrl && !/^https:\/\//i.test(donateUrl)) {
      return json({ error: "The donation link should start with https://" }, 400);
    }
    const endDate = clean(body.endDate ?? cur.endDate, 10);
    const next: Settings = {
      ...cur,
      teamName: clean(body.teamName ?? cur.teamName, 60) || DEFAULT_SETTINGS.teamName,
      schoolName: clean(body.schoolName ?? cur.schoolName, 80) || DEFAULT_SETTINGS.schoolName,
      tagline: clean(body.tagline ?? cur.tagline, 140),
      story: clean(body.story ?? cur.story, 2000),
      goal: money(body.goal ?? cur.goal) || DEFAULT_SETTINGS.goal,
      raised: money(body.raised ?? cur.raised),
      endDate: /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : cur.endDate,
      donateUrl,
      requirePhotoApproval: body.requirePhotoApproval === undefined ? cur.requirePhotoApproval : !!body.requirePhotoApproval,
      sponsorPrep: body.sponsorPrep && typeof body.sponsorPrep === "object"
        ? Object.fromEntries(Object.entries({ ...(cur.sponsorPrep || {}), ...body.sponsorPrep }).filter(([k]) => /^[a-z]{2,20}$/.test(k)).map(([k, v]) => [k, !!v]))
        : cur.sponsorPrep || {},
      minContacts: body.minContacts === undefined ? cur.minContacts : Math.max(1, Math.min(100, Math.round(Number(body.minContacts)) || cur.minContacts)),
      sendingPaused: body.sendingPaused === undefined ? cur.sendingPaused : !!body.sendingPaused,
      mailingAddress: clean(body.mailingAddress ?? cur.mailingAddress, 200),
      testEmail: body.testEmail === undefined ? cur.testEmail : normalizeEmail(body.testEmail),
      updatedAt: new Date().toISOString(),
    };
    await db().setJSON("settings", next);
    if (cur.sendingPaused && !next.sendingPaused) await kickSender(siteOrigin(new URL(req.url).origin));
    return json({ ok: true });
  }

  if (parts[0] === "outreach" && method === "GET") {
    const [waves, players, settings] = await Promise.all([getWaves(), listPlayers(), getSettings()]);
    const perWave: Record<string, Record<string, number>> = {};
    for (const p of players) {
      const log = await getLog(p.id);
      for (const byWave of Object.values(log)) {
        for (const [wid, e] of Object.entries(byWave)) {
          const t = (perWave[wid] ||= { emails: 0, texts: 0, failed: 0, optout: 0 });
          if (e.email === "sent") t.emails++;
          if (e.email === "failed") t.failed++;
          if (e.email === "optout") t.optout++;
          if (e.sms === "sent") t.texts++;
        }
      }
    }
    return json({
      waves,
      perWave,
      providers: providerStatus(),
      paused: settings.sendingPaused,
      inWindow: inSendWindow(),
      approvedPlayers: players.filter((p) => p.outreach?.status === "approved").length,
    });
  }

  if (parts[0] === "waves" && parts[1] === "reset" && method === "POST") {
    await saveWaves(DEFAULT_WAVES);
    return json({ ok: true });
  }

  if (parts[0] === "waves" && parts[1]) {
    const waves = await getWaves();
    const wave = waves.find((w) => w.id === parts[1]);
    if (!wave) return json({ error: "Message not found." }, 404);
    const body = await req.json().catch(() => ({}));
    if (parts[2] === "approve" && method === "POST") {
      wave.approved = !!body.approved;
      await saveWaves(waves);
      if (wave.approved) await kickSender(siteOrigin(new URL(req.url).origin));
      return json({ ok: true });
    }
    if (parts.length === 2 && method === "PUT") {
      wave.name = clean(body.name ?? wave.name, 40) || wave.name;
      wave.subject = clean(body.subject ?? wave.subject, 150);
      wave.email = clean(body.email ?? wave.email, 3000);
      wave.sms = clean(body.sms ?? wave.sms, 480);
      wave.enabled = body.enabled === undefined ? wave.enabled : !!body.enabled;
      wave.donateButton = body.donateButton === undefined ? wave.donateButton : !!body.donateButton;
      if (body.trigger && ["after", "beforeEnd"].includes(body.trigger.type)) {
        wave.trigger = { type: body.trigger.type, days: Math.max(-30, Math.min(120, Math.round(Number(body.trigger.days) || 0))) };
      }
      // Any edit needs a fresh approval before it can go out.
      wave.approved = false;
      await saveWaves(waves);
      return json({ ok: true });
    }
  }

  if (parts[0] === "preview" && method === "GET") {
    const q = new URL(req.url).searchParams;
    const waves = await getWaves();
    const wave = waves.find((w) => w.id === q.get("wave")) || waves[0];
    const player = (q.get("player") && (await getPlayer(q.get("player")!))) || (await listPlayers())[0];
    if (!player) return json({ error: "Add a player first to see a preview." }, 400);
    return json(await preview(wave, player, await liveSettings(), siteOrigin(new URL(req.url).origin), "Grandma"));
  }

  if (parts[0] === "test" && method === "POST") {
    const body = await req.json().catch(() => ({}));
    const settings = await liveSettings();
    const waves = await getWaves();
    const wave = waves.find((w) => w.id === body.wave) || waves[0];
    const player = (body.player && (await getPlayer(body.player))) || (await listPlayers())[0];
    if (!player) return json({ error: "Add a player first." }, 400);
    if (!settings.testEmail) return json({ error: "Add your own email under Test email first." }, 400);
    if (!providerStatus().email) return json({ error: "Email is not set up yet. Add the Resend key in Netlify first." }, 400);
    const origin = siteOrigin(new URL(req.url).origin);
    const u = await unsubUrl(origin, settings.testEmail);
    try {
      await sendEmail(settings.testEmail, renderEmail(wave, settings, player, mergeVars(settings, player, { name: "Coach" }, origin), origin, u), u);
    } catch (e: any) {
      return json({ error: e.message }, 502);
    }
    return json({ ok: true, results: [`Test email sent to ${settings.testEmail}.`] });
  }

  if (parts[0] === "send-now" && method === "POST") {
    await kickSender(siteOrigin(new URL(req.url).origin));
    return json({ ok: true });
  }

  if (parts[0] === "logo" && method === "POST") {
    const saved = await saveImage(req, "logo_");
    if ("error" in saved) return json({ error: saved.error }, 400);
    const cur = await getSettings();
    await deleteImage(cur.logoKey);
    await db().setJSON("settings", { ...cur, logoKey: saved.key });
    return json({ ok: true });
  }

  if (parts[0] === "logo" && method === "DELETE") {
    const cur = await getSettings();
    await deleteImage(cur.logoKey);
    await db().setJSON("settings", { ...cur, logoKey: "" });
    return json({ ok: true });
  }

  if (parts[0] === "players" && parts.length === 1 && method === "POST") {
    const body = await req.json().catch(() => ({}));
    const first = clean(body.first, 30);
    const last = clean(body.last, 30);
    if (!first) return json({ error: "Please enter a first name." }, 400);
    const players = await listPlayers();
    const taken = new Set(players.map((p) => p.slug));
    let slug = slugify(first, last);
    for (let i = 2; taken.has(slug); i++) slug = slugify(first, last) + i;
    const player: Player = {
      id: randomBytes(8).toString("hex"),
      slug,
      first,
      last,
      number: clean(body.number, 3),
      position: clean(body.position, 30),
      message: "",
      personalGoal: 0,
      raised: 0,
      photoKey: "",
      pendingPhotoKey: "",
      consent: null,
      active: true,
      createdAt: new Date().toISOString(),
    };
    await savePlayer(player);
    const code = await assignCode(player);
    return json({ ok: true, id: player.id, code });
  }

  if (parts[0] === "players" && parts[1]) {
    const player = await getPlayer(parts[1]);
    if (!player) return json({ error: "Player not found." }, 404);

    if (parts.length === 2 && method === "PUT") {
      const body = await req.json().catch(() => ({}));
      if (body.first !== undefined) player.first = clean(body.first, 30) || player.first;
      if (body.last !== undefined) player.last = clean(body.last, 30);
      if (body.number !== undefined) player.number = clean(body.number, 3);
      if (body.position !== undefined) player.position = clean(body.position, 30);
      if (body.active !== undefined) player.active = !!body.active;
      if (body.raised !== undefined) player.raised = money(body.raised);
      if (body.resetConsent) player.consent = null;
      await savePlayer(player);
      return json({ ok: true });
    }

    if (parts[2] === "contacts" && method === "GET") {
      const [contacts, log] = await Promise.all([getContacts(player.id), getLog(player.id)]);
      return json({ contacts, status: contactStatus(log) });
    }

    if (parts[2] === "outreach" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (!player.contactsDone) return json({ error: "This player has not added her supporters yet." }, 400);
      if (body.action === "approve") {
        player.outreach = { status: "approved", note: "", at: new Date().toISOString() };
      } else if (body.action === "changes") {
        player.outreach = { status: "changes", note: clean(body.note, 300), at: new Date().toISOString() };
      } else if (body.action === "stop") {
        player.outreach = { status: "pending", note: "Paused by coach", at: new Date().toISOString() };
      } else {
        return json({ error: "Unknown action" }, 400);
      }
      await savePlayer(player);
      if (body.action === "approve") await kickSender(siteOrigin(new URL(req.url).origin));
      return json({ ok: true });
    }

    if (parts[2] === "code" && method === "POST") {
      return json({ ok: true, code: await assignCode(player) });
    }

    if (parts[2] === "photo" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.action === "approve" && player.pendingPhotoKey) {
        await deleteImage(player.photoKey);
        player.photoKey = player.pendingPhotoKey;
        player.pendingPhotoKey = "";
      } else if (body.action === "reject") {
        await deleteImage(player.pendingPhotoKey);
        player.pendingPhotoKey = "";
      } else if (body.action === "remove") {
        await deleteImage(player.photoKey);
        player.photoKey = "";
      }
      await savePlayer(player);
      return json({ ok: true });
    }

    if (parts.length === 2 && method === "DELETE") {
      await deleteImage(player.photoKey);
      await deleteImage(player.pendingPhotoKey);
      const store = db();
      const { blobs } = await store.list({ prefix: "codes/" });
      for (const b of blobs) if ((await store.get(b.key, { type: "text" })) === player.id) await store.delete(b.key);
      await store.delete(`players/${player.id}`);
      await store.delete(`contacts/${player.id}`);
      await store.delete(`sendlog/${player.id}`);
      return json({ ok: true });
    }
  }

  return json({ error: "Not found" }, 404);
}

// Gives the player a fresh login code and retires any old one.
async function assignCode(player: Player) {
  const store = db();
  const { blobs } = await store.list({ prefix: "codes/" });
  for (const b of blobs) if ((await store.get(b.key, { type: "text" })) === player.id) await store.delete(b.key);
  let code = newCode();
  while (await store.get(`codes/${await codeHash(code)}`, { type: "text" })) code = newCode();
  await store.set(`codes/${await codeHash(code)}`, player.id);
  return code;
}

// ================= sponsors (coach) =================

async function coachSponsors(req: Request, parts: string[]) {
  const method = req.method;
  const origin = new URL(req.url).origin;

  if (parts.length === 0 && method === "GET") {
    const list = await listSponsors();
    const taken = takenGames(list);
    return json({
      levels: SPONSOR_LEVELS,
      homeGames: HOME_GAMES.map((g) => ({ ...g, takenBy: taken[g.id] || null })),
      sponsors: list.map(({ uploadToken, uploadUntil, ...s }) => ({
        ...s,
        logo: photoUrl(s.logoKey),
        reportUrl: `${origin}/sponsor-report/${s.token}`,
        tasks: s.tasks.map((t) => ({ ...t, photo: photoUrl(t.photoKey) })),
      })),
    });
  }

  // Add a sponsor by hand.
  if (parts.length === 0 && method === "POST") {
    const body = await req.json().catch(() => ({}));
    const business = clean(body.business, 80);
    if (business.length < 2) return json({ error: "Please enter the business name." }, 400);
    const level: SponsorLevel = isSponsorLevel(body.level) ? body.level : "backer";
    const status = ["interested", "committed", "paid"].includes(body.status) ? body.status : "committed";
    const s: Sponsor = {
      id: `${Date.now()}${randomBytes(4).toString("hex")}`, token: randomBytes(16).toString("hex"),
      business, contact: clean(body.contact, 60), email: clean(body.email, 120).toLowerCase(), phone: clean(body.phone, 30),
      website: cleanUrl(body.website), level, message: "", status,
      amount: money(body.amount) || SPONSOR_LEVELS[level].price,
      logoKey: "", showOnWall: false, createdAt: new Date().toISOString(), tasks: [],
    };
    if (status !== "interested") syncSponsorTasks(s);
    await saveSponsor(s);
    return json({ ok: true, id: s.id });
  }

  const s = parts[0] ? await getSponsor(parts[0]) : null;
  if (!s) return json({ error: "Sponsor not found." }, 404);

  if (parts.length === 1 && method === "PUT") {
    const body = await req.json().catch(() => ({}));
    for (const k of ["business", "contact", "phone"] as const) if (body[k] !== undefined) s[k] = clean(body[k], k === "business" ? 80 : 60) || s[k];
    if (body.email !== undefined) s.email = clean(body.email, 120).toLowerCase();
    if (body.website !== undefined) s.website = cleanUrl(body.website);
    if (body.level !== undefined && isSponsorLevel(body.level)) s.level = body.level;
    if (body.amount !== undefined) s.amount = money(body.amount);
    if (body.showOnWall !== undefined) s.showOnWall = !!body.showOnWall;
    if (body.status !== undefined && ["interested", "committed", "paid", "declined"].includes(body.status)) s.status = body.status;
    if (body.details && typeof body.details === "object") s.details = cleanSponsorDetails({ ...(s.details || {}), ...body.details }, clean);
    if (s.status === "committed" || s.status === "paid") syncSponsorTasks(s);
    await saveSponsor(s);
    return json({ ok: true });
  }

  if (parts.length === 1 && method === "DELETE") {
    await deleteImage(s.logoKey);
    for (const t of s.tasks) await deleteImage(t.photoKey);
    await db().delete(`sponsors/${s.id}`);
    return json({ ok: true });
  }

  if (parts[1] === "logo" && method === "POST") {
    const saved = await saveImage(req, `sl${s.id}_`);
    if ("error" in saved) return json({ error: saved.error }, 400);
    await deleteImage(s.logoKey);
    s.logoKey = saved.key;
    const t = s.tasks.find((x) => x.id === "logo");
    if (t && !t.done) { t.done = true; t.date = new Date().toISOString().slice(0, 10); }
    await saveSponsor(s);
    return json({ ok: true });
  }

  // Add your own to do item.
  if (parts[1] === "tasks" && parts.length === 2 && method === "POST") {
    const body = await req.json().catch(() => ({}));
    const text = clean(body.text, 160);
    if (!text) return json({ error: "Please type the to do item." }, 400);
    const proofIdx = s.tasks.findIndex((x) => x.id === "proof");
    const task = { id: `c${randomBytes(4).toString("hex")}`, text, done: false, date: "", link: "", photoKey: "", note: "" };
    if (proofIdx >= 0) s.tasks.splice(proofIdx, 0, task); else s.tasks.push(task);
    await saveSponsor(s);
    return json({ ok: true });
  }

  if (parts[1] === "tasks" && parts[2]) {
    const t = s.tasks.find((x) => x.id === parts[2]);
    if (!t) return json({ error: "To do item not found." }, 404);
    if (parts[3] === "photo" && method === "POST") {
      const saved = await saveImage(req, `sp${s.id}_`);
      if ("error" in saved) return json({ error: saved.error }, 400);
      await deleteImage(t.photoKey);
      t.photoKey = saved.key;
      await saveSponsor(s);
      return json({ ok: true });
    }
    if (parts.length === 3 && method === "PUT") {
      const body = await req.json().catch(() => ({}));
      if (body.done !== undefined) {
        t.done = !!body.done;
        if (t.done && !t.date) t.date = new Date().toISOString().slice(0, 10);
      }
      if (body.date !== undefined) t.date = /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : "";
      if (body.link !== undefined) t.link = cleanUrl(body.link);
      if (body.note !== undefined) t.note = clean(body.note, 300);
      if (body.removePhoto) { await deleteImage(t.photoKey); t.photoKey = ""; }
      await saveSponsor(s);
      return json({ ok: true });
    }
    if (parts.length === 3 && method === "DELETE") {
      await deleteImage(t.photoKey);
      s.tasks = s.tasks.filter((x) => x !== t);
      await saveSponsor(s);
      return json({ ok: true });
    }
  }

  return json({ error: "Not found" }, 404);
}

// ================= outreach helpers =================

async function preview(wave: Wave, player: Player, settings: Settings, origin: string, contactName: string) {
  const vars = mergeVars(settings, player, { name: contactName }, origin);
  const email = renderEmail(wave, settings, player, vars, origin, `${origin}/u/preview`);
  return { wave: wave.id, subject: email.subject, html: email.html, sms: renderSms(wave, vars) };
}

// Latest thing each contact received, for the player's and coach's lists.
function contactStatus(log: SendLog) {
  const out: Record<string, { last: string; email?: string; sms?: string; at: string }> = {};
  for (const [cid, byWave] of Object.entries(log)) {
    let best: { last: string; email?: string; sms?: string; at: string } | null = null;
    for (const [wid, e] of Object.entries(byWave)) {
      if (e.at && (!best || e.at > best.at)) best = { last: wid, email: e.email, sms: e.sms, at: e.at };
    }
    if (best) out[cid] = best;
  }
  return out;
}

function countSent(log: SendLog) {
  let n = 0;
  for (const byWave of Object.values(log)) for (const e of Object.values(byWave)) n += (e.email === "sent" ? 1 : 0) + (e.sms === "sent" ? 1 : 0);
  return n;
}
