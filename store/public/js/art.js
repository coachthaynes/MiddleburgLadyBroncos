// Lady Bronco Basketball artwork and garment mockups, drawn as SVG so colors can change live.
(function (root) {
  let uid = 0;
  const nid = (p) => `${p}${++uid}`;

  // ---------- colorways ----------
  const COLORWAYS = {
    white: { name: "White", garment: "#f7f7f5", main: "#c8102e", second: "#141414", outline: "#141414", ball: "#c8102e" },
    red: { name: "Bronco Red", garment: "#b50f2a", main: "#ffffff", second: "#141414", outline: "#141414", ball: "#ffffff" },
    black: { name: "Black", garment: "#1b1b1d", main: "#e0213f", second: "#ffffff", outline: "#ffffff", ball: "#e0213f" },
    gray: { name: "Heather Gray", garment: "#b9babd", main: "#c8102e", second: "#141414", outline: "#141414", ball: "#c8102e" },
  };

  // ---------- building blocks ----------
  function cubic(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ];
  }

  // Middleburg horseshoe inside a 200 x 200 box. withBall puts a basketball inside the U.
  // Traced from the official Middleburg horseshoe (970 px source), then scaled into the 200 box.
  const SHOE = "M228 96 C270 90 330 90 352 96 C378 104 386 140 378 168 C365 215 330 255 305 305 C270 375 258 450 268 520 C285 640 390 715 507 715 C625 715 730 640 748 520 C758 450 745 375 710 305 C685 255 650 215 637 168 C629 140 637 104 663 96 C690 90 750 90 780 94 C792 115 795 150 788 178 C775 182 760 176 748 182 C742 195 752 210 762 222 C820 290 868 380 866 490 C862 690 700 840 507 842 C314 840 152 690 150 490 C150 380 196 290 254 222 C264 210 272 195 266 182 C254 176 240 182 226 178 C220 150 220 115 228 96 Z";
  const SHOE_T = "scale(0.266) translate(-140 -80)";
  const HOLES = [[297, 237], [208, 453], [265, 663], [507, 778], [750, 663], [805, 453], [717, 237]];
  function horseshoe(c, { withBall = false, holes = true } = {}) {
    const dots = holes ? HOLES.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" fill="${c.outline}"/>`).join("") : "";
    const ball = withBall ? basketball(97.6, 103.7, 38, c) : "";
    return `<g><g transform="${SHOE_T}"><path d="${SHOE}" fill="${c.main}" stroke="${c.outline}" stroke-width="22" stroke-linejoin="round" paint-order="stroke"/>${dots}</g>${ball}</g>`;
  }

  function basketball(cx, cy, r, c) {
    const s = c.outline;
    const w = Math.max(2, r * 0.07);
    return `<g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.ball}" stroke="${s}" stroke-width="${w * 1.3}"/>
      <path d="M${cx} ${cy - r} V${cy + r} M${cx - r} ${cy} H${cx + r}" stroke="${s}" stroke-width="${w}" fill="none"/>
      <path d="M${cx - r * 0.72} ${cy - r * 0.69} Q${cx - r * 0.25} ${cy} ${cx - r * 0.72} ${cy + r * 0.69}" stroke="${s}" stroke-width="${w}" fill="none"/>
      <path d="M${cx + r * 0.72} ${cy - r * 0.69} Q${cx + r * 0.25} ${cy} ${cx + r * 0.72} ${cy + r * 0.69}" stroke="${s}" stroke-width="${w}" fill="none"/>
    </g>`;
  }

  function text(x, y, str, { font, size, fill, stroke, sw = 0, ls = 0, anchor = "middle", weight = 400, tl = 0 }) {
    const st = stroke && sw ? ` stroke="${stroke}" stroke-width="${sw}" paint-order="stroke" stroke-linejoin="round"` : "";
    const fit = tl ? ` textLength="${tl}" lengthAdjust="spacingAndGlyphs"` : "";
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${font}" font-size="${size}" font-weight="${weight}" letter-spacing="${ls}" fill="${fill}"${st}${fit}>${str}</text>`;
  }

  function arcText(cx, cy, r, str, { font, size, fill, stroke, sw = 0, ls = 0, bottom = false }) {
    const id = nid("arc");
    const d = bottom
      ? `M${cx - r} ${cy} A${r} ${r} 0 0 0 ${cx + r} ${cy}`
      : `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`;
    const st = stroke && sw ? ` stroke="${stroke}" stroke-width="${sw}" paint-order="stroke" stroke-linejoin="round"` : "";
    return `<defs><path id="${id}" d="${d}"/></defs><text font-family="${font}" font-size="${size}" letter-spacing="${ls}" fill="${fill}"${st} text-anchor="middle"><textPath href="#${id}" startOffset="50%">${str}</textPath></text>`;
  }

  const F = {
    varsity: "Graduate, serif",
    bebas: "'Bebas Neue', Impact, sans-serif",
    slab: "'Alfa Slab One', serif",
    marker: "'Permanent Marker', cursive",
    oswald: "Oswald, sans-serif",
  };

  // ---------- designs (each drawn in a 400 x 400 box) ----------
  const SAYINGS = ["No Mercy. All Heart.", "United as One.", "Battle Tested."];
  const pick = (o) => ({ saying: (o && o.saying) || SAYINGS[0], season: (o && o.season) || "26/27" });

  // Horseshoe with a ring in the garment color around it, so it can sit on top of type.
  function knockout(c, x, y, k) {
    return `<g transform="translate(${x} ${y}) scale(${k})"><path transform="${SHOE_T}" d="${SHOE}" fill="${c.garment}" stroke="${c.garment}" stroke-width="${18 / k / 0.266}" stroke-linejoin="round"/>${horseshoe(c, { withBall: true })}</g>`;
  }

  const DESIGNS = {
    built: {
      name: "Bronco Built", style: "Streetwear", usesSaying: true,
      art: (c, o) => { o = pick(o); return `
        <g transform="translate(163 0) scale(0.37)">${horseshoe(c, { withBall: true })}</g>
        ${text(200, 196, "BRONCO", { font: F.bebas, size: 128, fill: c.second, ls: 6, tl: 330 })}
        ${text(200, 318, "BUILT", { font: F.bebas, size: 156, fill: c.main, stroke: c.outline, sw: 6, ls: 10, tl: 330 })}
        ${text(200, 352, o.saying.toUpperCase(), { font: F.oswald, size: 24, fill: c.second, ls: 3, weight: 700, tl: o.saying.length > 16 ? 330 : 0 })}
        ${text(36, 390, "#HORSEPOWER", { font: F.oswald, size: 19, fill: c.main, ls: 2, weight: 700, anchor: "start" })}
        ${text(364, 390, o.season, { font: F.oswald, size: 19, fill: c.main, ls: 2, weight: 700, anchor: "end" })}`; },
    },
    horsepower: {
      name: "Horsepower Repeat", style: "Streetwear",
      art: (c, o) => { o = pick(o); return `
        ${text(200, 112, "HORSEPOWER", { font: F.bebas, size: 96, fill: c.main, tl: 360 })}
        <text x="200" y="200" text-anchor="middle" font-family="${F.bebas}" font-size="96" textLength="360" lengthAdjust="spacingAndGlyphs" fill="none" stroke="${c.second}" stroke-width="2.5">HORSEPOWER</text>
        ${text(200, 288, "HORSEPOWER", { font: F.bebas, size: 96, fill: c.main, tl: 360 })}
        ${knockout(c, 159, 124, 0.42)}
        <rect x="20" y="320" width="360" height="46" rx="6" fill="${c.second}"/>
        ${text(200, 352, `LADY BRONCOS BASKETBALL ${o.season}`, { font: F.oswald, size: 22, fill: c.second === "#ffffff" ? "#141414" : "#ffffff", ls: 3, weight: 700, tl: 330 })}`; },
    },
    varsity: {
      name: "Varsity Arch", style: "Varsity",
      art: (c, o) => { o = pick(o); const [y1, y2] = o.season.split("/"); return `
        ${arcText(200, 262, 172, "LADY BRONCOS", { font: F.varsity, size: 46, fill: c.main, stroke: c.outline, sw: 7, ls: 2 })}
        <g transform="translate(122 132) scale(0.78)">${horseshoe(c, { withBall: true })}</g>
        ${text(62, 228, y1 || "", { font: F.varsity, size: 40, fill: c.second })}
        ${text(338, 228, y2 || "", { font: F.varsity, size: 40, fill: c.second })}
        ${text(200, 368, "BASKETBALL", { font: F.bebas, size: 64, fill: c.second === "#ffffff" ? c.second : c.main, stroke: c.outline, sw: c.second === "#ffffff" ? 0 : 5, ls: 8 })}`; },
    },
    badge: {
      name: "Bronco Badge", style: "Varsity", usesSaying: true,
      art: (c, o) => { o = pick(o); return `
        <circle cx="200" cy="200" r="188" fill="none" stroke="${c.main}" stroke-width="14"/>
        <circle cx="200" cy="200" r="130" fill="none" stroke="${c.second}" stroke-width="4"/>
        ${arcText(200, 200, 150, "MIDDLEBURG", { font: F.varsity, size: 40, fill: c.second, ls: 6 })}
        ${arcText(200, 200, 168, `BRONCO BUILT · ${o.saying.toUpperCase()}`, { font: F.oswald, size: 22, fill: c.second, ls: 2, bottom: true })}
        <g transform="translate(142 112) scale(0.58)">${horseshoe(c, { withBall: true })}</g>
        ${text(200, 284, o.season, { font: F.varsity, size: 34, fill: c.main })}
        <circle cx="46" cy="200" r="7" fill="${c.main}"/><circle cx="354" cy="200" r="7" fill="${c.main}"/>`; },
    },
    wordmark: {
      name: "Minimal Wordmark", style: "Minimal", usesSaying: true,
      art: (c, o) => { o = pick(o); return `
        <g transform="translate(22 150) scale(0.46)">${horseshoe(c, { withBall: true })}</g>
        ${text(126, 206, "LADY BRONCOS", { font: F.oswald, size: 44, fill: c.second, ls: 1, weight: 700, anchor: "start", tl: 252 })}
        <rect x="128" y="220" width="250" height="3" fill="${c.main}"/>
        ${text(128, 250, o.saying.toUpperCase(), { font: F.oswald, size: 17, fill: c.main, ls: 4, weight: 700, anchor: "start", tl: o.saying.length > 14 ? 250 : 0 })}
        ${text(128, 276, `BASKETBALL ${o.season}`, { font: F.bebas, size: 22, fill: c.second, ls: 6, anchor: "start" })}`; },
    },
    chest: {
      name: "Left Chest Mark", style: "Minimal",
      art: (c, o) => { o = pick(o); return `
        <g transform="translate(90 30) scale(1.12)">${horseshoe(c, { withBall: true })}</g>
        ${text(200, 380, `LB ${o.season}`, { font: F.oswald, size: 44, fill: c.second, ls: 8, weight: 700 })}`; },
    },
  };

  function designSvg(key, cw, size = 400, bg = "none", opts = {}) {
    const c = typeof cw === "string" ? COLORWAYS[cw] : cw;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${size}" height="${size}">${bg !== "none" ? `<rect width="400" height="400" fill="${bg}"/>` : ""}${DESIGNS[key].art(c, opts)}</svg>`;
  }

  // ---------- garments (1000 x 1000) ----------
  function shade(id, color) {
    return `<defs>
      <linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".18" stop-color="#000" stop-opacity="0"/><stop offset=".82" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
      <radialGradient id="${id}h" cx=".45" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    </defs>`;
  }

  function darker(hex, amt = 0.14) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.round(v * (1 - amt)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }

  const TEE = "M418 148 Q500 206 582 148 L700 176 L852 300 L780 420 L698 368 L704 900 Q500 918 296 900 L302 368 L220 420 L148 300 L300 176 Z";
  const LONG = "M418 148 Q500 206 582 148 L700 176 Q770 204 800 290 L880 760 L798 784 L724 430 L704 900 Q500 918 296 900 L276 430 L202 784 L120 760 L200 290 Q230 204 300 176 Z";
  const CREW = "M410 150 Q500 214 590 150 L710 180 Q782 208 812 296 L892 752 L806 780 L732 440 L720 880 Q500 900 280 880 L268 440 L194 780 L108 752 L188 296 Q218 208 290 180 Z";
  const TANK = "M392 128 Q500 262 608 128 L668 138 Q672 290 748 336 L752 904 Q500 922 248 904 L252 336 Q328 290 332 138 Z";

  const GARMENTS = {
    tee: {
      name: "Short Sleeve Tee", slot: { x: 360, y: 250, w: 280 }, nameSlot: { x: 778, y: 318, r: 33, size: 26 },
      draw: (g) => `<path d="${TEE}" fill="${g}"/>
        <path d="M418 148 Q500 206 582 148 Q500 232 418 148 Z" fill="${darker(g, 0.18)}"/>
        <path d="M410 150 Q500 222 590 150" fill="none" stroke="${darker(g, 0.28)}" stroke-width="10"/>
        <path d="M232 408 L160 306 M768 408 L840 306" stroke="${darker(g, 0.2)}" stroke-width="6" stroke-dasharray="3 7"/>
        <path d="M300 884 Q500 902 700 884" stroke="${darker(g, 0.2)}" stroke-width="5" stroke-dasharray="3 7" fill="none"/>`,
      shape: TEE,
    },
    longsleeve: {
      name: "Long Sleeve Tee", slot: { x: 360, y: 250, w: 280 }, nameSlot: { x: 812, y: 560, r: 80, size: 30 },
      draw: (g) => `<path d="${LONG}" fill="${g}"/>
        <path d="M418 148 Q500 206 582 148 Q500 232 418 148 Z" fill="${darker(g, 0.18)}"/>
        <path d="M410 150 Q500 222 590 150" fill="none" stroke="${darker(g, 0.28)}" stroke-width="10"/>
        <path d="M130 736 L204 718 L210 752 L128 764 Z M870 736 L796 718 L790 752 L872 764 Z" fill="${darker(g, 0.18)}"/>`,
      shape: LONG,
    },
    crewneck: {
      name: "Crewneck Sweatshirt", slot: { x: 360, y: 260, w: 280 }, nameSlot: { x: 818, y: 560, r: 80, size: 30 },
      draw: (g) => `<path d="${CREW}" fill="${g}"/>
        <path d="M404 150 Q500 240 596 150 L580 146 Q500 212 420 146 Z" fill="${darker(g, 0.22)}"/>
        <path d="M282 842 Q500 862 718 842 L720 880 Q500 900 280 880 Z" fill="${darker(g, 0.16)}"/>
        <path d="M112 730 L196 710 L204 776 L110 752 Z M888 730 L804 710 L796 776 L890 752 Z" fill="${darker(g, 0.16)}"/>`,
      shape: CREW,
    },
    hoodie: {
      name: "Hoodie", slot: { x: 365, y: 290, w: 270 }, nameSlot: { x: 818, y: 560, r: 80, size: 30 },
      draw: (g) => `<path d="M330 186 Q336 40 500 32 Q664 40 670 186 Q500 150 330 186 Z" fill="${darker(g, 0.2)}"/>
        <path d="${CREW}" fill="${g}"/>
        <path d="M392 156 Q420 250 500 262 Q580 250 608 156 Q560 214 500 216 Q440 214 392 156 Z" fill="${darker(g, 0.24)}"/>
        <path d="M470 240 L462 400 M530 240 L538 400" stroke="${darker(g, 0.35)}" stroke-width="7" stroke-linecap="round"/>
        <path d="M350 640 L650 640 L690 800 L310 800 Z" fill="${darker(g, 0.08)}" stroke="${darker(g, 0.22)}" stroke-width="4"/>
        <path d="M282 842 Q500 862 718 842 L720 880 Q500 900 280 880 Z" fill="${darker(g, 0.16)}"/>
        <path d="M112 730 L196 710 L204 776 L110 752 Z M888 730 L804 710 L796 776 L890 752 Z" fill="${darker(g, 0.16)}"/>`,
      shape: CREW,
    },
    jacket: {
      name: "Full Zip Jacket", slot: { x: 540, y: 250, w: 130 }, nameSlot: { x: 818, y: 560, r: 80, size: 30 },
      draw: (g) => `<path d="${CREW}" fill="${g}"/>
        <path d="M410 150 L420 96 Q500 84 580 96 L590 150 Q500 176 410 150 Z" fill="${darker(g, 0.2)}"/>
        <path d="M500 150 V880" stroke="${darker(g, 0.45)}" stroke-width="8"/>
        <path d="M500 150 V880" stroke="#bbb" stroke-width="2" stroke-dasharray="4 4"/>
        <rect x="492" y="148" width="16" height="30" rx="4" fill="#c9c9c9"/>
        <path d="M340 660 L420 700 M660 660 L580 700" stroke="${darker(g, 0.3)}" stroke-width="6" stroke-linecap="round"/>
        <path d="M282 842 Q500 862 718 842 L720 880 Q500 900 280 880 Z" fill="${darker(g, 0.16)}"/>`,
      shape: CREW,
    },
    warmupjacket: {
      name: "Warmup Jacket", slot: { x: 540, y: 250, w: 130 }, nameSlot: { x: 806, y: 560, r: 80, size: 30 },
      draw: (g, c) => `<path d="${CREW}" fill="${g}"/>
        <path d="M290 180 L410 150 L500 190 L590 150 L710 180 L720 250 Q500 290 280 250 Z" fill="${c.accentPanel}"/>
        <path d="M200 300 L276 430 L204 784 L182 780 Z M800 300 L724 430 L796 784 L818 780 Z" fill="${c.accentPanel}"/>
        <path d="M410 150 L420 96 Q500 84 580 96 L590 150 Q500 176 410 150 Z" fill="${darker(g, 0.2)}"/>
        <path d="M500 150 V880" stroke="${darker(g, 0.45)}" stroke-width="8"/>
        <rect x="492" y="148" width="16" height="30" rx="4" fill="#c9c9c9"/>
        <path d="M282 842 Q500 862 718 842 L720 880 Q500 900 280 880 Z" fill="${c.accentPanel}"/>`,
      shape: CREW,
    },
    warmuppants: {
      name: "Warmup Pants", slot: { x: 300, y: 250, w: 110 },
      draw: (g, c) => `<path d="M300 110 L700 110 L736 940 L566 940 L510 330 L490 330 L434 940 L264 940 Z" fill="${g}"/>
        <rect x="296" y="96" width="408" height="56" rx="10" fill="${darker(g, 0.18)}"/>
        <path d="M486 124 L470 200 M514 124 L530 200" stroke="#ddd" stroke-width="5" stroke-linecap="round"/>
        <path d="M300 152 L268 930 L284 932 L318 152 Z M700 152 L732 930 L716 932 L682 152 Z" fill="${c.accentPanel}"/>
        <path d="M268 900 L432 900 M568 900 L732 900" stroke="${darker(g, 0.3)}" stroke-width="6"/>`,
      shape: "M300 110 L700 110 L736 940 L566 940 L510 330 L490 330 L434 940 L264 940 Z",
    },
    jersey: {
      name: "Practice Jersey", slot: { x: 350, y: 230, w: 300 }, number: true, nameSlot: { x: 500, y: 858, r: 0, size: 34 },
      draw: (g, c) => `<path d="${TANK}" fill="${g}"/>
        <path d="M392 128 Q500 262 608 128" fill="none" stroke="${c.accentPanel}" stroke-width="18"/>
        <path d="M332 138 Q328 290 252 336 M668 138 Q672 290 748 336" fill="none" stroke="${c.accentPanel}" stroke-width="16"/>
        <path d="M256 880 Q500 900 748 880" stroke="${darker(g, 0.2)}" stroke-width="5" stroke-dasharray="3 7" fill="none"/>`,
      shape: TANK,
    },
    hat: {
      name: "Dad Hat", slot: { x: 395, y: 330, w: 210 },
      draw: (g) => `<path d="M236 600 Q236 280 500 262 Q764 280 764 600 Z" fill="${g}"/>
        <path d="M500 264 Q470 420 480 600 M500 264 Q530 420 520 600" fill="none" stroke="${darker(g, 0.25)}" stroke-width="4"/>
        <path d="M500 264 Q360 330 330 600 M500 264 Q640 330 670 600" fill="none" stroke="${darker(g, 0.18)}" stroke-width="3"/>
        <ellipse cx="500" cy="266" rx="20" ry="10" fill="${darker(g, 0.25)}"/>
        <path d="M206 598 Q500 566 794 598 Q806 646 500 672 Q194 646 206 598 Z" fill="${darker(g, 0.12)}"/><path d="M236 616 Q500 596 764 616" fill="none" stroke="${darker(g, 0.28)}" stroke-width="3" stroke-dasharray="3 7"/>
        `,
      shape: "M236 600 Q236 280 500 262 Q764 280 764 600 Z",
    },
  };

  // Accent color for stripes and panels, chosen to contrast with the garment.
  function accentFor(cwKey) {
    return { white: "#c8102e", red: "#ffffff", black: "#c8102e", gray: "#c8102e" }[cwKey] || "#c8102e";
  }

  function mockupSvg(garmentKey, designKey, cwKey, { number = "23", size = 1000, saying = "", season = "", name = "" } = {}) {
    const opts = { saying, season };
    const G = GARMENTS[garmentKey];
    const c = { ...COLORWAYS[cwKey], accentPanel: accentFor(cwKey) };
    const id = nid("m");
    const s = G.slot;
    const scale = s.w / 400;
    let print = `<g transform="translate(${s.x} ${s.y}) scale(${scale})">${DESIGNS[designKey].art(c, opts)}</g>`;
    if (G.number) {
      print = `<g transform="translate(${s.x} ${s.y - 10}) scale(${scale * 0.8}) translate(50 0)">${text(200, 60, "LADY BRONCOS", { font: F.varsity, size: 46, fill: c.main, stroke: c.outline, sw: 5 })}</g>
        ${text(500, 640, number, { font: F.slab, size: 300, fill: c.main, stroke: c.outline, sw: 12 })}`;
    }
    if (garmentKey === "warmuppants") {
      print = `<g transform="translate(${s.x} ${s.y}) scale(${scale * 1.6})">${horseshoe(c, { withBall: true })}</g>`;
    }
    const ns = G.nameSlot;
    if (ns && name) {
      const label = String(name).toUpperCase().replace(/[<>&"]/g, "").slice(0, 14);
      print += `<g transform="translate(${ns.x} ${ns.y}) rotate(${ns.r})">${text(0, 0, label, { font: F.oswald, size: ns.size, fill: c.second === "#ffffff" ? "#ffffff" : c.main, ls: 3, weight: 700 })}</g>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="${size}" height="${size}">
      ${shade(id)}
      <defs><clipPath id="${id}c"><path d="${G.shape}"/></clipPath></defs>
      <ellipse cx="500" cy="950" rx="330" ry="26" fill="#000" opacity=".12"/>
      ${G.draw(c.garment, c)}
      <g clip-path="url(#${id}c)">${print}</g>
      <g clip-path="url(#${id}c)" style="mix-blend-mode:multiply"><rect width="1000" height="1000" fill="url(#${id}s)"/></g>
      <g clip-path="url(#${id}c)"><rect width="1000" height="1000" fill="url(#${id}h)"/></g>
    </svg>`;
  }

  root.BroncoArt = { COLORWAYS, DESIGNS, GARMENTS, SAYINGS, designSvg, mockupSvg, horseshoe, basketball };
})(typeof window !== "undefined" ? window : globalThis);
