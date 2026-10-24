(function () {
  const show = (id) => ["login", "dash"].forEach((s) => $("#" + s).classList.toggle("hidden", s !== id));
  let data = null;

  async function load() {
    try {
      data = await api("/api/coach/overview");
    } catch (e) {
      $("#logout").classList.add("hidden");
      show("login");
      if (e.status !== 401) $("#loginErr").textContent = e.message;
      return;
    }
    $("#logout").classList.remove("hidden");
    render();
    show("dash");
  }

  function statusPill(p) {
    if (!p.active) return '<span class="pill red">Hidden</span>';
    if (!p.consent?.accepted) return '<span class="pill warn">Needs to log in</span>';
    return '<span class="pill good">Live</span>';
  }

  function render() {
    const { settings: s, players, totals } = data;
    applyBrand(s);

    const gt = data.giftTotals || { confirmed: 0, pledged: 0, pledgedCount: 0 };
    const raisedAll = (s.raised || 0) + gt.confirmed;
    $("#oRaised").textContent = fmtMoney(raisedAll);
    $("#oGoal").textContent = fmtMoney(s.goal);
    setBar($("#bar"), raisedAll, s.goal);
    $("#oPledged").textContent = `${fmtMoney(gt.pledged)}`;
    $("#gaFor").innerHTML = `<option value="team">Whole team</option>` + players.map((p) => `<option value="${esc(p.slug)}">${esc(p.name)}</option>`).join("");
    loadGifts();
    $("#oDonate").textContent = fmtNum(totals.donate);
    $("#oViews").textContent = fmtNum(totals.view);
    $("#oShares").textContent = fmtNum(totals.share);
    $("#oLive").textContent = fmtNum(players.filter((p) => p.live).length);
    $("#linkStatus").innerHTML = s.donateUrl
      ? '<span class="pill good">Donation link connected</span>'
      : '<span class="pill warn">Add your MySchoolBucks link below</span>';

    // Settings forms
    $("#donateUrl").value = s.donateUrl;
    $("#raised").value = s.raised;
    $("#goal").value = s.goal;
    $("#endDate").value = s.endDate;
    $("#teamName").value = s.teamName;
    $("#schoolName").value = s.schoolName;
    $("#tagline").value = s.tagline;
    $("#story").value = s.story;
    $("#approval").checked = !!s.requirePhotoApproval;
    if (!s.logo) $$("img[data-logo]").forEach((i) => { i.src = "/brand/logo.png"; });

    // Photo approvals
    const pending = players.filter((p) => p.pendingPhoto);
    $("#approvalsCard").classList.toggle("hidden", !pending.length);
    $("#approvals").innerHTML = pending.map((p) => `
      <div class="approval">
        ${photoHtml(p.pendingPhoto, p.name, p.number)}
        <b>${esc(p.name)}</b>
        <div class="btn-row" style="margin-top:8px">
          <button class="btn btn-primary btn-small" data-photo="approve" data-id="${p.id}">Approve</button>
          <button class="btn btn-danger btn-small" data-photo="reject" data-id="${p.id}">Decline</button>
        </div>
      </div>`).join("");

    // Player rows
    $("#rows").innerHTML = players.length
      ? players.map((p) => `
        <tr>
          <td><div class="who">${avatarHtml(p.photo, p.name)}<div><b>${esc(p.first)} ${esc(p.last)}</b><div class="muted" style="font-size:.8rem">${p.number ? "#" + esc(p.number) + " · " : ""}/p/${esc(p.slug)}</div>${p.consent?.accepted ? `<div class="muted" style="font-size:.75rem">Permission: ${esc(p.consent.guardianName)}, ${new Date(p.consent.at).toLocaleDateString()}</div>` : ""}</div></div></td>
          <td>${statusPill(p)}</td>
          <td>${fmtNum(p.stats.view)}</td>
          <td>${fmtNum(p.stats.share)}</td>
          <td><b>${fmtNum(p.stats.donate)}</b></td>
          <td><b>${fmtMoney(p.confirmed || 0)}</b></td>
          <td><input type="number" min="0" step="0.01" value="${p.raised || ""}" placeholder="0" data-raised="${p.id}" aria-label="Other money raised by ${esc(p.name)}"></td>
          <td><div class="actions">
            <a class="btn btn-glass btn-small" href="/p/${esc(p.slug)}" target="_blank" rel="noopener">View</a>
            <button class="btn btn-glass btn-small" data-act="code" data-id="${p.id}">New code</button>
            <button class="btn btn-glass btn-small" data-act="toggle" data-id="${p.id}">${p.active ? "Hide" : "Show"}</button>
            ${p.photo ? `<button class="btn btn-glass btn-small" data-act="rmphoto" data-id="${p.id}">Remove photo</button>` : ""}
            <button class="btn btn-danger btn-small" data-act="delete" data-id="${p.id}">Delete</button>
          </div></td>
        </tr>`).join("")
      : '<tr><td colspan="7" class="muted">No players yet. Add your first player above.</td></tr>';
  }

  function showCode(name, code) {
    $("#codeTitle").textContent = name;
    $("#codeValue").textContent = code;
    $("#codeUrl").textContent = `${location.host}/portal`;
    $("#codeModal").classList.add("open");
  }
  $("#codeClose").addEventListener("click", () => $("#codeModal").classList.remove("open"));
  $("#codeCopy").addEventListener("click", () => copyText(`${$("#codeTitle").textContent}: log in at ${location.origin}/portal with code ${$("#codeValue").textContent}`));

  // Login
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#loginErr").textContent = "";
    try {
      await api("/api/coach/login", { method: "POST", body: { password: $("#password").value } });
      $("#password").value = "";
      await load();
    } catch (err) {
      $("#loginErr").textContent = err.message;
    }
  });

  $("#logout").addEventListener("click", async (e) => {
    e.preventDefault();
    await api("/api/logout", { method: "POST" }).catch(() => {});
    location.reload();
  });

  async function saveSettings(body, msg = "Saved!") {
    try {
      await api("/api/coach/settings", { method: "PUT", body });
      toast(msg);
      await load();
    } catch (err) {
      toast(err.message);
    }
  }

  $("#moneyForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveSettings({ donateUrl: $("#donateUrl").value.trim(), raised: $("#raised").value, goal: $("#goal").value, endDate: $("#endDate").value });
  });

  $("#pageForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveSettings({ teamName: $("#teamName").value, schoolName: $("#schoolName").value, tagline: $("#tagline").value, story: $("#story").value, requirePhotoApproval: $("#approval").checked });
  });

  $("#addForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const first = $("#aFirst").value.trim();
    const last = $("#aLast").value.trim();
    try {
      const res = await api("/api/coach/players", { method: "POST", body: { first, last, number: $("#aNum").value, position: $("#aPos").value } });
      e.target.reset();
      await load();
      showCode(`${first} ${last}`.trim(), res.code);
    } catch (err) {
      toast(err.message);
    }
  });

  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-act],[data-photo]");
    if (!b) return;
    const p = data.players.find((x) => x.id === b.dataset.id);
    if (!p) return;
    try {
      if (b.dataset.photo) {
        await api(`/api/coach/players/${p.id}/photo`, { method: "POST", body: { action: b.dataset.photo } });
        toast(b.dataset.photo === "approve" ? "Photo approved" : "Photo declined");
      } else if (b.dataset.act === "code") {
        if (!confirm(`Make a new login code for ${p.first}? Her old code will stop working.`)) return;
        const res = await api(`/api/coach/players/${p.id}/code`, { method: "POST" });
        showCode(`${p.first} ${p.last}`.trim(), res.code);
      } else if (b.dataset.act === "toggle") {
        await api(`/api/coach/players/${p.id}`, { method: "PUT", body: { active: !p.active } });
      } else if (b.dataset.act === "rmphoto") {
        if (!confirm(`Remove ${p.first}'s photo?`)) return;
        await api(`/api/coach/players/${p.id}/photo`, { method: "POST", body: { action: "remove" } });
      } else if (b.dataset.act === "delete") {
        if (!confirm(`Delete ${p.first} ${p.last}? Her page and photo will be removed.`)) return;
        await api(`/api/coach/players/${p.id}`, { method: "DELETE" });
      }
      await load();
    } catch (err) {
      toast(err.message);
    }
  });

  document.addEventListener("change", async (e) => {
    const id = e.target.dataset?.raised;
    if (!id) return;
    try {
      await api(`/api/coach/players/${id}`, { method: "PUT", body: { raised: e.target.value || 0 } });
      toast("Player total saved");
      await load();
    } catch (err) {
      toast(err.message);
    }
  });

  $("#pickLogo").addEventListener("click", () => $("#logoFile").click());
  $("#logoFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const blob = await resizeImage(file, 600, "image/png");
      await api("/api/coach/logo", { method: "POST", body: blob });
      toast("Logo updated");
      await load();
    } catch (err) {
      toast(err.message);
    }
  });
  $("#resetLogo").addEventListener("click", async () => {
    await api("/api/coach/logo", { method: "DELETE" }).catch((err) => toast(err.message));
    await load();
  });

  $("#csv").addEventListener("click", () => {
    const rows = [["Player", "Jersey", "Status", "Page visits", "Shares", "Donation clicks", "Raised", "Guardian", "Permission date"]];
    for (const p of data.players) {
      rows.push([`${p.first} ${p.last}`, p.number, !p.active ? "Hidden" : p.live ? "Live" : "Needs to log in", p.stats.view, p.stats.share, p.stats.donate, p.raised, p.consent?.guardianName || "", p.consent ? new Date(p.consent.at).toLocaleDateString() : ""]);
    }
    rows.push(["Team page", "", "", data.teamStats.view, data.teamStats.share, data.teamStats.donate, "", "", ""]);
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "LadyBroncosStats.csv";
    a.click();
  });

  // ---------- gifts ----------
  let gifts = [];
  let giftTab = "pledged";
  async function loadGifts() {
    try {
      gifts = (await api("/api/coach/gifts")).gifts;
      renderGifts();
    } catch (err) { toast(err.message); }
  }
  function renderGifts() {
    const list = gifts.filter((g) => giftTab === "all" || g.status === giftTab);
    const forOptions = (sel) => `<option value="team"${sel === "team" ? " selected" : ""}>Whole team</option>` + (data?.players || []).map((p) => `<option value="${esc(p.slug)}"${sel === p.slug ? " selected" : ""}>${esc(p.name)}</option>`).join("");
    $("#giftRows").innerHTML = list.length ? list.map((g) => `
      <tr>
        <td>${new Date(g.createdAt).toLocaleDateString()}<div class="muted" style="font-size:.75rem">${new Date(g.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div></td>
        <td><b>${esc(g.name)}</b>${g.anonymous ? ' <span class="pill">Anonymous</span>' : ""}${g.email ? `<div class="muted" style="font-size:.8rem">${esc(g.email)}</div>` : ""}${g.source === "coach" ? '<div class="muted" style="font-size:.75rem">Added by coach</div>' : ""}</td>
        <td><select class="gselect" data-gfor="${g.id}">${forOptions(g.slug)}</select></td>
        <td><input type="number" min="1" step="0.01" value="${g.amount}" data-gamt="${g.id}" aria-label="Amount"></td>
        <td>${g.status === "confirmed" ? '<span class="pill good">Confirmed</span>' : g.status === "removed" ? '<span class="pill red">Removed</span>' : '<span class="pill warn">Waiting</span>'}</td>
        <td><div class="actions">
          ${g.status !== "confirmed" ? `<button class="btn btn-primary btn-small" data-gact="confirm" data-id="${g.id}">Confirm</button>` : `<button class="btn btn-glass btn-small" data-gact="unconfirm" data-id="${g.id}">Undo</button>`}
          ${g.status !== "removed" ? `<button class="btn btn-danger btn-small" data-gact="remove" data-id="${g.id}">Remove</button>` : `<button class="btn btn-glass btn-small" data-gact="restore" data-id="${g.id}">Restore</button>`}
        </div></td>
      </tr>`).join("") : `<tr><td colspan="6" class="muted">${giftTab === "pledged" ? "Nothing waiting. New donation forms show up here." : "No gifts here yet."}</td></tr>`;
  }
  $("#giftTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-gt]");
    if (!b) return;
    giftTab = b.dataset.gt;
    $$("#giftTabs button").forEach((x) => x.classList.toggle("on", x === b));
    renderGifts();
  });
  $("#giftRows").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-gact]");
    if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.gact === "remove" && !confirm("Remove this gift? Use this when a payment never came through.")) return;
    try {
      await api(`/api/coach/gifts/${id}`, { method: "POST", body: { action: b.dataset.gact, amount: $(`[data-gamt="${id}"]`).value, slug: $(`[data-gfor="${id}"]`).value } });
      toast(b.dataset.gact === "confirm" ? "Gift confirmed" : "Updated");
      await load();
    } catch (err) { toast(err.message); }
  });
  $("#giftRows").addEventListener("change", async (e) => {
    const id = e.target.dataset.gamt || e.target.dataset.gfor;
    if (!id) return;
    try {
      await api(`/api/coach/gifts/${id}`, { method: "POST", body: e.target.dataset.gamt ? { amount: e.target.value } : { slug: e.target.value } });
      toast("Saved");
      await load();
    } catch (err) { toast(err.message); }
  });
  $("#giftAdd").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api("/api/coach/gifts", { method: "POST", body: { name: $("#gaName").value, slug: $("#gaFor").value, amount: $("#gaAmt").value, anonymous: $("#gaAnon").checked } });
      e.target.reset();
      toast("Gift added");
      await load();
    } catch (err) { toast(err.message); }
  });
  $("#giftCsv").addEventListener("click", () => {
    const rows = [["Date", "Donor", "Email", "Anonymous", "For", "Amount", "Status", "Confirmed on", "Source"]];
    for (const g of gifts) rows.push([new Date(g.createdAt).toLocaleString(), g.name, g.email, g.anonymous ? "Yes" : "No", g.forName, g.amount, g.status, g.confirmedAt ? new Date(g.confirmedAt).toLocaleDateString() : "", g.source === "coach" ? "Added by coach" : "Donation form"]);
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "LadyBroncosGifts.csv";
    a.click();
  });

  load();
})();
