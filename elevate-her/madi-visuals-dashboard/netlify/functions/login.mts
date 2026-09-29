import type { Config } from "@netlify/functions";
import { checkPassword, issueToken, json, fail } from "../lib/core.mts";

// POST /api/login { password } -> { token }
export default async (req: Request) => {
  if (req.method !== "POST") return fail("Method not allowed", 405);
  const { password } = await req.json().catch(() => ({}));
  if (!checkPassword(String(password || ""))) {
    await new Promise(r => setTimeout(r, 800)); // slow down guessing
    return fail("Wrong password", 401);
  }
  return json({ token: issueToken() });
};

export const config: Config = { path: "/api/login" };
