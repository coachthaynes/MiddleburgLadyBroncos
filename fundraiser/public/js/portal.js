(function () {
  const show = (id) => ["login", "consent", "supporters", "dash"].forEach((s) => $("#" + s).classList.toggle("hidden", s !== id));
  let me = null;
  let shareReady = false;

  async function load() {
    try {
      me = await api("/api/me");
    } catch (e) {
      $("#logout").classList.add("hidden");
      show("login");
      if (e.status !== 401) $("#loginErr").textContent = e.message;
      return;
    }
    applyBrand(me.settings);
    $("#logout").classList.remove("hidden");
    if (!me.player.consent?.accepted) { show("consent"); return; }
    if (!me.player.contactsDone) { await openSupporters(false); return; }
    renderDash();
    show("dash");
    loadSupporters();
  }

  // ---------- supporters list ----------
  const draftKey = () => `supDraft:${me.player.slug}`;
  const prettyPhone = (p) => { const d = String(p || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, ""); return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : p || ""; };
  const EMAIL_OK = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[a-z]{2,}$/i;
  const phoneOk = (v) => { const d = v.replace(/\D/g, ""); return (d.length === 10 && /^[2-9]/.test(d)) || (d.length === 11 && /^1[2-9]/.test(d)); };

  function rowHtml(c = {}) {
    return `<div class="sup-row" data-id="${esc(c.id || "")}">
      <b></b>
      <input data-k="name" type="text" maxlength="60" placeholder="Name" autocomplete="off" value="${esc(c.name || "")}" aria-label="Name">
      <input data-k="email" type="email" maxlength="120" placeholder="Email" autocomplete="off" inputmode="email" value="${esc(c.email || "")}" aria-label="Email">
      <input data-k="phone" type="tel" maxlength="20" placeholder="Phone" autocomplete="off" value="${esc(prettyPhone(c.phone))}" aria-label="Phone">
      <button type="button" class="rm" aria-label="Remove">×</button>
    </div>`;
  }

  function readRows() {
    return $$("#supRows .sup-row").map((r) => ({
      id: r.dataset.id,
      name: r.querySelector('[data-k="name"]').value.trim(),
      email: r.querySelector('[data-k="email"]').value.trim(),
      phone: r.querySelector('[data-k="phone"]').value.trim(),
    }));
  }

  // A row counts once it has a name plus a good email or phone.
  function refreshCount() {
    const min = me.settings.minContacts || 20;
    let n = 0;
    $$("#supRows .sup-row").forEach((r, i) => {
      const [name, email, phone] = ["name", "email", "phone"].map((k) => r.querySelector(`[data-k="${k}"]`).value.trim());
      const ok = name && (EMAIL_OK.test(email) || phoneOk(phone)) && (!email || EMAIL_OK.test(email)) && (!phone || phoneOk(phone));
      if (ok) n++;
      r.classList.toggle("done", !!ok);
      r.querySelector("b").textContent = ok ? "✓" : i + 1;
    });
    $("#supCount").textContent = n;
    $("#supBar").style.width = Math.min(100, (n / min) * 100) + "%";
    try { if (!me.player.contactsDone) localStorage.setItem(draftKey(), JSON.stringify(readRows())); } catch {}
  }

  function addRows(list) {
    $("#supRows").insertAdjacentHTML("beforeend", list.map(rowHtml).join(""));
    refreshCount();
  }

  async function openSupporters(canCancel) {
    const min = me.settings.minContacts || 20;
    $$("[data-min]").forEach((el) => { el.textContent = min; });
    $("#supErr").innerHTML = "";
    $("#supCancel").classList.toggle("hidden", !canCancel);
    let list = [];
    if (me.player.contactsDone) {
      list = (await api("/api/me/contacts")).contacts;
      $("#supPromise").checked = true;
    } else {
      try { list = JSON.parse(localStorage.getItem(draftKey()) || "[]"); } catch {}
    }
    $("#supRows").innerHTML = "";
    const blanks = Math.max(min - list.length, 3);
    addRows(list.concat(Array.from({ length: blanks }, () => ({}))));
    show("supporters");
    window.scrollTo({ top: 0 });
  }

  $("#supRows").addEventListener("input", (e) => { e.target.classList.remove("bad"); refreshCount(); });
  $("#supRows").addEventListener("click", (e) => {
    const b = e.target.closest(".rm");
    if (!b) return;
    b.closest(".sup-row").remove();
    refreshCount();
  });
  $("#supAdd").addEventListener("click", () => {
    addRows([{}, {}, {}]);
    $$("#supRows .sup-row").slice(-3)[0].querySelector("input").focus();
  });
  $("#supCancel").addEventListener("click", () => { show("dash"); });

  // Android Chrome can pick straight from the phone's contacts.
  if ("contacts" in navigator && "select" in navigator.contacts) {
    $("#supPick").classList.remove("hidden");
    $("#supPick").addEventListener("click", async () => {
      try {
        const picked = await navigator.contacts.select(["name", "email", "tel"], { multiple: true });
        const empty = $$("#supRows .sup-row").filter((r) => !$$("input", r).some((i) => i.value.trim()));
        empty.forEach((r) => r.remove());
        addRows(picked.map((c) => ({ name: (c.name || [])[0] || "", email: (c.email || [])[0] || "", phone: (c.tel || [])[0] || "" })));
      } catch {}
    });
  }

  $("#supForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#supErr").innerHTML = "";
    const rows = readRows();
    let bad = 0;
    $$("#supRows .sup-row").forEach((r, i) => {
      const c = rows[i];
      if (!c.name && !c.email && !c.phone) return;
      const flag = (k, cond) => { if (cond) { r.querySelector(`[data-k="${k}"]`).classList.add("bad"); bad++; } };
      flag("name", !c.name);
      flag("email", c.email && !EMAIL_OK.test(c.email));
      flag("phone", (c.phone && !phoneOk(c.phone)) || (!c.email && !c.phone));
    });
    if (bad) { $("#supErr").textContent = "Fix the boxes marked in red. Each person needs a name and an email or a 10 digit phone number."; return; }
    const btn = $("#supSave");
    btn.disabled = true;
    try {
      await api("/api/me/contacts", { method: "PUT", body: { contacts: rows, promise: $("#supPromise").checked } });
      try { localStorage.removeItem(draftKey()); } catch {}
      toast("Supporters saved! Your coach will check your list.");
      await load();
    } catch (err) {
      $("#supErr").innerHTML = esc(err.message) + (err.data?.problems ? `<ul>${err.data.problems.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
    } finally {
      btn.disabled = false;
    }
  });

  $("#supEdit").addEventListener("click", () => openSupporters(true));

  async function loadSupporters() {
    const p = me.player;
    const o = p.outreach || {};
    $("#supSummary").textContent = `${p.contactCount} supporters on your list`;
    $("#supStatus").innerHTML = o.status === "approved"
      ? '<span class="pill good">Approved by your coach</span> <span class="muted" style="font-size:.9rem">Emails go out from the team on a schedule.</span>'
      : o.status === "changes"
        ? `<div class="notice warn"><span>Your coach asked for a change: <b>${esc(o.note || "Please check your list.")}</b> Tap Edit my list to fix it.</span></div>`
        : '<span class="pill warn">Waiting for your coach to check your list</span>';
    $("#textBox").classList.add("hidden");
    if (o.status !== "approved") return;
    let data;
    try { data = await api("/api/me/texts"); } catch { return; }
    if (!data.ready || !data.texts.length) return;
    const done = data.texts.filter((t) => t.texted).length;
    $("#textProgress").textContent = `${done} of ${data.texts.length} texted.`;
    $("#textList").innerHTML = data.texts.map((t) => `
      <li class="${t.texted ? "done" : ""}" data-id="${esc(t.id)}" data-wave="${esc(data.wave.id)}">
        <span><b>${esc(t.name)}</b><small>${esc(prettyPhone(t.phone))}${t.texted ? ' · <em class="texted">Texted ✓</em>' : ""}</small></span>
        <a class="btn ${t.texted ? "btn-glass" : "btn-primary"} btn-small" href="sms:${esc(t.phone)}?&body=${encodeURIComponent(t.body)}" data-text>${t.texted ? "Again" : "Text"}</a>
      </li>`).join("");
    $("#textBox").classList.remove("hidden");
  }

  $("#textList").addEventListener("click", (e) => {
    const a = e.target.closest("[data-text]");
    if (!a) return;
    const li = a.closest("li");
    if (li.classList.contains("done")) return;
    api("/api/me/texted", { method: "POST", body: { contact: li.dataset.id, wave: li.dataset.wave } })
      .then(() => setTimeout(loadSupporters, 1500)).catch(() => {});
  });

  function renderDash() {
    const { player: p, settings } = me;
    const url = `${location.origin}/p/${p.slug}`;
    $("#hiName").textContent = p.first;
    $("#myLink").textContent = url;
    $("#viewPage").href = `/p/${p.slug}`;
    $("#mViews").textContent = fmtNum(p.stats.view);
    $("#mShares").textContent = fmtNum(p.stats.share);
    $("#mDonate").textContent = fmtNum(p.stats.donate);

    let status = p.live ? '<span class="pill good">Your page is live</span>' : '<span class="pill warn">Your page is hidden. Ask your coach.</span>';
    if (p.pendingPhoto) status += ' <span class="pill warn">New photo waiting for coach approval</span>';
    $("#status").innerHTML = status;

    const shown = p.pendingPhoto || p.photo;
    $("#photoPreview").innerHTML = photoHtml(shown, p.name, p.number);
    $("#removePhoto").classList.toggle("hidden", !shown);
    $("#photoNote").textContent = p.pendingPhoto
      ? "Your coach will approve this photo before it shows on your page."
      : p.photo
        ? "Looking good! Upload a new one any time."
        : settings.requirePhotoApproval
          ? "Pick a clear, smiling photo. Your coach approves photos before they go live."
          : "Pick a clear, smiling photo of yourself.";

    $("#message").value = p.message || "";
    $("#number").value = p.number || "";
    $("#position").value = p.position || "";

    if (!shareReady) {
      shareReady = true;
      renderShare($("#shareBox"), { url, slug: p.slug, subject: `Support ${p.name} and the ${settings.teamName}`, message: playerMessage(p.first, settings) });
      const toggle = $("#qrToggle");
      toggle.innerHTML = `${ICONS.qr} Show my QR code`;
      toggle.addEventListener("click", () => {
        const open = $("#qrBox").classList.toggle("open");
        toggle.innerHTML = `${ICONS.qr} ${open ? "Hide" : "Show"} my QR code`;
        if (open && !$("#qr").innerHTML) {
          const img = makeQr($("#qr"), url);
          if (img) $("#qrDownload").href = img;
        }
      });
    }
  }

  $("#code").addEventListener("input", (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#loginErr").textContent = "";
    const btn = e.submitter;
    btn.disabled = true;
    try {
      await api("/api/login", { method: "POST", body: { code: $("#code").value } });
      await load();
    } catch (err) {
      $("#loginErr").textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  $("#consentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#consentErr").textContent = "";
    try {
      await api("/api/me/consent", {
        method: "POST",
        body: { guardianOk: $("#c1").checked, shareOk: $("#c2").checked, honestOk: $("#c3").checked, guardianName: $("#guardian").value },
      });
      toast("You are all set!");
      await load();
    } catch (err) {
      $("#consentErr").textContent = err.message;
    }
  });

  $("#profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api("/api/me", { method: "PUT", body: { message: $("#message").value, number: $("#number").value, position: $("#position").value } });
      toast("Saved!");
      await load();
    } catch (err) {
      toast(err.message);
    }
  });

  $("#pickPhoto").addEventListener("click", () => $("#photoFile").click());
  $("#photoFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    $("#photoErr").textContent = "";
    const btn = $("#pickPhoto");
    btn.disabled = true;
    btn.textContent = "Uploading...";
    try {
      const blob = await resizeImage(file, 1000);
      const res = await api("/api/me/photo", { method: "POST", body: blob });
      toast(res.pending ? "Photo sent to your coach for approval" : "Photo updated!");
      await load();
    } catch (err) {
      $("#photoErr").textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "Upload photo";
    }
  });

  $("#removePhoto").addEventListener("click", async () => {
    if (!confirm("Remove your photo?")) return;
    try {
      await api("/api/me/photo", { method: "DELETE" });
      await load();
    } catch (err) {
      $("#photoErr").textContent = err.message;
    }
  });

  $("#copyLink").addEventListener("click", () => { copyText($("#myLink").textContent); track("share", me?.player.slug); });

  $("#logout").addEventListener("click", async (e) => {
    e.preventDefault();
    await api("/api/logout", { method: "POST" }).catch(() => {});
    location.reload();
  });

  load();
})();
