// Reads per game averages out of a MaxPreps "Printable stats" PDF (as text, one table row per line,
// cells separated by tabs). Used by the depth chart so this season's numbers can replace last season's.
// Averages come from the PPG, RPG, APG, SPG and BPG columns; when a column is missing they are worked out
// from the season totals (Pts, Reb, Ast, Stl, Blk) divided by games played.
(function (root) {
  const AVG = { ppg: ["ppg"], reb: ["rpg"], ast: ["apg"], stl: ["spg"], blk: ["bpg"] };
  const TOT = { ppg: ["pts"], reb: ["reb", "tot reb", "trb"], ast: ["ast"], stl: ["stl"], blk: ["blk"] };
  const num = (v) => { const n = parseFloat(String(v || "").replace(/[^\d.]/g, "")); return Number.isFinite(n) ? n : null; };
  const clean = (n) => String(n || "").replace(/\s*\((fr|so|jr|sr|8th|7th)\)\s*$/i, "").replace(/\s+/g, " ").trim();

  function parse(text) {
    const lines = String(text || "").split(/\r?\n/);
    const out = { team: "", season: "", players: [] };
    const title = lines.find((l) => /team season stats/i.test(l)) || "";
    const t = /^(.*?)\s+(?:girls\s+)?basketball team season stats\s*\((\d{4}-\d{2,4})\)/i.exec(title);
    if (t) { out.team = t[1].trim(); out.season = t[2]; }
    const by = new Map();
    let cols = null;
    for (const line of lines) {
      const cells = line.split("\t").map((c) => c.trim());
      const low = cells.map((c) => c.toLowerCase());
      const nameCol = low.findIndex((c) => c === "athlete name" || c === "name" || c === "player");
      if (nameCol >= 0 && cells.length >= 3) { cols = { name: nameCol, head: low }; continue; }
      if (!cols || cells.length < 3) continue;
      const name = clean(cells[cols.name]);
      if (!name || /season totals|team totals|^totals$/i.test(name)) continue;
      const jersey = cols.name > 0 ? cells[0] : "";
      const p = by.get(name) || { name, jersey, gp: null, avg: {}, tot: {} };
      cols.head.forEach((h, i) => {
        const v = num(cells[i]);
        if (h === "gp" && v != null) p.gp = v;
        for (const k of Object.keys(AVG)) {
          if (AVG[k].includes(h) && cells[i] !== "") p.avg[k] = v ?? 0;
          if (TOT[k].includes(h) && cells[i] !== "") p.tot[k] = v ?? 0;
        }
      });
      by.set(name, p);
    }
    for (const p of by.values()) {
      const stats = {};
      for (const k of Object.keys(AVG)) {
        if (p.avg[k] != null) stats[k] = p.avg[k];
        else if (p.tot[k] != null && p.gp) stats[k] = Math.round((p.tot[k] / p.gp) * 10) / 10;
        else stats[k] = 0;
      }
      out.players.push({ name: p.name, jersey: p.jersey, gp: p.gp || 0, stats });
    }
    return out;
  }

  // Which of our players a MaxPreps name means: "K. Jeffress", "Kennedy Jeffress" or "Jeffress, Kennedy".
  function match(mpName, roster) {
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, "");
    let first = "", last = "";
    if (mpName.includes(",")) { [last, first] = mpName.split(",").map((s) => s.trim()); }
    else { const parts = mpName.split(" "); first = parts[0] || ""; last = parts.slice(1).join(" "); }
    const f = norm(first), l = norm(last);
    const hits = roster.filter((full) => {
      const parts = full.split(" "), rf = norm(parts[0]), rl = norm(parts.slice(1).join(" "));
      if (rl !== l && !rl.endsWith(l) && !l.endsWith(rl)) return false;
      return f.length <= 1 ? rf.startsWith(f) : rf === f || rf.startsWith(f) || f.startsWith(rf);
    });
    return hits.length === 1 ? hits[0] : "";
  }

  const api = { parse, match };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MaxPrepsStats = api;
})(typeof window !== "undefined" ? window : globalThis);
