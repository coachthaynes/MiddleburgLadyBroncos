// Team contracts signed online. Only coaches can read them back.
import { createHash, randomBytes } from "node:crypto";
import { clean, db } from "./core.mts";

export const CONTRACT_VERSION = "2026 to 2027 v1";
const DOCS = ["player", "parent"] as const;
type Doc = (typeof DOCS)[number];

export interface SignedContract {
  id: string;
  doc: Doc;
  version: string;
  createdAt: string;
  fields: { playerName: string; grade: string; team: "varsity" | "jv"; parentName: string; parentPhone: string; parentEmail: string; role: string };
  signatures: { player?: { name: string; image: string }; parent: { name: string; image: string } };
  signer: { ipHash: string; userAgent: string };
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
// A drawn signature as a PNG, small enough to keep (a 600 by 170 pad is usually well under 60 KB).
const sigImage = (v: unknown) => {
  const s = String(v ?? "");
  return /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s) && s.length < 300_000 ? s : "";
};
const ipHash = (ip: string) => createHash("sha256").update(`contracts:${ip}`).digest("hex").slice(0, 24);

// Up to 10 signings per device every 15 minutes, enough for a family signing for several daughters.
async function tooMany(ip: string) {
  const key = `rlc/${ipHash(ip)}`;
  const rec = (await db().get(key, { type: "json" })) as { n: number; t: number } | null;
  const fresh = !rec || Date.now() - rec.t > 15 * 60 * 1000;
  if (!fresh && rec!.n >= 10) return true;
  await db().setJSON(key, { n: fresh ? 1 : rec!.n + 1, t: fresh ? Date.now() : rec!.t });
  return false;
}

export async function signContract(body: any, ip: string, userAgent: string) {
  const doc = (DOCS as readonly string[]).includes(body?.doc) ? (body.doc as Doc) : null;
  if (!doc) return { error: "Unknown contract.", status: 400 };
  if (clean(body?.company, 50)) return { error: "Please try again.", status: 400 }; // spam trap
  if (await tooMany(ip)) return { error: "Too many signatures from this device. Please try again in a few minutes.", status: 429 };
  const f = {
    playerName: clean(body?.playerName, 60),
    grade: ["9", "10", "11", "12"].includes(String(body?.grade)) ? String(body.grade) : "",
    team: body?.team === "jv" ? "jv" as const : body?.team === "varsity" ? "varsity" as const : null,
    parentName: clean(body?.parentName, 60),
    parentPhone: clean(body?.parentPhone, 30),
    parentEmail: clean(body?.parentEmail, 120).toLowerCase(),
    role: doc === "parent" ? clean(body?.role, 60) : "",
  };
  if (f.playerName.length < 3) return { error: "Please enter the player's full name.", status: 400 };
  if (doc === "player" && !f.grade) return { error: "Please choose a grade.", status: 400 };
  if (!f.team) return { error: "Please choose Varsity or JV.", status: 400 };
  if (f.parentName.length < 3) return { error: "Please enter the parent or guardian's full name.", status: 400 };
  if (!f.parentPhone) return { error: "Please enter a phone number.", status: 400 };
  if (!isEmail(f.parentEmail)) return { error: "Please enter a valid email.", status: 400 };
  if (doc === "parent" && !f.role) return { error: "Please choose a volunteer role.", status: 400 };
  if (body?.agree !== true || body?.esign !== true) return { error: "Please check both agreement boxes.", status: 400 };
  const parentSig = sigImage(body?.signatures?.parent);
  const playerSig = doc === "player" ? sigImage(body?.signatures?.player) : "";
  if (!parentSig || (doc === "player" && !playerSig)) return { error: "Please sign in each signature box.", status: 400 };

  const rec: SignedContract = {
    id: `${Date.now()}${randomBytes(4).toString("hex")}`,
    doc, version: CONTRACT_VERSION, createdAt: new Date().toISOString(),
    fields: { ...f, team: f.team },
    signatures: { parent: { name: f.parentName, image: parentSig }, ...(playerSig ? { player: { name: f.playerName, image: playerSig } } : {}) },
    signer: { ipHash: ipHash(ip), userAgent: clean(userAgent, 200) },
  };
  await db().setJSON(`contracts/${rec.id}`, rec);
  return { ok: true as const, record: rec };
}

// The list leaves out the signature images to stay light. Open one record to see them.
export async function listContracts() {
  const store = db();
  const { blobs } = await store.list({ prefix: "contracts/" });
  const all = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean) as SignedContract[];
  return all
    .map(({ signatures, signer, ...rest }) => ({ ...rest, signed: { player: !!signatures.player, parent: !!signatures.parent } }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getContract(id: string) {
  return (await db().get(`contracts/${id.replace(/[^\w]/g, "")}`, { type: "json" })) as SignedContract | null;
}

export async function deleteContract(id: string) {
  await db().delete(`contracts/${id.replace(/[^\w]/g, "")}`);
}
