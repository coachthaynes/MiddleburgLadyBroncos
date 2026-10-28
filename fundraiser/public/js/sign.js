// Read and sign a team contract: /contracts/player or /contracts/parent. /contracts shows both.
(function () {
  const doc = (/^\/contracts\/(player|parent)\/?$/.exec(location.pathname) || [])[1] || new URLSearchParams(location.search).get("doc");
  const C = window.CONTRACTS[doc];
  if (!C) { $("#chooser").classList.remove("hidden"); return; }

  document.title = `${C.title} · Middleburg Lady Broncos`;
  $("#signer").classList.remove("hidden");
  $("#ctTitle").textContent = C.title;
  $("#ctSub").textContent = C.subtitle;
  $("#ctPdf").href = C.pdf;
  $("#ctBody").innerHTML = C.body;
  $("#ctWho").textContent = `${C.who}. Fill in every box, sign in each signature pad, then tap Sign and submit.`;
  $("#ctAgreeText").textContent = doc === "player"
    ? "We have read the Core Principles and the Player Expectation Contract for the 2026 to 2027 season, we understand them, and we agree to follow them."
    : "I have read Coach Haynes' message and the Parent Expectations for the 2026 to 2027 season, I understand them, and I agree to follow them.";
  // Show only the parts this contract needs.
  $$("[data-for]").forEach((el) => { if (el.dataset.for !== doc) el.remove(); });
  $$("[data-sig]").forEach((el) => { if (doc === "parent" && el.dataset.sig === "player") el.remove(); });
  if (C.roles) $("#ctRoles").insertAdjacentHTML("beforeend", C.roles.map((r) => `<option>${esc(r)}</option>`).join(""));

  // ----- signature pads -----
  const pads = {};
  $$("[data-sig]").forEach((wrap) => {
    const canvas = $("canvas", wrap);
    const ctx = canvas.getContext("2d");
    const pad = { ink: false, canvas };
    pads[wrap.dataset.sig] = pad;
    ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#111";
    let last = null;
    const pt = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height)]; };
    canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); last = pt(e); ctx.beginPath(); ctx.arc(last[0], last[1], 1.2, 0, Math.PI * 2); ctx.fill(); });
    canvas.addEventListener("pointermove", (e) => {
      if (!last) return;
      const p = pt(e);
      ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
      last = p;
      if (!pad.ink) { pad.ink = true; wrap.classList.add("signed"); }
    });
    const end = () => { last = null; };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    $("[data-clear]", wrap).addEventListener("click", () => { ctx.clearRect(0, 0, canvas.width, canvas.height); pad.ink = false; wrap.classList.remove("signed"); });
  });
  const sigImage = (c) => {
    // White background so the signature prints cleanly.
    const out = document.createElement("canvas");
    out.width = c.width; out.height = c.height;
    const x = out.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, out.width, out.height); x.drawImage(c, 0, 0);
    return out.toDataURL("image/png");
  };

  // ----- submit -----
  $("#ctForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const v = (n) => (f[n] ? f[n].value.trim() : "");
    const team = doc === "player" ? (f.querySelector('[name="team"]:checked') || {}).value : (f.querySelector('[name="team2"]:checked') || {}).value;
    const err = (m) => { $("#ctErr").textContent = m; };
    const body = {
      doc, company: v("company"), agree: f.agree.checked, esign: f.esign.checked,
      parentName: v("parentName"), parentPhone: v("parentPhone"), parentEmail: v("parentEmail"), team: team || "",
      playerName: doc === "player" ? v("playerName") : v("daughterName"),
      grade: v("grade"), role: v("role"),
      signatures: {},
    };
    if (body.playerName.length < 3) return err(doc === "player" ? "Please enter the player's full name." : "Please enter your daughter's full name.");
    if (doc === "player" && !body.grade) return err("Please choose a grade.");
    if (!body.team) return err("Please choose Varsity or JV.");
    if (body.parentName.length < 3) return err("Please enter the parent or guardian's full name.");
    if (!body.parentPhone) return err("Please enter a phone number.");
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(body.parentEmail)) return err("Please enter a valid email.");
    if (doc === "parent" && !body.role) return err("Please choose the volunteer role you will claim.");
    if (pads.player && !pads.player.ink) return err("The player needs to sign in the player signature box.");
    if (!pads.parent.ink) return err("A parent or guardian needs to sign in the parent signature box.");
    if (!body.agree) return err("Please check the box to agree to the contract.");
    if (!body.esign) return err("Please check the box to agree to sign electronically.");
    if (pads.player) body.signatures.player = sigImage(pads.player.canvas);
    body.signatures.parent = sigImage(pads.parent.canvas);
    err("");
    const btn = $("#ctSubmit");
    btn.disabled = true; btn.textContent = "Submitting...";
    try {
      const r = await api("/api/contracts/sign", { method: "POST", body });
      $("#signer").classList.add("hidden");
      $("#done").classList.remove("hidden");
      $("#copy").innerHTML = window.signedCopyHtml(r.record);
      const other = doc === "player" ? "parent" : "player";
      $("#otherDoc").href = `/contracts/${other}`;
      $("#otherDoc").textContent = `Next: sign the ${window.CONTRACTS[other].title}`;
      $("#doneMsg").textContent = `${C.title} for ${body.playerName} is on file with the coaching staff. Save a copy for your records.`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (x) {
      err(x.message);
    } finally {
      btn.disabled = false; btn.textContent = "Sign and submit";
    }
  });
  $("#printCopy").addEventListener("click", () => window.print());
})();
