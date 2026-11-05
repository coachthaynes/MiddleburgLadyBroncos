import type { Config } from "@netlify/functions";
import { createHmac, timingSafeEqual } from "node:crypto";
import { recordEmailEvent } from "../lib/prospects.mts";

// Resend calls this when an email to a business is delivered, opened, clicked, bounced or marked as spam.
// Each call is signed with the webhook signing secret from Resend (RESEND_WEBHOOK_SECRET), so nobody else can fake one.
function verified(req: Request, body: string) {
  const secret = Netlify.env.get("RESEND_WEBHOOK_SECRET") || "";
  const id = req.headers.get("svix-id") || "", ts = req.headers.get("svix-timestamp") || "", sigs = req.headers.get("svix-signature") || "";
  if (!secret || !id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 600) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expect = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest();
  return sigs.split(" ").some((part) => {
    const sig = Buffer.from(part.split(",")[1] || "", "base64");
    return sig.length === expect.length && timingSafeEqual(sig, expect);
  });
}

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("ok");
  const body = await req.text();
  if (!verified(req, body)) return new Response("bad signature", { status: 401 });
  let event: { type?: string; data?: unknown } = {};
  try { event = JSON.parse(body); } catch { return new Response("bad body", { status: 400 }); }
  await recordEmailEvent(String(event.type || ""), event.data);
  return new Response("ok");
};

export const config: Config = { path: "/hooks/resend" };
