// Facebook Pages and Instagram (professional accounts) through the Meta Graph API.
const VERSION = () => process.env.META_GRAPH_VERSION || "v23.0";
const GRAPH = () => `https://graph.facebook.com/${VERSION()}`;

export const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "business_management",
  "instagram_basic",
  "instagram_content_publish"
];

export const metaConfigured = () => !!(process.env.META_APP_ID && process.env.META_APP_SECRET);

export function metaAuthUrl({ redirectUri, state }) {
  const p = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: redirectUri,
    state,
    response_type: "code"
  });
  // Apps created with "Facebook Login for Business" use a configuration id instead of scopes.
  if (process.env.META_CONFIG_ID) p.set("config_id", process.env.META_CONFIG_ID);
  else p.set("scope", META_SCOPES.join(","));
  return `https://www.facebook.com/${VERSION()}/dialog/oauth?${p}`;
}

async function graph(pathOrUrl, { method = "GET", params = {}, token } = {}) {
  const url = new URL(pathOrUrl.startsWith("http") ? pathOrUrl : GRAPH() + pathOrUrl);
  const body = new URLSearchParams();
  const target = method === "GET" ? url.searchParams : body;
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) target.set(k, v);
  if (token) target.set("access_token", token);
  const res = await fetch(url, method === "GET" ? {} : { method, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const msg = data.error?.error_user_msg || data.error?.message || `Meta API error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Exchange the login code for a long lived user token, then list Pages and linked Instagram accounts.
export async function metaExchange({ code, redirectUri }) {
  const short = await graph("/oauth/access_token", {
    params: {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: redirectUri,
      code
    }
  });
  const long = await graph("/oauth/access_token", {
    params: {
      grant_type: "fb_exchange_token",
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: short.access_token
    }
  });
  const pages = await graph("/me/accounts", {
    token: long.access_token,
    params: {
      fields: "id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}",
      limit: 100
    }
  });
  const channels = [];
  for (const page of pages.data || []) {
    // Page tokens derived from a long lived user token do not expire.
    channels.push({
      id: `facebook_${page.id}`,
      platform: "facebook",
      remoteId: page.id,
      name: page.name,
      avatar: page.picture?.data?.url || null,
      token: page.access_token
    });
    const ig = page.instagram_business_account;
    if (ig) {
      channels.push({
        id: `instagram_${ig.id}`,
        platform: "instagram",
        remoteId: ig.id,
        name: ig.username ? `@${ig.username}` : `${page.name} Instagram`,
        avatar: ig.profile_picture_url || null,
        token: page.access_token,
        pageId: page.id
      });
    }
  }
  return channels;
}

export async function publishFacebook(channel, { text, imageUrl, link }) {
  if (imageUrl) {
    const r = await graph(`/${channel.remoteId}/photos`, {
      method: "POST",
      token: channel.token,
      params: { url: imageUrl, caption: text, published: "true" }
    });
    const pid = r.post_id || r.id;
    return { remoteId: pid, url: `https://www.facebook.com/${pid}` };
  }
  const r = await graph(`/${channel.remoteId}/feed`, {
    method: "POST",
    token: channel.token,
    params: { message: text, link: link || undefined }
  });
  return { remoteId: r.id, url: `https://www.facebook.com/${r.id}` };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function publishInstagram(channel, { text, imageUrl }) {
  if (!imageUrl) throw new Error("Instagram posts need an image. Add a photo.");
  const container = await graph(`/${channel.remoteId}/media`, {
    method: "POST",
    token: channel.token,
    params: { image_url: imageUrl, caption: text }
  });
  // Wait for Instagram to finish processing the image (usually a few seconds).
  for (let i = 0; i < 10; i++) {
    const st = await graph(`/${container.id}`, { token: channel.token, params: { fields: "status_code" } });
    if (st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR" || st.status_code === "EXPIRED") throw new Error(`Instagram could not process the image (${st.status_code})`);
    await wait(2000);
  }
  const pub = await graph(`/${channel.remoteId}/media_publish`, {
    method: "POST",
    token: channel.token,
    params: { creation_id: container.id }
  });
  let url = null;
  try {
    const info = await graph(`/${pub.id}`, { token: channel.token, params: { fields: "permalink" } });
    url = info.permalink || null;
  } catch { /* permalink is optional */ }
  return { remoteId: pub.id, url };
}
