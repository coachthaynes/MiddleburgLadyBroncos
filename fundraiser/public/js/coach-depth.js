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
    "Andrea Brady": { primary: "PF", backups: ["SF"], stats: { ppg: 1.3, reb: 1.5, ast: 0.2, stl: 0.1, blk: 0 } },
  };

  let players = []; // { name, primary, backups, stats, from, index }
  let saved = {};
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

  function breakdown(p, rank, ranked) {
    const s = p.stats;
    const last = lastName(p.name);
    const keys = Object.keys(W);
    if (!keys.some((k) => num(s[k]) > 0)) {
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
      plan.push(`<b>To pass ${esc(above.name)} (#${rank - 1}, ${f2(above.index)})</b> she needs ${f2(gap)} more index points: about +${up1(gap / W[k1])} ${WORDS[k1]} per game, or +${up1(gap / W[k2])} ${WORDS[k2]} per game, or a mix of +${up1(gap / 2 / W[k1])} ${WORDS[k1]} and +${up1(gap / 2 / W[k2])} ${WORDS[k2]}.`);
      if (rank > 6) {
        const fifth = ranked[4];
        const g5 = need(fifth.index - p.index);
        plan.push(`<b>To reach the top five</b> (passing ${esc(fifth.name)} at ${f2(fifth.index)}) takes ${f2(g5)} more index points, for example +${up1(g5 / 2 / W[k1])} ${WORDS[k1]} and +${up1(g5 / 2 / W[k2])} ${WORDS[k2]} per game.`);
      }
    } else {
      const next = ranked[1];
      plan.push(`<b>She leads the team</b> by ${f2(p.index - next.index)} index points over ${esc(next.name)}. Adding +0.5 ${WORDS[k1]} and +0.5 ${WORDS[k2]} per game would grow that lead by ${f2(0.5 * W[k1] + 0.5 * W[k2])}.`);
    }
    // Her standing at her primary position.
    if (p.primary) {
      const atPos = ranked.filter((x) => x.primary === p.primary || x.backups.includes(p.primary));
      const posRank = atPos.indexOf(p) + 1;
      if (posRank > 1) {
        const lead = atPos[0];
        plan.push(`<b>At ${p.primary}</b> she is #${posRank} of ${atPos.length}. Moving to the top of the ${p.primary} depth chart means closing a ${f2(need(lead.index - p.index))} point gap on ${esc(lead.name)}.`);
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

  function render() {
    players.forEach((p) => { p.index = indexOf(p.stats); });
    const ranked = players.slice().sort((a, b) => b.index - a.index || a.name.localeCompare(b.name));
    const rankOf = new Map(ranked.map((p, i) => [p.name, i + 1]));

    $("#dcBoard").innerHTML = ranked.map((p, i) => `<tr class="${i < 3 ? "dc-top" : ""}">
      <td><b>${i + 1}</b></td><td><b>${esc(p.name)}</b></td><td>${esc(posLabel(p))}</td>
      <td>${f1(p.stats.ppg)}</td><td>${f1(p.stats.reb)}</td><td>${f1(p.stats.ast)}</td><td>${f1(p.stats.stl)}</td><td>${f1(p.stats.blk)}</td>
      <td><b>${f2(p.index)}</b></td></tr>`).join("");

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
    $("#dcStatus").textContent = `${players.length} varsity players. Averages: ${fromElevate} from Elevate Her, ${players.length - fromElevate} from the depth chart report. Calculated ${new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.`;
  }

  async function load() {
    $("#dcStatus").textContent = "Pulling the latest averages from Elevate Her...";
    try {
      const [H, d] = await Promise.all([window.loadHome(), api("/api/coach/depth").catch(() => ({ depth: null }))]);
      saved = (d.depth && d.depth.players) || {};
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
        return { name: p.name, primary: pos.primary || "", backups: (pos.backups || []).filter((b) => b !== pos.primary), stats, from: e && e.season ? "elevate" : "report" };
      });
      render();
    } catch (err) { $("#dcStatus").textContent = err.message; }
  }

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
