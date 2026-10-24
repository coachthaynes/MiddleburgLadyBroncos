import type { Config, Context } from "@netlify/functions";
import { randomBytes } from "node:crypto";
import {
  allStats, clean, clearAttempts, clearSessionCookie, codeHash, db, deleteImage, DEFAULT_SETTINGS,
  displayName, emptyStats, getPlayer, getSession, getSettings, isLive, json, listPlayers,
  makeSessionCookie, money, newCode, noteFailedAttempt, photoUrl, Player, publicPlayer,
  recordEvent, safeEqual, saveImage, savePlayer, Session, Settings, slugify, sumStats,
  tooManyAttempts, listGifts, saveGift, confirmedTotals, recentSupporters, Gift,
} from "../lib/core.mts";

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
      },
      settings: { ...publicSettings(settings), requirePhotoApproval: settings.requirePhotoApproval },
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

  if (parts[0] === "overview" && method === "GET") {
    const [settings, players, stats, gifts] = await Promise.all([getSettings(), listPlayers(), allStats(), listGifts()]);
    const t = confirmedTotals(gifts);
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
      })),
      teamStats: stats.team || emptyStats(),
      totals: sumStats(stats),
      giftTotals: {
        confirmed: t.all,
        teamOnly: t.bySlug.team || 0,
        pledged: gifts.filter((g) => g.status === "pledged").reduce((n, g) => n + g.amount, 0),
        pledgedCount: gifts.filter((g) => g.status === "pledged").length,
      },
    });
  }

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
      updatedAt: new Date().toISOString(),
    };
    await db().setJSON("settings", next);
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
