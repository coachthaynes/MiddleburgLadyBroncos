(function () {
  const S = window.STORE;
  const $ = (q, r = document) => r.querySelector(q);
  const $$ = (q, r = document) => Array.from(r.querySelectorAll(q));
  const money = (n) => "$" + Number(n).toFixed(2).replace(/\.00$/, "");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const IMG = "/img/products/";
  const photo = (file, alt = "") => `<img src="${IMG}${file}" alt="${esc(alt)}" loading="lazy" draggable="false">`;
  const CATEGORIES = { All: null, Tees: "tees", Hoodies: "hoodies", Warmups: "warmups", Bottoms: "bottoms", Hats: "hats" };
  const sizesFor = (p) => p.sizes || [...S.youth, ...S.adult];
  const byKey = (k) => S.products.find((p) => p.key === k);

  $$(".pct").forEach((el) => { el.textContent = S.giveBackPercent; });
  ["#fundLink", "#fundLink2", "#fundLink3"].forEach((id) => { $(id).href = S.fundraiserUrl; });
  $("#shipCost").textContent = money(S.shipping);

  // ---------- hero turntable ----------
  $("#ttFront").innerHTML = photo("fearherd.jpg", "Fear the Herd hoodie front");
  $("#ttBack").innerHTML = photo("fearherd_back.jpg", "Fear the Herd hoodie back");
  let tilt = { x: 0, y: 0 };
  const tt = $("#turntable");
  function spinHero() {
    const p = Math.min(1, window.scrollY / (window.innerHeight * 0.9));
    tt.style.transform = `rotateY(${(reduced ? 0 : p * 360) + tilt.x}deg) rotateX(${tilt.y}deg)`;
  }
  window.addEventListener("pointermove", (e) => {
    if (reduced) return;
    tilt = { x: (e.clientX / innerWidth - 0.5) * 18, y: (0.5 - e.clientY / innerHeight) * 10 };
    spinHero();
  }, { passive: true });

  // ---------- scroll ring ----------
  const ring = $("#ring");
  const step = 360 / S.products.length;
  ring.innerHTML = S.products.map((p, i) => `<div class="ring-item" data-i="${i}"><div class="glass">${photo(p.img, p.name)}</div></div>`).join("");
  function layoutRing() {
    const w = ring.offsetWidth;
    const radius = Math.round(w / (2 * Math.tan(Math.PI / S.products.length)) + w * 0.18);
    $$(".ring-item", ring).forEach((el, i) => { el.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`; });
    ring.dataset.r = radius;
  }
  function spinRing() {
    const sec = $("#ringSection");
    const r = sec.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    const angle = reduced ? 0 : p * 360;
    ring.style.transform = `translateZ(${-ring.dataset.r}px) rotateY(${-angle}deg)`;
    const front = Math.round(angle / step) % S.products.length;
    const prod = S.products[front];
    $("#ringName").innerHTML = `<b>${esc(prod.name)}</b> · ${money(prod.price)}`;
  }
  $("#ring").addEventListener("click", (e) => {
    const it = e.target.closest(".ring-item");
    if (it) openProduct(S.products[+it.dataset.i]);
  });

  function onScroll() { spinHero(); spinRing(); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { layoutRing(); onScroll(); });

  // ---------- product grid ----------
  let filter = "All";
  $("#filters").innerHTML = Object.keys(CATEGORIES).map((c) => `<button data-f="${c}" class="${c === filter ? "on" : ""}">${c}</button>`).join("");
  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    filter = b.dataset.f;
    $$("#filters button").forEach((x) => x.classList.toggle("on", x === b));
    renderProducts();
  });

  function renderProducts() {
    const list = S.products.filter((p) => !CATEGORIES[filter] || CATEGORIES[filter] === p.cat);
    $("#products").innerHTML = list.map((p) => `
      <button class="glass product" data-key="${p.key}">
        <div class="pv">${photo(p.img, p.name)}</div>
        <h3>${esc(p.name)}</h3>
        <div class="row"><span class="price">${money(p.price)}</span><span class="tag">${esc(p.prints)}</span></div>
      </button>`).join("");
  }
  $("#products").addEventListener("click", (e) => {
    const b = e.target.closest("[data-key]");
    if (b) openProduct(byKey(b.dataset.key));
  });
  $("#products").addEventListener("pointermove", (e) => {
    const card = e.target.closest(".product");
    if (!card || reduced) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-4px)`;
  });
  $("#products").addEventListener("pointerout", (e) => {
    const card = e.target.closest(".product");
    if (card && !card.contains(e.relatedTarget)) card.style.transform = "";
  });

  // ---------- product sheet ----------
  const pm = { p: null, size: "", qty: 1, flipped: false, spin: 0 };
  const cleanName = (v) => String(v || "").replace(/[^A-Za-z .\'-]/g, "").slice(0, 14).trim();
  function drawSheet() {
    const p = pm.p;
    $("#pmFront").innerHTML = photo(pm.view || p.img, p.name);
    $("#pmBack").innerHTML = p.back ? photo(p.back, `${p.name} back`) : "";
    const shots = [p.img, p.back, ...(p.extra || [])].filter(Boolean);
    $("#pmThumbs").innerHTML = shots.length > 1 ? shots.map((f) => `<button data-v="${f}" class="${(pm.flipped ? f === p.back : f === (pm.view || p.img)) ? "on" : ""}">${photo(f)}</button>`).join("") : "";
    $("#pmFlip").classList.toggle("hidden", !p.back);
    $("#pmNameWrap").classList.toggle("hidden", !p.sleeveName);
    $("#pmSizes").innerHTML = sizesFor(p).map((s) => `<button data-s="${s}" class="${s === pm.size ? "on" : ""}">${s}</button>`).join("");
    $("#pmQty").textContent = pm.qty;
    $("#pmPrice").textContent = money(p.price);
    $("#pmCard").style.transform = `rotateY(${pm.spin + (pm.flipped ? 180 : 0)}deg)`;
  }
  function openProduct(p) {
    Object.assign(pm, { p, size: p.sizes ? p.sizes[0] : "", qty: 1, flipped: false, spin: 0, view: "" });
    $("#pmPlayer").value = "";
    $("#pmName").textContent = p.name;
    $("#pmBlurb").textContent = p.blurb;
    $("#pmPrints").textContent = p.prints;
    $("#pmFlip").textContent = "See the back";
    $("#pmErr").textContent = "";
    drawSheet();
    $("#productModal").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeProduct() {
    $("#productModal").classList.remove("open");
    document.body.style.overflow = "";
  }
  $("#productModal").addEventListener("click", (e) => {
    if (e.target.id === "productModal" || e.target.closest("[data-close]")) return closeProduct();
    const s = e.target.closest("[data-s]"), v = e.target.closest("[data-v]");
    if (s) { pm.size = s.dataset.s; $("#pmErr").textContent = ""; drawSheet(); }
    if (v) {
      if (v.dataset.v === pm.p.back) { pm.flipped = true; pm.view = ""; }
      else { pm.flipped = false; pm.view = v.dataset.v; }
      drawSheet();
    }
  });
    $("#pmFlip").addEventListener("click", () => { pm.flipped = !pm.flipped; pm.view = ""; drawSheet(); });
  $("#qMinus").addEventListener("click", () => { pm.qty = Math.max(1, pm.qty - 1); drawSheet(); });
  $("#qPlus").addEventListener("click", () => { pm.qty = Math.min(20, pm.qty + 1); drawSheet(); });

  // Drag the garment to spin it.
  let drag = null;
  $("#pmStage").addEventListener("pointerdown", (e) => { if (!pm.p.back) return; drag = { x: e.clientX, start: pm.spin }; $("#pmCard").style.transition = "none"; });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    pm.spin = drag.start + (e.clientX - drag.x) * 0.8;
    $("#pmCard").style.transform = `rotateY(${pm.spin + (pm.flipped ? 180 : 0)}deg)`;
  });
  window.addEventListener("pointerup", () => {
    if (!drag) return;
    drag = null;
    $("#pmCard").style.transition = "";
    pm.spin = Math.round(pm.spin / 180) * 180;
    $("#pmCard").style.transform = `rotateY(${pm.spin + (pm.flipped ? 180 : 0)}deg)`;
  });

  $("#pmAdd").addEventListener("click", () => {
    if (!pm.size) { $("#pmErr").textContent = "Please pick a size."; return; }
    const item = {
      key: pm.p.key, title: pm.p.name, price: pm.p.price, size: pm.size, qty: pm.qty,
      player: pm.p.sleeveName ? cleanName($("#pmPlayer").value) : "",
    };
    const same = cart.find((i) => i.key === item.key && i.size === item.size && i.player === item.player);
    if (same) same.qty = Math.min(20, same.qty + item.qty); else cart.push(item);
    saveCart();
    closeProduct();
    openCart();
  });

  // ---------- cart ----------
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("lb_cart") || "[]"); } catch { cart = []; }
  // Drop items saved from older versions of the store.
  cart = Array.isArray(cart) ? cart.filter((i) => i && i.title && byKey(i.key)) : [];
  function saveCart() {
    try { localStorage.setItem("lb_cart", JSON.stringify(cart)); } catch { /* private mode */ }
    renderCart();
  }
  const describe = (i) => `size ${i.size}${i.player ? `, sleeve name ${i.player}` : ""}`;
  function totals() {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const ship = cart.length && $('#checkout [name="delivery"]:checked')?.value === "ship" ? S.shipping : 0;
    return { subtotal, ship, total: subtotal + ship, give: Math.round(subtotal * S.giveBackPercent) / 100 };
  }
  function renderCart() {
    $("#cartCount").textContent = cart.reduce((s, i) => s + i.qty, 0);
    if (!cart.length) {
      $("#cartItems").innerHTML = '<p class="muted">Your cart is empty. Find something you love below!</p>';
      $("#cartSummary").innerHTML = "";
      $("#checkout").classList.add("hidden");
      return;
    }
    $("#cartItems").innerHTML = cart.map((i, n) => `
      <div class="line">
        <div class="pv">${photo(byKey(i.key).img)}</div>
        <div><b>${esc(i.title)}</b><small>${esc(describe(i))}</small><small>Qty ${i.qty} · ${money(i.price * i.qty)}</small></div>
        <button class="rm" data-rm="${n}">Remove</button>
      </div>`).join("");
    const t = totals();
    $("#cartSummary").innerHTML = `<div class="sum">
      <div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
      ${t.ship ? `<div><span>Shipping</span><span>${money(t.ship)}</span></div>` : ""}
      <div class="total"><span>Total</span><span>${money(t.total)}</span></div>
      <div class="give"><span>Gifted to the Lady Broncos</span><span>${money(t.give)}</span></div></div>`;
    $("#checkout").classList.remove("hidden");
  }
  $("#cartItems").addEventListener("click", (e) => {
    const b = e.target.closest("[data-rm]");
    if (b) { cart.splice(+b.dataset.rm, 1); saveCart(); }
  });
  function openCart() { $("#cart").classList.add("open"); $("#scrim").classList.add("open"); }
  function closeCart() { $("#cart").classList.remove("open"); $("#scrim").classList.remove("open"); }
  $("#openCart").addEventListener("click", openCart);
  $("#scrim").addEventListener("click", closeCart);
  $("[data-close-cart]").addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeProduct(); closeCart(); } });

  $$('#checkout [name="delivery"]').forEach((r) => r.addEventListener("change", () => {
    const ship = $('#checkout [name="delivery"]:checked').value === "ship";
    $("#addrWrap").classList.toggle("hidden", !ship);
    $('#checkout [name="address"]').required = ship;
    renderCart();
  }));

  $("#checkout").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const t = totals();
    const data = new URLSearchParams({
      "form-name": "orders",
      name: f.name.value, email: f.email.value, phone: f.phone.value, player: f.player.value,
      delivery: f.delivery.value, address: f.address.value,
      items: cart.map((i) => `${i.qty} x ${i.title} (${describe(i)}) ${money(i.price * i.qty)}`).join("\n"),
      subtotal: money(t.subtotal), shipping: money(t.ship), total: money(t.total), giveback: money(t.give),
    });
    const btn = $("#placeOrder");
    btn.disabled = true;
    btn.textContent = "Sending...";
    try {
      const res = await fetch("/", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: data.toString() });
      if (!res.ok) throw new Error();
      cart = [];
      saveCart();
      f.reset();
      $("#cartItems").innerHTML = `<div class="notice good">Thank you! Your order is in. ${money(t.give)} of it goes to the Lady Broncos.</div>
        ${S.paymentUrl ? `<p style="margin-top:14px">Please finish by paying <b>${money(t.total)}</b>:</p><a class="btn btn-primary btn-big" style="width:100%" href="${esc(S.paymentUrl)}" target="_blank" rel="noopener">Pay now</a>`
          : `<p class="muted" style="margin-top:14px">A coach will reach out with payment details and a pickup or shipping date.</p>`}`;
    } catch {
      $("#coErr").textContent = "We could not send your order. Please try again.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Place order";
    }
  });

  // ---------- start ----------
  renderProducts();
  renderCart();
  document.fonts.ready.then(() => { layoutRing(); onScroll(); });
  layoutRing();
  onScroll();
})();
