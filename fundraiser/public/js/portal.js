(function () {
  const show = (id) => ["login", "consent", "dash"].forEach((s) => $("#" + s).classList.toggle("hidden", s !== id));
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
    renderDash();
    show("dash");
  }

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
