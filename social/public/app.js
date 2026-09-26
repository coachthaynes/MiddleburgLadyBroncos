/* Social Scheduler dashboard. Plain JavaScript, no build step.
   Writing rule for all visible text: no hyphens or dashes. */
(function () {
  "use strict";

  var LIMITS = { facebook: 63206, instagram: 2200 };
  var PLATFORM_NAME = { facebook: "Facebook", instagram: "Instagram" };
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  var app = document.getElementById("app");
  var S = { me: null, posts: [], channels: [], settings: { slots: {} }, filter: "scheduled", draft: null };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.h);
    toast.h = setTimeout(function () { t.classList.remove("show"); }, 3200);
  }
  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || "GET", headers: {}, credentials: "same-origin" };
    if (opts.raw) { init.body = opts.raw; init.headers["content-type"] = opts.type; }
    else if (opts.body !== undefined) { init.body = JSON.stringify(opts.body); init.headers["content-type"] = "application/json"; }
    return fetch("/api/" + path, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (r.status === 401 && path !== "login") { S.me.loggedIn = false; render(); }
        if (!r.ok) throw new Error(data.error || "Request failed");
        return data;
      });
    });
  }
  function initials(name) {
    return String(name || "?").replace(/^@/, "").split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();
  }
  function avatar(ch) {
    var style = ch.avatar ? ' style="background-image:url(' + esc(ch.avatar) + ')"' : "";
    return '<span class="avatar ' + esc(ch.platform) + '"' + style + ">" + (ch.avatar ? "" : esc(initials(ch.name))) + "</span>";
  }
  function channelById(id) {
    for (var i = 0; i < S.channels.length; i++) if (S.channels[i].id === id) return S.channels[i];
    return null;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmtTime(d) { return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
  function fmtDay(d) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var that = new Date(d); that.setHours(0, 0, 0, 0);
    var diff = Math.round((that - today) / 864e5);
    var label = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    if (diff === 0) return "Today · " + label;
    if (diff === 1) return "Tomorrow · " + label;
    if (diff === -1) return "Yesterday · " + label;
    return label;
  }
  function toLocalInput(iso) {
    var d = iso ? new Date(iso) : new Date(Date.now() + 3600e3);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function lengthFor(platform, text) { return Array.from(text).length; }

  // Next open queue slot, using the weekly times in Settings.
  function nextSlot(ignoreId) {
    var taken = {};
    S.posts.forEach(function (p) {
      if (p.status === "scheduled" && p.id !== ignoreId) taken[Math.floor(Date.parse(p.scheduledAt) / 60000)] = true;
    });
    var start = Date.now() + 5 * 60000;
    for (var dayOffset = 0; dayOffset < 90; dayOffset++) {
      var day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() + dayOffset);
      var times = (S.settings.slots[day.getDay()] || []).slice().sort();
      for (var i = 0; i < times.length; i++) {
        var hm = times[i].split(":");
        var d = new Date(day); d.setHours(+hm[0], +hm[1], 0, 0);
        if (d.getTime() > start && !taken[Math.floor(d.getTime() / 60000)]) return d;
      }
    }
    return null;
  }

  // Shrink photos to at most 2048px and convert to JPEG (Instagram only accepts JPEG).
  function prepareImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var max = 2048;
        var scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error("Could not read that image")); }, "image/jpeg", 0.88);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Could not read that image")); };
      img.src = url;
    });
  }

  /* ---------- data ---------- */
  function load() {
    return api("state").then(function (d) {
      S.posts = d.posts;
      S.channels = d.channels.sort(function (a, b) { return a.platform.localeCompare(b.platform) || a.name.localeCompare(b.name); });
      S.settings = d.settings;
    });
  }

  /* ---------- routing ---------- */
  function route() {
    var h = (location.hash || "#queue").slice(1);
    var q = h.indexOf("?");
    return { path: (q >= 0 ? h.slice(0, q) : h).split("/"), query: new URLSearchParams(q >= 0 ? h.slice(q + 1) : "") };
  }
  window.addEventListener("hashchange", function () { render(); });

  function shell(active, body) {
    var tabs = [["queue", "Queue"], ["compose", "Create post"], ["channels", "Channels"], ["settings", "Settings"]];
    return '<header class="top"><div class="inner"><div class="brand"><i aria-hidden="true"></i>Social Scheduler</div><nav class="tabs" aria-label="Main">' +
      tabs.map(function (t) { return '<a href="#' + t[0] + '" class="' + (t[0] === active ? "on" : "") + '"' + (t[0] === active ? ' aria-current="page"' : "") + ">" + t[1] + "</a>"; }).join("") +
      '</nav><button class="btn small" data-act="logout">Sign out</button></div></header><main>' + body + "</main>";
  }

  function render() {
    if (!S.me) return;
    if (!S.me.loggedIn) return renderLogin();
    var r = route();
    var page = r.path[0] || "queue";
    if (page === "compose") renderCompose(r.path[1]);
    else if (page === "channels") renderChannels(r.query);
    else if (page === "settings") renderSettings();
    else renderQueue();
  }

  /* ---------- login ---------- */
  function renderLogin() {
    app.innerHTML = '<div class="login"><div class="card"><h1>Social Scheduler</h1>' +
      (S.me.passwordSet ? "" : '<div class="notice warn">No admin password is set yet. Add ADMIN_PASSWORD in your Netlify environment variables, then redeploy.</div>') +
      '<form id="login"><label class="field" for="pw">Password</label><input type="password" id="pw" autocomplete="current-password" required>' +
      '<div class="row" style="margin-top:16px"><button class="btn primary" type="submit">Sign in</button></div><div id="loginErr"></div></form></div></div>';
    var form = document.getElementById("login");
    document.getElementById("pw").focus();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      api("login", { method: "POST", body: { password: document.getElementById("pw").value } })
        .then(function () { S.me.loggedIn = true; return load(); })
        .then(render)
        .catch(function (err) { document.getElementById("loginErr").innerHTML = '<div class="notice bad">' + esc(err.message) + "</div>"; });
    });
  }

  /* ---------- queue ---------- */
  var FILTERS = [
    ["scheduled", "Queue", function (p) { return p.status === "scheduled" || p.status === "publishing"; }],
    ["draft", "Drafts", function (p) { return p.status === "draft"; }],
    ["sent", "Sent", function (p) { return p.status === "published"; }],
    ["failed", "Needs attention", function (p) { return p.status === "failed" || p.status === "partial"; }]
  ];

  function postTime(p) {
    return Date.parse(p.status === "published" || p.status === "failed" || p.status === "partial" ? (p.publishedAt || p.updatedAt) : (p.scheduledAt || p.updatedAt));
  }

  function renderQueue() {
    var f = FILTERS.filter(function (x) { return x[0] === S.filter; })[0] || FILTERS[0];
    var list = S.posts.filter(f[2]).sort(function (a, b) {
      return f[0] === "scheduled" ? postTime(a) - postTime(b) : postTime(b) - postTime(a);
    });
    var html = '<div class="row spread"><div><h1>Posts</h1><p class="sub">' +
      (S.channels.length ? S.channels.length + " channel" + (S.channels.length === 1 ? "" : "s") + " connected. Scheduled posts publish automatically." : 'No channels yet. <a href="#channels">Connect an account</a> to start publishing.') +
      '</p></div><a class="btn primary" href="#compose">Create post</a></div>';
    html += '<div class="filters" role="tablist">' + FILTERS.map(function (x) {
      var n = S.posts.filter(x[2]).length;
      return '<button role="tab" aria-selected="' + (x[0] === f[0]) + '" class="' + (x[0] === f[0] ? "on" : "") + '" data-filter="' + x[0] + '">' + x[1] + '<span class="n">' + n + "</span></button>";
    }).join("") + "</div>";

    if (!list.length) {
      var msg = { scheduled: "Nothing in the queue. Create a post and pick Add to queue.", draft: "No drafts saved.", sent: "Nothing published yet.", failed: "All clear. No failed posts." }[f[0]];
      html += '<div class="card empty">' + msg + "</div>";
    } else {
      var lastDay = "";
      list.forEach(function (p) {
        var t = postTime(p);
        var day = f[0] === "draft" ? "Drafts" : fmtDay(new Date(t));
        if (day !== lastDay) { html += '<div class="day">' + esc(day) + "</div>"; lastDay = day; }
        html += postCard(p, t);
      });
    }
    app.innerHTML = shell("queue", html);
  }

  function postCard(p, t) {
    var chs = (p.channels || []).map(function (id) {
      var c = channelById(id);
      return c ? '<span class="pbadge ' + c.platform + '" title="' + esc(c.name) + '">' + esc(c.name) + "</span>" : '<span class="pbadge" style="background:var(--muted)">Removed channel</span>';
    }).join("");
    var results = "";
    if (p.results && Object.keys(p.results).length && p.status !== "scheduled") {
      results = '<div class="results">' + Object.keys(p.results).map(function (id) {
        var r = p.results[id];
        var c = channelById(id);
        var name = c ? PLATFORM_NAME[c.platform] + " " + c.name : id;
        if (r.status === "published") return "<div>✓ " + esc(name) + (r.url ? ' · <a href="' + esc(r.url) + '" target="_blank" rel="noopener">View post</a>' : "") + "</div>";
        return '<div class="err">✗ ' + esc(name) + ": " + esc(r.error) + "</div>";
      }).join("") + "</div>";
    }
    var editable = p.status !== "publishing" && p.status !== "published";
    var actions = [];
    if (editable) actions.push('<a class="btn small" href="#compose/' + esc(p.id) + '">Edit</a>');
    if (p.status === "published") actions.push('<button class="btn small" data-act="duplicate" data-id="' + esc(p.id) + '">Duplicate</button>');
    if (p.status === "scheduled" || p.status === "draft") actions.push('<button class="btn small" data-act="now" data-id="' + esc(p.id) + '">Post now</button>');
    if (p.status === "failed" || p.status === "partial") actions.push('<button class="btn small" data-act="now" data-id="' + esc(p.id) + '">Retry</button>');
    if (p.status !== "publishing") actions.push('<button class="btn small danger" data-act="delete" data-id="' + esc(p.id) + '">Delete</button>');
    var statusLabel = { scheduled: "Scheduled", publishing: "Publishing", draft: "Draft", published: "Published", failed: "Failed", partial: "Partly failed" }[p.status] || p.status;
    return '<article class="post"><div><div class="time">' + (p.status === "draft" ? "Draft" : esc(fmtTime(new Date(t)))) + "</div>" +
      (p.mediaId ? '<img class="thumb" alt="" src="/media/' + esc(p.mediaId) + '.jpg" style="margin-top:8px">' : "") + "</div>" +
      '<div><div class="text">' + (esc(p.text) || '<span class="hint">No text</span>') + '</div><div class="meta"><span class="status ' + esc(p.status) + '">' + esc(statusLabel) + "</span>" + chs + "</div>" + results + "</div>" +
      '<div class="actions">' + actions.join("") + "</div></article>";
  }

  /* ---------- composer ---------- */
  function blankDraft() {
    return { id: null, text: "", channels: S.channels.map(function (c) { return c.id; }), mediaId: null, link: "", when: "queue", at: null };
  }

  function renderCompose(id) {
    if (!S.draft || S.draft.id !== (id || null)) {
      var existing = id ? S.posts.filter(function (p) { return p.id === id; })[0] : null;
      if (id && !existing) { location.hash = "#queue"; return; }
      S.draft = existing ? {
        id: existing.id, text: existing.text || "", channels: (existing.channels || []).slice(),
        mediaId: existing.mediaId || null, link: existing.link || "",
        when: existing.status === "scheduled" ? "custom" : "queue", at: existing.scheduledAt || null
      } : blankDraft();
    }
    var d = S.draft;
    var chips = S.channels.length ? S.channels.map(function (c) {
      var on = d.channels.indexOf(c.id) >= 0;
      return '<button type="button" class="chip ' + (on ? "on" : "") + '" aria-pressed="' + on + '" data-chan="' + esc(c.id) + '">' + avatar(c) + esc(c.name) + "</button>";
    }).join("") : '<p class="hint">No channels connected. <a href="#channels">Connect Facebook and Instagram.</a></p>';

    var slot = nextSlot(d.id);
    var html = "<h1>" + (d.id ? "Edit post" : "Create post") + '</h1><p class="sub">Write once, publish everywhere you pick.</p><div class="grid2"><div class="card">' +
      '<label class="field">Post to</label><div class="chips">' + chips + "</div>" +
      '<label class="field" for="text">Text</label><textarea id="text" placeholder="What do you want to share?">' + esc(d.text) + "</textarea>" +
      '<div class="counters" id="counters"></div>' +
      '<label class="field">Image</label><div class="media">' +
      (d.mediaId ? '<img class="thumb" alt="Attached image" src="/media/' + esc(d.mediaId) + '.jpg"><button class="btn small danger" type="button" data-act="removeImage">Remove image</button>'
        : '<label class="drop" id="drop" tabindex="0">Drop a photo here or click to choose<br><span class="hint">JPEG or PNG. Required for Instagram.</span><input type="file" id="file" accept="image/jpeg,image/png" hidden></label>') +
      "</div>" +
      '<label class="field" for="link">Link for Facebook (optional)</label><input type="url" id="link" placeholder="https://" value="' + esc(d.link) + '">' +
      '<label class="field">When</label><div class="row">' +
      '<label class="row" style="gap:6px"><input type="radio" name="when" value="queue"' + (d.when === "queue" ? " checked" : "") + "> Next queue slot" + (slot ? ' <span class="hint">(' + esc(slot.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })) + ")</span>" : "") + "</label>" +
      '<label class="row" style="gap:6px"><input type="radio" name="when" value="custom"' + (d.when === "custom" ? " checked" : "") + "> Pick a time</label></div>" +
      (d.when === "custom" ? '<input type="datetime-local" id="at" style="margin-top:8px;max-width:260px" value="' + esc(toLocalInput(d.at)) + '">' : "") +
      '<div id="warnings"></div>' +
      '<div class="row" style="margin-top:18px">' +
      '<button class="btn primary" type="button" data-act="schedule">' + (d.when === "queue" ? "Add to queue" : "Schedule") + "</button>" +
      '<button class="btn" type="button" data-act="postNow">Post now</button>' +
      '<button class="btn" type="button" data-act="saveDraft">Save draft</button>' +
      '<a class="btn" href="#queue" data-act="cancel">Cancel</a></div></div>' +
      '<div><h2>Preview</h2><div id="previews"></div></div></div>';
    app.innerHTML = shell("compose", html);
    wireCompose();
    refreshCompose();
  }

  function selectedPlatforms() {
    var out = [];
    S.draft.channels.forEach(function (id) { var c = channelById(id); if (c && out.indexOf(c.platform) < 0) out.push(c.platform); });
    return out;
  }
  function textFor(platform) {
    var d = S.draft;
    return d.text;
  }

  function problems() {
    var d = S.draft, out = [];
    if (!d.channels.length) out.push("Pick at least one channel.");
    selectedPlatforms().forEach(function (p) {
      var len = lengthFor(p, textFor(p));
      if (len > LIMITS[p]) out.push(PLATFORM_NAME[p] + " text is " + (len - LIMITS[p]) + " characters too long.");
    });
    if (selectedPlatforms().indexOf("instagram") >= 0 && !d.mediaId) out.push("Instagram needs an image.");
    if (!d.text.trim() && !d.mediaId) out.push("Add some text or an image.");
    return out;
  }

  function refreshCompose() {
    var d = S.draft;
    var plats = selectedPlatforms();
    var counters = document.getElementById("counters");
    if (counters) counters.innerHTML = plats.map(function (p) {
      var left = LIMITS[p] - lengthFor(p, textFor(p));
      return "<span" + (left < 0 ? ' class="over"' : "") + ">" + PLATFORM_NAME[p] + ": " + left + " left</span>";
    }).join("");
    var probs = problems();
    var w = document.getElementById("warnings");
    if (w) w.innerHTML = probs.length && (d.text || d.mediaId) ? '<div class="notice warn">' + probs.map(esc).join("<br>") + "</div>" : "";
    var prev = document.getElementById("previews");
    if (!prev) return;
    if (!plats.length) { prev.innerHTML = '<div class="card empty">Pick a channel to see a preview.</div>'; return; }
    prev.innerHTML = plats.map(function (p) {
      var ch = channelById(d.channels.filter(function (id) { var c = channelById(id); return c && c.platform === p; })[0]);
      var img = d.mediaId ? '<img alt="" src="/media/' + esc(d.mediaId) + '.jpg">' : "";
      var head = '<div class="ph">' + avatar(ch) + esc(ch.name) + '<span class="pbadge ' + p + '" style="margin-left:auto">' + PLATFORM_NAME[p] + "</span></div>";
      var text = '<div class="pt">' + (esc(textFor(p)) || '<span class="hint">Your text appears here</span>') + "</div>";
      return '<div class="preview ' + p + '">' + head + (p === "instagram" ? (img || '<div class="empty">Image required</div>') + text : text + img) + "</div>";
    }).join("");
  }

  function wireCompose() {
    var ta = document.getElementById("text");
    ta.addEventListener("input", function () { S.draft.text = ta.value; refreshCompose(); });
    document.getElementById("link").addEventListener("input", function (e) { S.draft.link = e.target.value; });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="when"]'), function (r) {
      r.addEventListener("change", function () { S.draft.when = r.value; renderCompose(S.draft.id); });
    });
    var at = document.getElementById("at");
    if (at) at.addEventListener("change", function () { S.draft.at = at.value ? new Date(at.value).toISOString() : null; });
    var file = document.getElementById("file");
    var drop = document.getElementById("drop");
    if (file) {
      file.addEventListener("change", function () { if (file.files[0]) upload(file.files[0]); });
      drop.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); file.click(); } });
      drop.addEventListener("dragover", function (e) { e.preventDefault(); drop.style.borderColor = "var(--accent)"; });
      drop.addEventListener("dragleave", function () { drop.style.borderColor = ""; });
      drop.addEventListener("drop", function (e) { e.preventDefault(); if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]); });
    }
  }

  function upload(f) {
    if (!/^image\//.test(f.type)) return toast("Choose an image file.");
    toast("Uploading image…");
    prepareImage(f)
      .then(function (blob) { return api("media", { method: "POST", raw: blob, type: "image/jpeg" }); })
      .then(function (r) { S.draft.mediaId = r.id; renderCompose(S.draft.id); toast("Image added"); })
      .catch(function (e) { toast(e.message); });
  }

  function draftPayload(status) {
    var d = S.draft;
    var body = { text: d.text, channels: d.channels, mediaId: d.mediaId, link: d.link.trim(), status: status };
    if (status === "scheduled") {
      if (d.when === "queue") {
        var slot = nextSlot(d.id);
        if (!slot) throw new Error("No open queue slots. Add times in Settings or pick a time.");
        body.scheduledAt = slot.toISOString();
      } else {
        var at = document.getElementById("at");
        var when = at && at.value ? new Date(at.value) : null;
        if (!when || isNaN(when)) throw new Error("Pick a date and time.");
        if (when.getTime() < Date.now() - 60000) throw new Error("That time has already passed.");
        body.scheduledAt = when.toISOString();
      }
    }
    return body;
  }

  function savePost(status, then) {
    try {
      if (status !== "draft") { var probs = problems(); if (probs.length) throw new Error(probs[0]); }
      var body = draftPayload(status);
      var req = S.draft.id ? api("posts/" + S.draft.id, { method: "PUT", body: body }) : api("posts", { method: "POST", body: body });
      return req.then(function (p) {
        upsert(p);
        S.draft = null;
        return then ? then(p) : p;
      }).catch(function (e) { toast(e.message); });
    } catch (e) { toast(e.message); }
  }

  function upsert(p) {
    var i = S.posts.findIndex(function (x) { return x.id === p.id; });
    if (i >= 0) S.posts[i] = p; else S.posts.push(p);
  }

  function publishNow(id) {
    toast("Publishing…");
    return api("posts/" + id + "/publish", { method: "POST" }).then(function (p) {
      upsert(p);
      S.filter = p.status === "published" ? "sent" : "failed";
      toast(p.status === "published" ? "Published!" : "Some channels failed. See details.");
      if (location.hash !== "#queue") location.hash = "#queue"; else render();
    }).catch(function (e) { toast(e.message); });
  }

  /* ---------- channels ---------- */
  function renderChannels(q) {
    var msg = "";
    if (q.get("connected")) msg = '<div class="notice good">Connected ' + esc(q.get("connected")) + " account" + (q.get("connected") === "1" ? "" : "s") + ".</div>";
    if (q.get("error")) msg = '<div class="notice bad">' + esc(q.get("error")) + "</div>";
    var p = S.me.providers || {};
    var html = '<h1>Channels</h1><p class="sub">Connect the accounts you want to publish to.</p>' + msg +
      '<div class="connect" style="margin-top:16px">' +
      connectCard("meta", "Facebook and Instagram", "Connects your Facebook Pages and any Instagram professional accounts linked to them.", p.meta) +
      '</div><div class="card" style="margin-top:20px"><h2>Connected</h2>' +
      (S.channels.length ? S.channels.map(function (c) {
        return '<div class="channel">' + avatar(c) + '<div class="grow"><div style="font-weight:600">' + esc(c.name) + '</div><div class="hint">' + PLATFORM_NAME[c.platform] +
          (c.connectedAt ? " · connected " + esc(new Date(c.connectedAt).toLocaleDateString()) : "") + '</div></div><button class="btn small danger" data-act="disconnect" data-id="' + esc(c.id) + '">Disconnect</button></div>';
      }).join("") : '<p class="hint">Nothing connected yet.</p>') + "</div>";
    app.innerHTML = shell("channels", html);
  }
  function connectCard(provider, title, text, ready) {
    return '<div class="card"><h2>' + title + '</h2><p class="hint" style="margin:0 0 14px">' + text + "</p>" +
      (ready ? '<a class="btn primary" href="/oauth/' + provider + '/start">Connect</a>'
        : '<div class="notice warn" style="margin:0">App keys are not set on the server yet. See the setup guide in README.md.</div>') + "</div>";
  }

  /* ---------- settings ---------- */
  function renderSettings() {
    var slots = S.settings.slots || {};
    var html = '<h1>Settings</h1><p class="sub">Posting schedule for the queue, in your local time (' + esc(Intl.DateTimeFormat().resolvedOptions().timeZone) + ').</p><div class="card"><h2>Queue times</h2>' +
      [1, 2, 3, 4, 5, 6, 0].map(function (day) {
        var times = (slots[day] || []).slice().sort();
        return '<div class="slotday"><strong>' + DAYS[day] + '</strong><div class="row">' +
          times.map(function (t) {
            var hm = t.split(":"); var d = new Date(); d.setHours(+hm[0], +hm[1]);
            return '<span class="slot">' + esc(fmtTime(d)) + '<button aria-label="Remove ' + esc(fmtTime(d)) + '" data-act="rmSlot" data-day="' + day + '" data-time="' + esc(t) + '">×</button></span>';
          }).join("") +
          '<input type="time" aria-label="New time for ' + DAYS[day] + '" data-newslot="' + day + '"><button class="btn small" data-act="addSlot" data-day="' + day + '">Add</button></div></div>';
      }).join("") + "</div>";
    app.innerHTML = shell("settings", html);
  }
  function saveSlots(slots) {
    api("settings", { method: "PUT", body: { slots: slots } }).then(function (s) { S.settings = s; render(); toast("Saved"); }).catch(function (e) { toast(e.message); });
  }

  /* ---------- click actions ---------- */
  document.addEventListener("click", function (e) {
    var chip = e.target.closest("[data-chan]");
    if (chip) {
      var id = chip.getAttribute("data-chan");
      var i = S.draft.channels.indexOf(id);
      if (i >= 0) S.draft.channels.splice(i, 1); else S.draft.channels.push(id);
      renderCompose(S.draft.id);
      return;
    }
    var f = e.target.closest("[data-filter]");
    if (f) { S.filter = f.getAttribute("data-filter"); render(); return; }
    var a = e.target.closest("[data-act]");
    if (!a) return;
    var act = a.getAttribute("data-act");
    var pid = a.getAttribute("data-id");
    if (act === "logout") {
      api("logout", { method: "POST" }).then(function () { S.me.loggedIn = false; render(); });
    } else if (act === "cancel") {
      S.draft = null;
    } else if (act === "removeImage") {
      S.draft.mediaId = null; renderCompose(S.draft.id);
    } else if (act === "schedule") {
      savePost("scheduled", function (p) {
        toast("Scheduled for " + new Date(p.scheduledAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }));
        S.filter = "scheduled"; location.hash = "#queue";
      });
    } else if (act === "saveDraft") {
      savePost("draft", function () { toast("Draft saved"); S.filter = "draft"; location.hash = "#queue"; });
    } else if (act === "postNow") {
      var probs = problems();
      if (probs.length) return toast(probs[0]);
      if (!confirm("Publish this post now to the selected channels?")) return;
      savePost("draft", function (p) { return publishNow(p.id); });
    } else if (act === "now") {
      if (!confirm("Publish this post now?")) return;
      publishNow(pid);
    } else if (act === "delete") {
      if (!confirm("Delete this post?")) return;
      api("posts/" + pid, { method: "DELETE" }).then(function () {
        S.posts = S.posts.filter(function (p) { return p.id !== pid; }); render(); toast("Deleted");
      }).catch(function (err) { toast(err.message); });
    } else if (act === "duplicate") {
      var src = S.posts.filter(function (p) { return p.id === pid; })[0];
      S.draft = { id: null, text: src.text, channels: src.channels.slice(), mediaId: src.mediaId, link: src.link || "", when: "queue", at: null };
      location.hash = "#compose";
    } else if (act === "disconnect") {
      if (!confirm("Disconnect this account? Scheduled posts for it will fail until it is reconnected.")) return;
      api("channels/" + encodeURIComponent(pid), { method: "DELETE" }).then(function () {
        S.channels = S.channels.filter(function (c) { return c.id !== pid; }); render(); toast("Disconnected");
      });
    } else if (act === "addSlot" || act === "rmSlot") {
      var day = a.getAttribute("data-day");
      var slots = JSON.parse(JSON.stringify(S.settings.slots || {}));
      slots[day] = slots[day] || [];
      if (act === "addSlot") {
        var input = document.querySelector('[data-newslot="' + day + '"]');
        if (!input.value) return toast("Pick a time first");
        if (slots[day].indexOf(input.value) < 0) slots[day].push(input.value);
      } else {
        slots[day] = slots[day].filter(function (t) { return t !== a.getAttribute("data-time"); });
      }
      saveSlots(slots);
    }
  });

  // Keep the queue fresh while the tab is open so published posts move to Sent.
  setInterval(function () {
    if (S.me && S.me.loggedIn && document.visibilityState === "visible" && route().path[0] !== "compose") load().then(render).catch(function () {});
  }, 60000);

  fetch("/api/me", { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (me) {
    S.me = me;
    return me.loggedIn ? load() : null;
  }).then(render).catch(function () {
    app.innerHTML = '<div class="boot">Could not reach the server. Is the site deployed with its functions?</div>';
  });
})();
