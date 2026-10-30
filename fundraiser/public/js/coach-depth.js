// Coaches dashboard, Depth chart tab: a varsity depth chart from Elevate Her stats, position fit and the coach's ratings.
(function () {
  const SPOTS = [
    ["1", "Point guard"], ["2", "Shooting guard"], ["3", "Small forward"], ["4", "Power forward"], ["5", "Center or post"],
  ];
  const TIERS = ["Starter", "Second", "Third"];
  // What matters most at each spot. Each stat is scored against the best on the team.
  const WEIGHTS = {
    1: { ast: 1.6, stl: 1.2, ppg: 1.0, reb: 0.3, blk: 0.1 },
    2: { ppg: 1.6, stl: 1.1, ast: 0.6, reb: 0.5, blk: 0.2 },
    3: { ppg: 1.3, reb: 1.0, stl: 0.9, ast: 0.5, blk: 0.4 },
    4: { reb: 1.6, blk: 1.1, ppg: 1.0, stl: 0.4, ast: 0.3 },
    5: { reb: 1.7, blk: 1.5, ppg: 0.8, stl: 0.2, ast: 0.2 },
  };
  const STATS = ["ppg", "reb", "ast", "stl", "blk"];

  let players = [];   // { name, number, classYear, height, listed, stats, statsFrom, jv }
  let prefs = {};     // name -> { primary, secondary, rating }
  let chart = {};     // spot -> [starter, second, third]
  let notes = "";
  let savedAt = "";
  let dirty = false;

  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const inches = (h) => { const m = /(\d)\s*'\s*(\d{1,2})?/.exec(h || ""); return m ? Number(m[1]) * 12 + Number(m[2] || 0) : 0; };

  // Main and backup spot from the listed position, or from height when nothing is listed.
  function guessSpots(listed, height) {
    const p = (listed || "").toLowerCase();
    if (/point/.test(p)) return ["1", "2"];
    if (/combo/.test(p)) return ["1", "2"];
    if (/shooting/.test(p)) return ["2", "1"];
    if (/guard/.test(p) && /forward/.test(p)) return ["3", "2"];
    if (/wing|small forward/.test(p)) return ["3", "2"];
    if (/power/.test(p)) return ["4", "5"];
    if (/center|post/.test(p)) return ["5", "4"];
    if (/forward/.test(p)) return ["4", "3"];
    if (/guard/.test(p)) return ["2", "1"];
    const h = inches(height);
    if (!h) return ["", ""];
    if (h <= 65) return ["1", "2"];
    if (h <= 67) return ["2", "1"];
    if (h <= 69) return ["3", "2"];
    if (h <= 71) return ["4", "3"];
    return ["5", "4"];
  }
  const pref = (p) => prefs[p.name] || (prefs[p.name] = (() => { const [a, b] = guessSpots(p.listed, p.height); return { primary: a, secondary: b, rating: 0 }; })());

  function fit(p, spot) {
    const { primary, secondary } = pref(p);
    if (!primary) return 0.6;
    if (spot === primary) return 1;
    if (spot === secondary) return 0.8;
    if (Math.abs(Number(spot) - Number(primary)) === 1) return 0.55;
    return 0.25;
  }

  // Score at one spot, 0 to 100: stats for the spot, the coach's rating and experience, times position fit.
  function score(p, spot, max) {
    let stat = 0.35; // no stats yet: neither rewarded nor punished
    if (p.stats) {
      const w = WEIGHTS[spot];
      const total = Object.values(w).reduce((a, b) => a + b, 0);
      stat = STATS.reduce((sum, k) => sum + (w[k] || 0) * (max[k] ? num(p.stats[k]) / max[k] : 0), 0) / total;
    }
    const r = pref(p).rating || 3;
    const year = parseInt(p.classYear, 10);
    const exp = year ? Math.max(0, Math.min(1, (2030 - year) / 4)) : 0.25;
    return Math.round(100 * fit(p, spot) * (0.55 * stat + 0.35 * (r - 1) / 4 + 0.10 * exp));
  }

  function maxima(list) {
    const m = {};
    STATS.forEach((k) => { m[k] = Math.max(0, ...list.filter((p) => p.stats).map((p) => num(p.stats[k]))); });
    return m;
  }
  const pool = () => players.filter((p) => !p.jv || $("#dcJv").checked);

  // Best five player lineup across the five spots, one player per spot, then again for the next string.
  function suggest() {
    const list = pool();
    const max = maxima(list);
    const left = new Set(list.map((p) => p.name));
    const byName = new Map(list.map((p) => [p.name, p]));
    const out = Object.fromEntries(SPOTS.map(([s]) => [s, []]));
    for (let tier = 0; tier < 3 && left.size; tier++) {
      const names = [...left];
      let best = { total: -1, pick: [] };
      const walk = (i, used, total, pick) => {
        if (i === SPOTS.length) { if (total > best.total) best = { total, pick: pick.slice() }; return; }
        const spot = SPOTS[i][0];
        let placed = false;
        for (const n of names) {
          if (used.has(n)) continue;
          placed = true;
          used.add(n); pick.push(n);
          walk(i + 1, used, total + score(byName.get(n), spot, max), pick);
          used.delete(n); pick.pop();
        }
        if (!placed) { pick.push(""); walk(i + 1, used, total, pick); pick.pop(); }
      };
      walk(0, new Set(), 0, []);
      best.pick.forEach((n, i) => { out[SPOTS[i][0]][tier] = n; if (n) left.delete(n); });
    }
    return out;
  }

  // Overall value: each player's score at her best spot.
  function overall(p, max) { return Math.max(...SPOTS.map(([s]) => score(p, s, max))); }

  function render() {
    const list = pool();
    const max = maxima(list);
    const byName = new Map(players.map((p) => [p.name, p]));
    const opts = (cur) => `<option value="">Open</option>` + list.slice().sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => `<option${p.name === cur ? " selected" : ""}>${esc(p.name)}</option>`).join("");
    const cellFor = (spot, tier) => {
      const name = (chart[spot] || [])[tier] || "";
      const p = byName.get(name);
      const line = p && p.stats ? `${num(p.stats.ppg)} pts · ${num(p.stats.reb)} reb · ${num(p.stats.ast)} ast` : p ? "No stats yet" : "";
      return `<td class="${tier === 0 ? "dc-start" : ""}">
        ${p ? `<div class="dc-name">${p.number ? `<span class="dc-num">#${esc(p.number)}</span>` : ""}<b>${esc(p.name)}</b></div>
          <div class="dc-meta">${esc([p.classYear && "Class of " + p.classYear, p.height].filter(Boolean).join(" · "))}</div>
          <div class="dc-meta">${esc(line)}</div>
          <div class="dc-score" title="Score at this spot">${score(p, spot, max)}</div>` : '<div class="dc-meta">Open</div>'}
        <select class="gselect dc-pick" data-spot="${spot}" data-tier="${tier}" aria-label="${esc(SPOTS[Number(spot) - 1][1])} ${TIERS[tier]}">${opts(name)}</select>
      </td>`;
    };
    $("#dcChart").innerHTML = `<thead><tr><th></th>${SPOTS.map(([s, l]) => `<th><span class="dc-spot">${s}</span>${esc(l)}</th>`).join("")}</tr></thead>
      <tbody>${TIERS.map((t, i) => `<tr><th class="dc-tier">${t}</th>${SPOTS.map(([s]) => cellFor(s, i)).join("")}</tr>`).join("")}</tbody>`;

    // Rotation: the five starters, then the best three off the bench.
    const starters = SPOTS.map(([s]) => (chart[s] || [])[0]).filter(Boolean);
    const bench = list.filter((p) => !starters.includes(p.name)).sort((a, b) => overall(b, max) - overall(a, max));
    const role = ["Sixth player", "Seventh", "Eighth"];
    $("#dcRotation").innerHTML = `<h3>Eight player rotation</h3><ol>
      ${starters.map((n) => `<li><b>${esc(n)}</b> <span class="muted">Starter</span></li>`).join("")}
      ${bench.slice(0, 3).map((p, i) => `<li><b>${esc(p.name)}</b> <span class="muted">${role[i]}</span></li>`).join("")}
    </ol>${bench.length > 3 ? `<p class="muted">Also available: ${bench.slice(3).map((p) => esc(p.name)).join(", ")}</p>` : ""}`;

    const spotOpts = (cur) => `<option value="">Not set</option>` + SPOTS.map(([s, l]) => `<option value="${s}"${s === cur ? " selected" : ""}>${s} ${esc(l)}</option>`).join("");
    $("#dcRows").innerHTML = list.slice().sort((a, b) => overall(b, max) - overall(a, max)).map((p) => {
      const pr = pref(p);
      const st = p.stats || {};
      const cell = (k) => (p.stats ? esc(num(st[k])) : '<span class="muted">none</span>');
      return `<tr data-name="${esc(p.name)}">
        <td><b>${p.number ? "#" + esc(p.number) + " " : ""}${esc(p.name)}</b><br><small class="muted">${esc([p.jv ? "JV" : "", p.classYear && "Class of " + p.classYear, p.height, p.statsFrom].filter(Boolean).join(" · "))}</small></td>
        <td>${esc(p.listed || "Not listed")}</td>
        <td><select class="gselect" data-pref="primary">${spotOpts(pr.primary)}</select></td>
        <td><select class="gselect" data-pref="secondary">${spotOpts(pr.secondary)}</select></td>
        <td>${cell("ppg")}</td><td>${cell("reb")}</td><td>${cell("ast")}</td><td>${cell("stl")}</td><td>${cell("blk")}</td>
        <td><select class="gselect" data-pref="rating"><option value="0">Not rated</option>${[5, 4, 3, 2, 1].map((n) => `<option value="${n}"${n === pr.rating ? " selected" : ""}>${n}</option>`).join("")}</select></td>
        <td><b>${overall(p, max)}</b></td>
      </tr>`;
    }).join("");
    $("#dcSave").disabled = !dirty;
    $("#dcPrintDate").textContent = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function status() {
    const withStats = pool().filter((p) => p.stats).length;
    $("#dcStatus").textContent = `${pool().length} players, ${withStats} with Elevate Her stats. ${savedAt ? `Saved ${new Date(savedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.` : "Not saved yet. This is the suggested chart."}${dirty ? " Unsaved changes." : ""}`;
  }
  const touch = () => { dirty = true; render(); status(); };

  async function load() {
    try {
      const [H, d] = await Promise.all([window.loadHome(), api("/api/coach/depth").catch(() => ({ depth: null }))]);
      const elevatePath = (url) => (/^https:\/\/(?:www\.)?elevateherhoopsreport\.com(\/(?:players\/)?[a-z0-9-]+)\/?$/i.exec(url || "") || [])[1] || "";
      const varsity = new Map();
      (H.spotlights || []).forEach((s) => varsity.set(s.name, { ...s }));
      Object.entries(H.rosterExtras || {}).forEach(([n, x]) => {
        const p = varsity.get(n) || { name: n };
        Object.entries(x).forEach(([k, v]) => { if (v && !p[k]) p[k] = v; });
        varsity.set(n, p);
      });
      const paths = [...varsity.values()].map((p) => elevatePath(p.site)).filter(Boolean);
      const ev = paths.length ? (await api(`/api/elevate?paths=${encodeURIComponent(paths.join(","))}`).catch(() => ({ players: {} }))).players || {} : {};
      players = [...varsity.values()].map((p) => {
        const e = ev[elevatePath(p.site).toLowerCase()];
        let stats = null, statsFrom = "";
        if (e && e.season) { stats = e.season; statsFrom = `${e.season.season} stats`; }
        else if ((p.stats || []).length) {
          // Fall back to the stat line typed on the dashboard spotlight.
          const pick = (l) => (p.stats.find((x) => x.l.toUpperCase() === l) || {}).v || 0;
          stats = { ppg: pick("PPG"), reb: pick("RPG"), ast: pick("APG"), stl: pick("SPG"), blk: pick("BPG") };
          statsFrom = "Spotlight stats";
        }
        return { name: p.name, number: p.number || "", classYear: p.classYear || (e && e.classYear) || "", height: p.height || (e && e.height) || "", listed: p.position || (e && e.position) || "", stats, statsFrom, jv: false };
      }).concat((H.jv || []).filter((p) => p.name && !varsity.has(p.name)).map((p) => ({ name: p.name, number: p.number || "", classYear: p.classYear || "", height: "", listed: "", stats: null, statsFrom: "", jv: true })));
      const saved = d.depth;
      prefs = saved ? { ...saved.players } : {};
      notes = saved ? saved.notes : "";
      savedAt = saved ? saved.updatedAt : "";
      $("#dcJv").checked = !!(saved && saved.includeJv);
      const hasChart = saved && Object.values(saved.chart || {}).some((a) => a.some(Boolean));
      chart = hasChart ? saved.chart : suggest();
      $("#dcNotes").value = notes;
      dirty = false;
      render();
      status();
    } catch (e) { toast(e.message); }
  }

  $("#dcChart").addEventListener("change", (e) => {
    const s = e.target.closest(".dc-pick");
    if (!s) return;
    const { spot, tier } = s.dataset;
    const name = s.value;
    // A player holds one place on the chart: moving her clears where she was.
    if (name) Object.values(chart).forEach((arr) => arr.forEach((n, i) => { if (n === name) arr[i] = ""; }));
    chart[spot] = chart[spot] || ["", "", ""];
    chart[spot][Number(tier)] = name;
    touch();
  });
  $("#dcRows").addEventListener("change", (e) => {
    const el = e.target.closest("[data-pref]");
    const name = el && el.closest("[data-name]")?.dataset.name;
    if (!name) return;
    const p = players.find((x) => x.name === name);
    const pr = pref(p);
    pr[el.dataset.pref] = el.dataset.pref === "rating" ? Number(el.value) : el.value;
    touch();
  });
  $("#dcJv").addEventListener("change", () => { chart = suggest(); touch(); });
  $("#dcNotes").addEventListener("input", () => { notes = $("#dcNotes").value; dirty = true; $("#dcSave").disabled = false; status(); });
  $("#dcRebuild").addEventListener("click", () => {
    if (dirty && savedAt && !confirm("Rebuild the chart from stats and your ratings? Changes you made by hand on the chart will be replaced.")) return;
    chart = suggest();
    touch();
    toast("Depth chart rebuilt");
  });
  $("#dcPrint").addEventListener("click", () => { document.body.classList.add("print-depth"); window.print(); setTimeout(() => document.body.classList.remove("print-depth"), 500); });
  $("#dcSave").addEventListener("click", async () => {
    try {
      const r = await api("/api/coach/depth", { method: "PUT", body: { players: prefs, chart, notes, includeJv: $("#dcJv").checked } });
      savedAt = r.depth.updatedAt;
      dirty = false;
      render(); status();
      toast("Depth chart saved");
    } catch (e) { toast(e.message); }
  });

  let started = false;
  document.addEventListener("coach:ready", () => {
    if (started) return;
    started = true;
    load();
  });
})();
