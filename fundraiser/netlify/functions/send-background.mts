import { safeEqual } from "../lib/core.mts";
import { runSend, sendKey, siteOrigin } from "../lib/messaging.mts";

// Sends any messages that are due. Runs in the background for up to 15 minutes.
export default async (req: Request) => {
  if (!safeEqual(req.headers.get("x-send-key") || "", await sendKey())) return;
  const result = await runSend(siteOrigin(new URL(req.url).origin));
  console.log("send run", JSON.stringify(result));
};
