// Sponsor levels. Edit prices and benefits here; the page and form update automatically.
const SPONSOR_LEVELS = [
  {
    key: "backer", name: "Bronco Backer", price: 750,
    perks: ["Your name and link on our website sponsor wall", "PA thank you at a home game", "Thank you post on team social media", "Framed team photo certificate"],
  },
  {
    key: "stallion", name: "Stallion Partner", price: 1500,
    perks: ["Your logo on our game day entry banner", "PA mention at every home game", "Two social posts, including a player spotlight presented by you", "Your logo on the Team Store sponsor strip"],
  },
  {
    key: "herd", name: "Herd Champion", price: 2500, featured: true, page: 2,
    perks: ["Large logo on the entry banner", "Your logo on the back of our warmup shooting shirts", "A home game presented by your business with halftime recognition", "Featured entry banner spot that night", "Player shout out reel on Instagram", "Four season passes (if the school allows)"],
  },
  {
    key: "title", name: "Horsepower Title Sponsor", price: 5000, limit: "Only 2 available", page: 3,
    perks: ["Business Day: our players visit and we make a 60 second ad plus three clips for you", "Top logo spot on the entry banner and shooting shirts", "Senior Night or a holiday tournament named for you", "Homepage feature on our fundraiser site", "Framed jersey signed by the team"],
  },
];

(async function () {
  // Level cards and form options
  $("#levelCards").innerHTML = SPONSOR_LEVELS.map((l, i) => `
    <div class="glass level ${l.featured ? "featured" : ""}">
      ${l.featured ? '<span class="pill red level-tag">Most popular</span>' : ""}${l.limit ? `<span class="pill warn level-tag">${esc(l.limit)}</span>` : ""}
      <h3>${esc(l.name)}</h3>
      <div class="level-price">${fmtMoney(l.price)}</div>
      ${i ? `<p class="muted level-inc">Everything in ${esc(SPONSOR_LEVELS[i - 1].name)}, plus:</p>` : ""}
      <ul>${l.perks.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      ${l.page ? `<a class="level-more" href="/sponsor-packet.pdf#page=${l.page}" target="_blank" rel="noopener">Full details (PDF page ${l.page})</a>` : ""}
      <button class="btn ${l.featured ? "btn-primary" : "btn-glass"}" data-pick="${l.key}">Choose ${esc(l.name)}</button>
    </div>`).join("");
  $("#spLevel").innerHTML = SPONSOR_LEVELS.map((l) => `<option value="${l.key}">${esc(l.name)} (${fmtMoney(l.price)})</option>`).join("")
    + '<option value="backer" data-unsure="1">Not sure yet</option>';
  $("#levelCards").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pick]");
    if (!b) return;
    $("#spLevel").value = b.dataset.pick;
    $("#join").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => $("#spBusiness").focus(), 400);
  });

  // Sponsor wall and payment link
  try {
    const data = await api("/api/sponsors");
    if (data.payUrl) $("#payOnline").href = data.payUrl; else $("#payOnline").classList.add("hidden");
    $("#wall").innerHTML = data.sponsors.length
      ? data.sponsors.map((s) => {
        const inner = s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.business)}">` : `<span class="wall-name">${esc(s.business)}</span>`;
        const body = `<div class="wall-logo">${inner}</div><b>${esc(s.business)}</b><small>${esc(s.levelName)}</small>`;
        return s.website
          ? `<a class="wall-item lvl-${s.level}" href="${esc(s.website)}" target="_blank" rel="noopener sponsored">${body}</a>`
          : `<div class="wall-item lvl-${s.level}">${body}</div>`;
      }).join("")
      : '<p class="muted" style="margin:0">Be the first business to join our sponsor wall this season!</p>';
  } catch {
    $("#wall").innerHTML = '<p class="muted" style="margin:0">Our sponsor wall is loading slowly. Please refresh.</p>';
    $("#payOnline").classList.add("hidden");
  }

  // Interest form
  $("#sponsorForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#spErr").textContent = "";
    const btn = $("#spGo");
    btn.disabled = true;
    try {
      const unsure = $("#spLevel").selectedOptions[0]?.dataset.unsure;
      await api("/api/sponsor", { method: "POST", body: {
        business: $("#spBusiness").value, contact: $("#spContact").value, email: $("#spEmail").value, phone: $("#spPhone").value,
        website: $("#spWebsite").value, level: $("#spLevel").value,
        message: (unsure ? "Not sure which level yet. " : "") + $("#spMessage").value,
        company_hp: $("#spHp").value,
      } });
      $("#sponsorForm").classList.add("hidden");
      $("#spDone").classList.remove("hidden");
    } catch (err) {
      $("#spErr").textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
})();
