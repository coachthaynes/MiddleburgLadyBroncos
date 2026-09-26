// Small helpers shared by every function: JSON responses, signed cookies, login checks.
import crypto from "node:crypto";

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers }
  });

export const redirect = (location, headers = {}) =>
  new Response(null, { status: 302, headers: { location, ...headers } });

export function siteUrl(req) {
  const env = process.env.PUBLIC_URL || process.env.URL;
  if (env) return env.replace(/\/$/, "");
  return new URL(req.url).origin;
}

function secret() {
  const s = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

export function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function unsign(value) {
  if (!value || !value.includes(".")) return null;
  const [body, mac] = value.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function readCookie(req, name) {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function cookie(req, name, value, maxAgeSeconds) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export const SESSION_COOKIE = "bs_session";
const SESSION_DAYS = 30;

export function sessionCookie(req) {
  return cookie(req, SESSION_COOKIE, sign({ u: "admin", exp: Date.now() + SESSION_DAYS * 864e5 }), SESSION_DAYS * 86400);
}

export function isLoggedIn(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  return !!unsign(readCookie(req, SESSION_COOKIE));
}

export function checkPassword(given) {
  const real = process.env.ADMIN_PASSWORD || "";
  if (!real) return false;
  const a = crypto.createHash("sha256").update(String(given || "")).digest();
  const b = crypto.createHash("sha256").update(real).digest();
  return crypto.timingSafeEqual(a, b);
}
