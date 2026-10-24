import type { Config } from "@netlify/functions";
import { kickSender, siteOrigin } from "../lib/messaging.mts";

// Every hour, check for messages that are due and hand them to the background sender.
export default async () => {
  const origin = siteOrigin();
  if (origin) await kickSender(origin);
};

export const config: Config = { schedule: "@hourly" };
