// Coaches dashboard, Store orders tab: payment and fulfillment for every team store order.
(function () {
  const PAY = { unpaid: "Unpaid", paid: "Paid", refunded: "Refunded" };
  const METHOD = { "": "Not set", cash: "Cash", check: "Check", card: "Card", venmo: "Venmo", cashapp: "Cash App", zelle: "Zelle", other: "Other" };
  const STAGE = { new: "New", ordered: "Ordered from vendor", ready: "Ready to hand out", complete: "Picked up or shipped", canceled: "Canceled" };
  const NEXT = { new: "ordered", ordered: "ready", ready: "complete" };
  const NEXT_LABEL = { new: "Mark ordered", ordered: "Mark ready", ready: "Mark complete" };

  let orders = [];
  let filter = "open";
  let query = "";
  const money = (n) => Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const when = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const live = (o) => o.fulfillment !== "canceled";
  const itemLine = (i) => [i.color, i.size && `size ${i.size}`, i.name && `name ${i.name}`].filter(Boolean).join(", ");

  function matches(o) {
    const f = {
      open: live(o) && (o.fulfillment !== "complete" || o.payment.status === "unpaid"),
      unpaid: live(o) && o.payment.status === "unpaid",
      all: true,
    }[filter];
    const ok = f !== undefined ? f : o.fulfillment === filter;
    if (!ok) return false;
    if (!query) return true;
    const hay = [o.number, o.buyer.name, o.buyer.email, o.buyer.phone, o.player, ...o.items.map((i) => `${i.title} ${i.name}`)].join(" ").toLowerCase();
    return hay.includes(query);
  }

  function renderStats() {
    const active = orders.filter(live);
    const open = active.filter((o) => o.fulfillment !== "complete" || o.payment.status === "unpaid");
    const owed = active.filter((o) => o.payment.status === "unpaid").reduce((n, o) => n + o.total, 0);
    const paidOrders = active.filter((o) => o.payment.status === "paid");
    $("#osOpen").textContent = open.length;
    $("#osOwed").textContent = money(owed);
    $("#osPaid").textContent = money(paidOrders.reduce((n, o) => n + (o.payment.amount || o.total), 0));
    $("#osGive").textContent = money(paidOrders.reduce((n, o) => n + (o.subtotal * (o.givebackPercent || 0)) / 100, 0));
    $("#osReady").textContent = active.filter((o) => o.fulfillment === "ready").length;
    const fresh = active.filter((o) => o.fulfillment === "new").length;
    $("#ordBadge").textContent = fresh;
    $("#ordBadge").classList.toggle("hidden", !fresh);
  }

  function card(o) {
    const pay = o.payment;
    const payPill = pay.status === "paid" ? "good" : pay.status === "refunded" ? "" : "warn";
    const stagePill = o.fulfillment === "complete" ? "good" : o.fulfillment === "canceled" ? "" : o.fulfillment === "ready" ? "red" : "warn";
    const contact = [
      o.buyer.email && `<a href="mailto:${esc(o.buyer.email)}?subject=${encodeURIComponent(`Lady Broncos store order ${o.number}`)}">${esc(o.buyer.email)}</a>`,
      o.buyer.phone && `<a href="tel:${esc(o.buyer.phone.replace(/[^\d+]/g, ""))}">${esc(o.buyer.phone)}</a>`,
    ].filter(Boolean).join(" · ");
    return `<article class="ord" data-id="${esc(o.id)}">
      <header class="ord-head">
        <div><b class="ord-num">#${o.number}</b> <b>${esc(o.buyer.name)}</b><small class="muted">${when(o.createdAt)}${o.source === "coach" ? " · added by hand" : ""}</small></div>
        <div class="ord-pills"><span class="pill ${payPill}">${PAY[pay.status]}${pay.status === "paid" && pay.method ? ` · ${METHOD[pay.method]}` : ""}</span><span class="pill ${stagePill}">${STAGE[o.fulfillment]}</span><b class="ord-total">${money(o.total)}</b></div>
      </header>
      <div class="ord-body">
        <div>
          <ul class="ord-items">${o.items.map((i) => `<li><b>${i.qty} x ${esc(i.title)}</b> <span class="muted">${esc(itemLine(i))}</span><span>${money(i.price * i.qty)}</span></li>`).join("")}</ul>
          <p class="ord-meta">${contact || '<span class="muted">No contact info</span>'}</p>
          <p class="ord-meta">${o.delivery === "ship" ? `<b>Ship to</b> ${esc(o.address)} (shipping ${money(o.shipping)})` : "<b>Pickup</b> from a coach"}${o.player ? ` · Supporting <b>${esc(o.player)}</b>` : ""}</p>
        </div>
        <div class="ord-controls">
          <label class="field">Payment<select class="gselect" data-f="pay">${Object.entries(PAY).map(([k, v]) => `<option value="${k}"${k === pay.status ? " selected" : ""}>${v}</option>`).join("")}</select></label>
          <label class="field">Paid by<select class="gselect" data-f="method">${Object.entries(METHOD).map(([k, v]) => `<option value="${k}"${k === pay.method ? " selected" : ""}>${v}</option>`).join("")}</select></label>
          <label class="field">Amount paid<input class="gselect" type="number" min="0" step="0.01" data-f="amount" value="${pay.status === "unpaid" ? "" : pay.amount}" placeholder="${o.total}"></label>
          <label class="field">Fulfillment<select class="gselect" data-f="stage">${Object.entries(STAGE).map(([k, v]) => `<option value="${k}"${k === o.fulfillment ? " selected" : ""}>${v}</option>`).join("")}</select></label>
          <label class="field wide">Note<input class="gselect" type="text" maxlength="500" data-f="note" value="${esc(o.note)}" placeholder="Vendor order date, pickup plan, anything to remember"></label>
          <div class="btn-row wide">
            ${pay.status === "unpaid" && live(o) ? '<button class="btn btn-primary btn-small" data-act="paid">Mark paid</button>' : ""}
            ${NEXT[o.fulfillment] ? `<button class="btn btn-glass btn-small" data-act="next">${NEXT_LABEL[o.fulfillment]}</button>` : ""}
            ${o.fulfillment === "canceled" ? '<button class="btn btn-glass btn-small" data-act="delete">Delete for good</button>' : ""}
          </div>
        </div>
      </div>
    </article>`;
  }

  function renderList() {
    const list = orders.filter(matches);
    $("#ordList").innerHTML = list.length ? list.map(card).join("")
      : `<p class="muted" style="margin:0">${orders.length ? "No orders match this view." : "No store orders yet. They show up here the moment a family checks out."}</p>`;
  }

  // Everything still marked New, added up for the vendor.
  function vendorRows() {
    const paidOnly = $("#ovPaidOnly").checked;
    const pending = orders.filter((o) => o.fulfillment === "new" && (!paidOnly || o.payment.status === "paid"));
    const map = new Map();
    pending.forEach((o) => o.items.forEach((i) => {
      const k = [i.title, i.color, i.size].join("|");
      const r = map.get(k) || { title: i.title, color: i.color, size: i.size, qty: 0, names: [] };
      r.qty += i.qty;
      if (i.name) r.names.push(i.qty > 1 ? `${i.name} (${i.qty})` : i.name);
      map.set(k, r);
    }));
    return { pending, rows: [...map.values()].sort((a, b) => a.title.localeCompare(b.title) || a.color.localeCompare(b.color) || a.size.localeCompare(b.size)) };
  }
  function renderVendor() {
    const { pending, rows } = vendorRows();
    const pieces = rows.reduce((n, r) => n + r.qty, 0);
    $("#ovSummary").textContent = pending.length ? `${plural(pieces, "piece")} from ${plural(pending.length, "order")}` : "Nothing waiting";
    $("#ovRows").innerHTML = rows.length ? rows.map((r) => `<tr><td><b>${esc(r.title)}</b></td><td>${esc(r.color || "")}</td><td>${esc(r.size)}</td><td>${r.qty}</td><td>${esc(r.names.join(", "))}</td></tr>`).join("")
      : '<tr><td colspan="5" class="muted">No orders waiting to be sent to the vendor.</td></tr>';
    $("#ovMark").disabled = !pending.length;
  }

  function render() { renderStats(); renderList(); renderVendor(); }

  async function load() {
    try {
      orders = (await api("/api/coach/orders")).orders || [];
      render();
    } catch (e) { toast(e.message); }
  }

  async function patch(id, body, msg) {
    try {
      const r = await api(`/api/coach/orders/${encodeURIComponent(id)}`, { method: "PATCH", body });
      orders = orders.map((o) => (o.id === id ? r.order : o));
      render();
      if (msg) toast(msg);
    } catch (e) { toast(e.message); }
  }

  // ----- events -----
  $("#ordTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-of]");
    if (!b) return;
    filter = b.dataset.of;
    $$("#ordTabs button").forEach((x) => x.classList.toggle("on", x === b));
    renderList();
  });
  $("#ordSearch").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase().replace(/^#/, ""); renderList(); });
  $("#ordRefresh").addEventListener("click", load);
  $("#ovPaidOnly").addEventListener("change", renderVendor);

  $("#ordList").addEventListener("change", (e) => {
    const el = e.target.closest("[data-f]");
    const id = el && el.closest("[data-id]")?.dataset.id;
    if (!id) return;
    const o = orders.find((x) => x.id === id);
    const f = el.dataset.f;
    if (f === "pay") patch(id, { payment: { status: el.value, method: o.payment.method } }, `Order ${o.number} marked ${PAY[el.value].toLowerCase()}`);
    if (f === "method") patch(id, { payment: { status: o.payment.status, method: el.value } });
    if (f === "amount") patch(id, { payment: { status: o.payment.status === "unpaid" && el.value ? "paid" : o.payment.status, method: o.payment.method, amount: el.value || 0 } }, "Amount saved");
    if (f === "stage") patch(id, { fulfillment: el.value }, `Order ${o.number}: ${STAGE[el.value]}`);
    if (f === "note") patch(id, { note: el.value }, "Note saved");
  });
  $("#ordList").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-act]");
    const id = b && b.closest("[data-id]")?.dataset.id;
    if (!id) return;
    const o = orders.find((x) => x.id === id);
    if (b.dataset.act === "paid") patch(id, { payment: { status: "paid", method: o.payment.method } }, `Order ${o.number} marked paid`);
    if (b.dataset.act === "next") patch(id, { fulfillment: NEXT[o.fulfillment] }, `Order ${o.number}: ${STAGE[NEXT[o.fulfillment]]}`);
    if (b.dataset.act === "delete") {
      if (!confirm(`Delete order ${o.number} for good? This cannot be undone.`)) return;
      try {
        await api(`/api/coach/orders/${encodeURIComponent(id)}`, { method: "DELETE" });
        orders = orders.filter((x) => x.id !== id);
        render();
        toast("Order deleted");
      } catch (err) { toast(err.message); }
    }
  });

  $("#ovCopy").addEventListener("click", async () => {
    const { rows } = vendorRows();
    const text = rows.map((r) => `${r.qty} x ${r.title}${r.color ? `, ${r.color}` : ""}, size ${r.size}${r.names.length ? `. Names: ${r.names.join(", ")}` : ""}`).join("\n");
    try { await navigator.clipboard.writeText(text || "Nothing to order"); toast("Vendor sheet copied"); } catch { toast("Copy did not work. Select the table instead."); }
  });
  $("#ovMark").addEventListener("click", async () => {
    const { pending } = vendorRows();
    if (!pending.length || !confirm(`Mark ${plural(pending.length, "order")} as ordered from the vendor?`)) return;
    for (const o of pending) {
      try {
        const r = await api(`/api/coach/orders/${encodeURIComponent(o.id)}`, { method: "PATCH", body: { fulfillment: "ordered" } });
        orders = orders.map((x) => (x.id === o.id ? r.order : x));
      } catch (e) { toast(e.message); break; }
    }
    render();
    toast("Orders marked as ordered");
  });

  $("#ordCsv").addEventListener("click", () => {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Order", "Date", "Buyer", "Email", "Phone", "Supporting", "Delivery", "Address", "Item", "Color", "Size", "Name to print", "Qty", "Line total", "Order total", "Payment", "Paid by", "Amount paid", "Fulfillment", "Note"];
    const lines = [head.map(q).join(",")];
    orders.forEach((o) => o.items.forEach((i) => lines.push([
      o.number, new Date(o.createdAt).toLocaleDateString("en-US"), o.buyer.name, o.buyer.email, o.buyer.phone, o.player, o.delivery, o.address,
      i.title, i.color, i.size, i.name, i.qty, (i.price * i.qty).toFixed(2), o.total.toFixed(2),
      PAY[o.payment.status], METHOD[o.payment.method], o.payment.status === "unpaid" ? "" : o.payment.amount, STAGE[o.fulfillment], o.note,
    ].map(q).join(","))));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = `store-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // ----- add an order by hand -----
  const itemRow = () => `<div class="ed-row oa-item" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));margin-bottom:10px">
      <label class="field">Item<input type="text" data-i="title" maxlength="60" placeholder="Warmup Suit"></label>
      <label class="field">Color<input type="text" data-i="color" maxlength="30"></label>
      <label class="field">Size<input type="text" data-i="size" maxlength="12"></label>
      <label class="field">Name to print<input type="text" data-i="name" maxlength="14"></label>
      <label class="field">Qty<input type="number" data-i="qty" min="1" max="20" value="1"></label>
      <label class="field">Price each<input type="number" data-i="price" min="0" step="0.01"></label>
    </div>`;
  $("#oaItems").innerHTML = itemRow();
  $("#oaAddItem").addEventListener("click", () => $("#oaItems").insertAdjacentHTML("beforeend", itemRow()));
  $("#ordAdd").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const items = $$(".oa-item", f).map((row) => Object.fromEntries($$("[data-i]", row).map((x) => [x.dataset.i, x.value.trim()]))).filter((i) => i.title);
    if (!items.length) return toast("Add at least one item.");
    try {
      const r = await api("/api/coach/orders", { method: "POST", body: {
        name: f.name.value, phone: f.phone.value, email: f.email.value, player: f.player.value,
        paid: f.paid.checked, method: f.method.value, note: f.note.value, items, delivery: "pickup",
      } });
      orders.unshift(r.order);
      f.reset();
      $("#oaItems").innerHTML = itemRow();
      render();
      toast(`Order ${r.order.number} saved`);
    } catch (err) { toast(err.message); }
  });

  let started = false;
  document.addEventListener("coach:ready", () => {
    if (started) return;
    started = true;
    load();
  });
})();
