// Runs every five minutes on Netlify and publishes any post whose time has come.
import { publishDue } from "../../lib/publish.mjs";

export default async () => {
  const base = (process.env.PUBLIC_URL || process.env.URL || "").replace(/\/$/, "");
  const done = await publishDue(base);
  console.log(`Scheduler published ${done.length} post(s)`);
};

export const config = { schedule: "*/5 * * * *" };
