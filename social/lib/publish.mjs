// Sends one post to every channel it targets and records the outcome per channel.
import { getChannel, getPost, listPosts, savePost } from "./store.mjs";
import { publishFacebook, publishInstagram } from "./platforms/meta.mjs";

export function textFor(post, platform) {
  const custom = post.variants?.[platform];
  return custom && custom.trim() ? custom : post.text || "";
}

async function publishToChannel(post, channel, siteUrl) {
  const text = textFor(post, channel.platform);
  const imageUrl = post.mediaId ? `${siteUrl}/media/${post.mediaId}.jpg` : null;
  if (process.env.MOCK_PUBLISH) {
    if (channel.platform === "instagram" && !imageUrl) throw new Error("Instagram posts need an image. Add a photo.");
    return { remoteId: "mock", url: null };
  }
  switch (channel.platform) {
    case "facebook":
      return publishFacebook(channel, { text, imageUrl, link: post.link });
    case "instagram":
      return publishInstagram(channel, { text, imageUrl });
    default:
      throw new Error(`Unknown platform ${channel.platform}`);
  }
}

export async function publishPost(post, siteUrl) {
  post.status = "publishing";
  post.results = post.results || {};
  await savePost(post);

  for (const channelId of post.channels || []) {
    if (post.results[channelId]?.status === "published") continue; // already went out on a retry
    const channel = await getChannel(channelId);
    if (!channel) {
      post.results[channelId] = { status: "failed", error: "Channel is no longer connected", at: new Date().toISOString() };
      continue;
    }
    try {
      const r = await publishToChannel(post, channel, siteUrl);
      post.results[channelId] = { status: "published", ...r, at: new Date().toISOString() };
    } catch (err) {
      post.results[channelId] = { status: "failed", error: String(err.message || err), at: new Date().toISOString() };
    }
  }

  const outcomes = (post.channels || []).map((c) => post.results[c]?.status);
  const ok = outcomes.filter((s) => s === "published").length;
  post.status = ok === outcomes.length ? "published" : ok > 0 ? "partial" : "failed";
  post.publishedAt = new Date().toISOString();
  return savePost(post);
}

// Called by the scheduled function: publish everything that is due.
export async function publishDue(siteUrl) {
  const now = Date.now();
  const posts = await listPosts();
  const stale = 15 * 60 * 1000;
  const due = posts.filter((p) =>
    (p.status === "scheduled" && p.scheduledAt && Date.parse(p.scheduledAt) <= now) ||
    (p.status === "publishing" && Date.parse(p.updatedAt) < now - stale)
  );
  const done = [];
  for (const p of due) {
    const fresh = await getPost(p.id); // skip anything edited or deleted since listing
    if (!fresh || !["scheduled", "publishing"].includes(fresh.status)) continue;
    done.push(await publishPost(fresh, siteUrl));
  }
  return done;
}
