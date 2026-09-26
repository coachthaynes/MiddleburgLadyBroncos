// Connect flow for social accounts: /oauth/:provider/start and /oauth/:provider/callback
import { cookie, isLoggedIn, readCookie, redirect, sign, siteUrl, unsign } from "../../lib/http.mjs";
import { newId, saveChannel } from "../../lib/store.mjs";
import { metaAuthUrl, metaConfigured, metaExchange } from "../../lib/platforms/meta.mjs";

const STATE_COOKIE = "bs_oauth";

const back = (req, params) => redirect(`${siteUrl(req)}/#channels?${new URLSearchParams(params)}`, {
  "set-cookie": cookie(req, STATE_COOKIE, "", 0)
});

export default async (req) => {
  const url = new URL(req.url);
  const [, , provider, step] = url.pathname.split("/");
  const redirectUri = `${siteUrl(req)}/oauth/${provider}/callback`;

  if (!isLoggedIn(req)) return redirect(`${siteUrl(req)}/`);
  if (provider !== "meta") return back(req, { error: "Unknown provider" });
  if (!metaConfigured()) return back(req, { error: "Facebook app keys are not set on the server yet." });

  if (step === "start") {
    const state = newId(12);
    const location = metaAuthUrl({ redirectUri, state });
    const packed = sign({ state, provider, exp: Date.now() + 10 * 60 * 1000 });
    return redirect(location, { "set-cookie": cookie(req, STATE_COOKIE, packed, 600) });
  }

  if (step === "callback") {
    const saved = unsign(readCookie(req, STATE_COOKIE));
    const code = url.searchParams.get("code");
    if (url.searchParams.get("error")) return back(req, { error: url.searchParams.get("error_description") || url.searchParams.get("error") });
    if (!saved || saved.provider !== provider || saved.state !== url.searchParams.get("state") || !code) {
      return back(req, { error: "The sign in link expired. Please try connecting again." });
    }
    try {
      const channels = await metaExchange({ code, redirectUri });
      for (const ch of channels) await saveChannel({ ...ch, connectedAt: new Date().toISOString() });
      if (!channels.length) return back(req, { error: "No Facebook Pages were shared. Pick your Page when Facebook asks." });
      return back(req, { connected: channels.length });
    } catch (err) {
      return back(req, { error: String(err.message || err) });
    }
  }

  return back(req, { error: "Unknown step" });
};

export const config = { path: "/oauth/*" };
