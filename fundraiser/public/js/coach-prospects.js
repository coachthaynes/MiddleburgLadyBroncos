// Coaches dashboard, Sponsor prospects tab: find local businesses, email them yourself, assign players to visit.
(function () {
  const STATUS = { new: "Not contacted", assigned: "Assigned", emailed: "Emailed", visited: "Visited", interested: "Interested", signed: "Signed", notnow: "Not this year" };
  const PILL = { new: "", assigned: "warn", emailed: "warn", visited: "warn", interested: "red", signed: "good", notnow: "" };
  const SITE = "https://mhsladybroncos.com";
  // The three emails the coach sends, and how many days to wait before each follow up.
  const STEPS = [
    { n: 1, label: "Intro email", wait: 0,
      subject: "Sponsoring Middleburg Lady Broncos Basketball",
      body: "Hi {business} team,\n\nMy name is Tenise Haynes, and I am the head girls basketball coach at Middleburg High School. Our Lady Broncos are a hard working group of young women, and we are looking for a few local businesses to partner with us this season.\n\nSponsorships start at $750 and include your business on our website sponsor wall, shout outs at home games, social media features and more. Every dollar goes to Middleburg High School to cover tournaments, travel, uniforms and gear.\n\nSee every level and sign up here: {link}\nOur sponsor packet: {packet}\n\n{playerLine}Would you be open to a quick call or visit this week?\n\nThank you for supporting our community,\nCoach Tenise Haynes\nHead Coach, Middleburg Lady Broncos Basketball\n\nIf you would rather not hear from us, just reply and let me know." },
    { n: 2, label: "Follow up", wait: 5,
      subject: "Following up: Lady Broncos sponsorship",
      body: "Hi {business} team,\n\nI wanted to follow up on my note about sponsoring Middleburg Lady Broncos Basketball. Our sponsors get seen by every home crowd, our families and our community, and they help our girls compete this season.\n\nYou can see the levels and sign up in a couple of minutes here: {link}\n\nI would be happy to answer any questions by phone or in person.\n\nThank you,\nCoach Tenise Haynes\nHead Coach, Middleburg Lady Broncos Basketball" },
    { n: 3, label: "Last note", wait: 10,
      subject: "One last note from the Lady Broncos",
      body: "Hi {business} team,\n\nThis is my last note about our sponsorship program, and I promise not to fill up your inbox. If {business} would like to support the Lady Broncos this season, everything is here: {link}\n\nIf now is not the right time, I completely understand. Thank you for being part of the Middleburg community.\n\nCoach Tenise Haynes\nHead Coach, Middleburg Lady Broncos Basketball" },
  ];

  // Food places: ask for team meals on game days, from one game up to the whole season.
  const MEAL_STEPS = [
    { n: 1, label: "Intro email", wait: 0,
      subject: "Team meals for Middleburg Lady Broncos Basketball",
      body: "Hi {business} team,\n\nMy name is Tenise Haynes, and I am the head girls basketball coach at Middleburg High School. Our Lady Broncos are a hard working group of young women, and we are looking for local restaurants to help feed our team on game days this season.\n\nWould {business} be willing to donate team meals for our players and coaches? You can cover as few as 1 game or as many as all 25 games on our schedule, whatever works best for you. A good meal before a game or after a long road trip means a lot to our girls.\n\nTo thank you, we will give {business} a shout out at our home games and on our team social media, and we will make sure our families know where their team eats.\n\nJust reply with how many games you would like to cover, and I will send our schedule and head count so you can pick the dates.\n\n{playerLine}Thank you for supporting our community,\nCoach Tenise Haynes\nHead Coach, Middleburg Lady Broncos Basketball\n\nIf you would rather not hear from us, just reply and let me know." },
    { n: 2, label: "Follow up", wait: 5,
      subject: "Following up: Lady Broncos team meals",
      body: "Hi {business} team,\n\nI wanted to follow up on my note about team meals for Middleburg Lady Broncos Basketball. Even one meal for one game makes a big difference for our girls, and you are welcome to cover anywhere from 1 to all 25 games.\n\nJust reply with the number of games, and I will send our schedule and head count. I am also happy to talk by phone or stop by in person.\n\nThank you,\nCoach Tenise Haynes\nHead Coach, Middleburg Lady Broncos Basketball" },
    { n: 3, label: "Last note", wait: 10,
      subject: "One last note from the Lady Broncos",
      body: "Hi {business} team,\n\nThis is my last note about team meals, and I promise not to fill up your inbox. If {business} would like to feed the Lady Broncos for a game or two this season, just reply to this email and we will set it up.\n\nIf now is not the right time, I completely understand. Thank you for being part of the Middleburg community.\n\nCoach Tenise Haynes\nHead Coach, Middleburg Lady Broncos Basketball" },
  ];
  const stepsFor = (p) => (p.ask === "meals" ? MEAL_STEPS : STEPS);

  let list = [];
  let players = [];
  let filter = "all";
  let query = "";
  let playerFilter = "";
  const chosen = new Set();
  const day = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const enc = encodeURIComponent;

  const lastEmail = (p) => p.emails.slice().sort((a, b) => b.step - a.step)[0];
  const nextStep = (p) => { const l = lastEmail(p); return l ? stepsFor(p)[l.step] : stepsFor(p)[0]; };
  // A follow up is due once enough days have passed since the last email and the business has not answered.
  function followUpDue(p) {
    const l = lastEmail(p), next = nextStep(p);
    if (!l || !next || !["emailed", "assigned", "new"].includes(p.status)) return false;
    return Date.now() - Date.parse(l.at) >= next.wait * 86400000;
  }
  function fill(t, p) {
    const first = (p.playerName || "").split(" ")[0];
    const vars = { business: p.name, link: `${SITE}/sponsor`, packet: `${SITE}/sponsor-packet.pdf`, playerLine: first ? `One of our players, ${first}, may also stop by to introduce herself. ` : "" };
    return t.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  }
  // Gmail on a computer opens in the coach's own account; phones open the Gmail app instead (see the click handler).
  let gmailUser = "", emailReady = false;
  const gmailLink = (p, s) => `https://mail.google.com/mail/?view=cm&fs=1${gmailUser ? `&authuser=${enc(gmailUser)}` : ""}&to=${enc(p.email)}&su=${enc(fill(s.subject, p))}&body=${enc(fill(s.body, p))}`;
  const gmailApp = (p, s) => `googlegmail:///co?to=${enc(p.email)}&subject=${enc(fill(s.subject, p))}&body=${enc(fill(s.body, p))}`;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const mailLink = (p, s) => `mailto:${p.email}?subject=${enc(fill(s.subject, p))}&body=${enc(fill(s.body, p))}`;

  function matches(p) {
    if (playerFilter && p.playerId !== playerFilter) return false;
    if (filter === "due" && !followUpDue(p)) return false;
    if (!["all", "due"].includes(filter) && p.status !== filter) return false;
    if (query && ![p.name, p.category, p.address, p.email, p.playerName].join(" ").toLowerCase().includes(query)) return false;
    return true;
  }

  function renderStats() {
    $("#psTotal").textContent = list.length;
    $("#psEmail").textContent = list.filter((p) => p.email).length;
    $("#psAssigned").textContent = list.filter((p) => p.playerId).length;
    $("#psEmailed").textContent = list.filter((p) => p.emails.length).length;
    $("#psDue").textContent = list.filter(followUpDue).length;
    $("#psInterested").textContent = list.filter((p) => p.status === "interested").length;
    $("#psSigned").textContent = list.filter((p) => p.status === "signed").length;
  }

  const playerOpts = (cur) => `<option value="">Not assigned</option>` + players.map((p) => `<option value="${esc(p.id)}"${p.id === cur ? " selected" : ""}>${esc(p.name)}</option>`).join("");

  function card(p) {
    const next = nextStep(p);
    const map = p.address ? `https://www.google.com/maps/search/?api=1&query=${enc(p.name + " " + p.address)}` : `https://www.google.com/maps/search/?api=1&query=${enc(p.name + " Middleburg FL")}`;
    const emailBox = p.email
      ? `<label class="field">Email <small>${p.emailFrom === "website" ? "found on their website" : p.emailFrom === "listing" ? "from their listing" : "added by you"}</small><input class="gselect" type="email" data-f="email" value="${esc(p.email)}"></label>`
      : `<label class="field">Email <small>${p.emailChecked ? (p.website ? "none found on their website" : "no website listed") : ""}</small><input class="gselect" type="email" data-f="email" placeholder="Add an email"></label>`;
    const steps = p.emails.length ? `<div class="pr-steps">${p.emails.map((e) => `${STEPS[e.step - 1].label} sent ${day(e.at)}`).join(" · ")}${followUpDue(p) ? ' · <b style="color:var(--red)">Follow up due</b>' : ""}</div>` : "";
    return `<article class="pr" data-id="${esc(p.id)}">
      <div class="pr-head">
        <div><input type="checkbox" data-pick ${chosen.has(p.id) ? "checked" : ""} aria-label="Select ${esc(p.name)}"><div><b>${esc(p.name)}</b><small>${p.ask === "meals" ? "Team meals · " : ""}${esc(p.category)}${p.distance ? ` · ${p.distance} miles` : ""}</small></div></div>
        <span class="pill ${PILL[p.status]}">${STATUS[p.status]}${p.playerName ? ` · ${esc(p.playerName.split(" ")[0])}` : ""}</span>
      </div>
      <div class="pr-info">
        <a href="${esc(map)}" target="_blank" rel="noopener">${esc(p.address || "Find on the map")}</a>
        ${p.phone ? `<a href="tel:${esc(p.phone.replace(/[^\d+]/g, ""))}">${esc(p.phone)}</a>` : ""}
        ${p.website ? `<a href="${esc(p.website)}" target="_blank" rel="noopener">${esc(p.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</a>` : ""}
      </div>
      ${steps}
      ${p.playerNote ? `<div class="pr-pnote"><b>${esc((p.playerName || "Player").split(" ")[0])} says:</b> ${esc(p.playerNote)}</div>` : ""}
      <div class="pr-body">
        ${emailBox}
        <label class="field">Assigned to<select class="gselect" data-f="player">${playerOpts(p.playerId)}</select></label>
        <label class="field">Ask for<select class="gselect" data-f="ask"><option value="sponsor"${p.ask !== "meals" ? " selected" : ""}>Sponsorship</option><option value="meals"${p.ask === "meals" ? " selected" : ""}>Team meals</option></select></label>
        <label class="field">Status<select class="gselect" data-f="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${k === p.status ? " selected" : ""}>${v}</option>`).join("")}</select></label>
        <label class="field wide">Your notes<input class="gselect" type="text" maxlength="800" data-f="notes" value="${esc(p.notes)}" placeholder="Who you talked to, what they said, when to follow up"></label>
        <div class="btn-row wide">
          ${p.email && next ? `${emailReady ? `<button class="btn ${!lastEmail(p) || followUpDue(p) ? "btn-primary" : "btn-glass"} btn-small" data-act="send">Send ${esc(next.label.toLowerCase())}${lastEmail(p) && !followUpDue(p) ? ` (due ${day(Date.parse(lastEmail(p).at) + next.wait * 86400000)})` : ""}</button>` : ""}<a class="btn btn-glass btn-small" href="${esc(gmailLink(p, next))}" target="_blank" rel="noopener" data-gmail data-send="${next.n}">${emailReady ? "Write it in Gmail" : `${esc(next.label)} in Gmail`}</a>` : ""}
          ${!p.email && p.website && !p.emailChecked ? '<button class="btn btn-glass btn-small" data-act="find">Find their email</button>' : ""}
          ${p.email && !next ? '<span class="muted" style="font-size:.85rem">All three emails sent</span>' : ""}
          <button class="btn btn-glass btn-small" data-act="delete">Remove</button>
        </div>
      </div>
    </article>`;
  }

  function render() {
    renderStats();
    const shown = list.filter(matches);
    $("#prCount").textContent = `${shown.length} shown${chosen.size ? `, ${chosen.size} selected` : ""}`;
    $("#prList").innerHTML = shown.length ? shown.map(card).join("")
      : `<p class="muted" style="margin:0">${list.length ? "No businesses match this view." : "No businesses yet. Use Find businesses above to search around Middleburg."}</p>`;
    $("#prAll").checked = shown.length > 0 && shown.every((p) => chosen.has(p.id));
  }

  function renderDrip(d) {
    $("#prDripBtn").textContent = d.drip.on ? "Turn off" : "Turn on";
    $("#prDripBtn").className = `btn btn-small ${d.drip.on ? "btn-glass" : "btn-primary"}`;
    $("#prDripStatus").innerHTML = d.drip.on
      ? `<span class="pill good">On since ${esc(day(d.drip.onAt))}</span>${d.emailReady ? "" : ' <span class="pill warn">Email is not set up</span>'}`
      : '<span class="pill">Off</span> <span class="muted" style="font-size:.88rem">Read the emails below, then turn it on.</span>';
    $("#prDripSteps").innerHTML = d.dripSteps.map((s) => `<details class="pr-drip"><summary>${esc(s.name)} <small class="muted">${esc(s.when)}</small></summary><p style="margin:8px 0 0"><b>${esc(s.subject)}</b></p><pre>${esc(s.body)}</pre></details>`).join("");
  }

  async function load() {
    try {
      const [d, o] = await Promise.all([api("/api/coach/prospects"), api("/api/coach/overview").catch(() => ({ players: [] }))]);
      list = d.prospects || [];
      gmailUser = d.gmailUser || "";
      emailReady = !!d.emailReady;
      players = (o.players || []).map((p) => ({ id: p.id, name: [p.first, p.last].filter(Boolean).join(" ") || p.name })).sort((a, b) => a.name.localeCompare(b.name));
      $("#prGroups").innerHTML = Object.entries(d.groups).map(([k, v]) => `<label><input type="checkbox" value="${esc(k)}" checked> ${esc(v)}</label>`).join("");
      const opts = players.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
      $("#prPlayerFilter").innerHTML = `<option value="">Every player</option>${opts}`;
      $("#prBulkPlayer").innerHTML = `<option value="">Assign selected to...</option>${opts}<option value="none">Nobody (unassign)</option>`;
      renderDrip(d);
      render();
    } catch (e) { toast(e.message); }
  }

  async function patch(id, body, msg) {
    try {
      const r = await api(`/api/coach/prospects/${enc(id)}`, { method: "PATCH", body });
      list = list.map((p) => (p.id === id ? r.prospect : p));
      render();
      if (msg) toast(msg);
    } catch (e) { toast(e.message); }
  }

  // ----- search -----
  $("#prSearch").addEventListener("submit", async (e) => {
    e.preventDefault();
    const groups = $$("#prGroups input:checked").map((x) => x.value);
    if (!groups.length) { $("#prSearchMsg").textContent = "Pick at least one kind of business."; return; }
    const btn = $("#prSearchBtn");
    btn.disabled = true;
    btn.textContent = "Adding...";
    try {
      const r = await api("/api/coach/prospects/search", { method: "POST", body: { groups } });
      $("#prSearchMsg").textContent = `Added ${r.added} businesses from the team directory.`
        + (r.updated ? ` Filled in emails or details for ${r.updated} already on your list.` : "")
        + (r.skippedKnown ? ` Skipped ${r.skippedKnown} with nothing new or already sponsors.` : "");
    } catch (err) { $("#prSearchMsg").textContent = err.message; }
    btn.disabled = false;
    btn.textContent = "Add these businesses";
    await load();
  });

  // Look through each website for an email address, three at a time.
  $("#prFindAll").addEventListener("click", async () => {
    const todo = list.filter((p) => !p.email && p.website && !p.emailChecked);
    if (!todo.length) { $("#prSearchMsg").textContent = "Every business with a website has already been checked."; return; }
    const btn = $("#prFindAll");
    btn.disabled = true;
    let done = 0, found = 0;
    const work = async () => {
      while (todo.length) {
        const p = todo.shift();
        try {
          const r = await api(`/api/coach/prospects/${enc(p.id)}/find-email`, { method: "POST" });
          list = list.map((x) => (x.id === p.id ? r.prospect : x));
          if (r.prospect.email) found++;
        } catch { /* skip this one */ }
        done++;
        $("#prSearchMsg").textContent = `Checked ${done} websites, found ${found} emails...`;
      }
    };
    await Promise.all([work(), work(), work()]);
    $("#prSearchMsg").textContent = `Done. Checked ${done} websites and found ${found} email addresses. Businesses without one can still be called or visited.`;
    btn.disabled = false;
    render();
  });

  // ----- list -----
  $("#prTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pf]");
    if (!b) return;
    filter = b.dataset.pf;
    $$("#prTabs button").forEach((x) => x.classList.toggle("on", x === b));
    render();
  });
  $("#prFind").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  $("#prPlayerFilter").addEventListener("change", (e) => { playerFilter = e.target.value; render(); });
  $("#prAll").addEventListener("change", (e) => {
    list.filter(matches).forEach((p) => (e.target.checked ? chosen.add(p.id) : chosen.delete(p.id)));
    render();
  });
  // Send the next email in the series through the team email (Resend). Replies go to the coach's Gmail.
  async function sendNow(p) {
    const step = nextStep(p);
    const r = await api(`/api/coach/prospects/${enc(p.id)}/send`, { method: "POST", body: { step: step.n, subject: fill(step.subject, p), body: fill(step.body, p) } });
    list = list.map((x) => (x.id === p.id ? r.prospect : x));
  }
  $("#prBulkSend").addEventListener("click", async () => {
    if (!emailReady) return toast("Team email is not set up yet.");
    const picked = list.filter((p) => chosen.has(p.id));
    const ready = picked.filter((p) => p.email && nextStep(p) && (!lastEmail(p) || followUpDue(p)) && !["signed", "notnow"].includes(p.status));
    if (!ready.length) return toast("None of the selected businesses have an email due.");
    if (!confirm(`Send the next email to ${ready.length} businesses from the team email? Replies will come to your Gmail.`)) return;
    const btn = $("#prBulkSend");
    btn.disabled = true;
    let sent = 0;
    const failed = [];
    for (const [i, p] of ready.entries()) {
      btn.textContent = `Sending ${i + 1} of ${ready.length}...`;
      try { await sendNow(p); sent++; } catch (err) { failed.push(`${p.name}: ${err.message}`); }
      await new Promise((r) => setTimeout(r, 600));
    }
    btn.disabled = false;
    btn.textContent = "Send next email to selected";
    chosen.clear();
    render();
    toast(`Sent ${sent} emails.${picked.length > ready.length ? ` Skipped ${picked.length - ready.length} with no email, nothing due, or already signed.` : ""}${failed.length ? ` ${failed.length} did not send: ${failed[0]}` : ""}`);
  });

  $("#prBulkGo").addEventListener("click", async () => {
    const v = $("#prBulkPlayer").value;
    if (!v || !chosen.size) return toast("Pick businesses and a player first.");
    const pl = players.find((p) => p.id === v);
    const body = { player: v === "none" ? { id: "" } : { id: pl.id, name: pl.name } };
    for (const id of [...chosen]) {
      try {
        const r = await api(`/api/coach/prospects/${enc(id)}`, { method: "PATCH", body });
        list = list.map((p) => (p.id === id ? r.prospect : p));
      } catch (e) { toast(e.message); break; }
    }
    toast(v === "none" ? "Unassigned" : `Assigned ${chosen.size} businesses to ${pl.name.split(" ")[0]}`);
    chosen.clear();
    render();
  });

  $("#prList").addEventListener("change", (e) => {
    const card = e.target.closest("[data-id]");
    if (!card) return;
    const id = card.dataset.id;
    if (e.target.matches("[data-pick]")) { e.target.checked ? chosen.add(id) : chosen.delete(id); $("#prCount").textContent = `${list.filter(matches).length} shown${chosen.size ? `, ${chosen.size} selected` : ""}`; return; }
    const f = e.target.dataset.f;
    if (f === "status") patch(id, { status: e.target.value }, "Saved");
    if (f === "notes") patch(id, { notes: e.target.value }, "Note saved");
    if (f === "ask") patch(id, { ask: e.target.value }, e.target.value === "meals" ? "Will ask for team meals" : "Will ask for a sponsorship");
    if (f === "email") patch(id, { email: e.target.value.trim() }, "Email saved");
    if (f === "player") {
      const pl = players.find((p) => p.id === e.target.value);
      patch(id, { player: pl ? { id: pl.id, name: pl.name } : { id: "" } }, pl ? `Assigned to ${pl.name.split(" ")[0]}` : "Unassigned");
    }
  });
  $("#prList").addEventListener("click", async (e) => {
    const card = e.target.closest("[data-id]");
    if (!card) return;
    const id = card.dataset.id;
    const send = e.target.closest("[data-send]");
    if (send) {
      const p = list.find((x) => x.id === id), step = p && nextStep(p);
      // The Gmail web page cannot write an email on a phone, so open the Gmail app there.
      if (p && step && send.dataset.gmail !== undefined && (isIOS || isAndroid)) {
        e.preventDefault();
        if (isIOS) {
          location.href = gmailApp(p, step);
          // No Gmail app on this phone: fall back to the phone's mail app.
          setTimeout(() => { if (!document.hidden) location.href = mailLink(p, step); }, 1500);
        } else location.href = mailLink(p, step); // Android sends mail links to the Gmail app
      }
      setTimeout(() => patch(id, { emailed: Number(send.dataset.send) }), 600);
      return;
    }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "send") {
      const p = list.find((x) => x.id === id), btn = e.target.closest("[data-act]");
      if (lastEmail(p) && !followUpDue(p) && !confirm(`The ${nextStep(p).label.toLowerCase()} is not due yet. Send it now anyway?`)) return;
      btn.disabled = true;
      btn.textContent = "Sending...";
      try { await sendNow(p); toast(`Sent to ${p.name}`); } catch (err) { toast(err.message); }
      render();
      return;
    }
    if (act === "find") {
      try {
        const r = await api(`/api/coach/prospects/${enc(id)}/find-email`, { method: "POST" });
        list = list.map((p) => (p.id === id ? r.prospect : p));
        render();
        toast(r.prospect.email ? "Email found" : "No email on their website. Try calling or visiting.");
      } catch (err) { toast(err.message); }
    }
    if (act === "delete") {
      if (!confirm("Remove this business from your list?")) return;
      try { await api(`/api/coach/prospects/${enc(id)}`, { method: "DELETE" }); list = list.filter((p) => p.id !== id); chosen.delete(id); render(); } catch (err) { toast(err.message); }
    }
  });

  $("#prImport").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = $("#prImportText").value.trim();
    if (!text) return;
    try {
      const r = await api("/api/coach/prospects/import", { method: "POST", body: { text } });
      $("#prImportMsg").textContent = `Added ${r.added} businesses.${r.updated ? ` Filled in missing details for ${r.updated} already on your list.` : ""}${r.skipped ? ` Skipped ${r.skipped} with nothing new.` : ""}`;
      $("#prImportText").value = "";
      await load();
    } catch (err) { $("#prImportMsg").textContent = err.message; }
  });

  $("#prAdd").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const r = await api("/api/coach/prospects", { method: "POST", body: Object.fromEntries(["name", "category", "address", "phone", "email", "website"].map((k) => [k, f[k].value])) });
      list.push(r.prospect);
      f.reset();
      render();
      toast("Business added");
    } catch (err) { toast(err.message); }
  });

  $("#prDripBtn").addEventListener("click", async () => {
    const on = $("#prDripBtn").textContent === "Turn on";
    if (on && !confirm("Turn on automatic emails for businesses that sign up on the sponsor page from now on?")) return;
    try {
      await api("/api/coach/sponsor-drip", { method: "PUT", body: { on } });
      toast(on ? "Automatic sponsor emails are on" : "Automatic sponsor emails are off");
      await load();
    } catch (e) { toast(e.message); }
  });

  $("#prCsv").addEventListener("click", () => {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["Business", "Kind", "Miles", "Address", "Phone", "Email", "Website", "Status", "Assigned to", "Emails sent", "Your notes", "Player note"].map(q).join(",")];
    list.forEach((p) => lines.push([p.name, p.category, p.distance, p.address, p.phone, p.email, p.website, STATUS[p.status], p.playerName, p.emails.length, p.notes, p.playerNote].map(q).join(",")));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = `sponsor-prospects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  let started = false;
  document.addEventListener("coach:ready", () => {
    if (started) return;
    started = true;
    load();
  });
})();
