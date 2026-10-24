// Coaches dashboard: Hub (every login and admin page), Home page editor and the Fundraiser tab.
(function () {
  // ----- tabs -----
  const TABS = { hub: "tabHub", home: "tabHome", fundraiser: "tabFund" };
  function showTab(name) {
    if (!TABS[name]) name = "hub";
    Object.entries(TABS).forEach(([k, id]) => {
      $("#" + id).hidden = k !== name;
      $(`[data-tab="${k}"]`).setAttribute("aria-selected", String(k === name));
    });
    if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
  }
  $$("[data-tab]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (b) { showTab(b.dataset.go); window.scrollTo({ top: 0 }); }
  });
  window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));
  window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  // ----- hub links (links only, never passwords) -----
  const LINKS = [
    { group: "Team websites", items: [
      ["Home page", "/", "mhsladybroncos.com"],
      ["Player Hub", "/players", "Recruiting sites and player tools"],
      ["Donate page", "/donate", "Team fundraiser"],
      ["Sponsor page", "/sponsor", "Sponsor levels and interest form"],
      ["Sponsor packet", "/sponsor-packet.pdf", "PDF to send to businesses"],
      ["Team Store", "https://ladybroncosstore.netlify.app", "Fan gear for families"],
    ] },
    { group: "Coach logins", items: [
      ["Fundraiser dashboard", "#fundraiser", "Gifts, sponsors, players and outreach"],
      ["Athlete Monitor", "/athletemonitor/", "Testing, training, game stats and weekly reports"],
      ["MHS Secret Binder", "/secretbinder/", "Offense and defense playbook"],
      ["Recruit Board admin", "https://recruitingboard.elevateherhoopsreport.com/admin/", "College coach lists, drips and leads"],
      ["Madi Visuals dashboard", "https://madivisuals.netlify.app", "Photos and video for the player sites"],
      ["Social Scheduler", "https://social-schdeuler.netlify.app", "Schedule Instagram and Facebook posts"],
      ["Bronco Life Skills", "https://broncolifeskills.netlify.app", "Mentorship lessons"],
    ] },
    { group: "Player sites and logins", items: [
      ["Aiyana Haynes", "https://elevateherhoopsreport.com/aiyana-haynes/", "Recruiting site"],
      ["Kennedy Jeffress", "https://elevateherhoopsreport.com/kennedy-jeffress", "Recruiting site"],
      ["Aliyna McCobb", "https://elevateherhoopsreport.com/players/aliyna-mccobb", "Recruiting site"],
      ["Catherine Bodway", "https://elevateherhoopsreport.com/players/catherine-bodway", "Recruiting site"],
      ["Janiyla Owens", "https://elevateherhoopsreport.com/players/janiyla-owens", "Recruiting site"],
      ["Maliya Lassiter", "https://elevateherhoopsreport.com/players/maliya-lassiter", "Recruiting site"],
      ["Nyla Parsons", "https://elevateherhoopsreport.com/players/nyla-parsons", "Recruiting site"],
      ["Savanna Padgett", "https://elevateherhoopsreport.com/players/savanna-padgett", "Recruiting site"],
      ["Sophia Butler", "https://elevateherhoopsreport.com/players/sophia-butler", "Recruiting site"],
      ["Players directory", "https://elevateherhoopsreport.com/players-directory.html", "Elevate Her player sites"],
      ["Elevate Her Hoops Report", "https://elevateherhoopsreport.com", "Player site program"],
      ["Fundraiser player login", "/portal", "Players sign in with their code"],
    ] },
    { group: "Accounts and admin", items: [
      ["Netlify", "https://app.netlify.com/", "Every site, deploys and settings"],
      ["Store orders", "https://app.netlify.com/projects/ladybroncosstore/forms", "Team Store orders in Netlify Forms"],
      ["Site settings and keys", "https://app.netlify.com/projects/ladybroncosfundraiser/configuration/env", "INSTAGRAM_TOKEN and email settings"],
      ["MySchoolBucks", "https://www.myschoolbucks.com", "Donation reports from the school"],
      ["YouTube Studio", "https://studio.youtube.com", "Upload highlights"],
      ["Instagram", "https://www.instagram.com", "Team account"],
      ["Meta Business Suite", "https://business.facebook.com", "Instagram and Facebook insights"],
      ["MaxPreps", "https://www.maxpreps.com", "Schedule, scores and stats"],
      ["Hudl", "https://www.hudl.com/login", "Game film"],
      ["Resend", "https://resend.com/emails", "Supporter email delivery"],
    ] },
  ];
  const ext = (u) => /^https?:/.test(u);
  const linkCard = (label, url, note) => `<a class="glass hub-link" href="${esc(url)}"${ext(url) ? ' target="_blank" rel="noopener"' : url.startsWith("#") ? "" : ' target="_blank" rel="noopener"'}>
      <b>${esc(label)}</b>${note ? `<span>${esc(note)}</span>` : ""}<small>${esc(url.startsWith("#") ? "This dashboard" : url.replace(/^https?:\/\//, "").replace(/\/$/, "") || "mhsladybroncos.com")}</small></a>`;

  let myLinks = [];
  function renderHubLinks() {
    const groups = LINKS.map((g) => ({ group: g.group, items: g.items.map(([label, url, note]) => ({ label, url, note })) }));
    myLinks.forEach((l) => {
      const name = l.group || "My links";
      let g = groups.find((x) => x.group === name);
      if (!g) groups.push((g = { group: name, items: [] }));
      g.items.push(l);
    });
    $("#hubLinks").innerHTML = groups.map((g) => `<section class="hub-group"><h3>${esc(g.group)}</h3><div class="hub-grid">${g.items.map((l) => linkCard(l.label, l.url, l.note)).join("")}</div></section>`).join("");
  }
  function renderMyLinks() {
    $("#myLinks").innerHTML = myLinks.length ? myLinks.map((l, i) => `
      <div class="ed-row links-row" data-i="${i}">
        <label class="field">Name<input data-lk="label" value="${esc(l.label)}" maxlength="60"></label>
        <label class="field">Web address<input data-lk="url" value="${esc(l.url)}" maxlength="300" placeholder="https://"></label>
        <label class="field">Group<input data-lk="group" value="${esc(l.group)}" maxlength="40" placeholder="My links"></label>
        <label class="field">Note<input data-lk="note" value="${esc(l.note)}" maxlength="120"></label>
        <button class="btn btn-danger btn-small" data-lk-del="${i}" aria-label="Remove link">Remove</button>
      </div>`).join("") : '<p class="muted" style="margin:0">No extra links yet.</p>';
  }
  $("#myLinks").addEventListener("input", (e) => {
    const k = e.target.dataset.lk;
    if (k) myLinks[+e.target.closest("[data-i]").dataset.i][k] = e.target.value;
  });
  $("#myLinks").addEventListener("click", (e) => {
    const d = e.target.closest("[data-lk-del]");
    if (d) { myLinks.splice(+d.dataset.lkDel, 1); renderMyLinks(); }
  });
  $("#linkAdd").addEventListener("click", () => { myLinks.push({ label: "", url: "", group: "", note: "" }); renderMyLinks(); });
  $("#linkSave").addEventListener("click", async () => {
    try {
      const r = await api("/api/coach/links", { method: "PUT", body: { links: myLinks } });
      myLinks = r.links;
      renderMyLinks(); renderHubLinks();
      $("#linkMsg").textContent = "Saved";
    } catch (e) { $("#linkMsg").textContent = e.message; }
  });

  // ----- home page editor -----
  const F = (k, label, o = {}) => ({ k, label, ...o });
  const LISTS = {
    schedule: { title: "Game schedule", help: "Games sort by date and split into Home and Away tabs on the home page. Add the result after the game, for example W 54 41. Feature a game to spotlight it above the schedule.", add: "Add a game", max: 60,
      blank: { date: "", opponent: "", home: true, time: "7:30 PM", location: "", note: "", result: "", neutral: false, featured: false },
      fields: [F("date", "Date", { type: "date" }), F("opponent", "Opponent", { max: 60 }), F("home", "Home game", { type: "check" }), F("time", "Varsity time", { ph: "7:30 PM", max: 12 }),
        F("location", "Away gym", { ph: "Only for away games", max: 80 }), F("note", "Note", { ph: "Senior Night", max: 40 }), F("result", "Result", { ph: "W 54 41", max: 20 }),
        F("neutral", "Neutral site", { type: "check" }), F("featured", "Feature this game", { type: "check" })] },
    highlights: { title: "Highlights", help: "Six slots. Paste a YouTube link to fill a slot. Leave the link empty to show Coming soon.", max: 6, fixed: true,
      blank: { url: "", title: "", tag: "" },
      fields: [F("url", "YouTube link", { type: "url", ph: "https://youtu.be/...", wide: true }), F("title", "Title", { max: 80 }), F("tag", "Label", { ph: "Game recap", max: 30 })] },
    spotlights: { title: "Player spotlights", help: "Featured players with stats and links. Photos come from each player's fundraiser page.", add: "Add a spotlight", max: 6,
      blank: { name: "", number: "", position: "", classYear: "", height: "", headline: "", bio: "", site: "", stats: [], links: [] },
      fields: [F("name", "Full name", { max: 60 }), F("number", "Jersey", { max: 3 }), F("position", "Position", { max: 30 }), F("classYear", "Class of", { ph: "2027", max: 4 }),
        F("height", "Height", { ph: "5'8\"", max: 10 }), F("headline", "Headline", { max: 80, wide: true }), F("bio", "Bio", { type: "area", max: 600, wide: true }),
        F("site", "Recruiting site", { type: "url", wide: true }), F("stats", "Stat line", { type: "stats", wide: true }),
        F("links", "Other links", { type: "links", wide: true, ph: "One per line: Hudl https://www.hudl.com/..." })] },
    roster: { title: "Roster", help: "Everyone here shows on the home page roster and the Player Hub. Players with a fundraiser page are matched by first and last name and get their photo.", add: "Add a player", max: 30,
      blank: { name: "", number: "", position: "", classYear: "", height: "", site: "", maxpreps: "" },
      fields: [F("name", "Full name", { max: 60 }), F("number", "Jersey", { max: 3 }), F("position", "Position", { max: 30 }), F("classYear", "Class of", { max: 4 }),
        F("height", "Height", { max: 10 }), F("site", "Recruiting site", { type: "url", wide: true }), F("maxpreps", "MaxPreps", { type: "url", wide: true })] },
    coaches: { title: "Coaching staff", add: "Add a coach", max: 10,
      blank: { name: "", role: "", bio: "" },
      fields: [F("name", "Name", { max: 60 }), F("role", "Role", { ph: "Assistant Coach", max: 40 }), F("bio", "Short bio", { type: "area", max: 400, wide: true })] },
  };
  const SINGLE = [
    { title: "Hero and season", fields: [F("season", "Season", { ph: "2026/27", max: 20 }), F("heroLead", "Welcome line under LADY BRONCOS", { type: "area", max: 300, wide: true }),
      F("slogans", "Slogans", { type: "lines", max: 4, wide: true, ph: "One per line, for example Bronco Built" }),
      F("ticker", "Ticker lines", { type: "lines", max: 8, wide: true, ph: "One line each. The next game is added on its own." })] },
    { title: "Home gym", fields: [F("venue.name", "Gym name", { max: 80 }), F("venue.city", "City", { max: 60 }), F("venue.map", "Map link", { type: "url", wide: true })] },
    { title: "Recruiting", fields: [F("recruiting.email", "Recruiting email", { type: "email", max: 120 }), F("recruiting.maxpreps", "MaxPreps team page", { type: "url", wide: true })] },
    { title: "YouTube and Instagram", fields: [F("youtube.channel", "YouTube channel link", { type: "url", wide: true }), F("instagram.handle", "Instagram handle", { ph: "without the @", max: 40 }),
      F("instagram.posts", "Instagram post links", { type: "lines", max: 6, wide: true, ph: "Shown only until INSTAGRAM_TOKEN is set. One post link per line." })] },
  ];
  // Fields that hold links or codes, where hyphens are fine.
  const RAW = new Set(["url", "site", "map", "channel", "maxpreps", "email", "date", "posts", "handle", "links"]);

  let st = null, saved = null, savedAt = "", dirty = false;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const set = (o, path, v) => { const ks = path.split("."); const last = ks.pop(); ks.reduce((a, k) => (a[k] ??= {}), o)[last] = v; };

  function fromContent(c) {
    const x = clone({ ...window.HOME, ...(c || {}) });
    x.roster = Object.entries(x.rosterExtras || {}).map(([name, v]) => ({ name, ...v }));
    delete x.rosterExtras;
    x.highlights = (x.highlights || []).slice(0, 6);
    while (x.highlights.length < 6) x.highlights.push({ url: "", title: "", tag: "" });
    x.youtube ??= {}; x.instagram ??= { handle: "", posts: [] }; x.venue ??= {}; x.recruiting ??= {};
    return x;
  }

  function input(f, val, attrs) {
    const ph = f.ph ? ` placeholder="${esc(f.ph)}"` : "";
    const mx = f.max && f.type !== "lines" ? ` maxlength="${f.max}"` : "";
    if (f.type === "check") return `<label class="switch ed-check"><input type="checkbox" ${attrs}${val ? " checked" : ""}> ${esc(f.label)}</label>`;
    if (f.type === "area") return `<label class="field${f.wide ? " wide" : ""}">${esc(f.label)}<textarea ${attrs}${ph}${mx} rows="3">${esc(val || "")}</textarea></label>`;
    if (f.type === "lines") return `<label class="field wide">${esc(f.label)}<textarea ${attrs}${ph} rows="3">${esc((val || []).join("\n"))}</textarea></label>`;
    if (f.type === "links") return `<label class="field wide">${esc(f.label)}<textarea ${attrs}${ph} rows="2">${esc((val || []).map((l) => `${l.label} ${l.url}`).join("\n"))}</textarea></label>`;
    if (f.type === "stats") {
      const s = val || [];
      return `<div class="field wide"><span>${esc(f.label)} <small>Up to four, for example 12.5 and PPG</small></span><div class="stat-edit">${[0, 1, 2, 3].map((i) =>
        `<input ${attrs} data-si="${i}" data-sk="v" value="${esc(s[i]?.v || "")}" maxlength="8" placeholder="12.5" aria-label="Stat ${i + 1} number"><input ${attrs} data-si="${i}" data-sk="l" value="${esc(s[i]?.l || "")}" maxlength="14" placeholder="PPG" aria-label="Stat ${i + 1} label">`).join("")}</div></div>`;
    }
    const type = f.type === "date" ? "date" : f.type === "url" ? "url" : f.type === "email" ? "email" : "text";
    return `<label class="field${f.wide ? " wide" : ""}">${esc(f.label)}<input type="${type}" ${attrs}${ph}${mx} value="${esc(val ?? "")}"></label>`;
  }

  function ytThumb(u) {
    const m = /(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/.exec(u || "");
    return m ? `<img class="yt-thumb" src="https://i.ytimg.com/vi/${m[1]}/mqdefault.jpg" alt="">` : '<div class="yt-thumb empty">Coming soon</div>';
  }

  function renderList(name) {
    const L = LISTS[name];
    const items = st[name];
    const rows = items.map((it, i) => `
      <div class="ed-row${name === "schedule" ? " sched" : ""}" data-list="${name}" data-i="${i}">
        ${name === "highlights" ? `<div class="hl-slot"><b>Slot ${i + 1}</b>${ytThumb(it.url)}</div>` : ""}
        ${L.fields.map((f) => input(f, it[f.k], `data-k="${f.k}"`)).join("")}
        ${L.fixed ? "" : `<div class="row-actions">${i ? `<button class="btn btn-glass btn-small" data-move="${i}" aria-label="Move up">Up</button>` : ""}<button class="btn btn-danger btn-small" data-del="${i}">Remove</button></div>`}
      </div>`).join("");
    return `<details class="glass card ed-section" data-sec="${name}"${name === "schedule" ? " open" : ""}>
      <summary><h3>${esc(L.title)}</h3><span class="pill">${items.length}</span></summary>
      ${L.help ? `<p class="muted ed-help">${esc(L.help)}</p>` : ""}
      <div class="ed-list">${rows || '<p class="muted">Nothing here yet.</p>'}</div>
      ${L.fixed ? "" : `<button class="btn btn-glass btn-small" data-add="${name}"${items.length >= L.max ? " disabled" : ""}>${esc(L.add)}</button>`}
    </details>`;
  }

  function renderEditor() {
    const open = new Set($$("#homeEditor details[open]").map((d) => d.dataset.sec));
    $("#homeEditor").innerHTML = [
      ...SINGLE.map((s, i) => `<details class="glass card ed-section" data-sec="s${i}"${i ? "" : " open"}><summary><h3>${esc(s.title)}</h3></summary>
        <div class="ed-row single">${s.fields.map((f) => input(f, get(st, f.k), `data-path="${f.k}"`)).join("")}</div></details>`),
      ...Object.keys(LISTS).map(renderList),
    ].join("");
    if (open.size) $$("#homeEditor details").forEach((d) => { d.open = open.has(d.dataset.sec); });
    checkDashes();
  }

  function readField(el, f, target, key) {
    if (f?.type === "check") target[key] = el.checked;
    else if (f?.type === "lines") target[key] = el.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, f.max);
    else if (f?.type === "links") target[key] = el.value.split("\n").map((line) => {
      const m = /^(.*?)\s+(\S+)$/.exec(line.trim());
      return m ? { label: m[1].trim(), url: m[2] } : null;
    }).filter(Boolean).slice(0, 4);
    else if (f?.type === "stats") {
      const s = target[key] = Array.isArray(target[key]) ? target[key] : [];
      const i = +el.dataset.si;
      s[i] = { ...(s[i] || { v: "", l: "" }), [el.dataset.sk]: el.value };
    } else target[key] = el.value;
  }

  $("#homeEditor").addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.path) {
      const f = SINGLE.flatMap((s) => s.fields).find((x) => x.k === el.dataset.path);
      const parts = el.dataset.path.split(".");
      const key = parts.pop();
      const target = parts.length ? get(st, parts.join(".")) : st;
      readField(el, f, target, key);
    } else if (el.dataset.k) {
      const row = el.closest("[data-list]");
      const name = row.dataset.list;
      const f = LISTS[name].fields.find((x) => x.k === el.dataset.k);
      readField(el, f, st[name][+row.dataset.i], el.dataset.k);
      if (name === "highlights" && el.dataset.k === "url") row.querySelector(".yt-thumb").outerHTML = ytThumb(el.value);
    } else return;
    markDirty();
  });
  $("#homeEditor").addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]"), del = e.target.closest("[data-del]"), mv = e.target.closest("[data-move]");
    if (add) {
      const n = add.dataset.add;
      st[n].push(clone(LISTS[n].blank));
    } else if (del || mv) {
      const n = e.target.closest("[data-list]").dataset.list;
      const i = +(del ? del.dataset.del : mv.dataset.move);
      if (del) st[n].splice(i, 1); else [st[n][i - 1], st[n][i]] = [st[n][i], st[n][i - 1]];
    } else return;
    e.preventDefault();
    markDirty();
    renderEditor();
  });

  function checkDashes() {
    const hits = [];
    const walk = (v, path) => {
      const last = path[path.length - 1];
      if (RAW.has(last)) return;
      if (typeof v === "string") { if (/[-‐-―]/.test(v)) hits.push(v); }
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, [...path, i]));
      else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => walk(x, [...path, k]));
    };
    walk(st, []);
    $("#dashWarn").classList.toggle("hidden", !hits.length);
    $("#dashWarn").innerHTML = hits.length ? `<span>House style: no hyphens or dashes in page text. Please reword: ${hits.slice(0, 4).map((h) => `<b>${esc(h.slice(0, 50))}</b>`).join(", ")}${hits.length > 4 ? " and more" : ""}</span>` : "";
  }

  function statusText() {
    if (dirty) return "Unsaved changes";
    return savedAt ? `Published ${new Date(savedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : "Showing the starting content. Save to publish your edits.";
  }
  function markDirty() {
    dirty = true;
    $("#homeStatus").textContent = statusText();
    $("#homeSave").disabled = false;
    $("#homeUndo").disabled = false;
    checkDashes();
  }
  function settle() {
    dirty = false;
    $("#homeStatus").textContent = statusText();
    $("#homeSave").disabled = true;
    $("#homeUndo").disabled = true;
    renderHubStatus();
  }

  $("#homeUndo").addEventListener("click", () => { st = clone(saved); renderEditor(); settle(); });
  $("#homeSave").addEventListener("click", async () => {
    const b = $("#homeSave");
    b.disabled = true;
    b.textContent = "Saving...";
    try {
      const body = clone(st);
      body.spotlights.forEach((s) => { s.stats = (s.stats || []).filter((x) => x && x.v && x.l); });
      const r = await api("/api/coach/home", { method: "PUT", body });
      saved = fromContent(r.content);
      st = clone(saved);
      savedAt = r.updatedAt;
      renderEditor();
      settle();
      toast("Home page updated");
    } catch (e) {
      toast(e.message);
      b.disabled = false;
    } finally {
      b.textContent = "Save and publish";
    }
  });

  function renderHubStatus() {
    const games = (st?.schedule || []).filter((g) => g.date && !g.result && new Date(g.date + "T23:59:59") >= new Date())
      .sort((a, b) => a.date.localeCompare(b.date));
    const g = games[0];
    $("#hubNext").textContent = g ? `${g.home || g.neutral ? "vs" : "at"} ${g.opponent}` : "None scheduled";
    $("#hubNextWhen").textContent = g ? `${new Date(g.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${g.time || ""}` : "Add games on the Home page tab";
    $("#hubSaved").textContent = savedAt ? "Published" : "Not edited yet";
    $("#hubSavedWhen").textContent = savedAt ? new Date(savedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Showing the starting content";
  }

  // ----- start once the coach is logged in -----
  let started = false;
  document.addEventListener("coach:ready", async () => {
    if (started) return;
    started = true;
    showTab(location.hash.slice(1) || "hub");
    renderHubLinks();
    const [home, links] = await Promise.all([api("/api/coach/home").catch(() => ({})), api("/api/coach/links").catch(() => ({ links: [] }))]);
    saved = fromContent(home.content);
    st = clone(saved);
    savedAt = home.updatedAt || "";
    myLinks = links.links || [];
    renderMyLinks();
    renderHubLinks();
    renderEditor();
    settle();
  });
})();
