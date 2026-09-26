// Shared helpers for every page.
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const ICONS = {
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.9 4.5c2 0 3.6 1.1 5.1 2.9 1.5-1.8 3.1-2.9 5.1-2.9 3.9 0 6 3.9 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
  text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9H17l.5-4h-4V9c0-.6.4-1 1-1z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
};

async function api(path, opts = {}) {
  const init = { method: opts.method || "GET", headers: {}, credentials: "same-origin" };
  if (opts.body instanceof Blob) {
    init.body = opts.body;
    init.headers["content-type"] = opts.body.type;
  } else if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
    init.headers["content-type"] = "application/json";
  }
  const res = await fetch(path, init);
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.status = res.status;
    throw err;
  }
  return data;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtMoney(n, cents = false) {
  return Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents ? 2 : 0, minimumFractionDigits: 0 });
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function initials(name) {
  return String(name || "").split(/\s+/).map((w) => w.charAt(0)).join("").slice(0, 2).toUpperCase();
}

function photoHtml(photo, name, number) {
  const jersey = number ? `<span class="jersey">#${esc(number)}</span>` : "";
  const inner = photo
    ? `<img src="${esc(photo)}" alt="${esc(name)}" loading="lazy">`
    : `<span class="initials">${esc(initials(name))}</span>`;
  return `<div class="ph">${inner}${jersey}</div>`;
}

function avatarHtml(photo, name) {
  return `<div class="av ph">${photo ? `<img src="${esc(photo)}" alt="" loading="lazy">` : `<span class="initials">${esc(initials(name))}</span>`}</div>`;
}

function toast(msg) {
  let t = $(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  toast("Link copied!");
}

function daysLeft(endDate) {
  const end = new Date(endDate + "T23:59:59");
  return Math.max(0, end - new Date());
}

function endLabel(endDate) {
  return new Date(endDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function startCountdown(el, endDate) {
  const tick = () => {
    const ms = daysLeft(endDate);
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    el.innerHTML = [[d, "Days"], [h, "Hours"], [m, "Mins"], [s, "Secs"]]
      .map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join("");
  };
  tick();
  setInterval(tick, 1000);
}

function setBar(el, raised, goal) {
  const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
  requestAnimationFrame(() => setTimeout(() => { el.style.width = pct.toFixed(1) + "%"; }, 120));
  return Math.round(pct);
}

function track(type, slug) {
  const body = JSON.stringify({ type, slug: slug || "team" });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/track", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  }
}

function trackViewOnce(slug) {
  const key = "mlb_viewed_" + (slug || "team");
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch { /* storage blocked, count anyway */ }
  track("view", slug);
}

// Share buttons. The message opens in the sharer's own phone, email or social app.
function shareLinks({ url, message, subject }) {
  const full = `${message} ${url}`;
  const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
  return {
    text: `sms:${isApple ? "&" : "?"}body=${encodeURIComponent(full)}`,
    email: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(full)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
  };
}

function renderShare(container, { url, message, subject, slug }) {
  const l = shareLinks({ url, message, subject });
  const canNative = !!navigator.share;
  container.innerHTML = `
    ${canNative ? `<button class="btn btn-primary" data-s="native">${ICONS.share} Share</button>` : ""}
    <a class="btn btn-glass" data-s="text" href="${esc(l.text)}">${ICONS.text} Text</a>
    <a class="btn btn-glass" data-s="email" href="${esc(l.email)}">${ICONS.mail} Email</a>
    <a class="btn btn-glass" data-s="facebook" href="${esc(l.facebook)}" target="_blank" rel="noopener">${ICONS.facebook} Facebook</a>
    <a class="btn btn-glass" data-s="x" href="${esc(l.x)}" target="_blank" rel="noopener">${ICONS.x} Post on X</a>
    <button class="btn btn-glass" data-s="copy">${ICONS.link} Copy link</button>`;
  container.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-s]");
    if (!b) return;
    const kind = b.dataset.s;
    if (kind === "copy") { copyText(url); track("share", slug); return; }
    if (kind === "native") {
      try { await navigator.share({ title: subject, text: message, url }); track("share", slug); } catch { /* cancelled */ }
      return;
    }
    track("share", slug);
  });
}

function makeQr(container, url) {
  if (typeof qrcode !== "function") {
    container.innerHTML = '<p class="muted">QR code could not load. Try refreshing the page.</p>';
    return null;
  }
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  const img = qr.createDataURL(8, 2);
  container.innerHTML = `<img src="${img}" alt="QR code for ${esc(url)}">`;
  return img;
}

// Shrinks a phone photo before upload so it is quick to send and to load.
function resizeImage(file, max = 1000, type = "image/jpeg") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d");
      if (type === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read that photo."))), type, 0.86);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file does not look like a photo we can read. Try a JPG or PNG.")); };
    img.src = url;
  });
}

function applyBrand(settings) {
  if (settings.logo) $$("img[data-logo]").forEach((i) => { i.src = settings.logo; });
  $$("[data-team]").forEach((el) => { el.textContent = settings.teamName; });
  $$("[data-school]").forEach((el) => { el.textContent = settings.schoolName; });
}

function playerMessage(name, settings) {
  return `Hi! It's ${name} from the ${settings.schoolName} ${settings.teamName}. We are raising ${fmtMoney(settings.goal)} for our season and I would love your support. Every gift goes straight to our school:`;
}
