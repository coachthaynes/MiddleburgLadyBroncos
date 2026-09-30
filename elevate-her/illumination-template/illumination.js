/* Elevate Her · Illumination package renderer.
   Reads window.SITE (from site.js) and builds the page. Media comes from the
   Madi Visuals dashboard when SITE.media.dashboard is set, with the files in
   media/ as a fallback. Shared by every Illumination site: edit site.js, not this file. */
(function () {
  const S = window.SITE;
  if (!S) { document.body.innerHTML = "<p style='padding:40px'>site.js is missing.</p>"; return; }
  const P = S.player;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const toDate = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
  const fullName = `${P.first} ${P.last}`;
  const approver = S.contact.approver;

  /* ---------- Theme and meta ---------- */
  const root = document.documentElement.style;
  if (S.theme?.accent) root.setProperty("--accent", S.theme.accent);
  if (S.theme?.accent2) root.setProperty("--accent-2", S.theme.accent2);
  if (S.theme?.glow) root.setProperty("--accent-glow", S.theme.glow);
  document.title = `${fullName} #${P.number}`;
  const desc = `${fullName}, #${P.number} ${P.position.toLowerCase()} for the ${P.team}, Class of ${P.classYear}. Highlights, stats, film, NIL partnerships and licensed photos.`;
  $('meta[name="description"]').content = desc;
  $('meta[property="og:title"]').content = `${fullName} #${P.number} | ${P.team}`;
  $('meta[property="og:description"]').content = desc;

  /* ---------- Simple bindings ---------- */
  const binds = {
    number: P.number, team: P.team, first: P.first, last: P.last, bio: S.bio,
    testingNote: S.testingNote, academicsNote: S.academicsNote,
    scheduleTitle: S.schedule.title, scheduleNote: S.schedule.note, nilIntro: S.nil.intro
  };
  $$("[data-bind]").forEach(el => { el.textContent = binds[el.dataset.bind] ?? ""; });
  $("#name").setAttribute("aria-label", fullName);
  $("#brand").innerHTML = `${esc(P.first[0])}<em>.</em>${esc(P.last)} <em>#${esc(P.number)}</em>`;
  $("#meta").innerHTML = [`<b>#${esc(P.number)}</b>`, esc(P.position), esc(P.school), `Class of <b>${esc(P.classYear)}</b>`].map(t => `<span>${t}</span>`).join("");
  $("#portraitTag").innerHTML = esc(P.program).replace(" ", "<br>");
  $("#portraitImg").alt = `${fullName} portrait`;
  $("#footLeft").textContent = `${fullName} #${P.number} · ${P.team} · Class of ${P.classYear}`;
  $("#facts").innerHTML = [
    ["Jersey", `#${P.number}`], ["Position", P.position], ["Class", P.classYear],
    ["Height", P.height], ["School", P.schoolShort || P.school], ["Location", P.location]
  ].map(([k, v]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v || "TBD")}</dd></div>`).join("");

  /* ---------- Stats ---------- */
  const st = S.stats;
  const tile = t => `<div class="stat${t.hot ? " hot" : ""}"><div class="v"${t.count ? ` data-count="${esc(t.v)}"` : ""}>${esc(t.v)}</div><div class="l">${esc(t.l)}</div></div>`;
  let statsHtml = `
    <p class="eyebrow fade">Season stats</p>
    <h2 class="fade">${esc(st.seasonLabel)} <span class="lit">Season</span></h2>`;
  if (st.total) statsHtml += `<div class="total fade"><span class="v" data-count="${esc(st.total.v)}">${esc(st.total.v)}</span><p>${esc(st.total.text)}</p></div>`;
  statsHtml += `<div class="bigstats fade">${st.averages.map(tile).join("")}</div>`;
  if (st.table) {
    statsHtml += `<div class="table-wrap fade"><table><caption class="sr">Per game averages by season</caption>
      <thead><tr><th scope="col">Per game</th>${st.table.columns.map(c => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${st.table.rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(v => v === "" || v == null ? `<td class="soon">Upcoming</td>` : `<td class="now">${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  if (st.splits) {
    statsHtml += `<div class="subhead fade"><h3>${esc(st.splits.title)}</h3><small>${esc(st.splits.source || "")}</small></div>
      <div class="bigstats fade" style="margin-top:18px">${st.splits.tiles.map(tile).join("")}</div>
      <div class="split fade">${st.splits.meters.map(m => `<div class="meter"><div class="row"><span class="pct">${esc(m.pct)}%</span><span class="att">${esc(m.made)} of ${esc(m.att)}</span></div><div class="bar"><i data-w="${esc(m.pct)}"></i></div><div class="lbl">${esc(m.label)}</div></div>`).join("")}</div>`;
  }
  $("#statsWrap").innerHTML = statsHtml;

  /* ---------- Measurables, testing, academics ---------- */
  const chips = list => list.map(c => `<div class="chip${c.v && !c.pending ? " set" : ""}"><div class="k">${esc(c.k)}</div><div class="v${!c.v || c.pending ? " pending" : ""}">${esc(c.v || "Pending")}</div></div>`).join("");
  $("#measurables").innerHTML = chips(S.measurables);
  $("#testing").innerHTML = chips(S.testing);
  $("#academics").innerHTML = chips(S.academics);

  /* ---------- Film links ---------- */
  const arrow = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M9 7h8v8"/></svg>`;
  $("#filmLinks").innerHTML = S.film.links.map(l => l.url
    ? `<a class="link" href="${esc(l.url)}" target="_blank" rel="noopener"><div><b>${esc(l.name)}</b><span>${esc(l.desc)}</span></div>${arrow}</a>`
    : `<a class="link pending" aria-disabled="true"><div><b>${esc(l.name)}</b><span>Link coming soon</span></div>${arrow}</a>`).join("");

  /* ---------- NIL ---------- */
  const icons = {
    social: `<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>`,
    business: `<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>`,
    appearance: `<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>`,
    camp: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>`,
    product: `<path d="M20 7 12 3 4 7v10l8 4 8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/>`,
    cause: `<path d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.5-7 11-7 11z"/>`
  };
  $("#nilWhy").innerHTML = S.nil.why.map(w => `<div><strong>${esc(w.v)}</strong><span>${esc(w.l)}</span></div>`).join("");
  $("#nilOffers").innerHTML = S.nil.offers.map(o => `<article class="card fade"><div class="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons[o.icon] || icons.social}</svg></div><h3>${esc(o.title)}</h3><p>${esc(o.text)}</p></article>`).join("");
  $("#nilRules").innerHTML = S.nil.rules.map(r => `<li>${esc(r)}</li>`).join("");
  $("#mailFallback").href = `mailto:${S.contact.email}?subject=${encodeURIComponent("NIL opportunity for " + fullName)}`;

  /* ---------- Contact (private, by request) ---------- */
  const lock = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
  $("#contactIntro").textContent = `To protect ${P.first}'s privacy, contact details are shared by request only. Tell us who you are and ${approver} will review your request and send the information directly to you once it is approved.`;
  $("#contactCards").innerHTML = S.contact.people.map(c => `<div class="card fade"><div class="role">${esc(c.role)}</div><div class="who">${esc(c.who)}</div><span class="lock">${lock}${esc(c.detail)}</span></div>`).join("");
  $('#contactForm input[name="subject"]').value = `Contact request for ${fullName}`;

  /* ---------- Hero video availability ---------- */
  const heroVideo = $("#heroVideo"), filmVideo = $("#filmVideo");
  const setBackdrop = url => { if (url) $("#backdrop").style.setProperty("--poster", `url("${String(url).replace(/"/g, "%22")}")`); };
  setBackdrop(heroVideo.poster);
  let heroFailed = false;
  const noVideo = () => { heroFailed = true; document.body.classList.add("no-video"); };
  const noFilm = () => { filmVideo.style.display = "none"; $("#filmPh").hidden = false; };
  function watchSources(video, onFail) {
    const last = video.querySelector("source:last-of-type");
    if (last) last.addEventListener("error", onFail);
    video.addEventListener("error", onFail);
  }
  watchSources(heroVideo, noVideo);
  watchSources(filmVideo, noFilm);
  // Catches failures that happened before this script ran. Waits so a browser that
  // skips the first source (mp4) and moves on to webm is not mistaken for a failure.
  const dead = v => v.error || (v.networkState === 3 && v.readyState === 0);
  setTimeout(() => { if (dead(heroVideo)) noVideo(); if (dead(filmVideo)) noFilm(); }, 2500);
  function setSources(video, list, poster, onFail) {
    video.innerHTML = list.map(s => `<source src="${esc(s.url)}"${s.type ? ` type="${esc(s.type)}"` : ""}>`).join("");
    if (poster) { video.poster = poster; if (video === heroVideo) setBackdrop(poster); }
    watchSources(video, onFail);
    video.load();
  }

  const sound = $("#sound");
  sound.addEventListener("click", () => {
    heroVideo.muted = !heroVideo.muted;
    if (!heroVideo.muted) heroVideo.play().catch(() => {});
    sound.textContent = heroVideo.muted ? "Sound off" : "Sound on";
    sound.setAttribute("aria-pressed", String(!heroVideo.muted));
  });

  /* ---------- Split name into letters ---------- */
  $$("[data-split]").forEach(el => {
    const text = el.textContent;
    el.textContent = "";
    [...text].forEach(c => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; el.appendChild(s); });
  });
  const letters = $$(".name .ch"), metas = $$("#meta span");

  /* ---------- Hero: opening + scroll ---------- */
  const hero = $("#top"), reveal = $("#reveal"), ring = $("#ring"), spark = $("#spark");
  const title = $("#title"), cue = $("#cue"), outro = $("#outro"), nav = $("#nav"), kicker = $("#kicker");
  let open = reduce ? 1 : 0;
  let introDone = reduce;
  let W = innerWidth, H = innerHeight, halfDiag = Math.hypot(W, H) / 2;
  addEventListener("resize", () => { W = innerWidth; H = innerHeight; halfDiag = Math.hypot(W, H) / 2; render(); });
  const progress = () => clamp(-hero.getBoundingClientRect().top / (hero.offsetHeight - H));

  function render() {
    const p = progress();
    const close = easeIO(clamp(p / 0.82));
    const r = halfDiag * 1.02 * ease(open) * (1 - close);
    reveal.style.clipPath = `circle(${r.toFixed(1)}px at 50% 50%)`;
    reveal.style.opacity = String(1 - smooth(0.55, 0.9, p));
    reveal.style.setProperty("--zoom", (1.08 + p * 0.25).toFixed(3));
    const edge = (open < 1 ? Math.sin(open * Math.PI) : 0) + smooth(0.02, 0.2, p) * (1 - smooth(0.7, 0.86, p));
    ring.style.width = ring.style.height = (r * 2).toFixed(1) + "px";
    ring.style.opacity = String(clamp(edge));
    const tFade = smooth(0, 0.35, p);
    title.style.opacity = String(1 - tFade);
    title.style.transform = `translateY(${(-p * 120).toFixed(1)}px) scale(${(1 - tFade * 0.08).toFixed(3)})`;
    cue.style.opacity = introDone ? String(1 - smooth(0, 0.08, p)) : "0";
    sound.style.opacity = introDone ? String(1 - smooth(0.3, 0.5, p)) : "0";
    outro.style.opacity = String(smooth(0.86, 0.95, p) * (1 - smooth(0.97, 1, p)));
    nav.classList.toggle("show", p > 0.96 || hero.getBoundingClientRect().bottom < H * 0.5);
    if (p > 0.95) heroVideo.pause(); else if (heroVideo.paused && introDone && !heroFailed) heroVideo.play().catch(() => {});
  }

  function intro() {
    if (reduce) {
      letters.forEach(l => { l.style.transform = "none"; l.style.opacity = 1; });
      metas.forEach(m => { m.style.transform = "none"; m.style.opacity = 1; });
      render();
      return;
    }
    const t0 = performance.now(), SPARK = 700, OPEN = 1900;
    function frame(now) {
      const t = now - t0;
      const s = clamp(t / SPARK);
      spark.style.opacity = String(s < 1 ? s : Math.max(0, 1 - (t - SPARK) / 400));
      spark.style.transform = `scale(${(0.4 + s * 0.8).toFixed(2)})`;
      open = clamp((t - SPARK * 0.8) / OPEN);
      const tt = t - SPARK - OPEN * 0.45;
      letters.forEach((l, i) => {
        const k = ease(clamp((tt - i * 45) / 700));
        l.style.transform = `translateY(${(110 * (1 - k)).toFixed(1)}%)`;
        l.style.opacity = String(k);
      });
      kicker.style.opacity = String(clamp((tt + 200) / 600));
      metas.forEach((m, i) => {
        const k = ease(clamp((tt - 500 - i * 110) / 600));
        m.style.transform = `translateY(${(12 * (1 - k)).toFixed(1)}px)`;
        m.style.opacity = String(k);
      });
      if (t > SPARK + OPEN + 1300) introDone = true;
      render();
      if (!introDone) requestAnimationFrame(frame);
    }
    kicker.style.opacity = 0;
    requestAnimationFrame(frame);
  }

  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { render(); ticking = false; });
  }, { passive: true });
  if (document.readyState === "complete") intro(); else addEventListener("load", intro);

  /* ---------- Reveal on view + count up ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$("[data-w]", e.target).forEach(b => b.style.width = b.dataset.w + "%");
      $$("[data-count]", e.target).forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.01, rootMargin: "0px 0px -10% 0px" });
  function countUp(el) {
    if (reduce || el.dataset.done) return;
    el.dataset.done = 1;
    const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split(".")[1] || "").length;
    const t0 = performance.now(), dur = 1400;
    (function step(now) {
      const k = ease(clamp((now - t0) / dur));
      el.textContent = (end * k).toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- Cursor light ---------- */
  const glow = $("#glow");
  if (!reduce && matchMedia("(pointer: fine)").matches) {
    addEventListener("pointermove", e => {
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      glow.style.opacity = progress() >= 1 ? "1" : "0";
    }, { passive: true });
    document.addEventListener("pointermove", e => {
      const c = e.target.closest?.(".card");
      if (!c) return;
      const b = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - b.left) + "px");
      c.style.setProperty("--my", (e.clientY - b.top) + "px");
    }, { passive: true });
  }

  /* ---------- Schedule ---------- */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const gamesEl = $("#games");
  let next = null;
  S.schedule.games.forEach(g => {
    const d = toDate(g.date);
    const past = d < today;
    if (!past && !next) next = g;
    const li = document.createElement("li");
    li.className = "game" + (past ? " past" : "") + (g === next ? " next" : "") + (g.tag ? " special" : "");
    const pre = g.loc === "Home" ? "vs" : g.loc === "Away" ? "at" : "";
    const res = g.result ? `<span class="res ${g.result.trim()[0].toUpperCase() === "W" ? "w" : "l"}">${esc(g.result)}</span>` : "";
    li.innerHTML = `
      <div class="d">${MONTHS[d.getMonth()]} ${d.getDate()}<small>${DAYS[d.getDay()]}</small></div>
      <div><div class="o" ${g.tag ? `data-tag="${esc(g.tag)}"` : ""}>${pre ? `<em>${pre}</em>` : ""}${esc(g.opp)}</div>
        <div class="t">${esc(g.time)}${g.note ? ` · ${esc(g.note)}` : ""}${g.site ? ` · at ${esc(g.site)}` : ""}</div></div>
      <div class="r"><span class="pill ${g.loc.toLowerCase()}">${esc(g.loc)}</span>${res}</div>`;
    gamesEl.appendChild(li);
  });
  if (next) {
    const d = toDate(next.date);
    const days = Math.round((d - today) / 864e5);
    const place = next.loc === "Home" ? P.school : next.site ? `at ${next.site}` : next.loc === "Away" ? "Away game" : "Location TBD";
    const box = $("#nextGame");
    box.hidden = false;
    box.innerHTML = `
      <div class="when"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]} · ${DAYS[d.getDay()]}</span></div>
      <div><div class="lbl">Next game</div><div class="opp">${next.loc === "Home" ? "vs " : next.loc === "Away" ? "at " : ""}${esc(next.opp)}</div>
        <div class="info">${esc(next.time)}${next.note ? ` · ${esc(next.note)}` : ""} · ${esc(place)}</div></div>
      <div class="countdown">${days === 0 ? "Today" : days === 1 ? "Tomorrow" : days}${days > 1 ? "<small>days away</small>" : ""}</div>`;
  } else if (!S.schedule.games.length) {
    gamesEl.outerHTML = `<div class="empty-note fade"><b>Schedule coming soon</b>Check back when the season is set.</div>`;
  }

  /* ---------- Writeups ---------- */
  const list = $("#writeupList");
  const fmtDate = iso => { if (!iso) return ""; const d = toDate(iso); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
  if (!S.writeups.length) {
    list.innerHTML = `<div class="empty-note fade"><b>Writeups coming soon</b>Reporters and scouts: use the contact request below to set up an interview or evaluation.</div>`;
  }
  S.writeups.forEach(w => {
    const el = document.createElement(w.url ? "a" : "button");
    el.className = "card writeup fade";
    if (w.url) { el.href = w.url; el.target = "_blank"; el.rel = "noopener"; } else { el.type = "button"; }
    el.innerHTML = `
      <div class="kind"><span>${esc(w.kind || "Article")}</span><time>${fmtDate(w.date)}</time></div>
      <h3>${esc(w.title)}</h3>
      ${w.excerpt ? `<blockquote>${esc(w.excerpt)}</blockquote>` : ""}
      <div class="src"><span>${esc(w.source || "")}</span><span>${w.url ? "Read article" : "Read writeup"}</span></div>`;
    if (!w.url) el.addEventListener("click", () => {
      $("#readerKind").textContent = w.kind || "Writeup";
      $("#readerTitle").textContent = w.title;
      $("#readerMeta").textContent = [w.source, fmtDate(w.date)].filter(Boolean).join(" · ");
      $("#readerBody").innerHTML = (w.body || [w.excerpt || ""]).map(p => `<p>${esc(p)}</p>`).join("");
      $("#reader").classList.add("open");
      $("#readerClose").focus();
    });
    list.appendChild(el);
  });
  const closeReader = () => $("#reader").classList.remove("open");
  $("#readerClose").addEventListener("click", closeReader);
  $("#reader").addEventListener("click", e => { if (e.target.id === "reader") closeReader(); });

  /* ---------- Photo vault ---------- */
  const gallery = $("#gallery");
  const label = u => u === "nil" ? "NIL Ready" : "Editorial";
  function renderGallery(photos) {
    gallery.innerHTML = "";
    photos.forEach(ph => {
      const fig = document.createElement("figure");
      fig.className = "shot fade in " + (ph.size || "");
      fig.style.margin = 0;
      fig.dataset.use = ph.use;
      const src = ph.thumb || ph.src;
      fig.innerHTML = `
        <div class="empty"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/></svg>Photo coming soon</div>
        <img src="${esc(src)}" alt="${esc(fullName)}, ${esc(ph.title)}" loading="lazy">
        <figcaption class="cap"><div><b>${esc(ph.title)}</b></div><span class="badge ${ph.use === "nil" ? "nil" : "ed"}">${label(ph.use)}</span></figcaption>`;
      const img = fig.querySelector("img");
      img.addEventListener("error", () => {
        if (ph.thumb && img.src !== new URL(ph.src, location.href).href) { img.src = ph.src; return; }
        img.remove(); fig.style.cursor = "default"; fig.dataset.missing = 1;
      });
      fig.addEventListener("click", () => {
        if (fig.dataset.missing) return;
        $("#lbImg").src = ph.large || ph.src;
        $("#lbImg").alt = img.alt;
        $("#lbTitle").textContent = ph.title;
        $("#lbUse").textContent = ph.use === "nil" ? "NIL Ready: licensed partner use with a signed agreement" : "Editorial: media and recruiting use only";
        const dl = $("#lbDownload");
        dl.href = ph.download || ph.src;
        dl.setAttribute("download", `${P.first}_${P.last}_${(ph.title || "photo").replace(/\s+/g, "_")}`);
        $("#lightbox").classList.add("open");
        $("#lbClose").focus();
      });
      gallery.appendChild(fig);
    });
    applyFilter();
  }
  let filter = "all";
  function applyFilter() { $$(".shot").forEach(s => s.style.display = (filter === "all" || s.dataset.use === filter) ? "" : "none"); }
  $$(".filters button").forEach(b => b.addEventListener("click", () => {
    filter = b.dataset.filter;
    $$(".filters button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    applyFilter();
  }));
  renderGallery((S.photos || []).map(p => ({ ...p, src: "media/photos/" + p.file })));
  const closeLb = () => $("#lightbox").classList.remove("open");
  $("#lbClose").addEventListener("click", closeLb);
  $("#lightbox").addEventListener("click", e => { if (e.target.id === "lightbox") closeLb(); });
  addEventListener("keydown", e => { if (e.key === "Escape") { closeLb(); closeReader(); } });

  $$(".fade").forEach(el => io.observe(el));

  /* ---------- Madi Visuals dashboard media ----------
     Pulls everything Madi has marked live for this player. Anything not in the
     dashboard keeps using the local media/ files. */
  async function loadDashboardMedia() {
    const m = S.media;
    if (!m?.dashboard || !m.slug) return;
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`${m.dashboard.replace(/\/$/, "")}/api/sites/${encodeURIComponent(m.slug)}`, { signal: ctrl.signal });
      if (!res.ok) return;
      const data = await res.json();
      if (data.hero?.length) {
        heroFailed = false;
        document.body.classList.remove("no-video");
        setSources(heroVideo, data.hero, data.poster, noVideo);
        if (introDone) heroVideo.play().catch(() => {});
      } else if (data.poster) { heroVideo.poster = data.poster; setBackdrop(data.poster); }
      const film = data.film?.length ? data.film : data.hero;
      if (film?.length) {
        filmVideo.style.display = "";
        $("#filmPh").hidden = true;
        setSources(filmVideo, film, data.poster, noFilm);
      }
      if (data.portrait) {
        let img = $("#portraitImg");
        if (!img) { img = document.createElement("img"); $(".portrait").prepend(img); }
        img.alt = `${fullName} portrait`;
        img.onerror = null;
        img.src = data.portrait;
      }
      if (data.poster) $('meta[property="og:image"]').content = data.poster;
      if (data.photos?.length) renderGallery(data.photos);
    } catch (e) { /* dashboard unreachable: local media stays in place */ }
  }
  loadDashboardMedia();

  /* ---------- Forms (Netlify Forms; email fallback) ---------- */
  function wireForm(form, status, done, subject) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      try {
        const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(form)).toString() });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        $('#contactForm input[name="subject"]').value = `Contact request for ${fullName}`;
        status.textContent = done;
      } catch (err) {
        const skip = ["form-name", "subject", "company-url", "website"];
        const body = [...new FormData(form)].filter(([k]) => !skip.includes(k)).map(([k, v]) => `${k}: ${v}`).join("\n");
        location.href = `mailto:${S.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    });
  }
  wireForm($("#nilForm"), $("#formStatus"), `Thank you. ${approver} will review your inquiry and be in touch soon.`, `NIL opportunity for ${fullName}`);
  wireForm($("#contactForm"), $("#contactStatus"), `Request received. ${approver} will review it and email you directly.`, `Contact request for ${fullName}`);

  render();
})();
