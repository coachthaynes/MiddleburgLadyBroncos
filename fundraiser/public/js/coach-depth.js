// Coaches dashboard, Depth chart tab: the statistical evaluation and positional depth chart report.
// Index = PPG + (RPG x 1.2) + (APG x 1.5) + (SPG x 2.0) + (BPG x 2.0), from each player's season averages.
// It is worked out fresh every time the tab opens. Only the position designations are saved.
(function () {
  const POS = [["PG", "Point guard"], ["SG", "Shooting guard"], ["SF", "Small forward"], ["PF", "Power forward"], ["C", "Center"]];
  const W = { ppg: 1.0, reb: 1.2, ast: 1.5, stl: 2.0, blk: 2.0 };
  const LABEL = { ppg: "PPG", reb: "RPG", ast: "APG", stl: "SPG", blk: "BPG" };
  const WORDS = { ppg: "points", reb: "rebounds", ast: "assists", stl: "steals", blk: "blocks" };

  // Starting designations and averages from the coaches' depth chart report. Elevate Her averages
  // replace these whenever a player's profile has a season listed.
  const DEFAULTS = {
    "Aiyana Haynes": { primary: "SG", backups: ["PG", "SF"], stats: { ppg: 12.5, reb: 7.6, ast: 2.6, stl: 4.3, blk: 0.9 } },
    "Kennedy Jeffress": { primary: "PG", backups: ["SG"], stats: { ppg: 17.3, reb: 4.1, ast: 2.3, stl: 3.2, blk: 0.2 } },
    "Nyla Parsons": { primary: "PG", backups: ["SG"], stats: { ppg: 12.1, reb: 3.4, ast: 1.6, stl: 2.2, blk: 0 } },
    "Janiyla Owens": { primary: "SG", backups: [], stats: { ppg: 11.0, reb: 3.2, ast: 1.1, stl: 2.2, blk: 0 } },
    "Sophia Butler": { primary: "PF", backups: ["C"], stats: { ppg: 4.9, reb: 8.2, ast: 0.6, stl: 0.8, blk: 0.9 } },
    "Maliya Lassiter": { primary: "SG", backups: ["PG", "SF"], stats: { ppg: 5.3, reb: 2.1, ast: 0.9, stl: 1.7, blk: 0.1 } },
    "Aliyna McCobb": { primary: "PG", backups: ["SG"], stats: { ppg: 3.3, reb: 2.2, ast: 0.9, stl: 1.5, blk: 0 } },
    "Catherine Bodway": { primary: "PF", backups: ["C"], stats: { ppg: 2.7, reb: 3.2, ast: 0.2, stl: 0.4, blk: 0.7 } },
    "Savanna Padgett": { primary: "C", backups: [], stats: { ppg: 2.3, reb: 2.1, ast: 0.2, stl: 0.4, blk: 0.3 } },
    "Mikayla Burns": { primary: "PF", backups: ["SF"], stats: {} },
    "Andrea Brady": { primary: "PF", backups: ["SF"], stats: { ppg: 1.3, reb: 1.5, ast: 0.2, stl: 0.1, blk: 0 } },
  };

  let players = []; // { name, primary, backups, stats, gp, from, index, prevIndex, prevRank }
  let saved = {};
  // This season's MaxPreps uploads ({ current, previous }) and which averages the chart uses.
  let mp = { current: null, previous: null };
  let source = "mp";
  let lastSeason = new Map(); // name -> { stats, from } from Elevate Her or the report
  const prettyDate = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const f1 = (n) => num(n).toFixed(1);
  const f2 = (n) => num(n).toFixed(2);
  const indexOf = (s) => Math.round((num(s.ppg) * W.ppg + num(s.reb) * W.reb + num(s.ast) * W.ast + num(s.stl) * W.stl + num(s.blk) * W.blk) * 100) / 100;
  const posLabel = (p) => [p.primary, ...p.backups].filter(Boolean).join(" / ") || "Not set";
  const lastName = (n) => n.split(" ").slice(-1)[0];

  // ---------- player breakdowns, written from the numbers ----------
  // What each position leans on most, in order. Used to pick realistic areas to grow.
  const FOCUS = { PG: ["ast", "stl", "ppg"], SG: ["ppg", "stl", "ast"], SF: ["ppg", "reb", "stl"], PF: ["reb", "blk", "ppg"], C: ["reb", "blk", "ppg"] };
  const ROLE = {
    PG: "a point guard who runs the offense",
    SG: "a shooting guard who scores and pressures the ball",
    SF: "a wing who fills in on both ends",
    PF: "a power forward who works the glass",
    C: "a post who protects the rim",
  };
  const up1 = (x) => Math.max(0.1, Math.ceil(x * 10 - 1e-9) / 10).toFixed(1);
  const pct = (part, whole) => (whole > 0 ? Math.round((100 * part) / whole) : 0);
  const andList = (items) => (items.length < 3 ? items.join(" and ") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

  // opts.anon: the version players see in the Athlete Monitor, which names no teammates.
  function breakdown(p, rank, ranked, opts = {}) {
    const who = (x) => (opts.anon ? `the player ranked #${ranked.indexOf(x) + 1}` : esc(x.name));
    const s = p.stats;
    const last = lastName(p.name);
    const keys = Object.keys(W);
    if (!keys.some((k) => num(s[k]) > 0)) {
      if (p.from === "none") return { strengths: `${last} has no numbers in this week's MaxPreps upload, so she ranks #${rank} for now.`, plan: ["Once she plays and her stats are on MaxPreps, the next upload ranks her."] };
      return { strengths: `${last} has no season averages listed yet, so she ranks #${rank} until her stats are posted.`, plan: ["Get her season averages onto her Elevate Her profile so she can be ranked."] };
    }
    const avg = Object.fromEntries(keys.map((k) => [k, ranked.reduce((t, x) => t + num(x.stats[k]), 0) / ranked.length]));
    const best = Object.fromEntries(keys.map((k) => [k, Math.max(...ranked.map((x) => num(x.stats[k])))]));
    const teamRank = (k) => 1 + ranked.filter((x) => num(x.stats[k]) > num(s[k])).length;
    const contrib = keys.map((k) => [k, num(s[k]) * W[k]]).sort((x, y) => y[1] - x[1]);

    // Strengths: what she does better than most of the team, and where her index comes from.
    const strong = keys.filter((k) => num(s[k]) > 0 && (teamRank(k) <= 3 || num(s[k]) >= avg[k] * 1.4));
    const leads = keys.filter((k) => num(s[k]) > 0 && num(s[k]) === best[k]);
    const role = ROLE[p.primary] ? `${last} is ${ROLE[p.primary]}${p.backups.length ? `, with backup minutes at ${andList(p.backups)}` : ""}.` : `${last} has no primary position set.`;
    let strengths = `${role} Her index of ${f2(p.index)} ranks #${rank} of ${ranked.length}.`;
    if (p.blend) strengths += p.from === "last" ? ` She has no games in this week's upload yet, so these are last season's numbers.` : ` Her numbers still include last season until she has ${BLEND_GAMES} games (she has ${p.gp}).`;
    if (leads.length) strengths += ` She leads the team in ${andList(leads.map((k) => `${WORDS[k]} (${f1(s[k])})`))}.`;
    const others = strong.filter((k) => !leads.includes(k));
    if (others.length) strengths += ` She ranks ${andList(others.map((k) => `#${teamRank(k)} in ${WORDS[k]} (${f1(s[k])}, team average ${f1(avg[k])})`))}.`;
    strengths += ` ${WORDS[contrib[0][0]][0].toUpperCase() + WORDS[contrib[0][0]].slice(1)} make up ${pct(contrib[0][1], p.index)}% of her index`;
    strengths += contrib[1][1] > 0 ? `, and ${WORDS[contrib[1][0]]} another ${pct(contrib[1][1], p.index)}%.` : ".";

    // Where she can grow: the stats her position leans on where she has the most room, by index value.
    const focus = (FOCUS[p.primary] || ["ppg", "reb", "stl"])
      .map((k) => [k, (best[k] - num(s[k])) * W[k] + (num(s[k]) < avg[k] ? 1 : 0)])
      .sort((x, y) => y[1] - x[1]).map(([k]) => k);
    const [k1, k2] = focus;
    const plan = [];
    const need = (gap) => gap + 0.01;
    if (rank > 1) {
      const above = ranked[rank - 2];
      const gap = need(above.index - p.index);
      plan.push(`<b>To pass ${opts.anon ? `the player ranked #${rank - 1}` : `${esc(above.name)} (#${rank - 1}, ${f2(above.index)})`}</b> she needs ${f2(gap)} more index points: about +${up1(gap / W[k1])} ${WORDS[k1]} per game, or +${up1(gap / W[k2])} ${WORDS[k2]} per game, or a mix of +${up1(gap / 2 / W[k1])} ${WORDS[k1]} and +${up1(gap / 2 / W[k2])} ${WORDS[k2]}.`);
      if (rank > 6) {
        const fifth = ranked[4];
        const g5 = need(fifth.index - p.index);
        plan.push(`<b>To reach the top five</b> (passing ${opts.anon ? "the player ranked #5" : `${esc(fifth.name)} at ${f2(fifth.index)}`}) takes ${f2(g5)} more index points, for example +${up1(g5 / 2 / W[k1])} ${WORDS[k1]} and +${up1(g5 / 2 / W[k2])} ${WORDS[k2]} per game.`);
      }
    } else {
      const next = ranked[1];
      plan.push(`<b>She leads the team</b> by ${f2(p.index - next.index)} index points over ${who(next)}. Adding +0.5 ${WORDS[k1]} and +0.5 ${WORDS[k2]} per game would grow that lead by ${f2(0.5 * W[k1] + 0.5 * W[k2])}.`);
    }
    // Her standing at her primary position.
    if (p.primary) {
      const atPos = ranked.filter((x) => x.primary === p.primary || x.backups.includes(p.primary));
      const posRank = atPos.indexOf(p) + 1;
      if (posRank > 1) {
        const lead = atPos[0];
        plan.push(`<b>At ${p.primary}</b> she is #${posRank} of ${atPos.length}. Moving to the top of the ${p.primary} depth chart means closing a ${f2(need(lead.index - p.index))} point gap on ${opts.anon ? `the top ${p.primary}` : esc(lead.name)}.`);
      } else {
        plan.push(`<b>At ${p.primary}</b> she is first on the depth chart.`);
      }
    }
    // Steals and blocks count double, so defense is the fastest way up for a scorer.
    if (contrib[0][0] === "ppg" && pct(contrib[0][1], p.index) >= 45 && ![k1, k2].includes("stl")) {
      plan.push(`<b>Defense is her fastest lever.</b> Points make up ${pct(contrib[0][1], p.index)}% of her index, but each steal or block counts double, so one more steal per game is worth as much as two more points.`);
    }
    // Her weakest area compared with the team, among the stats her position is judged on.
    const weak = (FOCUS[p.primary] || keys).filter((k) => avg[k] > 0 && ![k1, k2].includes(k)).sort((x, y) => num(s[x]) / avg[x] - num(s[y]) / avg[y])[0];
    if (weak && num(s[weak]) < avg[weak] * 0.75) {
      plan.push(`<b>Biggest gap:</b> ${WORDS[weak]} (${f1(s[weak])} per game against a team average of ${f1(avg[weak])}). Getting to the team average adds ${f2((avg[weak] - num(s[weak])) * W[weak])} index points.`);
    }
    return { strengths, plan };
  }

  // How a player moved since the previous week's upload: rank places and index points.
  function changeText(p, rank) {
    if (p.prevIndex == null) return '<span class="muted">New</span>';
    const d = Math.round((p.index - p.prevIndex) * 100) / 100, moved = p.prevRank - rank;
    const arrow = moved > 0 ? `<span class="dc-up">Up ${moved}</span>` : moved < 0 ? `<span class="dc-down">Down ${-moved}</span>` : "Same spot";
    return `${arrow}<div class="muted" style="font-size:.78rem">${d > 0 ? "+" : ""}${f2(d)} index</div>`;
  }

  // ---------- what players see in the Athlete Monitor ----------
  // After each calculation the default view (this season blended, or last season before any upload) is sent to
  // the site, and the Athlete Monitor shows each player only her own line. Nothing here names a teammate.
  const plain = (t) => String(t).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  let lastSent = "", sendTimer = null;
  function publish(ranked) {
    if (mp.current && source !== "mp") return; // the coach is looking at another view; players keep the default one
    const entries = ranked.map((p, i) => {
      const rank = i + 1, r = breakdown(p, rank, ranked, { anon: true });
      const spots = POS.map(([code]) => {
        const list = ranked.filter((x) => x.primary === code || x.backups.includes(code));
        const at = list.indexOf(p);
        return at < 0 ? null : { code, order: at + 1, of: list.length, role: p.primary === code ? "primary" : "backup" };
      }).filter(Boolean);
      const moved = p.prevIndex == null ? null : { places: p.prevRank - rank, index: Math.round((p.index - p.prevIndex) * 100) / 100 };
      return { name: p.name, rank, of: ranked.length, spots, gp: p.gp, blend: !!p.blend, stats: p.stats, index: p.index, moved, why: plain(r.strengths), plan: r.plan.map(plain) };
    });
    const body = { asOf: useMp() ? mp.current.asOf : "", basis: useMp() ? `This season's MaxPreps stats${mp.current.asOf ? `, as of ${prettyDate(mp.current.asOf)}` : ""}${players.some((p) => p.blend) ? `, mixed with last season until a player has ${BLEND_GAMES} games` : ""}` : "Last season's averages", players: entries };
    const key = JSON.stringify(body);
    if (key === lastSent) return;
    clearTimeout(sendTimer);
    sendTimer = setTimeout(() => {
      api("/api/coach/depth-snapshot", { method: "POST", body }).then(() => { lastSent = key; }).catch(() => { /* try again on the next calculation */ });
    }, 1500);
  }

  function render() {
    players.forEach((p) => { p.index = indexOf(p.stats); });
    const ranked = players.slice().sort((a, b) => b.index - a.index || a.name.localeCompare(b.name));
    const rankOf = new Map(ranked.map((p, i) => [p.name, i + 1]));

    $("#dcBoard").innerHTML = ranked.map((p, i) => `<tr class="${i < 3 ? "dc-top" : ""}">
      <td><b>${i + 1}</b></td><td><b>${esc(p.name)}</b></td><td>${esc(posLabel(p))}</td><td>${p.gp == null ? "" : `${p.gp}${p.blend ? "*" : ""}`}</td>
      <td>${f1(p.stats.ppg)}</td><td>${f1(p.stats.reb)}</td><td>${f1(p.stats.ast)}</td><td>${f1(p.stats.stl)}</td><td>${f1(p.stats.blk)}</td>
      <td><b>${f2(p.index)}</b></td><td>${changeText(p, i + 1)}</td></tr>`).join("");
    // The Change column only means something with two MaxPreps uploads.
    $$(".dc-board th:last-child, .dc-board td:last-child").forEach((x) => { x.style.display = useMp() && mp.previous ? "" : "none"; });

    $("#dcPositions").innerHTML = POS.map(([code, label]) => {
      const list = ranked.filter((p) => p.primary === code || p.backups.includes(code));
      return `<div class="dc-pos"><h4>${esc(label)} (${code})</h4><table>
        <thead><tr><th>Ord</th><th>Player</th><th>Role</th><th>Index</th></tr></thead>
        <tbody>${list.length ? list.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.name)}</td>
          <td><span class="dc-role ${p.primary === code ? "primary" : ""}">${p.primary === code ? "Primary" : "Backup"}</span></td><td>${f2(p.index)}</td></tr>`).join("")
          : '<tr><td colspan="4" class="muted">No players listed here</td></tr>'}</tbody></table></div>`;
    }).join("");

    $("#dcCards").innerHTML = ranked.map((p) => {
      const rank = rankOf.get(p.name);
      const line = Object.keys(W).map((k) => `${f1(p.stats[k])} ${LABEL[k]}`).join(" · ");
      const r = breakdown(p, rank, ranked);
      return `<article class="dc-card"><header><b>${rank}. ${esc(p.name)} (${esc(posLabel(p))})</b><span>Index ${f2(p.index)}</span></header>
        <div class="dc-line">${line}</div>
        <p><b>Why she ranks here:</b> ${esc(r.strengths)}</p>
        <h5>How she moves up</h5><ul class="dc-plan">${r.plan.map((t) => `<li>${t}</li>`).join("")}</ul></article>`;
    }).join("");

    $("#dcPosEdit").innerHTML = players.slice().sort((a, b) => a.name.localeCompare(b.name)).map((p) => `<tr data-name="${esc(p.name)}">
      <td><b>${esc(p.name)}</b></td>
      <td><select class="gselect" data-primary><option value="">Not set</option>${POS.map(([c]) => `<option${c === p.primary ? " selected" : ""}>${c}</option>`).join("")}</select></td>
      <td><div class="dc-backs">${POS.map(([c]) => `<label><input type="checkbox" data-backup="${c}"${p.backups.includes(c) ? " checked" : ""}${c === p.primary ? " disabled" : ""}> ${c}</label>`).join("")}</div></td>
    </tr>`).join("");

    const fromElevate = players.filter((p) => p.from === "elevate").length;
    const missing = players.filter((p) => p.from === "none").map((p) => p.name);
    const lastOnly = players.filter((p) => p.from === "last").map((p) => p.name);
    const mixed = players.filter((p) => p.blend).length;
    $("#dcStatus").textContent = (useMp()
      ? `${players.length} varsity players. This season's averages from MaxPreps, stats as of ${prettyDate(mp.current.asOf)}${mp.previous ? `; Change compares with ${prettyDate(mp.previous.asOf)}` : ""}.` +
        (mixed ? ` * mixes in last season until a player has ${BLEND_GAMES} games (${mixed} player${mixed === 1 ? "" : "s"}).` : "") +
        (lastOnly.length ? ` Not in the upload yet, shown with last season: ${lastOnly.join(", ")}.` : "") +
        (missing.length ? ` Not in the upload: ${missing.join(", ")}.` : "")
      : `${players.length} varsity players. Last season's averages: ${fromElevate} from Elevate Her, ${players.length - fromElevate} from the depth chart report.`) + ` Calculated ${new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.`;
    publish(ranked);
  }

  async function load() {
    $("#dcStatus").textContent = "Pulling the latest averages from Elevate Her...";
    try {
      const [H, d] = await Promise.all([window.loadHome(), api("/api/coach/depth").catch(() => ({ depth: null }))]);
      saved = (d.depth && d.depth.players) || {};
      mp = d.stats || { current: null, previous: null };
      try { source = localStorage.getItem("dcSource") || "mp"; } catch { source = "mp"; }
      const elevatePath = (url) => (/^https:\/\/(?:www\.)?elevateherhoopsreport\.com(\/(?:(?:players|elite)\/)?[a-z0-9-]+)\/?$/i.exec(url || "") || [])[1] || "";
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
        const def = DEFAULTS[p.name] || { primary: "", backups: [], stats: {} };
        const pos = saved[p.name] || def;
        const stats = e && e.season
          ? Object.fromEntries(Object.keys(W).map((k) => [k, num(e.season[k])]))
          : Object.fromEntries(Object.keys(W).map((k) => [k, num(def.stats[k])]));
        lastSeason.set(p.name, { stats, from: e && e.season ? "elevate" : "report" });
        return { name: p.name, primary: pos.primary || "", backups: (pos.backups || []).filter((b) => b !== pos.primary), stats, from: e && e.season ? "elevate" : "report" };
      });
      applySource();
      render();
      showUploadState();
    } catch (err) { $("#dcStatus").textContent = err.message; }
  }

  // "mp": this season blended with last season early on; "mponly": this season only; "last": last season.
  const useMp = () => (source === "mp" || source === "mponly") && !!mp.current;
  const blending = () => source === "mp";
  const zero = () => Object.fromEntries(Object.keys(W).map((k) => [k, 0]));
  // Her line in an upload: matched when it was saved, or found now among every row the PDF had.
  const pick = (rec, name) => {
    if (!rec) return null;
    if (rec.players[name]) return rec.players[name];
    const r = (rec.rows || []).find((x) => MaxPrepsStats.match(x.name, [name], x.names) === name);
    return r ? { gp: r.gp, ...r.stats } : null;
  };

  // A few games can swing a player's averages a long way, so like college ratings that start the year from
  // last season, last season counts until she has this many games, fading out game by game.
  const BLEND_GAMES = 5;
  function statsFor(rec, name, blend) {
    const x = pick(rec, name);
    const now = x ? Object.fromEntries(Object.keys(W).map((k) => [k, num(x[k])])) : zero();
    const gp = x ? num(x.gp) : 0;
    const last = (lastSeason.get(name) || {}).stats || zero();
    const hasLast = Object.keys(W).some((k) => num(last[k]) > 0);
    if (!blend || !hasLast || gp >= BLEND_GAMES) return { stats: now, gp, from: x ? "maxpreps" : "none", blend: false };
    const mix = Object.fromEntries(Object.keys(W).map((k) => [k, Math.round(((gp * now[k] + (BLEND_GAMES - gp) * num(last[k])) / BLEND_GAMES) * 10) / 10]));
    return { stats: mix, gp, from: x ? "maxpreps" : "last", blend: true };
  }

  // Put the chosen averages on every player, and last week's index and rank for the Change column.
  function applySource() {
    const sel = $("#dcSource");
    sel.innerHTML = (mp.current
      ? `<option value="mp">This season, blended with last season until ${BLEND_GAMES} games (MaxPreps, as of ${esc(prettyDate(mp.current.asOf))})</option><option value="mponly">This season only (MaxPreps)</option>`
      : "") + '<option value="last">Last season: Elevate Her and the report</option>';
    sel.value = useMp() ? source : "last";
    let prevRanked = null;
    if (useMp() && mp.previous) {
      // Last week ranked the same way, so the moves compare like with like.
      prevRanked = players.map((p) => { const x = statsFor(mp.previous, p.name, blending()); return { name: p.name, index: x.from === "none" ? null : indexOf(x.stats) }; })
        .filter((x) => x.index != null).sort((a, b) => b.index - a.index || a.name.localeCompare(b.name));
    }
    players.forEach((p) => {
      if (useMp()) {
        const x = statsFor(mp.current, p.name, blending());
        p.stats = x.stats;
        p.gp = x.gp;
        p.from = x.from;
        p.blend = x.blend;
        const at = prevRanked ? prevRanked.findIndex((y) => y.name === p.name) : -1;
        p.prevIndex = at >= 0 ? prevRanked[at].index : null;
        p.prevRank = at >= 0 ? at + 1 : null;
      } else {
        const ls = lastSeason.get(p.name) || { stats: zero(), from: "report" };
        p.stats = ls.stats; p.from = ls.from; p.gp = null; p.prevIndex = null; p.prevRank = null; p.blend = false;
      }
    });
  }
  $("#dcSource").addEventListener("change", (e) => {
    source = e.target.value;
    try { localStorage.setItem("dcSource", source); } catch { /* private window */ }
    applySource();
    render();
  });

  // ---------- weekly MaxPreps upload ----------
  let pending = null;
  function showUploadState() {
    if (!$("#dcAsOf").value) $("#dcAsOf").value = new Date().toLocaleDateString("en-CA");
    if (pending) return;
    $("#dcPreview").innerHTML = mp.current
      ? `<p style="font-size:.85rem;margin:8px 0 0">Last upload: stats as of <b>${esc(prettyDate(mp.current.asOf))}</b>${mp.current.season ? `, ${esc(mp.current.season.replace("-", " to "))} season` : ""}, ${Object.keys(mp.current.players).length} players.${mp.current.notMatched.length ? ` Not matched: ${esc(mp.current.notMatched.join(", "))}.` : ""} <button class="btn btn-glass btn-small" type="button" id="dcClear">Remove uploads</button></p>`
      : "";
  }
  $("#dcPdf").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    $("#dcPreview").innerHTML = '<p class="muted" style="font-size:.85rem;margin:8px 0 0">Reading the PDF...</p>';
    try {
      const read = MaxPrepsStats.parse(await AM.pdfToText(file));
      if (!read.players.length) throw new Error("No player stats were found in that PDF. Use the MaxPreps Print stats page saved as a PDF.");
      const names = players.map((p) => p.name);
      const matched = {}, notMatched = [];
      read.players.forEach((r) => {
        const who = MaxPrepsStats.match(r.name, names, r.names);
        if (who && !matched[who]) matched[who] = { gp: r.gp, ...r.stats };
        else notMatched.push(r.name);
      });
      const missing = names.filter((n) => !matched[n]);
      const other = read.team && !/middleburg/i.test(read.team);
      pending = { team: read.team, season: read.season, asOf: $("#dcAsOf").value, players: matched, notMatched,
        rows: read.players.map((r) => ({ name: r.name, names: r.names || [], jersey: r.jersey, gp: r.gp, stats: r.stats })) };
      $("#dcPreview").innerHTML = `<div style="margin-top:10px">
        ${other ? `<p class="notice">This PDF is for <b>${esc(read.team)}</b>, not Middleburg. Check you picked the right file.</p>` : ""}
        <p style="font-size:.88rem;margin:0 0 6px">Read <b>${read.players.length}</b> players${read.team ? ` from ${esc(read.team)}` : ""}${read.season ? `, ${esc(read.season.replace("-", " to "))} season` : ""}. Matched <b>${Object.keys(matched).length}</b> of ${names.length} varsity players.</p>
        <div class="table-wrap"><table class="players dc-tbl"><thead><tr><th>Player</th><th>GP</th><th>PPG</th><th>RPG</th><th>APG</th><th>SPG</th><th>BPG</th></tr></thead><tbody>
        ${Object.entries(matched).map(([n, x]) => `<tr><td>${esc(n)}</td><td>${x.gp}</td><td>${f1(x.ppg)}</td><td>${f1(x.reb)}</td><td>${f1(x.ast)}</td><td>${f1(x.stl)}</td><td>${f1(x.blk)}</td></tr>`).join("")}
        </tbody></table></div>
        ${notMatched.length ? `<p class="muted" style="font-size:.82rem;margin:6px 0 0">On MaxPreps but not on the varsity list (JV or a different spelling): ${esc(notMatched.join(", "))}.</p>` : ""}
        ${missing.length ? `<p class="muted" style="font-size:.82rem;margin:6px 0 0">Varsity players not in this PDF: ${esc(missing.join(", "))}. They keep last season's numbers until they appear on MaxPreps.</p>` : ""}
        <div class="btn-row" style="margin-top:8px"><button class="btn btn-primary btn-small" type="button" id="dcSave"${Object.keys(matched).length ? "" : " disabled"}>Update the depth chart</button><button class="btn btn-glass btn-small" type="button" id="dcCancel">Cancel</button></div></div>`;
    } catch (err) {
      pending = null;
      $("#dcPreview").innerHTML = `<p class="notice" style="margin-top:8px">${esc(err.message || "That PDF could not be read.")}</p>`;
    }
    e.target.value = "";
  });
  $("#dcPreview").addEventListener("click", async (e) => {
    if (e.target.id === "dcCancel") { pending = null; showUploadState(); }
    if (e.target.id === "dcSave" && pending) {
      e.target.disabled = true;
      try {
        pending.asOf = $("#dcAsOf").value || pending.asOf;
        const r = await api("/api/coach/depth-stats", { method: "PUT", body: pending });
        mp = r.stats; pending = null; source = "mp";
        try { localStorage.setItem("dcSource", "mp"); } catch { /* private window */ }
        applySource(); render(); showUploadState();
        toast("Depth chart updated with this season's stats");
      } catch (err) { toast(err.message); e.target.disabled = false; }
    }
    if (e.target.id === "dcClear") {
      if (!confirm("Remove the MaxPreps uploads and go back to last season's averages?")) return;
      try {
        mp = (await api("/api/coach/depth-stats", { method: "DELETE" })).stats;
        applySource(); render(); showUploadState();
        toast("Uploads removed");
      } catch (err) { toast(err.message); }
    }
  });

  // Position changes save on their own.
  let saveTimer = null;
  function savePositions() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await api("/api/coach/depth", { method: "PUT", body: { players: Object.fromEntries(players.map((p) => [p.name, { primary: p.primary, backups: p.backups }])) } });
        toast("Positions saved");
      } catch (e) { toast(e.message); }
    }, 400);
  }
  $("#dcPosEdit").addEventListener("change", (e) => {
    const row = e.target.closest("[data-name]");
    if (!row) return;
    const p = players.find((x) => x.name === row.dataset.name);
    if (e.target.matches("[data-primary]")) { p.primary = e.target.value; p.backups = p.backups.filter((b) => b !== p.primary); }
    if (e.target.matches("[data-backup]")) {
      const c = e.target.dataset.backup;
      p.backups = e.target.checked ? [...p.backups, c] : p.backups.filter((b) => b !== c);
      p.backups = POS.map(([x]) => x).filter((x) => p.backups.includes(x));
    }
    render();
    savePositions();
  });

  $("#dcRebuild").addEventListener("click", load);
  $("#dcPrint").addEventListener("click", () => { document.body.classList.add("print-depth"); window.print(); setTimeout(() => document.body.classList.remove("print-depth"), 500); });

  let started = false;
  document.addEventListener("coach:ready", () => {
    if (started) return;
    started = true;
    load();
  });
})();
