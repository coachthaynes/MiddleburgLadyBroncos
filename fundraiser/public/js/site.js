// Home page. Content comes from the coach dashboard (or js/home-data.js), players from /api/public, sponsors from /api/sponsors.
(async function () {
  const H = await window.loadHome();
  const schedule = (H.schedule || []).map((g) => ({ ...g, at: gameTime(g) })).sort((a, b) => a.at - b.at);

  $$("[data-season]").forEach((el) => { el.textContent = H.season || ""; });
  if (H.heroLead) $("#heroLead").textContent = H.heroLead;
  const slogans = (H.slogans || []).filter(Boolean);
  $$("[data-slogans]").forEach((el) => {
    el.innerHTML = slogans.map((t) => `<span>${esc(t)}</span>`).join("");
    el.classList.toggle("hidden", !slogans.length);
  });

  // Mobile menu
  const menu = $("#menu");
  const menuBtn = $("#menuBtn");
  menuBtn.addEventListener("click", () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) { menu.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); } });

  // ----- schedule -----
  // Florida games are all in Eastern Standard Time during the season.
  function gameTime(g) {
    const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(g.time || "");
    let h = 19, min = 0;
    if (m) { h = (+m[1] % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0); min = +m[2]; }
    return new Date(`${g.date}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00-05:00`);
  }
  const dayFmt = (d, o) => d.toLocaleDateString("en-US", { timeZone: "America/New_York", ...o });
  const now = new Date();
  const upcoming = schedule.filter((g) => !g.result && g.at.getTime() + 2 * 3600000 > now.getTime());
  const next = upcoming[0];

  function renderSchedule(filter) {
    const list = schedule.filter((g) => filter === "all" || (filter === "home" ? g.home : !g.home));
    $("#scheduleList").innerHTML = list.length ? list.map((g) => {
      const past = !!g.result || g.at.getTime() + 2 * 3600000 < now.getTime();
      const res = g.result ? `<span class="result ${/^w/i.test(g.result) ? "w" : "l"}">${esc(g.result)}</span>` : "";
      return `<li class="game${g === next ? " next" : ""}${past ? " past" : ""}">
        <div class="date"><small>${esc(dayFmt(g.at, { month: "short" }))}</small><b>${esc(dayFmt(g.at, { day: "numeric" }))}</b></div>
        <div><div class="opp"><em>${g.home ? "vs" : "at"}</em>${esc(g.opponent)}</div>
          <div class="meta">${esc(dayFmt(g.at, { weekday: "long" }))} · ${esc(g.time || "Time to be announced")}${g.location ? " · " + esc(g.location) : ""}</div></div>
        <div class="right">${res || (g.home ? '<span class="tag">Home</span>' : '<span class="tag grey">Away</span>')}${g.note ? `<span class="pill red">${esc(g.note)}</span>` : ""}</div>
      </li>`;
    }).join("") : `<li class="game"><div></div><div class="muted">No ${filter} games on the schedule yet.</div></li>`;
  }
  renderSchedule("all");
  $$(".seg button").forEach((b) => b.addEventListener("click", () => {
    $$(".seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderSchedule(b.dataset.filter);
  }));

  const venue = H.venue || {};
  $("#venueLink").textContent = venue.name || "Middleburg High School";
  $("#venueLink").href = venue.map || "#";

  // Next game card with a live countdown
  const ng = $("#nextGame .ng-body");
  if (next) {
    ng.innerHTML = `<div class="ng-vs">${next.home ? "Home game vs" : "Road game at"}</div>
      <div class="ng-opp">${esc(next.opponent)}</div>
      <div class="ng-when">${esc(dayFmt(next.at, { weekday: "long", month: "long", day: "numeric" }))} · ${esc(next.time || "")}</div>
      ${next.note ? `<div class="ng-note"><span class="pill red">${esc(next.note)}</span></div>` : ""}
      <div class="countdown dark-cd" id="ngCount"></div>
      <div class="btn-row">${next.home ? `<a class="btn btn-primary btn-small" href="${esc(venue.map || "#")}" target="_blank" rel="noopener">Get directions</a>` : ""}<a class="btn btn-glass btn-small" href="#schedule">Full schedule</a></div>`;
    const cd = $("#ngCount");
    const tick = () => {
      const ms = Math.max(0, next.at - new Date());
      if (!ms) { cd.innerHTML = '<div style="grid-column:1/-1"><b>Game day</b><span>Tip off now</span></div>'; return; }
      cd.innerHTML = [[Math.floor(ms / 864e5), "Days"], [Math.floor((ms % 864e5) / 36e5), "Hours"], [Math.floor((ms % 36e5) / 6e4), "Mins"], [Math.floor((ms % 6e4) / 1e3), "Secs"]]
        .map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join("");
    };
    tick();
    setInterval(tick, 1000);
  } else {
    ng.innerHTML = '<div class="ng-opp" style="margin-top:16px">Season wrap</div><p class="muted">Thank you for an amazing season. The next schedule posts here as soon as it is set.</p>';
  }

  const wins = schedule.filter((g) => /^w/i.test(g.result || "")).length;
  const losses = schedule.filter((g) => /^l/i.test(g.result || "")).length;
  $("#gHome").textContent = schedule.filter((g) => g.home).length;
  $("#gGames").textContent = schedule.length;
  $("#gRecord").textContent = `${wins} and ${losses}`;

  // Calendar download
  $("#icsBtn").addEventListener("click", () => {
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:mhsladybroncos.com", "CALSCALE:GREGORIAN"];
    upcoming.forEach((g) => {
      lines.push("BEGIN:VEVENT", `UID:${g.date}${g.opponent.replace(/\W/g, "")}@mhsladybroncos.com`, `DTSTAMP:${stamp(new Date())}`,
        `DTSTART:${stamp(g.at)}`, `DTEND:${stamp(new Date(g.at.getTime() + 2 * 3600000))}`,
        `SUMMARY:Lady Broncos ${g.home ? "vs" : "at"} ${g.opponent}${g.note ? " (" + g.note + ")" : ""}`,
        `LOCATION:${g.home ? venue.name + ", " + (venue.city || "") : g.location || g.opponent}`, "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
    a.download = "LadyBroncosSchedule.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  if (!upcoming.length) $("#icsBtn").classList.add("hidden");

  // Ticker
  const tickerItems = ["Go Broncos"];
  if (next) tickerItems.push(`Next up: ${next.home ? "vs" : "at"} ${next.opponent} ${dayFmt(next.at, { month: "short", day: "numeric" })} ${next.time || ""}`);
  schedule.filter((g) => g.note && upcoming.includes(g)).forEach((g) => tickerItems.push(`${g.note} ${dayFmt(g.at, { month: "short", day: "numeric" })} vs ${g.opponent}`));
  tickerItems.push(...(H.ticker || []));
  const tickerHtml = tickerItems.map((t) => `<span>${esc(t)}</span>`).join("");
  $("#ticker").innerHTML = tickerHtml + tickerHtml;

  // ----- highlights -----
  const yt = (H.youtube && H.youtube.channel) || "https://www.youtube.com";
  $("#ytChannel").href = yt;
  const ytId = (u) => {
    const s = String(u || "").trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    const m = /(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/.exec(s);
    return m ? m[1] : "";
  };
  const slots = (H.highlights || []).slice(0, 6);
  while (slots.length < 6) slots.push({ title: "Highlight", tag: "Coming soon" });
  $("#highlightGrid").innerHTML = slots.map((h, i) => {
    const id = ytId(h.url);
    const frame = id
      ? `<button class="frame" data-yt="${esc(id)}" style="background-image:url(https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg)" aria-label="Play ${esc(h.title)}"><span class="num">${i + 1}</span><span class="play"></span></button>`
      : `<a class="frame empty" href="${esc(yt)}" target="_blank" rel="noopener"><span class="num">${i + 1}</span><span>Coming soon</span></a>`;
    return `<article class="glass hl">${frame}${h.tag ? `<span class="tag grey">${esc(h.tag)}</span>` : ""}<h3>${esc(h.title || "Highlight")}</h3></article>`;
  }).join("");
  $("#highlightGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-yt]");
    if (!b) return;
    const f = document.createElement("div");
    f.className = "frame";
    f.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(b.dataset.yt)}?autoplay=1&rel=0" title="${esc(b.getAttribute("aria-label"))}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    b.replaceWith(f);
  });

  // ----- coaches and recruiting -----
  $("#coachList").innerHTML = (H.coaches || []).map((c) => `
    <div class="glass coach"><div class="badge">${esc(initials(c.name))}</div>
      <div><span class="role">${esc(c.role)}</span><h3>${esc(c.name)}</h3>${c.bio ? `<p>${esc(c.bio)}</p>` : ""}</div></div>`).join("");
  const rec = H.recruiting || {};
  const mail = (subject) => rec.email ? `mailto:${rec.email}?subject=${encodeURIComponent(subject)}` : "/sponsor";
  $("#recruitEmail").href = mail("College recruiting: Middleburg Lady Broncos");
  $("#futureEmail").href = mail("Future Bronco: interested in Lady Broncos basketball");
  if (rec.maxpreps) $("#maxprepsLink").href = rec.maxpreps; else $("#maxprepsLink").classList.add("hidden");

  // ----- players: spotlight and roster -----
  const shortName = (full) => {
    const p = String(full).trim().split(/\s+/);
    return p.length > 1 ? `${p[0]} ${p[p.length - 1].charAt(0).toUpperCase()}.` : p[0];
  };
  // Roster entries from the dashboard, keyed by short name so they match fundraiser pages ("Aiyana H.").
  const extras = {};
  Object.entries(H.rosterExtras || {}).forEach(([k, v]) => { extras[shortName(k)] = { ...v, fullName: k }; });
  (H.spotlights || []).forEach((s) => {
    const k = shortName(s.name);
    const x = (extras[k] ||= { fullName: s.name });
    ["number", "position", "classYear", "height", "site"].forEach((f) => { if (!x[f] && s[f]) x[f] = s[f]; });
  });

  function renderSpotlights(players) {
    const byName = Object.fromEntries(players.map((p) => [p.name, p]));
    $("#spotlightList").innerHTML = (H.spotlights || []).map((s) => {
      const p = byName[shortName(s.name)];
      const links = [
        s.site ? `<a class="btn btn-primary btn-small" href="${esc(s.site)}" target="_blank" rel="noopener">Recruiting profile</a>` : "",
        ...(s.links || []).map((l) => `<a class="btn btn-glass btn-small" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`),
        p ? `<a class="btn btn-glass btn-small" href="/donate/${esc(p.slug)}">Support ${esc(p.first)}</a>` : "",
      ].join("");
      return `<article class="glass spot">
        ${photoHtml(p && p.photo, s.name, s.number)}
        <div class="spot-body">
          <div class="spot-num">#${esc(s.number)}</div>
          <h3>${esc(s.name)}</h3>
          <div class="pos">${esc([s.position, s.height, s.classYear && "Class of " + s.classYear].filter(Boolean).join(" · "))}</div>
          ${s.headline ? `<p class="headline">${esc(s.headline)}</p>` : ""}
          <p>${esc(s.bio || "")}</p>
          ${(s.stats || []).length ? `<div class="statline">${s.stats.map((x) => `<div><b>${esc(x.v)}</b><span>${esc(x.l)}</span></div>`).join("")}</div>` : ""}
          <div class="btn-row">${links}</div>
        </div></article>`;
    }).join("");
    if (!(H.spotlights || []).length) $("#spotlight").classList.add("hidden");
  }

  function renderRoster(players) {
    // Fundraiser players plus everyone on the dashboard roster who does not have a fundraiser page.
    const have = new Set(players.map((p) => p.name));
    const list = [
      ...players.map((p) => ({ ...p, x: extras[p.name] || {} })),
      ...Object.entries(extras).filter(([k]) => !have.has(k)).map(([, x]) => ({ x })),
    ];
    const num = (p) => parseInt(p.number || p.x.number, 10);
    const sorted = list.sort((a, b) => (num(a) || 999) - (num(b) || 999) || (a.x.fullName || a.name).localeCompare(b.x.fullName || b.name));
    $("#gPlayers").textContent = sorted.length;
    $("#rosterGrid").innerHTML = sorted.length ? sorted.map((p) => {
      const x = p.x;
      const name = x.fullName || p.name;
      const number = p.number || x.number;
      const meta = [p.position || x.position || "Lady Bronco", x.height, x.classYear && "Class of " + x.classYear].filter(Boolean).join(" · ");
      return `<div class="glass rcard">
        ${photoHtml(p.photo, name, number)}
        <h3>${esc(name)}</h3>
        <div class="meta">${esc(meta)}</div>
        <div class="links">${x.site ? `<a class="red" href="${esc(x.site)}" target="_blank" rel="noopener">Profile</a>` : ""}${x.maxpreps ? `<a href="${esc(x.maxpreps)}" target="_blank" rel="noopener">MaxPreps</a>` : ""}${p.slug ? `<a href="/donate/${esc(p.slug)}">Support ${esc(p.first || "her")}</a>` : ""}</div>
      </div>`;
    }).join("") : '<div class="glass card"><p class="muted" style="margin:0">The roster posts here once tryouts wrap up.</p></div>';
  }

  api("/api/public")
    .then((d) => { renderSpotlights(d.players || []); renderRoster(d.players || []); })
    .catch(() => { renderSpotlights([]); renderRoster([]); });

  // ----- sponsors: top levels near the top, the rest near the bottom -----
  const logoBox = (s) => s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.business)}" loading="lazy">` : `<span class="wall-name">${esc(s.business)}</span>`;
  const linkOrDiv = (s, cls, inner) => s.website
    ? `<a class="glass ${cls}" href="${esc(s.website)}" target="_blank" rel="noopener sponsored">${inner}</a>`
    : `<div class="glass ${cls}">${inner}</div>`;
  api("/api/sponsors").then((w) => {
    const all = w.sponsors || [];
    const top = all.filter((s) => s.level === "title" || s.level === "herd");
    if (top.length) {
      $("#sponsorTop").innerHTML = top.map((s) => linkOrDiv(s, `sp-card lvl-${s.level}`,
        `<div class="sp-logo">${logoBox(s)}</div><b>${esc(s.business)}</b><small>${s.level === "title" ? "Presenting sponsor" : esc(s.levelName)}</small>`)).join("");
    }
    const levels = [["stallion", "Stallion Partners"], ["backer", "Bronco Backers"]]
      .map(([lvl, label]) => [label, lvl, all.filter((s) => s.level === lvl)])
      .filter(([, , l]) => l.length);
    if (levels.length) {
      $("#sponsorRest").innerHTML = levels.map(([label, lvl, l]) => `<div class="sp-level"><h3>${esc(label)}</h3><div class="sp-strip ${lvl}">${
        l.map((s) => linkOrDiv(s, "sp-chip", `${s.logo ? `<img src="${esc(s.logo)}" alt="" loading="lazy">` : ""}<b>${esc(s.business)}</b>`)).join("")
      }</div></div>`).join("") + '<p class="muted center-text" style="margin:0">Want your business here? <a href="/sponsor">See sponsor levels</a>.</p>';
    }
  }).catch(() => {});

  // ----- Instagram -----
  const ig = H.instagram || {};
  const igUrl = ig.handle ? `https://www.instagram.com/${encodeURIComponent(ig.handle)}/` : "";
  if (igUrl) { $("#igFollow").href = igUrl; $("#igFollow").textContent = `Follow @${ig.handle}`; } else $("#igFollow").classList.add("hidden");
  const igEmpty = () => {
    $("#igGrid").innerHTML = `<div class="glass ig-empty"><p class="muted" style="margin:0 0 12px">Game day photos, practice clips and player shout outs show up here.</p>${igUrl ? `<a class="btn btn-primary" href="${esc(igUrl)}" target="_blank" rel="noopener">See us on Instagram</a>` : ""}</div>`;
  };
  const igEmbeds = () => {
    const posts = (ig.posts || []).filter((u) => /instagram\.com\/(p|reel|tv)\//.test(u)).slice(0, 6);
    if (!posts.length) return igEmpty();
    $("#igGrid").innerHTML = posts.map((u) => `<div class="ig-embed"><blockquote class="instagram-media" data-instgrm-permalink="${esc(u)}" data-instgrm-version="14"><a href="${esc(u)}" target="_blank" rel="noopener">View this post on Instagram</a></blockquote></div>`).join("");
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.instagram.com/embed.js";
    document.body.appendChild(s);
  };
  api("/api/instagram").then((d) => {
    const posts = d.posts || [];
    if (!posts.length) return igEmbeds();
    $("#igGrid").innerHTML = posts.map((p) => `<a class="ig-post" href="${esc(p.url)}" target="_blank" rel="noopener">
      <img src="${esc(p.image)}" alt="${esc(p.caption ? p.caption.slice(0, 100) : "Lady Broncos on Instagram")}" loading="lazy">
      ${p.video ? '<span class="vid">Video</span>' : ""}${p.caption ? `<span class="cap">${esc(p.caption)}</span>` : ""}</a>`).join("");
    if (!igUrl && d.handle) { $("#igFollow").href = `https://www.instagram.com/${encodeURIComponent(d.handle)}/`; $("#igFollow").textContent = `Follow @${d.handle}`; $("#igFollow").classList.remove("hidden"); }
  }).catch(igEmbeds);
})();
