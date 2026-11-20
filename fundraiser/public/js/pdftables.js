/* Reads tables out of a PDF in the browser (MaxPreps "Printable stats" PDFs). Copy and paste from a PDF
   drops blank cells, which shifts numbers into the wrong columns, so this lines every value up under its
   column header by position on the page and returns tab separated text with blank cells kept.
   No hyphens or dashes in visible text. */
(function () {
  "use strict";
  var loading = null;
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "/vendor/pdfjs/pdf.min.js";
      s.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.js"; resolve(window.pdfjsLib); };
      s.onerror = function () { loading = null; reject(new Error("Could not load the PDF reader.")); };
      document.head.appendChild(s);
    });
    return loading;
  }

  // Words closer than this (in PDF units) belong to the same cell, like "A." "Mccobb" "(Fr)".
  var JOIN_GAP = 3.5, LINE_GAP = 3;

  function toLines(items) {
    var sorted = items.filter(function (i) { return i.str.trim() !== ""; }).map(function (i) {
      return { str: i.str.trim(), x: i.transform[4], y: i.transform[5], w: i.width || 0 };
    }).sort(function (a, b) { return b.y - a.y || a.x - b.x; });
    var lines = [];
    sorted.forEach(function (it) {
      var line = lines.length && Math.abs(lines[lines.length - 1].y - it.y) <= LINE_GAP ? lines[lines.length - 1] : null;
      if (!line) { line = { y: it.y, items: [] }; lines.push(line); }
      line.items.push(it);
    });
    return lines.map(function (l) {
      var parts = l.items.sort(function (a, b) { return a.x - b.x; }), cells = [];
      parts.forEach(function (p) {
        var last = cells[cells.length - 1];
        if (last && p.x - (last.x + last.w) < JOIN_GAP) { last.str += " " + p.str; last.w = p.x + p.w - last.x; }
        else cells.push({ str: p.str, x: p.x, w: p.w });
      });
      return cells;
    });
  }

  var isHeader = function (cells) {
    var t = cells.map(function (c) { return c.str.toLowerCase(); });
    return t.some(function (s) { return s === "athlete name" || s === "name" || s === "player"; }) && cells.length >= 3;
  };

  // Turns one page's lines into text: table rows as tab separated cells under the last header seen.
  function pageText(lines, state) {
    var out = [];
    lines.forEach(function (cells) {
      if (isHeader(cells)) {
        state.cols = cells.map(function (c) { return c.x; });
        out.push(cells.map(function (c) { return c.str; }).join("\t"));
        return;
      }
      if (!state.cols) { out.push(cells.map(function (c) { return c.str; }).join(" ")); return; }
      var row = state.cols.map(function () { return ""; });
      cells.forEach(function (c) {
        // A value belongs to the rightmost column whose header starts at or before it (allowing a little slack).
        var col = 0;
        for (var i = 0; i < state.cols.length; i++) if (state.cols[i] <= c.x + 6) col = i;
        row[col] = row[col] ? row[col] + " " + c.str : c.str;
      });
      // Section titles and other single words stay as plain lines.
      if (cells.length === 1 && !/^\d/.test(cells[0].str)) { out.push(cells[0].str); return; }
      out.push(row.join("\t"));
    });
    return out.join("\n");
  }

  window.AM = window.AM || {};
  AM.pdfToText = function (file) {
    return Promise.all([loadPdfJs(), file.arrayBuffer()]).then(function (r) {
      return r[0].getDocument({ data: new Uint8Array(r[1]) }).promise;
    }).then(function (pdf) {
      var state = { cols: null }, pages = [];
      var next = function (n) {
        if (n > pdf.numPages) return Promise.resolve(pages.join("\n"));
        return pdf.getPage(n).then(function (page) { return page.getTextContent(); }).then(function (tc) {
          pages.push(pageText(toLines(tc.items), state));
          return next(n + 1);
        });
      };
      return next(1);
    });
  };

  // Hudl Assist Box Score Report: a picture of one team's shot chart from page 1. Each chart sits under a
  // title with the team's name in the right column; the run graph above uses the same names, so the lowest
  // title on the page is the chart's. Both charts are the same size, so the gap between the titles is the height.
  // names: both teams' names as the report prints them; pick: which one to cut out. Resolves to a JPEG data URL or null.
  AM.pdfShotChart = function (file, names, pick) {
    return Promise.all([loadPdfJs(), file.arrayBuffer()]).then(function (r) {
      return r[0].getDocument({ data: new Uint8Array(r[1]) }).promise;
    }).then(function (pdf) { return pdf.getPage(1); }).then(function (page) {
      return page.getTextContent().then(function (tc) {
        var width = page.view[2], items = tc.items.filter(function (i) { return i.str.trim(); });
        var left = Math.min.apply(null, items.map(function (i) { return i.transform[4]; }));
        var titles = names.map(function (n) {
          var hits = items.filter(function (i) { return i.str.trim() === n && i.transform[4] > width * 0.35; });
          return hits.length ? hits.reduce(function (a, b) { return b.transform[5] < a.transform[5] ? b : a; }) : null;
        });
        if (titles.some(function (t) { return !t; })) return null;
        var gap = Math.abs(titles[0].transform[5] - titles[1].transform[5]);
        if (gap < 100) return null;
        var t = titles[pick], size = Math.abs(t.transform[3]) || 10;
        // PDF units, y measured up from the bottom of the page.
        var box = { x0: t.transform[4] - 4, x1: width - left + 4, yTop: t.transform[5] + size + 4 };
        box.yBottom = box.yTop - gap + 6;
        var scale = 3, vp = page.getViewport({ scale: scale });
        var canvas = document.createElement("canvas");
        canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
        return page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise.then(function () {
          var a = vp.convertToViewportPoint(box.x0, box.yTop), b = vp.convertToViewportPoint(box.x1, box.yBottom);
          var cx = Math.max(0, Math.round(Math.min(a[0], b[0]))), cy = Math.max(0, Math.round(Math.min(a[1], b[1])));
          var cw = Math.min(canvas.width - cx, Math.round(Math.abs(b[0] - a[0]))), ch = Math.min(canvas.height - cy, Math.round(Math.abs(b[1] - a[1])));
          var out = document.createElement("canvas"), k = Math.min(1, 1000 / cw);
          out.width = Math.round(cw * k); out.height = Math.round(ch * k);
          var ctx = out.getContext("2d");
          ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, out.width, out.height);
          ctx.drawImage(canvas, cx, cy, cw, ch, 0, 0, out.width, out.height);
          return out.toDataURL("image/jpeg", 0.85);
        });
      });
    });
  };
})();
