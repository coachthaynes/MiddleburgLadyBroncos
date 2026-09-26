import type { Config } from "@netlify/functions";
import { getSettings, readCookie, recordEvent } from "../lib/core.mts";

// Every Donate button points here. We count the click, then send the donor to the school portal.
export default async (req: Request) => {
  const url = new URL(req.url);
  const slug = (url.pathname.split("/")[2] || "team").toLowerCase().replace(/[^a-z0-9]/g, "") || "team";
  const settings = await getSettings();

  if (!settings.donateUrl) {
    return Response.redirect(new URL(slug === "team" ? "/?soon=1" : `/p/${slug}?soon=1`, url), 302);
  }

  // Count each browser once per player per 12 hours so refreshes do not pad the numbers.
  const cookieName = `mlb_go_${slug}`;
  const headers = new Headers({ location: settings.donateUrl, "cache-control": "no-store" });
  if (!readCookie(req, cookieName)) {
    await recordEvent("donate", slug);
    headers.append("set-cookie", `${cookieName}=1; Path=/go; Max-Age=${60 * 60 * 12}; SameSite=Lax`);
  }
  return new Response(null, { status: 302, headers });
};

export const config: Config = { path: ["/go", "/go/*"] };
