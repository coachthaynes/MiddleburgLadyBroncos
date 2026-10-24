// Home page content the coach edits on the dashboard. Anything not saved here falls back to public/js/home-data.js.
import { clean, cleanUrl, db } from "./core.mts";

const HOME_KEY = "home/content";
const LINKS_KEY = "coach/links";

const str = (v: unknown, max = 200) => clean(v, max);
const url = (v: unknown) => cleanUrl(v);
const list = (v: unknown, max: number) => (Array.isArray(v) ? v.slice(0, max) : []);
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export function cleanHome(body: unknown) {
  const b = obj(body);
  const yt = obj(b.youtube), ig = obj(b.instagram), venue = obj(b.venue), rec = obj(b.recruiting);
  return {
    season: str(b.season, 20),
    heroLead: str(b.heroLead, 300),
    slogans: list(b.slogans, 4).map((t) => str(t, 40)).filter(Boolean),
    ticker: list(b.ticker, 8).map((t) => str(t, 80)).filter(Boolean),
    youtube: { channel: url(yt.channel) },
    highlights: list(b.highlights, 6).map((h) => {
      const x = obj(h);
      return { url: url(x.url), title: str(x.title, 80), tag: str(x.tag, 30) };
    }),
    instagram: {
      handle: str(ig.handle, 40).replace(/^@/, "").replace(/[^\w.]/g, ""),
      posts: list(ig.posts, 6).map(url).filter((u) => /instagram\.com\/(p|reel|tv)\//.test(u)),
    },
    schedule: list(b.schedule, 60).map((g) => {
      const x = obj(g);
      return {
        date: /^\d{4}-\d{2}-\d{2}$/.test(String(x.date)) ? String(x.date) : "",
        opponent: str(x.opponent, 60),
        home: !!x.home,
        time: str(x.time, 12),
        location: str(x.location, 80),
        note: str(x.note, 40),
        result: str(x.result, 20),
        neutral: !!x.neutral,
        featured: !!x.featured,
      };
    }).filter((g) => g.date && g.opponent),
    venue: { name: str(venue.name, 80), city: str(venue.city, 60), map: url(venue.map) },
    spotlights: list(b.spotlights, 6).map((s) => {
      const x = obj(s);
      return {
        name: str(x.name, 60), number: str(x.number, 3), position: str(x.position, 30),
        classYear: str(x.classYear, 4), height: str(x.height, 10),
        headline: str(x.headline, 80), bio: str(x.bio, 600), site: url(x.site),
        stats: list(x.stats, 4).map((t) => ({ v: str(obj(t).v, 8), l: str(obj(t).l, 14) })).filter((t) => t.v && t.l),
        links: list(x.links, 4).map((l) => ({ label: str(obj(l).label, 20), url: url(obj(l).url) })).filter((l) => l.label && l.url),
      };
    }).filter((s) => s.name),
    rosterExtras: Object.fromEntries(list(b.roster, 30).map((r) => {
      const x = obj(r);
      return [str(x.name, 60), {
        number: str(x.number, 3), position: str(x.position, 30), classYear: str(x.classYear, 4),
        height: str(x.height, 10), site: url(x.site), maxpreps: url(x.maxpreps),
      }];
    }).filter(([n]) => n)),
    coaches: list(b.coaches, 10).map((c) => {
      const x = obj(c);
      return { name: str(x.name, 60), role: str(x.role, 40), bio: str(x.bio, 400) };
    }).filter((c) => c.name),
    recruiting: { email: /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(str(rec.email, 120)) ? str(rec.email, 120) : "", maxpreps: url(rec.maxpreps) },
  };
}

export async function getHome() {
  return (await db().get(HOME_KEY, { type: "json" })) as { content: ReturnType<typeof cleanHome>; updatedAt: string } | null;
}

export async function saveHome(body: unknown) {
  const rec = { content: cleanHome(body), updatedAt: new Date().toISOString() };
  await db().setJSON(HOME_KEY, rec);
  return rec;
}

export function cleanLinks(body: unknown) {
  return list(obj(body).links, 40).map((l) => {
    const x = obj(l);
    return { group: str(x.group, 40), label: str(x.label, 60), url: url(x.url), note: str(x.note, 120) };
  }).filter((l) => l.label && l.url);
}

export async function getLinks() {
  return ((await db().get(LINKS_KEY, { type: "json" })) as { links: ReturnType<typeof cleanLinks> } | null)?.links || [];
}

export async function saveLinks(body: unknown) {
  const links = cleanLinks(body);
  await db().setJSON(LINKS_KEY, { links });
  return links;
}

// ---------- YouTube highlights ----------
// Latest uploads from the team channel through YouTube's public feed (no API key). Cached for an hour.
const clip = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  // House style: no hyphens or dashes in page text.
  .replace(/\s*[-‐-―|]+\s*/g, " · ").replace(/^ · | · $/g, "").replace(/\s+/g, " ").trim();

async function channelId(handle: string) {
  const r = await fetch(`https://www.youtube.com/@${encodeURIComponent(handle)}`, { headers: { "accept-language": "en-US,en;q=0.9", "user-agent": "Mozilla/5.0 (compatible; mhsladybroncos.com)" } });
  const html = await r.text();
  const m = /"(?:externalId|channelId)":"(UC[\w-]{22})"/.exec(html) || /youtube\.com\/channel\/(UC[\w-]{22})/.exec(html);
  if (!m) throw new Error(`No channel id for @${handle} (${r.status})`);
  return m[1];
}

export async function youtubeFeed(ref: string) {
  const handle = /^@?([\w.-]{3,40})$/.exec(ref)?.[1] || "";
  const direct = /^UC[\w-]{22}$/.test(ref) ? ref : "";
  if (!handle && !direct) return { videos: [] };
  const key = `cache/youtube/${(direct || handle).toLowerCase()}`;
  const store = db();
  const cached = (await store.get(key, { type: "json" }).catch(() => null)) as { at: number; id: string; videos: unknown[] } | null;
  if (cached && Date.now() - cached.at < 60 * 60 * 1000) return { videos: cached.videos };
  try {
    const id = direct || cached?.id || (await channelId(handle));
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
    if (!r.ok) throw new Error(`YouTube feed ${r.status}`);
    const xml = await r.text();
    const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
      id: /<yt:videoId>([\w-]{11})<\/yt:videoId>/.exec(e)?.[1] || "",
      title: clip(/<title>([\s\S]*?)<\/title>/.exec(e)?.[1] || ""),
      at: /<published>([^<]+)<\/published>/.exec(e)?.[1] || "",
    })).filter((v) => v.id);
    await store.setJSON(key, { at: Date.now(), id, videos });
    return { videos };
  } catch (err) {
    console.error("youtube", err);
    return { videos: cached?.videos || [] };
  }
}
