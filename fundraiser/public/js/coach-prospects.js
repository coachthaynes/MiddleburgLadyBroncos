// Coaches dashboard, Sponsor prospects tab: add local businesses, email them, and move each one along the lead path.
(function () {
  // The lead path, from first contact to a closed deal. Keys match what the server stores.
  const STAGES = [
    { k: "new", label: "New lead", hint: "Not contacted yet" },
    { k: "emailed", label: "Contacted", hint: "Emailed or called, waiting to hear back" },
    { k: "visited", label: "Talking", hint: "They answered or you met" },
    { k: "interested", label: "Ready to sign", hint: "They said yes and need to sign up or pick meal dates" },
    { k: "signed", label: "Won", hint: "Signed up or meal dates set" },
    { k: "notnow", label: "Not this year", hint: "Closed without a deal" },
  ];
  const STATUS = Object.fromEntries(STAGES.map((s) => [s.k, s.label]));
  const PILL = { new: "", emailed: "warn", visited: "warn", interested: "red", signed: "good", notnow: "" };
  const OPEN = ["new", "emailed", "visited", "interested"];
  const SITE = "https://mhsladybroncos.com";
  // The three emails the coach sends, and how many days to wait before each follow up.
  const STEPS = [
    { n: 1, label: "Intro email", wait: 0,
      subject: "Sponsoring Middleburg Lady Broncos Basketball",
      body: "Hi {business} team,\n\nMy name is Tenise Haynes, and I am the head girls basketball coach at Middleburg High School. Our Lady Broncos are a hard working group of young women, and we are looking for a few local businesses to partner with us this season.\n\nSponsorships start at $750 and include your business on our website sponsor wall, shout outs at home games, social media features and more. Every dollar goes to Middleburg High School to cover tournaments, travel, uniforms and gear.\n\nSee every level and sign up here: {link}\nOur sponsor packet: {packet}\n\nWould you be open to a quick call or visit this week?\n\nThank you for supporting our community,\nCoach Tenise Haynes\nHead Coach, Middleburg Lady Broncos Basketball\n\nIf you would rather not hear from us, just reply and let me know." },
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
      body: "Hi {business} team,\n\nMy name is Tenise Haynes, and I am the head girls basketball coach at Middleburg High School. Our Lady Broncos are a hard working group of young women, and we are looking for local restaurants to help feed our team on game days this season.\n\nWould {business} be willing to donate team meals for our players and coaches? You can cover as few as 1 game or as many as all 25 games on our schedule, whatever works best for you. A good meal before a game or after a long road trip means a lot to our girls.\n\nTo thank you, we will give {business} a shout out at our home games and on our team social media, and we will make sure our families know where their team eats.\n\nJust reply with how many games you would like to cover, and I will send our schedule and head count so you can pick the dates.\n\nThank you for supporting our community,\nCoach Tenise Haynes\nHead Coach, Middleburg Lady Broncos Basketball\n\nIf you would rather not hear from us, just reply and let me know." },
    { n: 2, label: "Follow up", wait: 5,
      subject: "Following up: Lady Broncos team meals",
      body: "Hi {business} team,\n\nI wanted to follow up on my note about team meals for Middleburg Lady Broncos Basketball. Even one meal for one game makes a big difference for our girls, and you are welcome to cover anywhere from 1 to all 25 games.\n\nJust reply with the number of games, and I will send our schedule and head count. I am also happy to talk by phone or stop by in person.\n\nThank you,\nCoach Tenise Haynes\nHead Coach, Middleburg Lady Broncos Basketball" },
    { n: 3, label: "Last note", wait: 10,
      subject: "One last note from the Lady Broncos",
      body: "Hi {business} team,\n\nThis is my last note about team meals, and I promise not to fill up your inbox. If {business} would like to feed the Lady Broncos for a game or two this season, just reply to this email and we will set it up.\n\nIf now is not the right time, I completely understand. Thank you for being part of the Middleburg community.\n\nCoach Tenise Haynes\nHead Coach, Middleburg Lady Broncos Basketball" },
  ];
  const stepsFor = (p) => (p.ask === "meals" ? MEAL_STEPS : STEPS);
  // The built in wording, kept so the coach can go back to it.
  const ORIGINAL = { sponsor: STEPS.map((x) => ({ subject: x.subject, body: x.body })), meals: MEAL_STEPS.map((x) => ({ subject: x.subject, body: x.body })) };
  let emailText = { sponsor: [null, null, null], meals: [null, null, null] }, emailTab = "sponsor";
  function applyEmailText() {
    for (const [kind, steps] of [["sponsor", STEPS], ["meals", MEAL_STEPS]]) {
      steps.forEach((x, i) => Object.assign(x, emailText[kind][i] || ORIGINAL[kind][i]));
    }
  }
  function renderEmails() {
    const steps = emailTab === "meals" ? MEAL_STEPS : STEPS;
    $$("[data-etab]").forEach((b) => { b.className = `btn btn-small ${b.dataset.etab === emailTab ? "btn-primary" : "btn-glass"}`; });
    $("#prEmailList").innerHTML = steps.map((x, i) => `<details class="pr-drip"${i === 0 ? " open" : ""} data-ei="${i}">
      <summary>${esc(x.label)} <small class="muted">${i === 0 ? "sent first" : `${x.wait} days after the last one`}${emailText[emailTab][i] ? " · your wording" : ""}</small></summary>
      <label class="field" style="margin-top:8px">Subject<input class="gselect" type="text" maxlength="200" data-esub value="${esc(x.subject)}"></label>
      <label class="field" style="margin-top:8px">Email<textarea class="gselect" rows="12" maxlength="6000" data-ebody>${esc(x.body)}</textarea></label>
      <div class="btn-row" style="margin-top:8px"><button class="btn btn-primary btn-small" type="button" data-esave>Save</button>${emailText[emailTab][i] ? '<button class="btn btn-glass btn-small" type="button" data-ereset>Back to the original</button>' : ""}</div>
    </details>`).join("");
  }
  async function saveEmails(next, msg) {
    try {
      const r = await api("/api/coach/prospect-emails", { method: "PUT", body: next });
      emailText = r.emailText;
      applyEmailText();
      renderEmails();
      render();
      toast(msg);
    } catch (err) { toast(err.message); }
  }
  $$("[data-etab]").forEach((b) => b.addEventListener("click", () => { emailTab = b.dataset.etab; renderEmails(); }));
  $("#prEmailList").addEventListener("click", (e) => {
    const box = e.target.closest("[data-ei]");
    if (!box) return;
    const i = Number(box.dataset.ei), next = { sponsor: [...emailText.sponsor], meals: [...emailText.meals] };
    if (e.target.closest("[data-esave]")) {
      const subject = box.querySelector("[data-esub]").value.trim(), body = box.querySelector("[data-ebody]").value.trim();
      if (!subject || !body) return toast("The subject and email both need words.");
      const same = subject === ORIGINAL[emailTab][i].subject && body === ORIGINAL[emailTab][i].body;
      next[emailTab][i] = same ? null : { subject, body };
      saveEmails(next, "Email saved");
    }
    if (e.target.closest("[data-ereset]")) {
      if (!confirm("Go back to the original wording for this email?")) return;
      next[emailTab][i] = null;
      saveEmails(next, "Back to the original");
    }
  });

  let list = [];
  let filter = "all";
  let query = "";
  const chosen = new Set();
  const day = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const enc = encodeURIComponent;

  const lastEmail = (p) => p.emails.slice().sort((a, b) => b.step - a.step)[0];
  const nextStep = (p) => { const l = lastEmail(p); return l ? stepsFor(p)[l.step] : stepsFor(p)[0]; };
  // A follow up is due once enough days have passed since the last email and the business has not answered.
  function followUpDue(p) {
    const l = lastEmail(p), next = nextStep(p);
    if (!l || !next || !["emailed", "new"].includes(p.status)) return false;
    return Date.now() - Date.parse(l.at) >= next.wait * 86400000;
  }
  function fill(t, p) {
    const vars = { business: p.name, link: `${SITE}/sponsor`, packet: `${SITE}/sponsor-packet.pdf`, playerLine: "" };
    return t.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  }
  // Gmail on a computer opens in the coach's own account; phones open the Gmail app instead (see the click handler).
  let gmailUser = "", emailReady = false, tracking = false;
  const gmailLink = (p, s) => `https://mail.google.com/mail/?view=cm&fs=1${gmailUser ? `&authuser=${enc(gmailUser)}` : ""}&to=${enc(p.email)}&su=${enc(fill(s.subject, p))}&body=${enc(fill(s.body, p))}`;
  const gmailApp = (p, s) => `googlegmail:///co?to=${enc(p.email)}&subject=${enc(fill(s.subject, p))}&body=${enc(fill(s.body, p))}`;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const mailLink = (p, s) => `mailto:${p.email}?subject=${enc(fill(s.subject, p))}&body=${enc(fill(s.body, p))}`;

  // What Resend reported about one email.
  function mailState(e) {
    if (e.bounced) return ' · <b style="color:var(--red)">bounced</b>';
    if (e.complained) return ' · <b style="color:var(--red)">marked as spam</b>';
    if (e.clicked) return ` · <b style="color:var(--good, #1d7a46)">opened and clicked ${day(e.clicked)}</b>`;
    if (e.opened) return ` · <b style="color:var(--good, #1d7a46)">opened ${day(e.opened)}</b>`;
    if (e.delivered) return " · delivered, not opened yet";
    return tracking && e.id ? " · waiting on delivery" : "";
  }
  const opened = (p) => p.emails.some((e) => e.opened || e.clicked);

  function matches(p) {
    if (filter === "opened" && !opened(p)) return false;
    if (filter === "bounced" && !p.bounced) return false;
    if (filter === "due" && !followUpDue(p)) return false;
    if (filter === "open" && !OPEN.includes(p.status)) return false;
    if (!["all", "due", "open", "opened", "bounced"].includes(filter) && p.status !== filter) return false;
    if (query && ![p.name, p.category, p.address, p.email, p.notes].join(" ").toLowerCase().includes(query)) return false;
    return true;
  }

  function renderStats() {
    $("#psTotal").textContent = list.length;
    $("#psEmail").textContent = list.filter((p) => p.email).length;
    $("#psOpen").textContent = list.filter((p) => OPEN.includes(p.status)).length;
    $("#psDue").textContent = list.filter(followUpDue).length;
    $("#psSigned").textContent = list.filter((p) => p.status === "signed").length;
  }

  // The stage buttons along the top: how many businesses are in each, tap one to see them.
  function renderPath() {
    const n = (f) => list.filter(f).length;
    const tab = (k, label, count) => `<button type="button" data-pf="${k}" class="${filter === k ? "on" : ""}"><b>${count}</b>${esc(label)}</button>`;
    $("#prTabs").innerHTML = [
      tab("all", "Everything", list.length),
      tab("due", "Follow up due", n(followUpDue)),
      tab("opened", "Opened an email", n(opened)),
      tab("bounced", "Bounced", n((p) => !!p.bounced)),
      ...STAGES.map((s) => tab(s.k, s.label, n((p) => p.status === s.k))),
    ].join("");
  }

  // What to do next for a business, based on where it is on the lead path.
  function nextAction(p, next) {
    const due = lastEmail(p) && next ? Date.parse(lastEmail(p).at) + next.wait * 86400000 : 0;
    const send = p.email && next && emailReady && !p.bounced
      ? `<button class="btn ${!lastEmail(p) || followUpDue(p) ? "btn-primary" : "btn-glass"} btn-small" data-act="send">Send ${esc(next.label.toLowerCase())}${due && !followUpDue(p) ? ` (due ${day(due)})` : ""}</button>` : "";
    const call = p.phone ? `<a class="btn btn-glass btn-small" href="tel:${esc(p.phone.replace(/[^\d+]/g, ""))}">Call</a>` : "";
    const move = (k, label, primary) => `<button class="btn ${primary ? "btn-primary" : "btn-glass"} btn-small" data-stage="${k}">${label}</button>`;
    switch (p.status) {
      case "new": return `${send}${call}${move("emailed", "I reached out another way", false)}${!p.email && !p.phone ? '<span class="muted">Add an email or phone under Details.</span>' : ""}`;
      case "emailed": return `${move("visited", "They answered", !followUpDue(p))}${send}${call}${p.email && !next ? '<span class="muted">All three emails sent.</span>' : ""}`;
      case "visited": return `${move("interested", "They said yes", true)}${call}<span class="muted">${p.ask === "meals" ? "Ask how many games they can feed." : "Send them the sign up link: mhsladybroncos.com/sponsor"}</span>`;
      case "interested": return `${move("signed", p.ask === "meals" ? "Meal dates set" : "They signed up", true)}<span class="muted">${p.ask === "meals" ? "Send the schedule and head count." : "Waiting on the sponsor form or payment."}</span>`;
      case "signed": return `<span class="pill good">Won${p.stageAt?.signed ? ` ${esc(day(p.stageAt.signed))}` : ""}</span>${p.ask === "meals" ? "" : '<span class="muted">Once they fill out the sponsor form, they show on the Sponsors list.</span>'}`;
      case "notnow": return `${move("new", "Open this lead again", false)}<span class="muted">Closed${p.stageAt?.notnow ? ` ${esc(day(p.stageAt.notnow))}` : ""}.</span>`;
      default: return "";
    }
  }

  function card(p) {
    const next = nextStep(p);
    const at = STAGES.findIndex((s) => s.k === p.status);
    const map = p.address ? `https://www.google.com/maps/search/?api=1&query=${enc(p.name + " " + p.address)}` : `https://www.google.com/maps/search/?api=1&query=${enc(p.name + " Middleburg FL")}`;
    const emailBox = p.email
      ? `<label class="field">Email <small>${p.emailFrom === "website" ? "found on their website" : p.emailFrom === "listing" ? "from the directory" : "added by you"}</small><input class="gselect" type="email" data-f="email" value="${esc(p.email)}"></label>`
      : `<label class="field">Email <small>${p.emailChecked ? (p.website ? "none found on their website" : "no website listed") : ""}</small><input class="gselect" type="email" data-f="email" placeholder="Add an email"></label>`;
    const sent = p.emails.length ? `<div class="pr-steps">${p.emails.map((e) => `${stepsFor(p)[e.step - 1].label} sent ${day(e.at)}${mailState(e)}`).join(" · ")}${followUpDue(p) ? ' · <b style="color:var(--red)">Follow up due</b>' : ""}</div>` : "";
    const bounce = p.bounced ? `<div class="pr-bounce"><b>Email bounced.</b> ${esc(p.bounced)} Check the address under Details and fix it, or call them instead.</div>` : "";
    const stages = STAGES.map((s, i) => `<button type="button" data-stage="${s.k}" class="${s.k === p.status ? "on" : ""}${i < at && at < 5 ? " done" : ""}${s.k === "notnow" ? " lost" : ""}" title="${esc(s.hint)}"${s.k === p.status ? ' aria-current="step"' : ""}>${esc(s.label)}</button>`).join("");
    return `<article class="pr" data-id="${esc(p.id)}">
      <div class="pr-head">
        <div><input type="checkbox" data-pick ${chosen.has(p.id) ? "checked" : ""} aria-label="Select ${esc(p.name)}"><div><b>${esc(p.name)}</b><small>${p.ask === "meals" ? "Team meals · " : ""}${esc(p.category)}</small></div></div>
        <span>${p.bounced ? '<span class="pill red">Bounced</span> ' : opened(p) ? '<span class="pill good">Opened</span> ' : ""}<span class="pill ${PILL[p.status] || ""}">${esc(STATUS[p.status] || "New lead")}</span></span>
      </div>
      <div class="pr-info">
        <a href="${esc(map)}" target="_blank" rel="noopener">${esc(p.address || "Find on the map")}</a>
        ${p.phone ? `<a href="tel:${esc(p.phone.replace(/[^\d+]/g, ""))}">${esc(p.phone)}</a>` : ""}
        ${p.email ? `<span>${esc(p.email)}</span>` : ""}
        ${p.website ? `<a href="${esc(p.website)}" target="_blank" rel="noopener">${esc(p.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</a>` : ""}
      </div>
      <div class="pr-stages" role="group" aria-label="Lead stage">${stages}</div>
      <div class="pr-next">${nextAction(p, next)}</div>
      ${sent}
      ${bounce}
      ${p.notes ? `<div class="pr-note">${esc(p.notes)}</div>` : ""}
      <details class="pr-more"><summary>Details and notes</summary>
        <div class="pr-body">
          ${emailBox}
          <label class="field">Phone<input class="gselect" type="tel" data-f="phone" value="${esc(p.phone)}" placeholder="Add a phone"></label>
          <label class="field">Ask for<select class="gselect" data-f="ask"><option value="sponsor"${p.ask !== "meals" ? " selected" : ""}>Sponsorship</option><option value="meals"${p.ask === "meals" ? " selected" : ""}>Team meals</option></select></label>
          <label class="field wide">Your notes<textarea class="gselect" rows="3" maxlength="800" data-f="notes" placeholder="Who you talked to, what they said, when to follow up">${esc(p.notes)}</textarea></label>
          <div class="btn-row wide">
            ${p.email && next ? `<a class="btn btn-glass btn-small" href="${esc(gmailLink(p, next))}" target="_blank" rel="noopener" data-gmail data-send="${next.n}">Write the ${esc(next.label.toLowerCase())} in Gmail</a>` : ""}
            ${!p.email && p.website && !p.emailChecked ? '<button class="btn btn-glass btn-small" data-act="find">Find their email</button>' : ""}
            <button class="btn btn-glass btn-small" data-act="delete">Remove from the list</button>
          </div>
        </div>
      </details>
    </article>`;
  }

  function render() {
    renderStats();
    renderPath();
    const shown = list.filter(matches);
    const stage = STAGES.find((s) => s.k === filter);
    $("#prCount").textContent = `${shown.length} shown${stage ? ` in ${stage.label}` : ""}${chosen.size ? `, ${chosen.size} selected` : ""}${emailReady && !tracking ? ". Opens and bounces show once Resend tracking is connected." : ""}`;
    $("#prList").innerHTML = shown.length ? shown.map(card).join("")
      : `<p class="muted" style="margin:0">${list.length ? (stage ? `No businesses in ${stage.label} right now. ${stage.hint}.` : "No businesses match this view.") : "No businesses yet. Add some from the team directory above."}</p>`;
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
      const d = await api("/api/coach/prospects");
      list = d.prospects || [];
      gmailUser = d.gmailUser || "";
      emailReady = !!d.emailReady;
      tracking = !!d.tracking;
      if (d.emailText) { emailText = d.emailText; applyEmailText(); renderEmails(); }
      $("#prGroups").innerHTML = Object.entries(d.groups).map(([k, v]) => `<label><input type="checkbox" value="${esc(k)}" checked> ${esc(v)}</label>`).join("");
      $("#prBulkStage").innerHTML = `<option value="">Move selected to...</option>${STAGES.map((x) => `<option value="${x.k}">${esc(x.label)}</option>`).join("")}`;
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
    render();
  });
  $("#prFind").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
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
    const ready = picked.filter((p) => p.email && !p.bounced && nextStep(p) && (!lastEmail(p) || followUpDue(p)) && !["signed", "notnow"].includes(p.status));
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
    const v = $("#prBulkStage").value;
    if (!v || !chosen.size) return toast("Pick businesses and a stage first.");
    for (const id of [...chosen]) {
      try {
        const r = await api(`/api/coach/prospects/${enc(id)}`, { method: "PATCH", body: { status: v } });
        list = list.map((p) => (p.id === id ? r.prospect : p));
      } catch (e) { toast(e.message); break; }
    }
    toast(`Moved ${chosen.size} businesses to ${STATUS[v]}`);
    chosen.clear();
    render();
  });

  $("#prList").addEventListener("change", (e) => {
    const card = e.target.closest("[data-id]");
    if (!card) return;
    const id = card.dataset.id;
    if (e.target.matches("[data-pick]")) { e.target.checked ? chosen.add(id) : chosen.delete(id); $("#prCount").textContent = `${list.filter(matches).length} shown${chosen.size ? `, ${chosen.size} selected` : ""}`; return; }
    const f = e.target.dataset.f;
    if (f === "notes") patch(id, { notes: e.target.value }, "Note saved");
    if (f === "ask") patch(id, { ask: e.target.value }, e.target.value === "meals" ? "Will ask for team meals" : "Will ask for a sponsorship");
    if (f === "email") patch(id, { email: e.target.value.trim() }, "Email saved");
    if (f === "phone") patch(id, { phone: e.target.value.trim() }, "Phone saved");
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
    const stageBtn = e.target.closest("[data-stage]");
    if (stageBtn) {
      const k = stageBtn.dataset.stage, p = list.find((x) => x.id === id);
      if (p && p.status !== k) patch(id, { status: k }, `Moved to ${STATUS[k]}`);
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
    const lines = [["Business", "Kind", "Ask for", "Address", "Phone", "Email", "Website", "Stage", "Emails sent", "Your notes"].map(q).join(",")];
    list.forEach((p) => lines.push([p.name, p.category, p.ask === "meals" ? "Team meals" : "Sponsorship", p.address, p.phone, p.email, p.website, STATUS[p.status], p.emails.length, p.notes].map(q).join(",")));
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
