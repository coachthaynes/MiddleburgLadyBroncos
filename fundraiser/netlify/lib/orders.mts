// Team store orders: the store checkout saves them here and coaches track payment and fulfillment on the dashboard.
import { createHash, randomBytes } from "node:crypto";
import { clean, db, money } from "./core.mts";

export const PAYMENT = ["unpaid", "paid", "refunded"] as const;
export const METHODS = ["", "cash", "check", "card", "venmo", "cashapp", "zelle", "other"] as const;
export const FULFILL = ["new", "ordered", "ready", "complete", "canceled"] as const;

export interface OrderItem { key: string; title: string; color: string; size: string; name: string; qty: number; price: number }
export interface Order {
  id: string;
  number: number;
  createdAt: string;
  updatedAt: string;
  buyer: { name: string; email: string; phone: string };
  player: string; // the player the buyer is supporting
  delivery: "pickup" | "ship";
  address: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  givebackPercent: number;
  payment: { status: (typeof PAYMENT)[number]; method: (typeof METHODS)[number]; amount: number; paidAt: string };
  fulfillment: (typeof FULFILL)[number];
  note: string;
  source: "store" | "coach";
}

const cents = (n: number) => Math.round(n * 100) / 100;
const pick = <T extends readonly string[]>(list: T, v: unknown, fallback: T[number]): T[number] =>
  (list as readonly string[]).includes(String(v)) ? (String(v) as T[number]) : fallback;
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);

export function cleanItems(v: unknown): OrderItem[] {
  return (Array.isArray(v) ? v.slice(0, 40) : []).map((x: any) => ({
    key: clean(x?.key, 40).replace(/[^\w-]/g, ""),
    title: clean(x?.title, 60),
    color: clean(x?.color, 30),
    size: clean(x?.size, 12),
    name: clean(x?.name ?? x?.player, 14),
    qty: Math.max(1, Math.min(20, Math.floor(Number(x?.qty) || 1))),
    price: Math.min(500, cents(money(x?.price))),
  })).filter((i) => i.title);
}

function totalsFor(items: OrderItem[], shipping: number) {
  const subtotal = cents(items.reduce((n, i) => n + i.price * i.qty, 0));
  return { subtotal, shipping, total: cents(subtotal + shipping) };
}

// Order numbers count up from 1001 so families and coaches can refer to "order 1004".
async function nextNumber() {
  const store = db();
  const cur = (await store.get("orders-meta/seq", { type: "json" })) as { n: number } | null;
  const n = (cur?.n || 1000) + 1;
  await store.setJSON("orders-meta/seq", { n });
  return n;
}

export async function listOrders(): Promise<Order[]> {
  const store = db();
  const { blobs } = await store.list({ prefix: "orders/" });
  const all = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  return (all.filter(Boolean) as Order[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(id: string) {
  return (await db().get(`orders/${id.replace(/[^\w]/g, "")}`, { type: "json" })) as Order | null;
}

async function saveOrder(o: Order) {
  await db().setJSON(`orders/${o.id}`, o);
}

// Up to 8 orders per visitor every 15 minutes keeps the form from being flooded.
async function tooManyOrders(ip: string) {
  const key = `rlo/${createHash("sha256").update(ip).digest("hex").slice(0, 24)}`;
  const rec = (await db().get(key, { type: "json" })) as { n: number; t: number } | null;
  const fresh = !rec || Date.now() - rec.t > 15 * 60 * 1000;
  if (!fresh && rec!.n >= 8) return true;
  await db().setJSON(key, { n: fresh ? 1 : rec!.n + 1, t: fresh ? Date.now() : rec!.t });
  return false;
}

export async function createOrder(body: any, ip: string, source: Order["source"] = "store") {
  if (source === "store" && clean(body?.company, 50)) return { ok: true as const, number: 0 }; // spam trap
  if (source === "store" && (await tooManyOrders(ip))) return { error: "Too many orders from this device. Please try again in a few minutes.", status: 429 };
  const items = cleanItems(body?.items);
  if (!items.length) return { error: "Your cart is empty.", status: 400 };
  const name = clean(body?.name, 60);
  if (name.length < 2) return { error: "Please enter your name.", status: 400 };
  const email = clean(body?.email, 120).toLowerCase();
  if (source === "store" && !isEmail(email)) return { error: "Please enter a valid email.", status: 400 };
  if (email && !isEmail(email)) return { error: "That email does not look right.", status: 400 };
  const delivery = body?.delivery === "ship" ? "ship" : "pickup";
  const address = delivery === "ship" ? clean(body?.address, 300) : "";
  if (delivery === "ship" && address.length < 8) return { error: "Please enter a shipping address.", status: 400 };
  const now = new Date().toISOString();
  const paid = source === "coach" && body?.paid === true;
  const t = totalsFor(items, delivery === "ship" ? Math.min(50, cents(money(body?.shipping))) : 0);
  const order: Order = {
    id: `${Date.now()}${randomBytes(4).toString("hex")}`,
    number: await nextNumber(),
    createdAt: now, updatedAt: now,
    buyer: { name, email, phone: clean(body?.phone, 30) },
    player: clean(body?.player, 60),
    delivery, address, items, ...t,
    givebackPercent: Math.max(0, Math.min(100, Math.round(Number(body?.givebackPercent) || 30))),
    payment: { status: paid ? "paid" : "unpaid", method: paid ? pick(METHODS, body?.method, "cash") : "", amount: paid ? t.total : 0, paidAt: paid ? now : "" },
    fulfillment: "new",
    note: source === "coach" ? clean(body?.note, 500) : "",
    source,
  };
  await saveOrder(order);
  return { ok: true as const, number: order.number, order };
}

// Coach updates: payment, fulfillment, notes and contact fixes. Totals follow any item edits.
export async function updateOrder(id: string, body: any) {
  const o = await getOrder(id);
  if (!o) return null;
  if (body?.payment) {
    const p = body.payment;
    const status = pick(PAYMENT, p.status, o.payment.status);
    o.payment = {
      status,
      method: pick(METHODS, p.method ?? o.payment.method, o.payment.method),
      amount: p.amount !== undefined ? cents(money(p.amount)) : status === "paid" && o.payment.status !== "paid" ? o.total : o.payment.amount,
      paidAt: status === "paid" ? o.payment.paidAt || new Date().toISOString() : "",
    };
  }
  if (body?.fulfillment) o.fulfillment = pick(FULFILL, body.fulfillment, o.fulfillment);
  if (body?.note !== undefined) o.note = clean(body.note, 500);
  if (body?.buyer) {
    const b = body.buyer;
    if (b.name !== undefined && clean(b.name, 60).length >= 2) o.buyer.name = clean(b.name, 60);
    if (b.email !== undefined) { const e = clean(b.email, 120).toLowerCase(); if (!e || isEmail(e)) o.buyer.email = e; }
    if (b.phone !== undefined) o.buyer.phone = clean(b.phone, 30);
  }
  if (Array.isArray(body?.items)) {
    const items = cleanItems(body.items);
    if (items.length) Object.assign(o, { items }, totalsFor(items, o.shipping));
  }
  o.updatedAt = new Date().toISOString();
  await saveOrder(o);
  return o;
}

export async function deleteOrder(id: string) {
  await db().delete(`orders/${id.replace(/[^\w]/g, "")}`);
}
