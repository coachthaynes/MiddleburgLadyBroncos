(function () {
  "use strict";

  var LESSONS = window.LESSONS || [];
  var HANDOUTS = window.HANDOUTS || {};
  var GROCERIES = window.GROCERIES || [];
  var app = document.getElementById("app");

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function money(n, cents) {
    var sign = n < 0 ? "minus " : "";
    var v = Math.abs(n);
    return sign + "$" + v.toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
  }
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function parseDate(iso) {
    var p = iso.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function longDate(iso) {
    var d = parseDate(iso);
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()] + ", " +
      ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getMonth()] +
      " " + d.getDate() + ", " + d.getFullYear();
  }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem("lsmc." + key));
      localStorage.setItem("lsmc." + key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  function totalMin(l) { return l.agenda.reduce(function (a, b) { return a + b.min; }, 0); }

  var ICONS = {
    play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    link: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
    chev: '<svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    ball: '<svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="var(--accent)"/><g fill="none" stroke="var(--band)" stroke-width="1.8"><path d="M2 20h36M20 2v36"/><path d="M7 7c5 4 7 8.5 7 13s-2 9-7 13"/><path d="M33 7c-5 4-7 8.5-7 13s2 9 7 13"/></g></svg>'
  };

  /* ---------- routing ---------- */
  function route() {
    var h = (location.hash || "").replace("#", "");
    var m = /^s(\d{1,2})$/.exec(h);
    closePresenter();
    if (m) {
      var l = LESSONS.filter(function (x) { return x.num === +m[1]; })[0];
      if (l) { renderLesson(l); window.scrollTo(0, 0); return; }
    }
    if (h === "" || h === "home" || !m) {
      renderHome();
      if (h && h !== "home" && document.getElementById(h)) document.getElementById(h).scrollIntoView();
      else window.scrollTo(0, 0);
    }
  }
  window.addEventListener("hashchange", route);

  /* ---------- home ---------- */
  function renderHome() {
    document.title = "Bronco Life Skills";
    var done = store("done") || {};
    var doneCount = LESSONS.filter(function (l) { return done[l.id]; }).length;
    var items = [];
    LESSONS.forEach(function (l, i) {
      if (i > 0) {
        var prev = parseDate(LESSONS[i - 1].date), cur = parseDate(l.date);
        var gap = Math.round((cur - prev) / 86400000);
        if (gap > 7) {
          var skip = new Date(prev.getTime() + 7 * 86400000);
          items.push('<li class="sched-break">No session ' + MON[skip.getMonth()] + " " + skip.getDate() + (skip.getMonth() === 10 ? " (Thanksgiving weekend)" : " (holiday break)") + "</li>");
        }
      }
      var d = parseDate(l.date);
      items.push(
        '<li class="sched-item"><a href="#s' + l.num + '">' +
          '<div class="date-block"><div class="dow">' + DOW[d.getDay()] + '</div><div class="md">' + (d.getMonth() + 1) + "/" + d.getDate() + '</div><div class="yr">' + d.getFullYear() + "</div></div>" +
          '<div class="sched-main"><h3><span class="num">' + l.num + ".</span>" + esc(l.title) + "</h3><p>" + esc(l.point) + "</p></div>" +
          '<div class="sched-meta">' +
            (l.presenter && l.presenter !== "Open" ? '<span class="chip presenter">' + esc(l.presenter) + "</span>" : '<span class="chip">Presenter open</span>') +
            '<span class="chip">' + totalMin(l) + " min</span>" +
            (done[l.id] ? '<span class="chip done">Delivered</span>' : "") +
          "</div>" +
        "</a></li>"
      );
    });

    app.innerHTML =
      '<section class="hero"><div class="wrap">' +
        '<div style="display:flex;align-items:center;gap:12px">' + ICONS.ball + '<div class="eyebrow">Middleburg Lady Broncos Basketball</div></div>' +
        "<h1>Life Skills Mentorship</h1>" +
        '<p class="lede">An eleven week series for our players, one topic per week, November 2026 through January 2027. Every session is a complete lesson plan built to run in 20 to 30 minutes: a hook, teaching points, real data, videos, a hands on activity, and a take home challenge.</p>' +
        '<div class="hero-stats">' +
          "<div><b>11</b><span>Sessions</span></div>" +
          "<div><b>20 to 30</b><span>Minutes each</span></div>" +
          "<div><b>11/7 to 1/30</b><span>Saturdays</span></div>" +
          "<div><b>" + doneCount + " of 11</b><span>Delivered</span></div>" +
        "</div>" +
      "</div></section>" +
      '<section class="schedule" id="schedule"><div class="wrap">' +
        '<div class="section-head"><h2>Season Schedule</h2><span class="chip">Tap a session to open the full lesson plan</span></div>' +
        '<ol class="sched-list">' + items.join("") + "</ol>" +
      "</div></section>" +
      '<section><div class="wrap">' +
        '<div class="section-head"><h2>How each lesson is built</h2></div>' +
        '<div class="howto">' +
          "<div><h4>Game plan</h4><p>A minute by minute bar at the top shows exactly how the 20 to 30 minutes are split.</p></div>" +
          "<div><h4>Teach</h4><p>Short, clear talking points for every line item, plus coaching tips for delivering them.</p></div>" +
          "<div><h4>Numbers that matter</h4><p>Real data with sources so players see why it matters.</p></div>" +
          "<div><h4>Watch and resources</h4><p>Video picks to preview before class and trusted websites for deeper learning.</p></div>" +
          "<div><h4>Activity</h4><p>A hands on game or challenge so the lesson sticks, with a built in timer and handouts.</p></div>" +
          "<div><h4>Present mode</h4><p>One click turns the lesson into big, readable slides for a TV or projector.</p></div>" +
        "</div>" +
      "</div></section>";
  }

  /* ---------- lesson ---------- */
  function renderLesson(l) {
    document.title = l.num + ". " + l.title + " | Bronco Life Skills";
    var idx = LESSONS.indexOf(l);
    var prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
    var done = store("done") || {};
    var total = totalMin(l);

    var gp = l.agenda.map(function (a) {
      var isAct = /activity/i.test(a.label);
      return '<div class="gp-seg' + (isAct ? " activity" : "") + '" style="flex:' + a.min + '" title="' + esc(a.label + ": " + a.detail) + '">' +
        '<div class="m">' + a.min + "</div>" +
        '<div class="l">' + esc(a.label) + "</div>" +
        '<div class="d">' + esc(a.detail) + "</div></div>";
    }).join("");

    var toc = [
      ["overview", "Overview"], ["teach", "Teach"], ["terms", "Key terms"], ["data", "Numbers"],
      ["watch", "Watch"], ["activity", "Activity"]
    ];
    if (l.tool || l.tool2) toc.push(["tools", "Tools"]);
    toc.push(["resources", "Resources"], ["coach", "Wrap and coach notes"]);

    var html =
      '<section class="lesson-top"><div class="wrap">' +
        '<div class="crumbs"><div class="left"><a class="btn ghost-dark" href="#schedule">All sessions</a></div>' +
          '<div class="right"><button class="btn primary" id="presentBtn" type="button">' + ICONS.play + "Present</button></div></div>" +
        '<div class="eyebrow">Session ' + l.num + " of 11 · " + esc(longDate(l.date)) + "</div>" +
        "<h1>" + esc(l.title) + "</h1>" +
        '<div class="meta"><span>Presenter: <b>' + esc(l.presenter === "Open" ? "Open, not yet assigned" : l.presenter) + "</b></span><span>Length: <b>" + total + " minutes</b></span><span>Activity: <b>" + esc(l.activity.name) + "</b></span></div>" +
        '<p class="point">' + esc(l.point) + "</p>" +
        '<div class="gameplan"><div class="gameplan-label"><span>Game plan</span><span>' + total + " minutes</span></div>" +
        '<div class="gp-bar">' + gp + "</div></div>" +
      "</div></section>" +
      '<div class="wrap lesson-body">' +
        '<nav class="toc" aria-label="Lesson sections"><ol>' +
          toc.map(function (t) { return '<li><a href="#s' + l.num + '" data-jump="' + t[0] + '">' + t[1] + "</a></li>"; }).join("") +
        '</ol><div class="toc-actions"><label class="delivered"><input type="checkbox" id="doneBox"' + (done[l.id] ? " checked" : "") + "> Delivered</label></div></nav>" +
        "<main>" + lessonMain(l) +
          '<nav class="pager">' +
            (prev ? '<a href="#s' + prev.num + '"><small>Previous</small><span>' + prev.num + ". " + esc(prev.title) + "</span></a>" : "") +
            (next ? '<a class="next" href="#s' + next.num + '"><small>Next</small><span>' + next.num + ". " + esc(next.title) + "</span></a>" : '<a class="next" href="#schedule"><small>Series complete</small><span>Back to schedule</span></a>') +
          "</nav>" +
        "</main>" +
      "</div>";

    app.innerHTML = html;

    document.getElementById("presentBtn").addEventListener("click", function () { openPresenter(l); });
    document.getElementById("doneBox").addEventListener("change", function (e) {
      var d = store("done") || {};
      d[l.id] = e.target.checked;
      store("done", d);
    });
    app.querySelectorAll("[data-jump]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var t = document.getElementById(a.getAttribute("data-jump"));
        if (t) t.scrollIntoView({ block: "start" });
      });
    });
    wireCards();
    wireTimer(l);
    if (l.tool) mountTool(l.tool);
    if (l.tool2) mountTool(l.tool2);
  }

  function lessonMain(l) {
    var out = [];

    out.push('<section class="block" id="overview"><h2>Overview</h2>' +
      '<div class="card"><h3 class="eyebrow" style="font-family:var(--body);margin-bottom:10px">By the end, players will be able to</h3><ul class="goals">' +
      l.goals.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="hook" style="margin-top:14px"><div class="eyebrow" style="color:var(--muted)">Open with this · ' + l.agenda[0].min + ' min</div><h3>' + esc(l.hook.title) + "</h3><p>" + esc(l.hook.text) + "</p></div>" +
      "</section>");

    out.push('<section class="block" id="teach"><h2>Teach <span class="tag">' + (l.agenda[1] ? l.agenda[1].min + " MIN" : "") + '</span></h2>' +
      '<p class="intro">Each topic below is one line item from the curriculum. Open a topic to see the talking points. Keep each one to about 2 minutes.</p>' +
      '<div class="teach">' +
      l.sections.map(function (s, i) {
        return "<details" + (i === 0 ? " open" : "") + '><summary><h3><span class="idx">' + (i + 1) + "</span>" + esc(s.title) + "</h3>" + ICONS.chev + "</summary>" +
          '<div class="inner"><ul>' + s.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" +
          (s.tip ? '<div class="tip"><b>Coach tip</b>' + esc(s.tip) + "</div>" : "") +
          "</div></details>";
      }).join("") +
      '</div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="expandAll">Open all topics</button><button class="btn" type="button" id="collapseAll">Close all topics</button></div></section>');

    out.push('<section class="block" id="terms"><h2>Key terms</h2><dl class="terms">' +
      l.terms.map(function (t) { return "<div><dt>" + esc(t.t) + "</dt><dd>" + esc(t.d) + "</dd></div>"; }).join("") +
      "</dl></section>");

    out.push('<section class="block" id="data"><h2>Numbers that matter</h2><p class="intro">Put one of these on the screen during the hook or the teach section. Real numbers make it real.</p><div class="stats">' +
      l.data.map(function (d) {
        return '<div class="stat"><div class="big">' + esc(d.stat) + "</div><p>" + esc(d.text) + '</p><div class="src">Source: ' +
          (d.url ? '<a href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(d.source) + "</a>" : esc(d.source)) + "</div></div>";
      }).join("") + "</div></section>");

    out.push('<section class="block" id="watch"><h2>Watch <span class="tag">' + agendaMin(l, /watch/i) + '</span></h2>' +
      '<p class="intro">Each link opens a focused YouTube search so you can pick the best current video. Preview it before the session and cue up the part you want to show.</p><div class="links">' +
      l.videos.map(function (v) {
        return '<a class="link-row" href="' + esc(v.url) + '" target="_blank" rel="noopener"><span class="ic">' + ICONS.play + '</span><span><div class="t">' + esc(v.title) + '</div><div class="n">' + esc(v.note) + '</div></span><span class="go">' + esc(v.source) + "</span></a>";
      }).join("") + "</div></section>");

    var a = l.activity;
    out.push('<section class="block" id="activity"><h2>Activity</h2>' +
      '<div class="activity"><div class="activity-head"><h3>' + esc(a.name) + '</h3><div class="facts"><span>' + esc(a.time) + "</span><span>" + esc(a.format) + "</span></div></div>" +
      '<div class="activity-body">' +
        '<div class="timer" id="timer"><span class="clock" id="clock">0:00</span>' +
          '<button class="btn primary" type="button" id="tStart">Start</button>' +
          '<button class="btn" type="button" id="tReset">Reset</button>' +
          '<span style="color:var(--muted);font-size:0.9rem">Activity timer</span></div>' +
        "<p>" + esc(a.setup) + "</p>" +
        '<div class="two-col"><div><h4>Materials</h4><ul>' + a.materials.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></div>" +
        "<div><h4>Debrief questions</h4><ul>" + a.debrief.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></div></div>" +
        "<div><h4>Steps</h4><ol class=\"steps\">" + a.steps.map(function (s) { return "<li><span>" + esc(s) + "</span></li>"; }).join("") + "</ol></div>" +
        (a.scenarios ? '<div><h4>Scenario cards</h4><div class="scen">' + a.scenarios.map(function (s) { return "<div>" + esc(s) + "</div>"; }).join("") + "</div></div>" : "") +
        (a.examples ? '<div><h4>Example bullets to show</h4><div class="scen">' + a.examples.map(function (s) { return "<div>" + esc(s) + "</div>"; }).join("") + "</div></div>" : "") +
        (l.handout ? renderHandout(l.handout) : "") +
      "</div></div></section>");

    if (l.tool || l.tool2) {
      out.push('<section class="block" id="tools"><h2>Interactive tools</h2><p class="intro">Put these on the screen and fill them in with the group.</p>' +
        (l.tool ? '<div id="tool-' + l.tool + '"></div>' : "") +
        (l.tool2 ? '<div id="tool-' + l.tool2 + '" style="margin-top:16px"></div>' : "") +
        "</section>");
    }

    out.push('<section class="block" id="resources"><h2>Resources</h2><p class="intro">Trusted sites for you to prepare with and for players who want to go deeper.</p><div class="links">' +
      l.resources.map(function (r) {
        return '<a class="link-row" href="' + esc(r.url) + '" target="_blank" rel="noopener"><span class="ic">' + ICONS.link + '</span><span><div class="t">' + esc(r.title) + '</div><div class="n">' + esc(r.note) + '</div></span><span class="go">Open</span></a>';
      }).join("") + "</div></section>");

    out.push('<section class="block" id="coach"><h2>Wrap and coach notes</h2>' +
      '<div class="takehome"><div class="eyebrow">Take home challenge</div><p>' + esc(l.takeHome) + "</p></div>" +
      '<div class="coach" style="margin-top:16px">' +
        '<div class="card"><h3>Discussion starters</h3><ul>' + l.discussion.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul></div>" +
        '<div class="card"><h3>Coach notes</h3><ul>' + l.coachNotes.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul></div>" +
      "</div></section>");

    return out.join("");
  }

  function agendaMin(l, re) {
    var a = l.agenda.filter(function (x) { return re.test(x.label); })[0];
    return a ? a.min + " MIN" : "";
  }

  /* ---------- handouts ---------- */
  function renderHandout(key) {
    var h = HANDOUTS[key];
    if (!h) return "";
    var body = "";
    if (h.table) {
      body = '<div class="table-scroll"><table><thead><tr>' +
        h.table.head.map(function (c, i) { return "<th" + (i > 1 ? ' class="num"' : "") + ">" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        h.table.rows.map(function (r) {
          var cls = /^Net/.test(r[0]) ? ' class="net"' : (/^(Gross|Total)/.test(r[0]) ? ' class="strong"' : "");
          return "<tr" + cls + ">" + r.map(function (c, i) { return "<td" + (i > 1 ? ' class="num"' : "") + ">" + esc(c) + "</td>"; }).join("") + "</tr>";
        }).join("") + "</tbody></table></div>";
    }
    if (h.clauses) {
      body = '<div class="clauses">' + h.clauses.map(function (c) { return "<p>" + esc(c) + "</p>"; }).join("") + "</div>" +
        '<div class="reveal"><button class="btn" type="button" data-toggle="leaseKey">Show answer key</button>' +
        '<div id="leaseKey" hidden><ul>' + h.answers.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div></div>";
    }
    if (h.cards) {
      body = '<div class="cards">' + h.cards.map(function (c) {
        return '<div class="scard"><div>' + esc(c[0]) + '</div><div class="ans"><b>' + esc(c[1]) + "</b>" + (c[2] ? "<div>" + esc(c[2]) + "</div>" : "") + '</div><button class="btn" type="button" data-card>Reveal</button></div>';
      }).join("") + '</div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-allcards="show">Reveal all</button><button class="btn" type="button" data-allcards="hide">Hide all</button></div>';
    }
    if (h.bad) {
      body = '<div class="emails"><div><span class="lbl bad">Before</span><pre>' + esc(h.bad) + '</pre></div>' +
        '<div><span class="lbl good">After (show once pairs finish)</span><div id="goodEmail" hidden><pre>' + esc(h.good) + '</pre></div>' +
        '<button class="btn" type="button" data-toggle="goodEmail" style="margin-top:6px">Show rewritten email</button></div></div>';
    }
    return '<div class="handout"><h3>' + esc(h.title) + "</h3>" + (h.intro ? '<p class="hi">' + esc(h.intro) + "</p>" : "") + body + "</div>";
  }

  function wireCards() {
    app.querySelectorAll("[data-card]").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = b.closest(".scard");
        c.classList.toggle("show");
        b.textContent = c.classList.contains("show") ? "Hide" : "Reveal";
      });
    });
    app.querySelectorAll("[data-allcards]").forEach(function (b) {
      b.addEventListener("click", function () {
        var show = b.getAttribute("data-allcards") === "show";
        app.querySelectorAll(".scard").forEach(function (c) {
          c.classList.toggle("show", show);
          c.querySelector("[data-card]").textContent = show ? "Hide" : "Reveal";
        });
      });
    });
    app.querySelectorAll("[data-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = document.getElementById(b.getAttribute("data-toggle"));
        t.hidden = !t.hidden;
        b.textContent = t.hidden ? b.textContent.replace(/^Hide/, "Show") : b.textContent.replace(/^Show/, "Hide");
      });
    });
    var ex = document.getElementById("expandAll"), co = document.getElementById("collapseAll");
    if (ex) ex.addEventListener("click", function () { app.querySelectorAll(".teach details").forEach(function (d) { d.open = true; }); });
    if (co) co.addEventListener("click", function () { app.querySelectorAll(".teach details").forEach(function (d) { d.open = false; }); });
  }

  /* ---------- timer ---------- */
  var timerHandle = null;
  function wireTimer(l) {
    clearInterval(timerHandle);
    var act = l.agenda.filter(function (x) { return /activity/i.test(x.label); })[0];
    var full = (act ? act.min : 10) * 60;
    var left = full, running = false;
    var clock = document.getElementById("clock"), start = document.getElementById("tStart"), reset = document.getElementById("tReset");
    function draw() {
      var s = Math.abs(left);
      clock.textContent = (left < 0 ? "+" : "") + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
      clock.classList.toggle("over", left < 0);
    }
    function tick() { left -= 1; draw(); }
    start.addEventListener("click", function () {
      running = !running;
      if (running) { timerHandle = setInterval(tick, 1000); start.textContent = "Pause"; }
      else { clearInterval(timerHandle); start.textContent = "Start"; }
    });
    reset.addEventListener("click", function () { clearInterval(timerHandle); running = false; start.textContent = "Start"; left = full; draw(); });
    draw();
  }

  /* ---------- tools ---------- */
  function mountTool(name) {
    var el = document.getElementById("tool-" + name);
    if (!el) return;
    ({ budget: toolBudget, compound: toolCompound, grocery: toolGrocery, decision: toolDecision, profit: toolProfit })[name](el);
  }

  function num(id) { var v = parseFloat(document.getElementById(id).value); return isNaN(v) ? 0 : v; }

  function toolBudget(el) {
    var rows = [
      ["Rent and utilities", 900, "need"], ["Groceries", 300, "need"], ["Car payment, gas, insurance", 350, "need"],
      ["Phone", 60, "need"], ["Eating out", 150, "want"], ["Streaming and subscriptions", 40, "want"],
      ["Clothes and fun", 120, "want"], ["Emergency fund", 200, "save"], ["Retirement or investing", 100, "save"]
    ];
    el.innerHTML = '<div class="tool"><h3>Budget Builder</h3><p class="sub">Example numbers are loaded. Change the take home pay and each line to match a scenario card.</p>' +
      '<div class="field-grid"><div class="field"><label for="b-pay">Monthly take home pay</label><input id="b-pay" type="number" inputmode="decimal" value="2350"></div></div>' +
      '<div class="budget-rows">' + rows.map(function (r, i) {
        return '<div class="budget-row"><input class="inline-input" id="b-n' + i + '" value="' + esc(r[0]) + '" aria-label="Category name">' +
          '<input class="inline-input" id="b-v' + i + '" type="number" inputmode="decimal" value="' + r[1] + '" aria-label="Amount">' +
          '<select class="inline-input" id="b-t' + i + '" aria-label="Type"><option value="need"' + (r[2] === "need" ? " selected" : "") + '>Need</option><option value="want"' + (r[2] === "want" ? " selected" : "") + '>Want</option><option value="save"' + (r[2] === "save" ? " selected" : "") + ">Savings</option></select></div>";
      }).join("") + "</div>" +
      '<div class="results" id="b-res"></div><div class="meter" id="b-meter"></div></div>';
    function calc() {
      var pay = num("b-pay"), t = { need: 0, want: 0, save: 0 };
      rows.forEach(function (r, i) { t[document.getElementById("b-t" + i).value] += num("b-v" + i); });
      var spent = t.need + t.want + t.save, left = pay - spent;
      document.getElementById("b-res").innerHTML =
        res("Take home", money(pay)) + res("Planned", money(spent)) +
        res(left >= 0 ? "Left over" : "Over budget", money(left), left >= 0 ? "good" : "bad");
      var targets = [["Needs", t.need, 50], ["Wants", t.want, 30], ["Savings", t.save, 20]];
      document.getElementById("b-meter").innerHTML = targets.map(function (x) {
        var pct = pay > 0 ? x[1] / pay * 100 : 0;
        return '<div class="meter-row"><span>' + x[0] + '</span><div class="meter-track"><div class="meter-fill" style="width:' + Math.min(pct, 100) + '%"></div><div class="meter-target" style="left:' + x[2] + '%"></div></div><span class="pct">' + Math.round(pct) + "% (goal " + x[2] + "%)</span></div>";
      }).join("") + '<p class="fineprint">The dark line on each bar marks the 50/30/20 guideline.</p>';
    }
    el.addEventListener("input", calc);
    calc();
  }

  function res(k, v, cls) { return '<div class="result' + (cls ? " " + cls : "") + '"><div class="k">' + k + '</div><div class="v">' + v + "</div></div>"; }

  function toolCompound(el) {
    el.innerHTML = '<div class="tool"><h3>Compound Growth</h3><p class="sub">See what starting early is worth. Returns are an assumed average, not a promise.</p>' +
      '<div class="field-grid">' +
        '<div class="field"><label for="c-m">Invest each month</label><input id="c-m" type="number" value="100"></div>' +
        '<div class="field"><label for="c-a">Starting age</label><input id="c-a" type="number" value="18"></div>' +
        '<div class="field"><label for="c-e">Ending age</label><input id="c-e" type="number" value="65"></div>' +
        '<div class="field"><label for="c-r">Yearly return (%)</label><input id="c-r" type="number" step="0.5" value="7"></div>' +
      '</div><div class="results" id="c-res"></div><div class="growth-chart" id="c-chart"></div></div>';
    function fv(m, yrs, r) { var i = r / 100 / 12, n = yrs * 12; return i === 0 ? m * n : m * (Math.pow(1 + i, n) - 1) / i; }
    function calc() {
      var m = num("c-m"), a = num("c-a"), e = num("c-e"), r = num("c-r");
      var yrs = Math.max(0, e - a), late = Math.max(0, yrs - 10);
      var total = fv(m, yrs, r), put = m * 12 * yrs, lateTotal = fv(m, late, r);
      document.getElementById("c-res").innerHTML =
        res("You put in", money(put)) + res("It grows to", money(total), "good") +
        res("Growth from interest", money(total - put)) + res("Start 10 years later", money(lateTotal), "bad");
      drawChart(m, a, yrs, r);
    }
    function drawChart(m, a, yrs, r) {
      var W = 640, H = 220, pl = 64, pr = 12, pt = 12, pb = 28;
      if (yrs < 1) { document.getElementById("c-chart").innerHTML = ""; return; }
      var maxV = fv(m, yrs, r) || 1;
      var x = function (y) { return pl + (W - pl - pr) * y / yrs; };
      var yv = function (v) { return pt + (H - pt - pb) * (1 - v / maxV); };
      var pts = [], cont = [];
      for (var y = 0; y <= yrs; y++) { pts.push(x(y) + "," + yv(fv(m, y, r))); cont.push(x(y) + "," + yv(m * 12 * y)); }
      var area = "M" + x(0) + "," + yv(0) + " L" + pts.join(" L") + " L" + x(yrs) + "," + yv(0) + " Z";
      var grid = "";
      for (var g = 0; g <= 4; g++) {
        var v = maxV * g / 4, gy = yv(v);
        grid += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + gy + '" y2="' + gy + '" stroke="var(--line)" stroke-width="1"/>' +
          '<text x="' + (pl - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + shortMoney(v) + "</text>";
      }
      var ticks = "", step = yrs > 30 ? 10 : 5;
      for (var t = 0; t <= yrs; t += step) ticks += '<text x="' + x(t) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--muted)">Age ' + (a + t) + "</text>";
      var endX = x(yrs), endY = yv(fv(m, yrs, r));
      document.getElementById("c-chart").innerHTML =
        '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Growth of monthly investing over time">' + grid + ticks +
        '<path d="' + area + '" fill="var(--accent)" fill-opacity="0.16"/>' +
        '<polyline points="' + pts.join(" ") + '" fill="none" stroke="var(--accent)" stroke-width="2.5"/>' +
        '<polyline points="' + cont.join(" ") + '" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="5 4"/>' +
        '<circle cx="' + endX + '" cy="' + endY + '" r="4.5" fill="var(--accent)"/></svg>' +
        '<div class="legend"><span><i style="background:var(--accent)"></i>Total value</span><span><i style="background:var(--muted)"></i>Money you put in</span></div>';
    }
    el.addEventListener("input", calc);
    calc();
  }
  function shortMoney(v) {
    if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
    if (v >= 1e3) return "$" + Math.round(v / 1e3) + "K";
    return "$" + Math.round(v);
  }

  function toolGrocery(el) {
    var groups = [];
    GROCERIES.forEach(function (g) { if (groups.indexOf(g.group) < 0) groups.push(g.group); });
    el.innerHTML = '<div class="tool"><h3>$50 Grocery Cart</h3><p class="sub">Sample prices for planning practice. Check what your group needs for 5 dinners.</p>' +
      '<div class="field-grid"><div class="field"><label for="g-budget">Budget</label><input id="g-budget" type="number" value="50"></div></div>' +
      '<div class="grocery-grid">' + groups.map(function (grp) {
        return '<div class="grocery-group">' + esc(grp) + "</div>" + GROCERIES.map(function (g, i) {
          if (g.group !== grp) return "";
          return '<label><input type="checkbox" id="g' + i + '" data-price="' + g.price + '">' + esc(g.item) + '<span class="p">' + money(g.price, true) + "</span></label>";
        }).join("");
      }).join("") + '</div><div class="sticky-total"><div class="results" id="g-res"></div>' +
      '<button class="btn" type="button" id="g-clear" style="margin-top:10px">Clear cart</button></div></div>';
    function calc() {
      var total = 0, count = 0;
      el.querySelectorAll("input[data-price]").forEach(function (c) { if (c.checked) { total += +c.getAttribute("data-price"); count++; } });
      var budget = num("g-budget"), left = budget - total;
      document.getElementById("g-res").innerHTML = res("Items", count) + res("Cart total", money(total, true)) +
        res(left >= 0 ? "Left to spend" : "Over budget", money(left, true), left >= 0 ? "good" : "bad");
    }
    el.addEventListener("input", calc);
    el.addEventListener("change", calc);
    document.getElementById("g-clear").addEventListener("click", function () {
      el.querySelectorAll("input[data-price]").forEach(function (c) { c.checked = false; });
      calc();
    });
    calc();
  }

  function toolDecision(el) {
    var factors = [["Cost", 5, 6, 8], ["Distance from home", 3, 9, 4], ["Playing time", 4, 5, 8], ["Program for my major", 5, 8, 6], ["Gut feeling", 2, 7, 6]];
    el.innerHTML = '<div class="tool"><h3>Decision Matrix</h3><p class="sub">Example: choosing between two colleges. Weight each factor 1 to 5 by how much it matters, then score each option 1 to 10.</p>' +
      '<div class="matrix-scroll"><table class="matrix"><thead><tr><th>Factor</th><th>Weight (1 to 5)</th>' +
      '<th><input class="inline-input" id="d-o1" value="College A" aria-label="Option 1 name"></th>' +
      '<th><input class="inline-input" id="d-o2" value="College B" aria-label="Option 2 name"></th></tr></thead><tbody>' +
      factors.map(function (f, i) {
        return "<tr><td><input class=\"inline-input\" id=\"d-f" + i + "\" value=\"" + esc(f[0]) + "\" aria-label=\"Factor name\"></td>" +
          '<td><input class="inline-input" type="number" min="1" max="5" id="d-w' + i + '" value="' + f[1] + '" aria-label="Weight"></td>' +
          '<td><input class="inline-input" type="number" min="1" max="10" id="d-a' + i + '" value="' + f[2] + '" aria-label="Score for option 1"></td>' +
          '<td><input class="inline-input" type="number" min="1" max="10" id="d-b' + i + '" value="' + f[3] + '" aria-label="Score for option 2"></td></tr>';
      }).join("") +
      '</tbody><tfoot><tr><td colspan="2">Weighted total</td><td id="d-ta"></td><td id="d-tb"></td></tr></tfoot></table></div>' +
      '<p class="fineprint" id="d-msg"></p></div>';
    function calc() {
      var a = 0, b = 0;
      factors.forEach(function (f, i) { var w = num("d-w" + i); a += w * num("d-a" + i); b += w * num("d-b" + i); });
      var ta = document.getElementById("d-ta"), tb = document.getElementById("d-tb");
      ta.textContent = a; tb.textContent = b;
      ta.className = a > b ? "win" : ""; tb.className = b > a ? "win" : "";
      var n1 = document.getElementById("d-o1").value || "Option 1", n2 = document.getElementById("d-o2").value || "Option 2";
      document.getElementById("d-msg").textContent = a === b ? "It is a tie. Look at your highest weighted factor, or sleep on it." :
        (a > b ? n1 : n2) + " scores higher by " + Math.abs(a - b) + " points. Does that match your gut? If not, ask what the matrix is missing.";
    }
    el.addEventListener("input", calc);
    calc();
  }

  function toolProfit(el) {
    el.innerHTML = '<div class="tool"><h3>Profit Calculator</h3><p class="sub">Example: a team car wash. Change the numbers for your own business idea.</p>' +
      '<div class="field-grid">' +
        '<div class="field"><label for="p-price">Price per sale</label><input id="p-price" type="number" step="0.5" value="12"></div>' +
        '<div class="field"><label for="p-unit">Cost per sale (supplies)</label><input id="p-unit" type="number" step="0.25" value="2"></div>' +
        '<div class="field"><label for="p-fixed">Startup costs (one time)</label><input id="p-fixed" type="number" value="120"></div>' +
        '<div class="field"><label for="p-qty">Expected sales</label><input id="p-qty" type="number" value="40"></div>' +
      '</div><div class="results" id="p-res"></div></div>';
    function calc() {
      var price = num("p-price"), unit = num("p-unit"), fixed = num("p-fixed"), qty = num("p-qty");
      var rev = price * qty, cost = fixed + unit * qty, profit = rev - cost, margin = price - unit;
      var be = margin > 0 ? Math.ceil(fixed / margin) : null;
      document.getElementById("p-res").innerHTML =
        res("Revenue", money(rev)) + res("Total costs", money(cost)) +
        res("Profit", money(profit), profit >= 0 ? "good" : "bad") +
        res("Profit per sale", money(margin, true)) +
        res("Break even", be === null ? "Never" : be + " sales", be !== null && be <= qty ? "good" : "bad");
    }
    el.addEventListener("input", calc);
    calc();
  }

  /* ---------- presenter ---------- */
  var pres = null;
  function buildSlides(l) {
    var s = [];
    s.push({ kicker: "Session " + l.num + " · " + longDate(l.date), title: l.title, lead: l.point });
    s.push({ kicker: "Today's goals", title: "By the end of today", list: l.goals });
    s.push({ kicker: "Let's start", title: l.hook.title, lead: l.hook.text });
    l.sections.forEach(function (sec, i) {
      var pts = sec.points;
      for (var k = 0; k < pts.length; k += 5) {
        s.push({ kicker: "Topic " + (i + 1) + " of " + l.sections.length + (pts.length > 5 ? " · part " + (k / 5 + 1) : ""), title: sec.title, list: pts.slice(k, k + 5) });
      }
    });
    l.data.forEach(function (d) { s.push({ kicker: "Numbers that matter", stat: d.stat, lead: d.text, src: d.source }); });
    s.push({ kicker: "Activity · " + l.activity.time, title: l.activity.name, list: l.activity.steps });
    s.push({ kicker: "Talk it over", title: "Debrief", list: l.activity.debrief });
    s.push({ kicker: "This week", title: "Take home challenge", lead: l.takeHome });
    return s;
  }
  function openPresenter(l) {
    var slides = buildSlides(l), i = 0;
    var el = document.createElement("div");
    el.className = "present";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Presentation");
    el.innerHTML = '<div class="present-bar"><span class="ttl">' + esc(l.num + ". " + l.title) + '</span><div style="display:flex;gap:8px"><button class="btn ghost-dark" type="button" data-p="full">Full screen</button><button class="btn ghost-dark" type="button" data-p="close">Exit</button></div></div>' +
      '<div class="present-stage"><div class="slide" id="slide"></div></div>' +
      '<div class="present-foot"><button class="btn ghost-dark" type="button" data-p="prev">Back</button><div class="progress"><div id="pbar"></div></div><span class="count" id="pcount"></span><button class="btn primary" type="button" data-p="next">Next</button></div>';
    document.body.appendChild(el);
    document.body.style.overflow = "hidden";
    function draw() {
      var s = slides[i], h = '<div class="kicker">' + esc(s.kicker) + "</div>";
      if (s.stat) h += '<div class="bigstat">' + esc(s.stat) + "</div>";
      if (s.title) h += "<h2>" + esc(s.title) + "</h2>";
      if (s.lead) h += '<p class="lead">' + esc(s.lead) + "</p>";
      if (s.list) h += "<ul>" + s.list.map(function (x) { return "<li><span>" + esc(x) + "</span></li>"; }).join("") + "</ul>";
      if (s.src) h += '<div class="src">Source: ' + esc(s.src) + "</div>";
      el.querySelector("#slide").innerHTML = h;
      el.querySelector("#pcount").textContent = (i + 1) + " / " + slides.length;
      el.querySelector("#pbar").style.width = ((i + 1) / slides.length * 100) + "%";
      el.querySelector("[data-p=prev]").disabled = i === 0;
      el.querySelector("[data-p=next]").textContent = i === slides.length - 1 ? "Finish" : "Next";
      el.querySelector(".present-stage").scrollTop = 0;
    }
    function go(d) {
      if (i + d >= slides.length) { closePresenter(); return; }
      i = Math.max(0, i + d); draw();
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-p]");
      if (!b) return;
      var a = b.getAttribute("data-p");
      if (a === "next") go(1);
      else if (a === "prev") go(-1);
      else if (a === "close") closePresenter();
      else if (a === "full") {
        try {
          if (document.fullscreenElement) document.exitFullscreen();
          else if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
        } catch (err) { /* optional */ }
      }
    });
    function key(e) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
      else if (e.key === "Escape") closePresenter();
    }
    document.addEventListener("keydown", key);
    pres = { el: el, key: key };
    draw();
    el.querySelector("[data-p=next]").focus();
  }
  function closePresenter() {
    if (!pres) return;
    document.removeEventListener("keydown", pres.key);
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* ignore */ }
    pres.el.remove();
    pres = null;
    document.body.style.overflow = "";
  }

  route();
})();
