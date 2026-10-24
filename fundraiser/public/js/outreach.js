// Coach dashboard: supporter lists, message approvals and email settings.
(function () {
  let overview = null;
  let info = null;
  const open = { lists: new Set(), edit: new Set() };
  const prettyPhone = (p) => { const d = String(p || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, ""); return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : p || ""; };

  function whenText(t) {
    if (t.type === "after") return t.days ? `${t.days} days after her list is approved` : "As soon as her list is approved";
    if (t.days > 0) return `${t.days} days before the end date`;
    if (t.days === 0) return "On the end date";
    return `${-t.days} day${t.days === -1 ? "" : "s"} after the end date`;
  }

  async function render(data) {
    overview = data;
    const s = data.settings;
    $("#orMinShow").textContent = s.minContacts;
    $("#orMin").value = s.minContacts;
    $("#orTest").value = s.testEmail || "";
    $("#orAddr").value = s.mailingAddress || "";
    $("#orPause").checked = !!s.sendingPaused;
    renderLists();
    try { info = await api("/api/coach/outreach"); } catch (e) { $("#orWaves").innerHTML = `<p class="error">${esc(e.message)}</p>`; return; }
    $("#orProvider").innerHTML = info.providers.email
      ? (info.paused ? '<span class="pill warn">Emails paused</span>' : '<span class="pill good">Email ready</span>')
      : '<span class="pill warn">Email not set up yet</span>';
    renderWaves();
  }

  function renderLists() {
    const players = overview.players.filter((p) => p.consent?.accepted);
    const order = { changes: 1, pending: 0, approved: 2 };
    players.sort((a, b) => (a.contactsDone === b.contactsDone ? 0 : a.contactsDone ? -1 : 1) || (order[a.outreach?.status] ?? 3) - (order[b.outreach?.status] ?? 3));
    $("#orLists").innerHTML = players.length ? players.map((p) => {
      const st = p.outreach?.status;
      const pill = !p.contactsDone ? '<span class="pill">Has not added supporters yet</span>'
        : st === "approved" ? '<span class="pill good">Approved</span>'
          : st === "changes" ? '<span class="pill warn">Waiting on her changes</span>'
            : '<span class="pill red">Needs your review</span>';
      const counts = p.contactsDone ? `${p.contacts} supporters · ${p.emails} emails · ${p.phones} phones · ${p.sent} sent so far` : "";
      return `<div class="or-item" data-pid="${esc(p.id)}">
        <div class="or-top">
          <div><b>${esc(p.name)}</b> ${pill}<small>${counts}${st === "changes" && p.outreach.note ? ` · You asked: ${esc(p.outreach.note)}` : ""}</small></div>
          ${p.contactsDone ? `<div class="btn-row">
            <button class="btn btn-glass btn-small" data-or="list">${open.lists.has(p.id) ? "Hide list" : "See list"}</button>
            <button class="btn btn-glass btn-small" data-or="preview">Preview her email</button>
            ${st === "approved" ? '<button class="btn btn-danger btn-small" data-or="stop">Pause her emails</button>'
              : `<button class="btn btn-primary btn-small" data-or="approve">Approve list</button><button class="btn btn-glass btn-small" data-or="changes">Ask for changes</button>`}
          </div>` : ""}
        </div>
        <ul class="or-contacts ${open.lists.has(p.id) ? "" : "hidden"}"></ul>
      </div>`;
    }).join("") : '<p class="muted" style="margin:0">Lists show up here after players log in and add their supporters.</p>';
    open.lists.forEach((id) => fillList(id));
  }

  async function fillList(id) {
    const ul = $(`#orLists [data-pid="${id}"] .or-contacts`);
    if (!ul) return;
    try {
      const { contacts } = await api(`/api/coach/players/${id}/contacts`);
      ul.innerHTML = contacts.map((c) => `<li><b>${esc(c.name)}</b><span>${esc(c.email)}</span><span>${esc(prettyPhone(c.phone))}</span></li>`).join("");
    } catch (e) { ul.innerHTML = `<li>${esc(e.message)}</li>`; }
  }

  function renderWaves() {
    $("#orWaves").innerHTML = info.waves.map((w) => {
      const n = info.perWave[w.id] || {};
      const stats = [n.emails ? `${n.emails} emails sent` : "", n.texts ? `${n.texts} texts sent by players` : "", n.failed ? `${n.failed} failed` : "", n.optout ? `${n.optout} unsubscribed` : ""].filter(Boolean).join(" · ");
      const pill = !w.enabled ? '<span class="pill">Turned off</span>' : w.approved ? '<span class="pill good">Approved</span>' : '<span class="pill red">Needs approval</span>';
      const editing = open.edit.has(w.id);
      return `<div class="or-item" data-wid="${esc(w.id)}">
        <div class="or-top">
          <div><b>${esc(w.name)}</b> ${pill}<small>${esc(whenText(w.trigger))}${stats ? " · " + stats : ""}</small></div>
          <div class="btn-row">
            <button class="btn btn-glass btn-small" data-wv="preview">Preview</button>
            <button class="btn btn-glass btn-small" data-wv="edit">${editing ? "Close" : "Edit"}</button>
            <button class="btn btn-glass btn-small" data-wv="test">Send me a test</button>
            ${w.enabled ? (w.approved ? '<button class="btn btn-danger btn-small" data-wv="unapprove">Stop</button>' : '<button class="btn btn-primary btn-small" data-wv="approve">Approve</button>') : ""}
          </div>
        </div>
        ${editing ? `<form class="form or-edit" data-wv-form>
          <div class="two">
            <label class="field">Name<input type="text" name="name" maxlength="40" value="${esc(w.name)}"></label>
            <label class="field">When it goes out<span class="two" style="gap:8px">
              <select name="type" class="gselect big"><option value="after" ${w.trigger.type === "after" ? "selected" : ""}>After her list is approved (days)</option><option value="beforeEnd" ${w.trigger.type === "beforeEnd" ? "selected" : ""}>Before the end date (days)</option></select>
              <input type="number" name="days" min="-30" max="120" value="${w.trigger.days}"></span></label>
          </div>
          <label class="field">Email subject<input type="text" name="subject" maxlength="150" value="${esc(w.subject)}"></label>
          <label class="field">Email<textarea name="email" maxlength="3000">${esc(w.email)}</textarea></label>
          <label class="field">Text message <small>The player sends this from her phone</small><textarea name="sms" maxlength="480" style="min-height:80px">${esc(w.sms)}</textarea></label>
          <p class="muted" style="font-size:.85rem;margin:0">Fill ins: {first} supporter's first name, {player} player's first name, {goal}, {raised}, {percent}, {days} days left, {endDate}, {link} her page. For "before the end date", use a negative number for days after.</p>
          <div class="btn-row">
            <label class="switch"><input type="checkbox" name="donateButton" ${w.donateButton ? "checked" : ""}> Donate button in the email</label>
            <label class="switch"><input type="checkbox" name="enabled" ${w.enabled ? "checked" : ""}> Use this message</label>
          </div>
          <div><button class="btn btn-primary" type="submit">Save message</button></div>
        </form>` : ""}
      </div>`;
    }).join("") + '<div class="btn-row" style="margin-top:6px"><button class="btn btn-glass btn-small" id="orReset">Restore the original messages</button></div>';
  }

  async function preview(waveId, playerId) {
    try {
      const q = new URLSearchParams({ wave: waveId || "" });
      if (playerId) q.set("player", playerId);
      const pv = await api(`/api/coach/preview?${q}`);
      const w = info?.waves.find((x) => x.id === pv.wave);
      $("#pvTitle").textContent = w ? w.name : "Email";
      $("#pvSubject").textContent = pv.subject;
      $("#pvFrame").srcdoc = pv.html;
      $("#pvSms").textContent = pv.sms;
      $("#pvModal").classList.add("open");
    } catch (e) { toast(e.message); }
  }
  $("#pvModal").addEventListener("click", (e) => { if (e.target.id === "pvModal" || e.target.closest("[data-pv-close]")) $("#pvModal").classList.remove("open"); });

  async function reload() { if (window.coachReload) await window.coachReload(); }

  $("#orLists").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-or]");
    if (!b) return;
    const id = b.closest("[data-pid]").dataset.pid;
    const act = b.dataset.or;
    if (act === "list") {
      if (open.lists.has(id)) open.lists.delete(id); else open.lists.add(id);
      renderLists();
      return;
    }
    if (act === "preview") return preview(info?.waves[0]?.id, id);
    let note = "";
    if (act === "changes") {
      note = prompt("What should she change? She will see this note.", "Please add more family members with email addresses.");
      if (note === null) return;
    }
    if (act === "stop" && !confirm("Pause emails for this player? You can approve her again any time.")) return;
    try {
      await api(`/api/coach/players/${id}/outreach`, { method: "POST", body: { action: act, note } });
      toast(act === "approve" ? "Approved! Her emails will go out as each message is due." : "Saved");
      await reload();
    } catch (err) { toast(err.message); }
  });

  $("#orWaves").addEventListener("click", async (e) => {
    if (e.target.id === "orReset") {
      if (!confirm("Put back the original five messages? Your edits and approvals on messages will be cleared.")) return;
      try { await api("/api/coach/waves/reset", { method: "POST" }); open.edit.clear(); await reload(); } catch (err) { toast(err.message); }
      return;
    }
    const b = e.target.closest("[data-wv]");
    if (!b) return;
    const id = b.closest("[data-wid]").dataset.wid;
    const act = b.dataset.wv;
    if (act === "edit") {
      if (open.edit.has(id)) open.edit.delete(id); else open.edit.add(id);
      renderWaves();
      return;
    }
    if (act === "preview") return preview(id);
    try {
      if (act === "test") {
        const r = await api("/api/coach/test", { method: "POST", body: { wave: id } });
        toast(r.results.join(" "));
        return;
      }
      await api(`/api/coach/waves/${id}/approve`, { method: "POST", body: { approved: act === "approve" } });
      toast(act === "approve" ? "Approved" : "Stopped");
      await reload();
    } catch (err) { toast(err.message); }
  });

  $("#orWaves").addEventListener("submit", async (e) => {
    const f = e.target.closest("[data-wv-form]");
    if (!f) return;
    e.preventDefault();
    const id = f.closest("[data-wid]").dataset.wid;
    const v = (n) => f.elements[n];
    try {
      await api(`/api/coach/waves/${id}`, { method: "PUT", body: {
        name: v("name").value, subject: v("subject").value, email: v("email").value, sms: v("sms").value,
        trigger: { type: v("type").value, days: v("days").value },
        donateButton: v("donateButton").checked, enabled: v("enabled").checked,
      } });
      open.edit.delete(id);
      toast("Saved. Approve it when it looks right.");
      await reload();
    } catch (err) { toast(err.message); }
  });

  $("#orForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api("/api/coach/settings", { method: "PUT", body: {
        minContacts: $("#orMin").value, testEmail: $("#orTest").value, mailingAddress: $("#orAddr").value, sendingPaused: $("#orPause").checked,
      } });
      toast("Saved!");
      await reload();
    } catch (err) { toast(err.message); }
  });

  $("#orSendNow").addEventListener("click", async () => {
    try { await api("/api/coach/send-now", { method: "POST" }); toast("Checking for due emails now"); } catch (err) { toast(err.message); }
  });

  window.renderOutreach = render;
})();
