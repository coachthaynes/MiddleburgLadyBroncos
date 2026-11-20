// Reads per game averages out of a MaxPreps "Printable stats" PDF (as text, one table row per line,
// cells separated by tabs). Used by the depth chart so this season's numbers can replace last season's.
// Averages come from the PPG, RPG, APG, SPG and BPG columns; when a column is missing they are worked out
// from the season totals (Pts, Reb, Ast, Stl, Blk) divided by games played.
(function (root) {
  const AVG = { ppg: ["ppg"], reb: ["rpg"], ast: ["apg"], stl: ["spg"], blk: ["bpg"] };
  const TOT = { ppg: ["pts"], reb: ["reb", "tot reb", "trb"], ast: ["ast"], stl: ["stl"], blk: ["blk"] };
  const num = (v) => { const n = parseFloat(String(v || "").replace(/[^\d.]/g, "")); return Number.isFinite(n) ? n : null; };
  const clean = (n) => String(n || "").replace(/\s*\((fr|so|jr|sr|8th|7th)\)\s*$/i, "").replace(/\s+/g, " ").trim();

  // MaxPreps "Stat Report" PDFs (Season Stats with "#Last Name, First Name" columns) are often scanned:
  // a player's name can land on the line above or below her numbers, zeros can come through as stray
  // characters, and a table's header may be one block of text. So each table is read in order: the Nth
  // player in a table gets the Nth full row of numbers in it. Per game numbers are worked out from the season
  // totals (whole numbers read more reliably than ".5"), with the per game columns as a fallback.
  const isStatReport = (text) => /#\s*last name,\s*first name/i.test(text) || /stat report/i.test(text);
  const hasLetters = (t) => /[a-z]/i.test(t);
  function statReport(text) {
    const lines = String(text || "").split(/\r?\n/);
    const out = { team: "", season: "", players: [] };
    const title = lines.find((l) => /varsity basketball/i.test(l)) || "";
    const t = /^(.*?)(?:\s*\([A-Z]{2}\))?\s+girls\s+varsity basketball\s+\w+\s+(\d{2}-\d{2})/i.exec(title.trim());
    if (t) { out.team = t[1].trim(); out.season = t[2]; }
    const by = new Map(); // jersey (or name) -> { jersey, names, gp, tot, avg }
    let i = 0;
    while (i < lines.length) {
      const head = lines[i];
      if (!/name/i.test(head) || !/\bGP\b/.test(head)) { i++; continue; }
      // Columns from GP onward, by tab cell when the reader lined them up, otherwise by word.
      const tabbed = head.includes("\t");
      const headCells = tabbed ? head.split("\t").map((c) => c.trim()) : head.trim().split(/\s+/);
      const g = headCells.findIndex((c) => c.toUpperCase() === "GP");
      const cols = headCells.slice(g).map((c) => c.toLowerCase());
      const players = [], rows = [];
      let waiting = null; // the last player still missing a name
      for (i = i + 1; i < lines.length; i++) {
        const line = lines[i];
        if (/team totals/i.test(line) || (/name/i.test(line) && /\bGP\b/.test(line))) break;
        const cells = line.includes("\t") ? line.split("\t").map((c) => c.trim()) : null;
        const words = (cells ? cells.join(" ") : line).trim().split(/\s+/).filter(Boolean);
        const jersey = (words.find((w) => /^#\d+$/.test(w)) || (/^#(\d+)/.exec(words[0] || "") || [])[0] || "").replace("#", "");
        const nameText = words.filter((w) => hasLetters(w) && !/^#\d+$/.test(w)).map((w) => w.replace(/^#\d+/, "")).join(" ").trim();
        let nums;
        if (cells && tabbed) nums = cells.slice(g, g + cols.length).map((c) => (c && !hasLetters(c) ? c : c ? "" : ""));
        else nums = words.filter((w) => !hasLetters(w) && !/^#\d+$/.test(w) && !/^\d+-\d+-\d+$/.test(w));
        const filled = nums.filter((x) => x !== "").length;
        if (jersey) { const p = { jersey, names: nameText ? [nameText] : [] }; players.push(p); waiting = nameText ? null : p; }
        else if (nameText && /,/.test(nameText + (lines[i + 1] || "")) && filled < 4) {
          if (waiting) { waiting.names.push(nameText); waiting = null; }
          else if (players.length && !players[players.length - 1].names.length) players[players.length - 1].names.push(nameText);
        }
        if (filled >= Math.max(4, Math.floor(cols.length / 2))) rows.push(nums);
      }
      // The Nth player gets the Nth row. Rows read as one block of text line up from the right, where the
      // totals and per game columns are; GP is always the first number.
      players.forEach((p, n) => {
        const r = rows[n];
        if (!r) return;
        const at = (name) => {
          const k = cols.indexOf(name);
          if (k < 0) return null;
          if (tabbed && r.length === cols.length) return r[k] === "" ? null : r[k];
          const j = r.length - (cols.length - k);
          return k === 0 ? r[0] : j >= 0 ? r[j] : null;
        };
        const key = p.jersey || p.names[0];
        const rec = by.get(key) || { jersey: p.jersey, names: [], gp: 0, tot: {}, avg: {} };
        p.names.forEach((nm) => { const c = clean(nm); if (c && !rec.names.includes(c)) rec.names.push(c); });
        const gp = num(at("gp"));
        if (gp) rec.gp = gp;
        for (const k of Object.keys(AVG)) {
          for (const h of TOT[k].concat(k === "reb" ? ["rebs"] : [])) { const v = at(h); if (v != null && rec.tot[k] == null) rec.tot[k] = num(v) ?? 0; }
          for (const h of AVG[k].concat({ ppg: ["p/g"], reb: ["r/g"], ast: ["a/g"], stl: ["s/g"], blk: ["b/g", "bg"] }[k])) { const v = at(h); if (v != null && rec.avg[k] == null) rec.avg[k] = num(v) ?? 0; }
        }
        by.set(key, rec);
      });
    }
    for (const r of by.values()) {
      const stats = {};
      for (const k of Object.keys(AVG)) {
        stats[k] = r.tot[k] != null && r.gp ? Math.round((r.tot[k] / r.gp) * 10) / 10 : r.avg[k] != null ? r.avg[k] : 0;
      }
      out.players.push({ name: r.names[0] || `#${r.jersey}`, names: r.names, jersey: r.jersey, gp: r.gp || 0, stats });
    }
    return out;
  }

  function parse(text) {
    if (isStatReport(text)) return statReport(text);
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
  // Tries every spelling the PDF gave (a scan can spell a name two ways), then allows the last name to be
  // one letter off when the first name matches exactly ("Mecobb, Aliyna" is Aliyna McCobb).
  function match(mpName, roster, alts) {
    const all = [mpName].concat(alts || []).filter((n, i, a) => n && a.indexOf(n) === i);
    for (const n of all) { const hit = matchOne(n, roster, false); if (hit) return hit; }
    for (const n of all) { const hit = matchOne(n, roster, true); if (hit) return hit; }
    return "";
  }
  const oneOff = (a, b) => {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 4) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  };
  function matchOne(mpName, roster, loose) {
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, "");
    let first = "", last = "";
    if (mpName.includes(",")) { [last, first] = mpName.split(",").map((s) => s.trim()); }
    else { const parts = mpName.split(" "); first = parts[0] || ""; last = parts.slice(1).join(" "); }
    const f = norm(first), l = norm(last);
    const hits = roster.filter((full) => {
      const parts = full.split(" "), rf = norm(parts[0]), rl = norm(parts.slice(1).join(" "));
      if (loose) return f.length > 1 && rf === f && oneOff(rl, l);
      if (!l || (rl !== l && !rl.endsWith(l) && !l.endsWith(rl))) return false;
      return f.length <= 1 ? rf.startsWith(f) : rf === f || rf.startsWith(f) || f.startsWith(rf);
    });
    return hits.length === 1 ? hits[0] : "";
  }

  const api = { parse, match };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MaxPrepsStats = api;
})(typeof window !== "undefined" ? window : globalThis);
