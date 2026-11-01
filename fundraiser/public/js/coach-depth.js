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
    "Kennedy Jeffress": { primary: "PG", backups: [], stats: { ppg: 17.3, reb: 4.1, ast: 2.3, stl: 3.2, blk: 0.2 } },
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

  // Why she ranks where she does: her biggest index contributions, any team leads and her playmaking and defense points.
  function why(p, rank) {
    const s = p.stats;
    const parts = Object.keys(W).map((k) => [k, num(s[k]) * W[k]]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const phrase = (k) => `${f1(s[k])} ${WORDS[k]} per game`;
    const top = Object.keys(W).filter((k) => num(s[k]) > 0 && num(s[k]) === Math.max(...players.map((x) => num(x.stats[k]))));
    const tied = (k) => players.filter((x) => num(x.stats[k]) === num(s[k])).length > 1;
    const list = (ks) => ks.map((k) => `${WORDS[k]} (${f1(s[k])})`).join(ks.length > 2 ? ", " : " and ").replace(/, ([^,]*)$/, " and $1");
    const leads = [];
    if (top.filter((k) => !tied(k)).length) leads.push(`leads the team in ${list(top.filter((k) => !tied(k)))}`);
    if (top.filter(tied).length) leads.push(`ties for the team lead in ${list(top.filter(tied))}`);
    const defense = num(s.ast) * W.ast + num(s.stl) * W.stl + num(s.blk) * W.blk;
    if (!parts.length) return `${lastName(p.name)} ranks #${rank} overall. No season averages are listed yet.`;
    let t = `${lastName(p.name)} ranks #${rank} overall at ${posLabel(p)}. Her index of ${f2(p.index)} is driven by ${phrase(parts[0][0])}`;
    if (parts[1]) t += ` and ${phrase(parts[1][0])}`;
    t += ".";
    if (leads.length) t += ` She ${leads.join(", and ")}.`;
    if (defense > 0) t += ` Playmaking and defense (assists, steals and blocks) add ${f2(defense)} index points.`;
    return t;
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
      return `<article class="dc-card"><header><b>${rank}. ${esc(p.name)} (${esc(posLabel(p))})</b><span>Index ${f2(p.index)}</span></header>
        <div class="dc-line">${line}</div><p><b>Why she ranks here:</b> ${esc(why(p, rank))}</p></article>`;
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
