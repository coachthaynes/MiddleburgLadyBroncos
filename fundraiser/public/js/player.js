(async function () {
  const slug = (location.pathname.split("/")[2] || new URLSearchParams(location.search).get("p") || "").toLowerCase();
  let data;
  try {
    data = await api(`/api/player/${encodeURIComponent(slug)}`);
  } catch (e) {
    $("#missing").classList.remove("hidden");
    $("#missingMsg").textContent = e.message;
    return;
  }
  const { settings, player: p } = data;
  applyBrand(settings);
  trackViewOnce(p.slug);
  document.title = `Support ${p.name} | ${settings.teamName}`;
  if (!settings.donateReady || new URLSearchParams(location.search).has("soon")) $("#soon").classList.remove("hidden");

  $("#profile").classList.remove("hidden");
  $("#shareSection").classList.remove("hidden");
  $("#photo").innerHTML = photoHtml(p.photo, p.name, p.number);
  $("#name").textContent = p.name;
  $("#meta").textContent = [p.number ? `#${p.number}` : "", p.position, `${settings.schoolName} ${settings.teamName}`].filter(Boolean).join(" · ");
  $("#message").textContent = p.message || `Thank you for supporting me and the ${settings.teamName}! Every gift helps our team cover tournaments, travel and gear this season.`;
  $("#donateBtn").href = `/go/${p.slug}`;
  $("#donateBtn").innerHTML = `${ICONS.heart} Donate to support ${esc(p.first)}`;
  $("#noteName").textContent = p.name;
  $$(".nameFirst").forEach((el) => { el.textContent = p.first; });

  const pct = setBar($("#bar"), settings.raised, settings.goal);
  $("#barWrap").setAttribute("aria-valuenow", pct);
  $("#teamLine").textContent = `Team: ${fmtMoney(settings.raised)} of ${fmtMoney(settings.goal)}`;
  $("#ends").textContent = daysLeft(settings.endDate) > 0 ? `Ends ${endLabel(settings.endDate)}` : "Fundraiser has ended";

  const url = `${location.origin}/p/${p.slug}`;
  renderShare($("#shareBox"), {
    url,
    slug: p.slug,
    subject: `Support ${p.name} and the ${settings.teamName}`,
    message: playerMessage(p.first, settings),
  });

  const toggle = $("#qrToggle");
  toggle.innerHTML = `${ICONS.qr} Show QR code`;
  toggle.addEventListener("click", () => {
    const box = $("#qrBox");
    const open = box.classList.toggle("open");
    toggle.innerHTML = `${ICONS.qr} ${open ? "Hide" : "Show"} QR code`;
    if (open && !$("#qr").innerHTML) makeQr($("#qr"), url);
  });
})();
