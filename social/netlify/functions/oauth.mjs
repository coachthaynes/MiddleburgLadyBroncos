// Connect flow for social accounts: /oauth/:provider/start and /oauth/:provider/callback
import { cookie, isLoggedIn, readCookie, redirect, sign, siteUrl, unsign } from "../../lib/http.mjs";
import { newId, saveChannel } from "../../lib/store.mjs";
import { metaAuthUrl, metaConfigured, metaExchange } from "../../lib/platforms/meta.mjs";
import { pkcePair, xAuthUrl, xConfigured, xExchange } from "../../lib/platforms/x.mjs";

const STATE_COOKIE = "bs_oauth";

const back = (req, params) => redirect(`${siteUrl(req)}/#channels?${new URLSearchParams(params)}`, {
  "set-cookie": cookie(req, STATE_COOKIE, "", 0)
});

export default async (req) => {
  const url = new URL(req.url);
  const [, , provider, step] = url.pathname.split("/");
  const redirectUri = `${siteUrl(req)}/oauth/${provider}/callback`;

  if (!isLoggedIn(req)) return redirect(`${siteUrl(req)}/`);
  if (!["meta", "x"].includes(provider)) return back(req, { error: "Unknown provider" });
  if (provider === "meta" && !metaConfigured()) return back(req, { error: "Facebook app keys are not set on the server yet." });
  if (provider === "x" && !xConfigured()) return back(req, { error: "X app keys are not set on the server yet." });

  if (step === "start") {
    const state = newId(12);
    let location;
    let verifier;
    if (provider === "meta") {
      location = metaAuthUrl({ redirectUri, state });
    } else {
      const pair = pkcePair();
      verifier = pair.verifier;
      location = xAuthUrl({ redirectUri, state, challenge: pair.challenge });
    }
    const packed = sign({ state, verifier, provider, exp: Date.now() + 10 * 60 * 1000 });
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
      const channels = provider === "meta"
        ? await metaExchange({ code, redirectUri })
        : await xExchange({ code, redirectUri, verifier: saved.verifier });
      for (const ch of channels) await saveChannel({ ...ch, connectedAt: new Date().toISOString() });
      if (!channels.length) return back(req, { error: "No Facebook Pages were shared. Pick your team Page when Facebook asks." });
      return back(req, { connected: channels.length });
    } catch (err) {
      return back(req, { error: String(err.message || err) });
    }
  }

  return back(req, { error: "Unknown step" });
};

export const config = { path: "/oauth/*" };
