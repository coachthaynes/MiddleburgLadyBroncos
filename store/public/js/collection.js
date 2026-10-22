// Bronco Built 26/27 collection: print artwork, garments with front and back views, and products.
// Uses the traced horseshoe and basketball from art.js.
(function (root) {
  const A = root.BroncoArt;
  let uid = 0;
  const nid = (p) => `${p}${++uid}`;

  const RED = "#d7142f", DEEP = "#9e0c22", WHITE = "#ffffff", BLACK = "#121212", GRAY = "#8d8e91", SILVER = "#d9d9db";
  const F = {
    varsity: "Graduate, serif",
    brush: "Knewave, 'Permanent Marker', cursive",
    block: "Oswald, Impact, sans-serif",
    teko: "Teko, Oswald, sans-serif",
  };

  // ---------- helpers ----------
  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  function T(x, y, str, o) {
    const st = o.stroke && o.sw ? ` stroke="${o.stroke}" stroke-width="${o.sw}" paint-order="stroke" stroke-linejoin="round"` : "";
    const fit = o.tl ? ` textLength="${o.tl}" lengthAdjust="spacingAndGlyphs"` : "";
    const tr = o.rot || o.skew ? ` transform="${o.rot ? `rotate(${o.rot} ${x} ${y})` : ""}${o.skew ? ` translate(${x} ${y}) skewX(${o.skew}) translate(${-x} ${-y})` : ""}"` : "";
    return `<text x="${x}" y="${y}" text-anchor="${o.anchor || "middle"}" font-family="${o.font}" font-size="${o.size}" font-weight="${o.weight || 400}" letter-spacing="${o.ls || 0}" fill="${o.fill}"${st}${fit}${tr}>${str}</text>`;
  }

  // Rough paint streak: a tapered band with ragged edges.
  function streak(x, y, len, h, color, seed = 1, dir = 1) {
    const r = rng(seed);
    const pts = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const taper = dir > 0 ? 0.25 + 0.75 * t : 1 - 0.75 * t;
      pts.push([x + len * t, y - (h / 2) * taper - r() * h * 0.25]);
    }
    for (let i = n; i >= 0; i--) {
      const t = i / n;
      const taper = dir > 0 ? 0.25 + 0.75 * t : 1 - 0.75 * t;
      pts.push([x + len * t, y + (h / 2) * taper + r() * h * 0.25]);
    }
    return `<path d="M${pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L")} Z" fill="${color}"/>`;
  }

  // Speckled, worn print texture.
  function distressDefs(id, amount = 0.5, seed = 7) {
    return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -12 0 0 0 ${(1 + 12 * (0.7 - 0.1 * amount)).toFixed(2)}" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in"/>
    </filter>`;
  }

  function ballArc(cx, cy, r, color, sw = 6) {
    const id = nid("bc");
    return `<defs><clipPath id="${id}"><rect x="${cx - r - 10}" y="${cy - r - 10}" width="${2 * r + 20}" height="${r + 10}"/></clipPath></defs>
      <g clip-path="url(#${id})" fill="none" stroke="${color}" stroke-width="${sw}">
        <circle cx="${cx}" cy="${cy}" r="${r}"/>
        <path d="M${cx} ${cy - r} V${cy}"/>
        <path d="M${cx - r * 0.72} ${cy - r * 0.69} Q${cx - r * 0.25} ${cy} ${cx - r * 0.72} ${cy + r * 0.69}"/>
        <path d="M${cx + r * 0.72} ${cy - r * 0.69} Q${cx + r * 0.25} ${cy} ${cx + r * 0.72} ${cy + r * 0.69}"/>
      </g>`;
  }

  // Horseshoe placed with its top left corner at x, y and a given width (the traced mark is about 196 wide, 206 tall).
  function shoe(x, y, w, { main = RED, outline = BLACK, ball = false, ballColor } = {}) {
    const k = w / 196;
    const c = { main, outline, ball: ballColor || main };
    return `<g transform="translate(${x} ${y}) scale(${k})">${A.horseshoe(c, { withBall: ball })}</g>`;
  }

  // Stylized bronco head facing left, in a 200 x 200 box.
  function broncoHead(x, y, k) {
    const head = "M118 8 L134 40 C152 50 170 76 178 106 C186 136 184 166 176 196 L96 196 C98 172 96 150 86 132 C72 120 50 128 36 126 C18 124 8 112 10 98 C12 86 22 76 34 70 C52 58 70 44 86 34 L98 22 L104 2 L112 24 Z";
    const r = rng(11);
    let mane = "";
    for (let i = 0; i < 9; i++) {
      const sx = 128 + i * 6 + r() * 4, sy = 34 + i * 18;
      mane += `<path d="M${sx} ${sy} L${sx + 34 + r() * 26} ${sy + 4 + r() * 10} L${sx + 8} ${sy + 14} Z" fill="${i % 2 ? RED : DEEP}"/>`;
    }
    return `<g transform="translate(${x} ${y}) scale(${k})">
      ${mane}
      <path d="${head}" fill="${WHITE}" stroke="${BLACK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M86 132 C80 108 66 92 50 86" fill="none" stroke="${BLACK}" stroke-width="3"/>
      <path d="M120 70 C132 92 140 120 140 150" fill="none" stroke="${GRAY}" stroke-width="3"/>
      <path d="M66 58 Q76 50 88 56 Q78 64 66 58 Z" fill="${BLACK}"/>
      <ellipse cx="24" cy="100" rx="5" ry="3.5" fill="${BLACK}"/>
      <path d="M14 112 Q24 118 36 116" fill="none" stroke="${BLACK}" stroke-width="3"/>
    </g>`;
  }

  // ---------- prints ----------
  // Each print has its own size and is drawn for the garment color it goes on.
  const PRINTS = {
    signature: {
      name: "Bronco Built Signature", w: 400, h: 420, on: BLACK,
      art: () => { const d = nid("ds"); return `<defs>${distressDefs(d, 0.45, 3)}</defs><g filter="url(#${d})">
        ${ballArc(200, 168, 128, "#5a5a5e", 6)}
        ${T(200, 150, "BRONCO", { font: F.varsity, size: 92, fill: RED, stroke: WHITE, sw: 7, tl: 370 })}
        ${T(200, 250, "BUILT.", { font: F.brush, size: 104, fill: WHITE, skew: -8, tl: 300 })}
        ${streak(36, 300, 120, 16, RED, 4, -1)}${streak(244, 300, 120, 16, RED, 5, 1)}
        ${streak(60, 322, 96, 8, DEEP, 6, -1)}${streak(244, 322, 96, 8, DEEP, 7, 1)}
        ${shoe(168, 270, 64)}
        ${T(200, 372, "FEARLESS BY NATURE", { font: F.block, size: 26, weight: 700, fill: WHITE, ls: 5, tl: 330 })}
        ${T(200, 410, "26/27", { font: F.block, size: 30, weight: 700, fill: WHITE, ls: 3 })}</g>`; },
    },
    battletested: {
      name: "Battle Tested", w: 400, h: 450, on: WHITE,
      art: () => { const d = nid("ds"); return `<defs>${distressDefs(d, 0.35, 9)}</defs><g filter="url(#${d})">
        <circle cx="200" cy="128" r="104" fill="${RED}" opacity=".92"/>
        ${streak(70, 70, 120, 26, DEEP, 12, -1)}${streak(250, 200, 110, 22, DEEP, 13, 1)}
        ${ballArc(200, 128, 116, BLACK, 5)}
        ${broncoHead(108, 30, 0.96)}
        ${T(200, 300, "BRONCO", { font: F.varsity, size: 90, fill: RED, stroke: BLACK, sw: 6, tl: 370 })}
        ${T(200, 372, "BUILT.", { font: F.brush, size: 78, fill: BLACK, skew: -8, tl: 240 })}
        ${T(200, 410, "BATTLE TESTED.", { font: F.block, size: 30, weight: 700, fill: BLACK, ls: 3, tl: 300 })}
        <rect x="92" y="430" width="56" height="5" fill="${RED}"/><rect x="252" y="430" width="56" height="5" fill="${RED}"/>
        ${T(200, 442, "26/27", { font: F.block, size: 24, weight: 700, fill: BLACK, ls: 2 })}</g>`; },
    },
    united: {
      name: "United as One", w: 400, h: 360, on: "#b7b8bb",
      art: () => `
        ${shoe(118, 0, 164, { outline: BLACK })}
        ${T(200, 252, "BRONCO BUILT.", { font: F.block, size: 52, weight: 700, fill: BLACK, ls: 2, tl: 370 })}
        <rect x="40" y="268" width="320" height="6" fill="${RED}"/>
        ${T(200, 310, "UNITED AS ONE.", { font: F.block, size: 30, weight: 700, fill: BLACK, ls: 4, tl: 300 })}
        ${T(200, 348, "26/27", { font: F.block, size: 26, weight: 700, fill: BLACK, ls: 3 })}`,
    },
    champions: {
      name: "Champions in the Making", w: 400, h: 380, on: BLACK,
      art: () => { const d = nid("ds"); return `<defs>${distressDefs(d, 0.4, 21)}</defs><g filter="url(#${d})">
        ${ballArc(200, 150, 120, "#5a5a5e", 6)}
        ${T(200, 140, "CHAMPIONS", { font: F.varsity, size: 66, fill: SILVER, stroke: RED, sw: 6, tl: 384 })}
        ${T(200, 214, "IN THE MAKING", { font: F.brush, size: 52, fill: WHITE, skew: -8, tl: 330 })}
        ${streak(40, 268, 120, 14, RED, 22, -1)}${streak(240, 268, 120, 14, RED, 23, 1)}
        ${streak(70, 290, 90, 6, WHITE, 24, -1)}${streak(240, 290, 90, 6, WHITE, 25, 1)}
        ${shoe(170, 240, 60, { outline: WHITE })}
        ${T(200, 350, "26/27", { font: F.block, size: 30, weight: 700, fill: WHITE, ls: 3 })}</g>`; },
    },
    nomercy: {
      name: "No Mercy. All Heart.", w: 400, h: 430, on: "#c8102e",
      art: () => { const d = nid("ds"); return `<defs>${distressDefs(d, 0.4, 31)}</defs><g filter="url(#${d})">
        <circle cx="200" cy="138" r="118" fill="#2a2a2c" stroke="${BLACK}" stroke-width="6"/>
        <g fill="none" stroke="${BLACK}" stroke-width="7"><path d="M200 20 V256 M82 138 H318"/><path d="M115 57 Q170 138 115 219"/><path d="M285 57 Q230 138 285 219"/></g>
        ${streak(30, 200, 340, 34, "rgba(255,255,255,.85)", 32, 1)}
        ${shoe(150, 50, 100, { outline: WHITE })}
        ${T(200, 252, "NO MERCY.", { font: F.brush, size: 74, fill: WHITE, stroke: BLACK, sw: 6, rot: -7, tl: 330 })}
        ${T(206, 326, "ALL HEART.", { font: F.brush, size: 74, fill: WHITE, stroke: BLACK, sw: 6, rot: -7, tl: 330 })}
        ${streak(60, 360, 300, 10, "rgba(255,255,255,.7)", 33, 1)}
        <rect x="100" y="390" width="70" height="4" fill="${WHITE}"/><rect x="230" y="390" width="70" height="4" fill="${WHITE}"/>
        ${shoe(184, 370, 32, { main: WHITE, outline: BLACK })}
        ${T(200, 424, "26/27", { font: F.block, size: 22, weight: 700, fill: WHITE, ls: 2 })}</g>`; },
    },
    fearherd: {
      name: "Fear the Herd (back)", w: 400, h: 420, on: BLACK,
      art: () => { const d = nid("ds"); return `<defs>${distressDefs(d, 0.3, 41)}</defs><g filter="url(#${d})">
        ${ballArc(200, 220, 180, "#6a6a6e", 7)}
        ${shoe(130, 60, 140, { outline: WHITE })}
        ${T(200, 300, "FEAR THE HERD", { font: F.varsity, size: 62, fill: RED, stroke: WHITE, sw: 6, tl: 392 })}
        <rect x="30" y="327" width="40" height="3" fill="${WHITE}"/><rect x="330" y="327" width="40" height="3" fill="${WHITE}"/>
        ${T(200, 338, "GIRLS BASKETBALL", { font: F.block, size: 24, weight: 700, fill: WHITE, ls: 6, tl: 250 })}
        <rect x="120" y="372" width="50" height="4" fill="${RED}"/><rect x="230" y="372" width="50" height="4" fill="${RED}"/>
        ${T(200, 384, "26/27", { font: F.block, size: 28, weight: 700, fill: WHITE, ls: 3 })}</g>`; },
    },
    season: {
      name: "26/27 Season (back)", w: 400, h: 460, on: WHITE,
      art: () => { const d = nid("ds"); return `<defs>${distressDefs(d, 0.5, 51)}</defs><g filter="url(#${d})">
        ${streak(10, 170, 250, 30, "rgba(215,20,47,.35)", 52, 1)}
        ${T(130, 200, "26", { font: F.brush, size: 200, fill: RED, stroke: BLACK, sw: 4, rot: -10 })}
        ${T(155, 330, "/", { font: F.brush, size: 190, fill: BLACK, rot: -10 })}
        ${T(170, 420, "27", { font: F.brush, size: 200, fill: BLACK, stroke: RED, sw: 3, rot: -10 })}
        ${streak(120, 440, 200, 12, RED, 53, -1)}</g>
        ${T(340, 130, "SAME", { font: F.teko, size: 46, weight: 700, fill: BLACK })}
        ${T(340, 170, "TEAM.", { font: F.teko, size: 46, weight: 700, fill: BLACK })}
        ${T(340, 220, "SAME", { font: F.teko, size: 46, weight: 700, fill: BLACK })}
        ${T(340, 260, "GOAL.", { font: F.teko, size: 46, weight: 700, fill: BLACK })}
        ${T(336, 310, "BIGGER", { font: F.teko, size: 46, weight: 700, fill: RED, tl: 112 })}
        ${T(336, 350, "DREAMS.", { font: F.teko, size: 46, weight: 700, fill: RED, tl: 112 })}
        ${shoe(312, 372, 56)}`; },
    },
    chest: {
      name: "Horseshoe chest mark", w: 200, h: 212, on: BLACK,
      art: () => shoe(2, 2, 196, { outline: "#1a1a1a" }),
    },
    sleeveWhite: {
      name: "Bronco Built sleeve (white)", w: 120, h: 520, on: BLACK,
      art: () => `${T(38, 20, "BRONCO BUILT.", { font: F.brush, size: 64, fill: WHITE, rot: 90, anchor: "start", tl: 400 })}${shoe(26, 440, 68, { outline: WHITE })}`,
    },
    sleeveBlack: {
      name: "Bronco Built leg (black)", w: 120, h: 520, on: "#b7b8bb",
      art: () => `${shoe(26, 0, 68, { outline: BLACK })}${T(38, 100, "BRONCO BUILT.", { font: F.brush, size: 64, fill: BLACK, rot: 90, anchor: "start", tl: 400 })}`,
    },
    seasonMark: {
      name: "26/27 mark", w: 200, h: 80, on: BLACK,
      art: () => T(100, 64, "26/27", { font: F.block, size: 68, weight: 700, fill: WHITE, ls: 4 }),
    },
    banner: {
      name: "Bronco Built banner", w: 1200, h: 300, on: BLACK,
      art: () => { const d = nid("ds"); return `<defs>${distressDefs(d, 0.35, 61)}</defs><g filter="url(#${d})">
        ${shoe(40, 40, 210, { outline: WHITE })}
        <rect x="290" y="40" width="5" height="220" fill="${WHITE}" opacity=".7"/>
        ${T(640, 168, "BRONCO BUILT.", { font: F.brush, size: 120, fill: SILVER, skew: -8, tl: 640 })}
        ${T(640, 240, "GIRLS BASKETBALL", { font: F.block, size: 40, weight: 700, fill: WHITE, ls: 14, tl: 520 })}
        <rect x="985" y="40" width="5" height="220" fill="${WHITE}" opacity=".7"/>
        ${T(1095, 150, "26", { font: F.brush, size: 110, fill: WHITE, rot: -8 })}
        ${T(1110, 250, "27", { font: F.brush, size: 110, fill: RED, rot: -8 })}</g>`; },
    },
  };

  function printSvg(key, width, bg) {
    const p = PRINTS[key];
    const h = Math.round((width / p.w) * p.h);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${p.w} ${p.h}" width="${width}" height="${h}">${bg ? `<rect width="${p.w}" height="${p.h}" fill="${bg}"/>` : ""}${p.art()}</svg>`;
  }

  // ---------- garments ----------
  function darker(hex, amt = 0.14) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.round(v * (1 - amt)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }

  const TEE = "M418 148 Q500 206 582 148 L700 176 L852 300 L780 420 L698 368 L704 900 Q500 918 296 900 L302 368 L220 420 L148 300 L300 176 Z";
  const LONG = "M418 148 Q500 206 582 148 L700 176 Q770 204 800 290 L880 760 L798 784 L724 430 L704 900 Q500 918 296 900 L276 430 L202 784 L120 760 L200 290 Q230 204 300 176 Z";
  const CREW = "M410 150 Q500 214 590 150 L710 180 Q782 208 812 296 L892 752 L806 780 L732 440 L720 880 Q500 900 280 880 L268 440 L194 780 L108 752 L188 296 Q218 208 290 180 Z";
  const SHORTS = "M286 170 L714 170 L758 690 L536 712 L500 420 L464 712 L242 690 Z";
  const JOGGER = "M312 110 L688 110 L708 850 L566 868 L510 330 L490 330 L434 868 L292 850 Z";
  const CAP = "M236 600 Q236 280 500 262 Q764 280 764 600 Z";

  const GARMENTS = {
    tee: {
      shape: TEE,
      front: (g) => `<path d="${TEE}" fill="${g}"/><path d="M418 148 Q500 206 582 148 Q500 232 418 148 Z" fill="${darker(g, 0.18)}"/>
        <path d="M410 150 Q500 222 590 150" fill="none" stroke="${darker(g, 0.28)}" stroke-width="10"/>
        <path d="M232 408 L160 306 M768 408 L840 306" stroke="${darker(g, 0.2)}" stroke-width="6" stroke-dasharray="3 7"/>`,
      back: (g) => `<path d="${TEE}" fill="${g}"/><path d="M418 148 Q500 172 582 148" fill="none" stroke="${darker(g, 0.28)}" stroke-width="10"/>
        <path d="M232 408 L160 306 M768 408 L840 306" stroke="${darker(g, 0.2)}" stroke-width="6" stroke-dasharray="3 7"/>`,
      slots: { chest: { x: 340, y: 228, w: 320 }, back: { x: 320, y: 214, w: 360 }, leftChest: { x: 580, y: 236, w: 74 } },
      name: { x: 222, y: 318, r: -33, size: 26 },
    },
    longsleeve: {
      shape: LONG,
      front: (g, c) => `<path d="${LONG}" fill="${g}"/>
        <path d="M700 176 Q770 204 800 290 L880 760 L850 768 L772 300 Q752 226 700 190 Z" fill="${c.accent}"/>
        <path d="M716 196 Q760 230 778 300 L856 766 L838 770 L760 304 Q744 240 708 206 Z" fill="${WHITE}"/>
        <path d="M300 176 Q230 204 200 290 L120 760 L150 768 L228 300 Q248 226 300 190 Z" fill="${c.accent}"/>
        <path d="M284 196 Q240 230 222 300 L144 766 L162 770 L240 304 Q256 240 292 206 Z" fill="${WHITE}"/>
        <path d="M418 148 Q500 206 582 148 Q500 232 418 148 Z" fill="${darker(g, 0.18)}"/>
        <path d="M410 150 Q500 222 590 150" fill="none" stroke="${c.accent}" stroke-width="12"/>`,
      back: (g, c) => `<path d="${LONG}" fill="${g}"/>
        <path d="M700 176 Q770 204 800 290 L880 760 L850 768 L772 300 Q752 226 700 190 Z" fill="${c.accent}"/>
        <path d="M300 176 Q230 204 200 290 L120 760 L150 768 L228 300 Q248 226 300 190 Z" fill="${c.accent}"/>
        <path d="M418 148 Q500 172 582 148" fill="none" stroke="${c.accent}" stroke-width="12"/>`,
      slots: { chest: { x: 345, y: 228, w: 310 }, back: { x: 330, y: 220, w: 340 } },
      name: { x: 178, y: 560, r: 100, size: 28 },
    },
    hoodie: {
      shape: CREW,
      front: (g) => `<path d="M330 186 Q336 40 500 32 Q664 40 670 186 Q500 150 330 186 Z" fill="${darker(g, 0.2)}"/>
        <path d="${CREW}" fill="${g}"/>
        <path d="M392 156 Q420 250 500 262 Q580 250 608 156 Q560 214 500 216 Q440 214 392 156 Z" fill="${darker(g, 0.24)}"/>
        <path d="M470 240 L462 400 M530 240 L538 400" stroke="${darker(g, 0.4)}" stroke-width="7" stroke-linecap="round"/>
        <path d="M350 640 L650 640 L690 800 L310 800 Z" fill="${darker(g, 0.06)}" stroke="${darker(g, 0.24)}" stroke-width="4"/>
        <path d="M282 842 Q500 862 718 842 L720 880 Q500 900 280 880 Z" fill="${darker(g, 0.16)}"/>
        <path d="M112 730 L196 710 L204 776 L110 752 Z M888 730 L804 710 L796 776 L890 752 Z" fill="${darker(g, 0.16)}"/>`,
      back: (g) => `<path d="${CREW}" fill="${g}"/>
        <path d="M352 196 Q338 64 500 52 Q662 64 648 196 Q630 312 500 322 Q370 312 352 196 Z" fill="${darker(g, 0.12)}" stroke="${darker(g, 0.24)}" stroke-width="4"/>
        <path d="M500 54 V320" stroke="${darker(g, 0.26)}" stroke-width="4"/>
        <path d="M282 842 Q500 862 718 842 L720 880 Q500 900 280 880 Z" fill="${darker(g, 0.16)}"/>
        <path d="M112 730 L196 710 L204 776 L110 752 Z M888 730 L804 710 L796 776 L890 752 Z" fill="${darker(g, 0.16)}"/>`,
      slots: { chest: { x: 360, y: 290, w: 280 }, back: { x: 315, y: 340, w: 370 }, leftChest: { x: 575, y: 300, w: 80 }, leftSleeve: { x: 762, y: 360, w: 70, r: -10 } },
      name: { x: 178, y: 560, r: 100, size: 28 },
    },
    warmupjacket: {
      shape: CREW,
      front: (g, c) => `<path d="${CREW}" fill="${g}"/>
        <path d="M290 180 L410 150 L500 190 L590 150 L710 180 L720 250 Q500 290 280 250 Z" fill="${c.accent}"/>
        <path d="M200 300 L276 430 L204 784 L182 780 Z M800 300 L724 430 L796 784 L818 780 Z" fill="${c.accent}"/>
        <path d="M410 150 L420 96 Q500 84 580 96 L590 150 Q500 176 410 150 Z" fill="${darker(g, 0.2)}"/>
        <path d="M500 150 V880" stroke="#3a3a3c" stroke-width="8"/><rect x="492" y="148" width="16" height="30" rx="4" fill="#c9c9c9"/>
        <path d="M340 660 L420 700 M660 660 L580 700" stroke="#3a3a3c" stroke-width="6" stroke-linecap="round"/>
        <path d="M282 842 Q500 862 718 842 L720 880 Q500 900 280 880 Z" fill="${c.accent}"/>`,
      back: (g, c) => `<path d="${CREW}" fill="${g}"/>
        <path d="M290 180 L410 150 Q500 170 590 150 L710 180 L720 250 Q500 290 280 250 Z" fill="${c.accent}"/>
        <path d="M200 300 L276 430 L204 784 L182 780 Z M800 300 L724 430 L796 784 L818 780 Z" fill="${c.accent}"/>
        <path d="M282 842 Q500 862 718 842 L720 880 Q500 900 280 880 Z" fill="${c.accent}"/>`,
      slots: { leftChest: { x: 560, y: 290, w: 96 }, back: { x: 360, y: 320, w: 280 } },
      name: { x: 178, y: 560, r: 100, size: 28 },
    },
    shorts: {
      shape: SHORTS,
      front: (g, c) => `<path d="${SHORTS}" fill="${g}"/>
        <rect x="282" y="150" width="436" height="48" rx="8" fill="${darker(g, 0.25)}"/>
        <path d="M488 170 L476 240 M512 170 L524 240" stroke="#ddd" stroke-width="5" stroke-linecap="round"/>
        <path d="M286 198 L242 690 L270 692 L312 198 Z M714 198 L758 690 L730 692 L688 198 Z" fill="${c.accent}"/>
        <path d="M300 198 L258 690 L266 690 L308 198 Z M700 198 L742 690 L734 690 L692 198 Z" fill="${WHITE}"/>
        <path d="M242 672 L464 694 L464 712 L242 690 Z M758 672 L536 694 L536 712 L758 690 Z" fill="${c.accent}"/>`,
      back: (g, c) => `<path d="${SHORTS}" fill="${g}"/><rect x="282" y="150" width="436" height="48" rx="8" fill="${darker(g, 0.25)}"/>
        <path d="M286 198 L242 690 L270 692 L312 198 Z M714 198 L758 690 L730 692 L688 198 Z" fill="${c.accent}"/>
        <path d="M242 672 L464 694 L464 712 L242 690 Z M758 672 L536 694 L536 712 L758 690 Z" fill="${c.accent}"/>`,
      slots: { leftLeg: { x: 590, y: 520, w: 90 }, rightLeg: { x: 318, y: 560, w: 110 } },
    },
    joggers: {
      shape: JOGGER,
      front: (g) => `<path d="${JOGGER}" fill="${g}"/>
        <rect x="306" y="94" width="388" height="56" rx="10" fill="${darker(g, 0.12)}"/>
        <path d="M486 122 L470 220 M514 122 L530 220" stroke="#f2f2f2" stroke-width="5" stroke-linecap="round"/>
        <path d="M296 800 L436 818 L434 868 L292 850 Z M704 800 L564 818 L566 868 L708 850 Z" fill="${darker(g, 0.12)}"/>
        <path d="M330 160 Q360 200 350 240 M670 160 Q640 200 650 240" fill="none" stroke="${darker(g, 0.2)}" stroke-width="4"/>`,
      back: (g) => `<path d="${JOGGER}" fill="${g}"/><rect x="306" y="94" width="388" height="56" rx="10" fill="${darker(g, 0.12)}"/>
        <path d="M296 800 L436 818 L434 868 L292 850 Z M704 800 L564 818 L566 868 L708 850 Z" fill="${darker(g, 0.12)}"/>`,
      slots: { leftLeg: { x: 586, y: 250, w: 84, r: -3 } },
    },
    cap: {
      shape: CAP,
      front: (g) => `<path d="${CAP}" fill="${g}"/>
        <path d="M500 264 Q470 420 480 600 M500 264 Q530 420 520 600" fill="none" stroke="${darker(g, 0.5)}" stroke-width="4"/>
        <path d="M500 264 Q360 330 330 600 M500 264 Q640 330 670 600" fill="none" stroke="#2c2c2e" stroke-width="3"/>
        <ellipse cx="500" cy="266" rx="20" ry="10" fill="#2c2c2e"/>
        <path d="M206 598 Q500 566 794 598 Q806 646 500 672 Q194 646 206 598 Z" fill="#232325"/>
        <path d="M236 616 Q500 596 764 616" fill="none" stroke="#3a3a3c" stroke-width="3" stroke-dasharray="3 7"/>`,
      back: (g) => `<path d="${CAP}" fill="${g}"/>
        <path d="M430 600 Q430 520 500 512 Q570 520 570 600 Z" fill="${darker(g, 0.6)}"/>
        <rect x="440" y="560" width="120" height="16" rx="4" fill="#444"/>
        <ellipse cx="500" cy="266" rx="20" ry="10" fill="#2c2c2e"/>`,
      slots: { front: { x: 420, y: 330, w: 160 }, side: { x: 640, y: 470, w: 100, r: 8 }, back: { x: 450, y: 420, w: 100 } },
    },
  };

  // ---------- products ----------
  const PRODUCTS = {
    signature: { name: "Signature Tee", garment: "tee", color: BLACK, accent: RED, front: [["signature", "chest"]] },
    battletested: { name: "Battle Tested Tee", garment: "tee", color: "#f7f7f5", accent: RED, front: [["battletested", "chest"]] },
    teamtee: { name: "Team Tee", garment: "tee", color: "#c8102e", accent: WHITE, front: [["nomercy", "chest"]] },
    seasontee: { name: "Season Tee", garment: "tee", color: "#f7f7f5", accent: RED, front: [["chest", "leftChest"]], back: [["season", "back"]] },
    united: { name: "United as One Hoodie", garment: "hoodie", color: "#b7b8bb", accent: RED, front: [["united", "chest"]] },
    fearherd: { name: "Fear the Herd Hoodie", garment: "hoodie", color: "#161617", accent: RED, front: [["chest", "leftChest"], ["sleeveWhite", "leftSleeve"]], back: [["fearherd", "back"]], noName: true },
    warmupls: { name: "Long Sleeve Warmup", garment: "longsleeve", color: "#161617", accent: RED, front: [["champions", "chest"]] },
    warmupjacket: { name: "Warmup Jacket", garment: "warmupjacket", color: "#161617", accent: RED, front: [["chest", "leftChest"]] },
    shorts: { name: "Basketball Shorts", garment: "shorts", color: "#161617", accent: RED, front: [["chest", "leftLeg"], ["seasonMark", "rightLeg"]] },
    sweatpants: { name: "Sweatpants", garment: "joggers", color: "#b7b8bb", accent: RED, front: [["sleeveBlack", "leftLeg"]] },
    hat: { name: "Hat", garment: "cap", color: "#161617", accent: RED, front: [["chest", "front"], ["seasonMark", "side"]] },
  };

  function placePrint(printKey, slot) {
    const p = PRINTS[printKey];
    const k = slot.w / p.w;
    const rot = slot.r ? ` rotate(${slot.r})` : "";
    return `<g transform="translate(${slot.x} ${slot.y})${rot} scale(${k})">${p.art()}</g>`;
  }

  // Draws a product from the front or back, with an optional player name on the sleeve.
  function productSvg(key, view = "front", { size = 1000, name = "" } = {}) {
    const P = PRODUCTS[key];
    const G = GARMENTS[P.garment];
    const id = nid("p");
    const c = { accent: P.accent };
    const list = P[view] || [];
    let prints = list.map(([pk, sk]) => placePrint(pk, G.slots[sk])).join("");
    if (view === "front" && name && G.name && !P.noName) {
      const n = G.name;
      const label = String(name).toUpperCase().replace(/[<>&"]/g, "").slice(0, 14);
      const dark = parseInt(P.color.slice(1, 3), 16) < 120;
      prints += T(n.x, n.y, label, { font: F.block, size: n.size, weight: 700, fill: dark ? WHITE : BLACK, ls: 3, rot: n.r });
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="${size}" height="${size}">
      <defs>
        <clipPath id="${id}c"><path d="${G.shape}"/></clipPath>
        <linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".2" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
        <radialGradient id="${id}h" cx=".45" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="500" cy="950" rx="330" ry="26" fill="#000" opacity=".12"/>
      ${G[view](P.color, c)}
      <g clip-path="url(#${id}c)">${prints}</g>
      <g clip-path="url(#${id}c)" style="mix-blend-mode:multiply"><rect width="1000" height="1000" fill="url(#${id}s)"/></g>
      <g clip-path="url(#${id}c)"><rect width="1000" height="1000" fill="url(#${id}h)"/></g>
    </svg>`;
  }

  const hasBack = (key) => !!(PRODUCTS[key].back && PRODUCTS[key].back.length);
  const takesName = (key) => !!GARMENTS[PRODUCTS[key].garment].name && !PRODUCTS[key].noName;

  root.BroncoCollection = { PRINTS, PRODUCTS, GARMENTS, printSvg, productSvg, hasBack, takesName };
})(typeof window !== "undefined" ? window : globalThis);
