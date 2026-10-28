// Coaches dashboard, Contracts tab: who has signed the Player Contract and the Parent Agreement.
(function () {
  let sigs = [];
  let roster = [];
  let filter = "all";
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
  const day = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const TEAM = { varsity: "Varsity", jv: "JV" };

  // Varsity and JV from the home page roster, the same lists families see.
  function buildRoster(H) {
    const varsity = new Set([...Object.keys(H.rosterExtras || {}), ...(H.spotlights || []).map((p) => p.name)]);
    roster = [...varsity].map((name) => ({ name, team: "varsity" }))
      .concat((H.jv || []).filter((p) => p.name && !varsity.has(p.name)).map((p) => ({ name: p.name, team: "jv" })));
  }

  // Exact name first, then first and last name, then a first name alone for players listed by one name.
  function findPlayer(name) {
    const n = norm(name);
    const parts = n.split(" ");
    return roster.find((p) => norm(p.name) === n)
      || roster.find((p) => { const r = norm(p.name).split(" "); return r.length > 1 && r[0] === parts[0] && r[r.length - 1] === parts[parts.length - 1]; })
      || roster.find((p) => { const r = norm(p.name).split(" "); return r.length === 1 && r[0] === parts[0]; });
  }

  function rows() {
    const map = new Map(roster.map((p) => [p.name, { ...p, player: null, parent: null, onRoster: true }]));
    // Newest signature wins, since the list comes newest first.
    sigs.forEach((s) => {
      const hit = findPlayer(s.fields.playerName);
      const key = hit ? hit.name : `extra:${norm(s.fields.playerName)}`;
      const row = map.get(key) || { name: s.fields.playerName, team: s.fields.team, onRoster: false, player: null, parent: null };
      if (!row[s.doc]) row[s.doc] = s;
      map.set(key, row);
    });
    return [...map.values()];
  }

  const cell = (s) => s
    ? `<a class="pill good" href="/contract-copy?id=${encodeURIComponent(s.id)}" target="_blank" rel="noopener">Signed ${day(s.createdAt)}</a>`
    : '<span class="pill warn">Missing</span>';

  function render() {
    const all = rows();
    const onRoster = all.filter((r) => r.onRoster);
    const total = onRoster.length;
    $("#csPlayer").textContent = `${onRoster.filter((r) => r.player).length} of ${total}`;
    $("#csParent").textContent = `${onRoster.filter((r) => r.parent).length} of ${total}`;
    $("#csReady").textContent = onRoster.filter((r) => r.player && r.parent).length;
    const list = all.filter((r) => filter === "all" || (filter === "missing" ? !(r.player && r.parent) : r.team === filter))
      .sort((a, b) => (a.team === b.team ? 0 : a.team === "varsity" ? -1 : 1) || a.name.localeCompare(b.name));
    $("#ctRows").innerHTML = list.length ? list.map((r) => {
      const latest = r.parent || r.player;
      const f = latest ? latest.fields : null;
      return `<tr>
        <td><b>${esc(r.name)}</b>${r.onRoster ? "" : '<br><small class="muted">Not on the roster. Check the spelling.</small>'}</td>
        <td>${esc(TEAM[r.team] || "")}</td>
        <td>${cell(r.player)}</td>
        <td>${cell(r.parent)}</td>
        <td>${f ? `${esc(f.parentName)}<br><small><a href="tel:${esc(f.parentPhone.replace(/[^\d+]/g, ""))}">${esc(f.parentPhone)}</a> · <a href="mailto:${esc(f.parentEmail)}">${esc(f.parentEmail)}</a></small>` : '<span class="muted">None yet</span>'}</td>
        <td>${r.parent ? esc(r.parent.fields.role) : '<span class="muted">None yet</span>'}</td>
      </tr>`;
    }).join("") : '<tr><td colspan="6" class="muted">Nobody here.</td></tr>';

    $("#ctAllCount").textContent = sigs.length;
    $("#ctAll").innerHTML = sigs.length ? sigs.map((s) => `<tr>
        <td>${new Date(s.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
        <td>${s.doc === "player" ? "Player Contract" : "Parent Agreement"}</td>
        <td>${esc(s.fields.playerName)} <small class="muted">${esc(TEAM[s.fields.team] || "")}</small></td>
        <td>${esc(s.fields.parentName)}</td>
        <td><div class="btn-row"><a class="btn btn-glass btn-small" href="/contract-copy?id=${encodeURIComponent(s.id)}" target="_blank" rel="noopener">View</a><button class="btn btn-glass btn-small" data-del="${esc(s.id)}">Delete</button></div></td>
      </tr>`).join("") : '<tr><td colspan="5" class="muted">No contracts signed yet.</td></tr>';
  }

  async function load() {
    try {
      const [H, r] = await Promise.all([window.loadHome(), api("/api/coach/contracts")]);
      buildRoster(H);
      sigs = r.contracts || [];
      render();
    } catch (e) { toast(e.message); }
  }

  $("#ctTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cf]");
    if (!b) return;
    filter = b.dataset.cf;
    $$("#ctTabs button").forEach((x) => x.classList.toggle("on", x === b));
    render();
  });
  $("#ctRefresh").addEventListener("click", load);
  $("#ctAll").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-del]");
    if (!b || !confirm("Delete this signed contract for good? This cannot be undone.")) return;
    try {
      await api(`/api/coach/contracts/${encodeURIComponent(b.dataset.del)}`, { method: "DELETE" });
      sigs = sigs.filter((s) => s.id !== b.dataset.del);
      render();
      toast("Deleted");
    } catch (err) { toast(err.message); }
  });
  $("#ctRemind").addEventListener("click", async () => {
    const missing = rows().filter((r) => r.onRoster && !(r.player && r.parent)).map((r) => r.name.split(" ")[0]);
    const text = `Lady Broncos families: every player needs a signed Player Contract and Parent Agreement before she can play. It takes a couple of minutes on your phone:\nPlayer Contract: https://mhsladybroncos.com/contracts/player\nParent Agreement: https://mhsladybroncos.com/contracts/parent${missing.length ? `\nStill waiting on: ${missing.join(", ")}` : ""}`;
    try { await navigator.clipboard.writeText(text); toast("Reminder copied. Paste it in SportsYou or a text."); } catch { toast("Copy did not work on this device."); }
  });
  $("#ctCsv").addEventListener("click", () => {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["Signed", "Contract", "Player", "Grade", "Team", "Parent or guardian", "Phone", "Email", "Volunteer role", "Version"].map(q).join(",")];
    sigs.forEach((s) => lines.push([new Date(s.createdAt).toLocaleString("en-US"), s.doc === "player" ? "Player Contract" : "Parent Agreement", s.fields.playerName, s.fields.grade, TEAM[s.fields.team], s.fields.parentName, s.fields.parentPhone, s.fields.parentEmail, s.fields.role, s.version].map(q).join(",")));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = `contracts-${new Date().toISOString().slice(0, 10)}.csv`;
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
