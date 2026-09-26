(async function () {
  const params = new URLSearchParams(location.search);
  trackViewOnce("team");

  let data;
  try {
    data = await api("/api/public");
  } catch (e) {
    $("#roster").innerHTML = `<div class="notice warn">${esc(e.message)}</div>`;
    return;
  }
  const { settings, players, totals } = data;
  applyBrand(settings);
  document.title = `${settings.teamName} Fundraiser`;

  if (!settings.donateReady || params.has("soon")) $("#soon").classList.remove("hidden");

  $("#tagline").textContent = settings.tagline;
  $("#story").textContent = settings.story;
  $("#raised").textContent = fmtMoney(settings.raised);
  $("#goal").textContent = fmtMoney(settings.goal);
  const pct = setBar($("#bar"), settings.raised, settings.goal);
  $("#barWrap").setAttribute("aria-valuenow", pct);
  $("#pct").textContent = `${pct}% there`;
  $("#ends").textContent = daysLeft(settings.endDate) > 0 ? `Ends ${endLabel(settings.endDate)}` : "Fundraiser has ended";
  startCountdown($("#countdown"), settings.endDate);
  $("#sDonate").textContent = fmtNum(totals.donate);
  $("#sShare").textContent = fmtNum(totals.share);
  $("#sPlayers").textContent = fmtNum(players.length);

  // Roster
  $("#roster").innerHTML = players.length
    ? players.map((p) => `
      <a class="glass player-card" href="/p/${esc(p.slug)}">
        ${photoHtml(p.photo, p.name, p.number)}
        <h3>${esc(p.name)}</h3>
        <div class="meta">${esc(p.position || "Lady Bronco")}</div>
        <div class="cta">Support ${esc(p.first)} →</div>
      </a>`).join("")
    : `<div class="glass card"><p class="muted" style="margin:0">Player pages are on the way. You can still give to the whole team with the Donate button above.</p></div>`;

  // Leaderboard: dollars when the coach has entered them, otherwise donation clicks.
  const useDollars = players.some((p) => p.raised > 0);
  if (useDollars) $("#leaderNote").textContent = "Ranked by dollars raised, updated by the coach from school reports.";
  const ranked = [...players]
    .sort((a, b) => (useDollars ? b.raised - a.raised : 0) || b.stats.donate - a.stats.donate || b.stats.share - a.stats.share)
    .slice(0, 10);
  $("#leaderboard").innerHTML = ranked.length
    ? ranked.map((p, i) => `
      <li>
        <span class="rank">${i + 1}</span>
        ${avatarHtml(p.photo, p.name)}
        <a href="/p/${esc(p.slug)}">${esc(p.name)}</a>
        <span class="score">${useDollars ? fmtMoney(p.raised) : fmtNum(p.stats.donate)}<small>${useDollars ? "raised" : "supporters"}</small></span>
      </li>`).join("")
    : `<li style="grid-template-columns:1fr"><span class="muted">The leaderboard fills in as players share their pages.</span></li>`;

  // Share
  const url = location.origin + "/";
  renderShare($("#shareBox"), {
    url,
    slug: "team",
    subject: `Support the ${settings.schoolName} ${settings.teamName}`,
    message: `Please support the ${settings.schoolName} ${settings.teamName}! We are raising ${fmtMoney(settings.goal)} for our season and every gift goes straight to our school:`,
  });
})();
