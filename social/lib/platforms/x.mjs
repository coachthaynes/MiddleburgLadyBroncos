// X (Twitter) through the X API v2 with OAuth 2.0 and PKCE.
import crypto from "node:crypto";
import { saveChannel } from "../store.mjs";

const API = "https://api.x.com/2";
export const X_SCOPES = ["tweet.read", "tweet.write", "users.read", "media.write", "offline.access"];

export const xConfigured = () => !!process.env.X_CLIENT_ID;

export function pkcePair() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function xAuthUrl({ redirectUri, state, challenge }) {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: process.env.X_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: X_SCOPES.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256"
  });
  return `https://x.com/i/oauth2/authorize?${p}`;
}

async function tokenRequest(params) {
  const headers = { "content-type": "application/x-www-form-urlencoded" };
  if (process.env.X_CLIENT_SECRET) {
    headers.authorization = "Basic " + Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString("base64");
  }
  const res = await fetch(`${API}/oauth2/token`, {
    method: "POST",
    headers,
    body: new URLSearchParams({ client_id: process.env.X_CLIENT_ID, ...params })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || `X token error ${res.status}`);
  return data;
}

async function api(path, token, init = {}) {
  const res = await fetch(path.startsWith("http") ? path : API + path, {
    ...init,
    headers: { authorization: `Bearer ${token}`, ...(init.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.detail || data.title || data.errors?.[0]?.message || `X API error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function xExchange({ code, redirectUri, verifier }) {
  const tok = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri, code_verifier: verifier });
  const me = await api("/users/me?user.fields=profile_image_url,name,username", tok.access_token);
  return [{
    id: `x_${me.data.id}`,
    platform: "x",
    remoteId: me.data.id,
    name: `@${me.data.username}`,
    avatar: me.data.profile_image_url || null,
    token: tok.access_token,
    refreshToken: tok.refresh_token,
    expiresAt: Date.now() + (tok.expires_in || 7200) * 1000
  }];
}

// Access tokens last about two hours; refresh tokens rotate on every use.
async function freshToken(channel) {
  if (channel.expiresAt && Date.now() < channel.expiresAt - 120000) return channel.token;
  if (!channel.refreshToken) throw new Error("X login expired. Reconnect the X account.");
  const tok = await tokenRequest({ grant_type: "refresh_token", refresh_token: channel.refreshToken });
  channel.token = tok.access_token;
  channel.refreshToken = tok.refresh_token || channel.refreshToken;
  channel.expiresAt = Date.now() + (tok.expires_in || 7200) * 1000;
  await saveChannel(channel);
  return channel.token;
}

export async function publishX(channel, { text, image }) {
  const token = await freshToken(channel);
  const body = { text };
  if (image) {
    const form = new FormData();
    form.set("media", new Blob([image.data], { type: image.contentType }), "image.jpg");
    form.set("media_category", "tweet_image");
    const up = await api("/media/upload", token, { method: "POST", body: form });
    const mediaId = up.data?.id || up.media_id_string;
    if (mediaId) body.media = { media_ids: [String(mediaId)] };
  }
  const r = await api("/tweets", token, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return { remoteId: r.data.id, url: `https://x.com/${channel.name.replace(/^@/, "")}/status/${r.data.id}` };
}
