/* Generates the illustrated product images in images/products/*.svg
   Run:  node tools/make-product-images.js
   (Real photos can replace any of these — see README.) */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'images', 'products');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- shared paint ---------- */
const lg = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const rg = (id, stops, cx = .5, cy = .5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".6">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
const METAL = [[0, '#8c949d'], [.3, '#eef1f4'], [.55, '#b3bbc4'], [.8, '#f6f8fa'], [1, '#8a929b']];
const DEFS = `<defs>
${lg('blk', [[0, '#555a63'], [.45, '#2a2d33'], [1, '#121417']])}
${lg('blkh', [[0, '#17191c'], [.5, '#3d414a'], [1, '#141619']], 1, 0)}
${lg('wht', [[0, '#ffffff'], [.6, '#eef1f4'], [1, '#cdd3da']])}
${lg('whth', [[0, '#d5dae0'], [.45, '#ffffff'], [1, '#c8ced6']], 1, 0)}
${lg('mtl', METAL, 1, 0)}
${lg('mtlv', METAL)}
${lg('gld', [[0, '#9c6f12'], [.4, '#ffe39a'], [.7, '#d4a52c'], [1, '#9c6f12']], 1, 0)}
${lg('blu', [[0, '#5b9bff'], [.5, '#2160e0'], [1, '#123a99']])}
${lg('grn', [[0, '#49c98a'], [.5, '#17804a'], [1, '#0b4f2d']])}
${lg('pcb', [[0, '#23985a'], [1, '#0d5530']])}
${lg('red', [[0, '#ff6b6b'], [.5, '#d9262f'], [1, '#9e1420']])}
${lg('org', [[0, '#ffb366'], [.5, '#ff7a1a'], [1, '#c95300']])}
${lg('gry', [[0, '#7d8592'], [.5, '#4b5260'], [1, '#2d323b']])}
${lg('scr', [[0, '#1e5eff'], [.55, '#6a3df0'], [1, '#0b1f5c']], 1, 1)}
${lg('gls', [[0, '#ffffff', .55], [.55, '#ffffff', 0]])}
${rg('sh', [[0, '#0f172a', .38], [1, '#0f172a', 0]])}
${rg('lens', [[0, '#7fb4ff'], [.3, '#1b2a4a'], [1, '#03060c']], .38, .38)}
${rg('dome', [[0, '#ffffff'], [.7, '#e4e8ee'], [1, '#b4bcc6']], .35, .3)}
${rg('glass', [[0, '#62728c'], [.55, '#1a2233'], [1, '#080b12']], .35, .3)}
</defs>`;

/* ---------- primitives ---------- */
const r = (x, y, w, h, rx, fill, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${ex}/>`;
const gl = (x, y, w, h, rx) => r(x, y, w, h, rx, 'url(#gls)');
const c = (cx, cy, rr, fill, ex = '') => `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${fill}" ${ex}/>`;
const el = (cx, cy, rx, ry, fill, ex = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${ex}/>`;
const p = (d, fill, ex = '') => `<path d="${d}" fill="${fill}" ${ex}/>`;
const ln = (d, stroke, w, ex = '') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${ex}/>`;
const G = (t, inner) => `<g transform="${t}">${inner}</g>`;
const T = (x, y, rot, inner, s = 1) => G(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, inner);
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const txt = (x, y, s, fill, t, w = 700) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${s}" font-weight="${w}" fill="${fill}">${t}</text>`;
const cable = (d, col = '#1c1e22', w = 11) => ln(d, col, w) + ln(d, '#ffffff', w * .22, 'opacity=".2" transform="translate(-1.5 -1.5)"');
// 3D box: front face at (x,y,w,h), receding up-right by d
const box = (x, y, w, h, d, front, top, side) =>
  p(`M${x} ${y}L${x + d} ${y - d}H${x + w + d}L${x + w} ${y}z`, top) +
  p(`M${x + w} ${y}L${x + w + d} ${y - d}V${y + h - d}L${x + w} ${y + h}z`, side) +
  r(x, y, w, h, 2, front);
const S = (inner, sh = { cx: 200, rx: 150, cy: 284 }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">${DEFS}${sh ? el(sh.cx, sh.cy || 284, sh.rx, 13, 'url(#sh)') : ''}${inner}</svg>`;

/* ---------- connectors (local coords: pointing up, cable exits at 0,0) ---------- */
const relief = (w = 18, h = 26, col = '#1d1f23') => r(-w / 2, -h, w, h + 2, w / 3, col);
const hdmiPlug = (body = 'url(#blk)') => relief() + r(-28, -84, 56, 60, 9, body) + gl(-28, -84, 56, 28, 9) +
  p('M-23 -112h46v24l-6 6h-34l-6-6z', 'url(#mtl)') + r(-17, -108, 34, 9, 2, '#1a1a1a') + r(-14, -106, 28, 3, 1, 'url(#gld)');
const dpPlug = (body = 'url(#blk)') => relief() + r(-28, -84, 56, 60, 9, body) + gl(-28, -84, 56, 28, 9) +
  p('M-22 -112h38l6 6v24h-44z', 'url(#mtl)') + r(-16, -106, 28, 9, 2, '#1a1a1a');
const vgaPlug = (body = 'url(#blu)') => relief(20, 28) + p('M-40 -88h80v58q0 8-8 8h-64q-8 0-8-8z', body) + gl(-40, -88, 80, 28, 6) +
  r(-58, -100, 116, 14, 3, 'url(#mtl)') + p('M-36 -126h72l-7 26h-58z', 'url(#mtl)', 'stroke="#7d858e" stroke-width="1.5"') +
  rep(5, i => c(-24 + i * 12, -120, 2.3, '#4b5563')) + rep(5, i => c(-22 + i * 11, -113, 2.3, '#4b5563')) + rep(5, i => c(-20 + i * 10, -106, 2.3, '#4b5563')) +
  r(-56, -124, 12, 26, 3, 'url(#mtl)') + r(44, -124, 12, 26, 3, 'url(#mtl)');
const usbA = (body = 'url(#blk)') => relief(16, 24) + r(-20, -76, 40, 54, 8, body) + gl(-20, -76, 40, 24, 8) +
  r(-16, -112, 32, 38, 2, 'url(#mtl)') + r(-9, -104, 6, 6, 1, '#4b5563') + r(3, -104, 6, 6, 1, '#4b5563');
const usbB = (body = 'url(#blk)') => relief(16, 24) + r(-22, -76, 44, 54, 8, body) + gl(-22, -76, 44, 24, 8) +
  r(-16, -106, 32, 32, 3, 'url(#mtl)') + r(-10, -100, 20, 14, 2, '#3a3f46');
const indianPlug = () => relief(18, 22) + p('M-36 -20h72l6-58q0-10-10-10h-64q-10 0-10 10z', 'url(#blk)') + gl(-38, -88, 76, 30, 8) +
  r(-26, -112, 10, 26, 5, 'url(#mtl)') + r(16, -112, 10, 26, 5, 'url(#mtl)') + r(-6, -124, 12, 38, 6, 'url(#mtl)');
const iecPlug = () => relief() + p('M-32 -86h64v58q0 8-8 8h-48q-8 0-8-8z', 'url(#blk)') + gl(-32, -86, 64, 26, 6) +
  p('M-28 -104h56v14l-6 6h-44l-6-6z', '#2a2d33') + r(-20, -100, 8, 9, 1, '#000') + r(-4, -100, 8, 9, 1, '#000') + r(12, -100, 8, 9, 1, '#000');
const WIRES = ['#f5a25d', '#ff7a1a', '#9be59b', '#2b6cff', '#c6dbff', '#3fbf7f', '#e9d7c3', '#8a5a3b'];
const rj45Head = () => r(-20, -46, 40, 46, 3, 'rgba(225,238,252,.85)', 'stroke="#9fb3c8" stroke-width="1.5"') +
  rep(8, i => r(-16 + i * 4.2, -44, 2.4, 12, .5, 'url(#gld)')) + rep(8, i => r(-16 + i * 4.2, -30, 2.4, 28, 1, WIRES[i])) +
  p('M-10 -14l-6 22h7l5-20z', 'rgba(200,220,240,.9)', 'stroke="#9fb3c8"');
const rj45 = (boot = '#2b6cff') => relief(14, 24, boot) + p('M-22 -62h44l-5 40h-34z', boot) + gl(-22, -62, 44, 20, 3) + T(0, -60, 0, rj45Head());
const dcBarrel = () => relief(10, 18) + r(-10, -60, 20, 44, 6, 'url(#blk)') + gl(-10, -60, 20, 20, 6) + r(-6, -84, 12, 26, 2, 'url(#mtl)') + c(0, -84, 2.5, '#333');
const typeCPlug = (body = 'url(#blk)') => relief(10, 20) + r(-15, -66, 30, 48, 8, body) + gl(-15, -66, 30, 20, 8) + r(-11, -92, 22, 28, 10, 'url(#mtl)') + r(-6, -86, 12, 4, 2, '#333');
const sataPlug = () => relief(12, 16, '#d9262f') + r(-22, -60, 44, 44, 5, 'url(#blk)') + gl(-22, -60, 44, 18, 5) + p('M-20 -76h40v16h-40v-6h8v-4h-8z', '#222');
const cableScene = (L, R, col = '#1c1e22', w = 11) => S(
  cable('M150 236C150 306 60 300 66 232C72 150 328 150 334 232C340 300 250 306 250 236', col, w) + T(150, 238, -10, L) + T(250, 238, 10, R),
  { cx: 200, rx: 168 });

/* ---------- small helpers for scenes ---------- */
const keyboard = (ox, oy, w, h) => {
  const bl = [ox - .35 * h, oy + .55 * h], br = [ox + w - .35 * h, oy + .55 * h];
  const cols = 15, rows = 5, pad = 10, kw = (w - 2 * pad) / cols, kh = (h - 2 * pad) / rows;
  let keys = '';
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    if (j === 4 && i > 3 && i < 11) { if (i === 4) keys += r(pad + 4 * kw, pad + 4 * kh, 7 * kw - 3, kh - 3, 3, '#3a3e45'); continue; }
    keys += r(pad + i * kw, pad + j * kh, kw - 3, kh - 3, 3, '#3a3e45') + r(pad + i * kw, pad + j * kh, kw - 3, (kh - 3) * .45, 3, '#4b5059');
  }
  return p(`M${bl[0]} ${bl[1]}L${br[0]} ${br[1]}l3 12L${bl[0] + 3} ${bl[1] + 12}z`, '#0b0c0e') +
    G(`matrix(1 0 -.35 .55 ${ox} ${oy})`, r(0, 0, w, h, 10, 'url(#blk)') + keys);
};
const mouseShape = (accent = '') => p('M0 -62C36 -62 42 -12 38 28C34 64 -34 64 -38 28C-42 -12 -36 -62 0 -62z', 'url(#blk)') +
  ln('M0 -62V-14', '#0b0c0e', 2) + ln('M-37 -12Q0 -4 37 -12', '#0b0c0e', 1.5, 'opacity=".6"') + r(-4, -50, 8, 18, 4, '#6b7280') +
  p('M-20 -54C-10 -60 10 -60 20 -54L14 -30C4 -34 -4 -34 -14 -30z', 'url(#gls)', 'opacity=".7"') + accent;
const port = {
  hdmi: (x, y) => p(`M${x - 16} ${y - 7}h32v9l-5 6h-22l-5-6z`, '#0a0a0a', 'stroke="#c3cad3" stroke-width="2"'),
  usb: (x, y) => r(x - 12, y - 5, 24, 10, 1.5, '#0a0a0a', 'stroke="#c3cad3" stroke-width="2"') + r(x - 8, y - 2, 16, 3, 1, '#2b6cff'),
  rj45: (x, y) => r(x - 12, y - 10, 24, 20, 2, '#0a0a0a', 'stroke="#c3cad3" stroke-width="2"') + r(x - 4, y + 6, 8, 4, 0, '#0a0a0a'),
  vga: (x, y) => p(`M${x - 20} ${y - 8}h40l-4 16h-32z`, '#16181b', 'stroke="#c3cad3" stroke-width="2"') + rep(5, i => c(x - 12 + i * 6, y - 2, 1.4, '#9aa2ab')) + rep(4, i => c(x - 9 + i * 6, y + 3, 1.4, '#9aa2ab')),
  dc: (x, y) => c(x, y, 7, '#0a0a0a', 'stroke="#c3cad3" stroke-width="2"') + c(x, y, 2, '#c3cad3'),
  typec: (x, y) => r(x - 10, y - 4, 20, 8, 4, '#0a0a0a', 'stroke="#c3cad3" stroke-width="2"')
};
const led = (x, y, col = '#22c55e') => c(x, y, 3.5, col) + c(x, y, 7, col, 'opacity=".25"');
const bnc = () => r(-10, -18, 20, 20, 3, 'url(#mtl)') + r(-13, -50, 26, 34, 3, 'url(#mtl)') + rep(3, i => r(-13, -46 + i * 10, 26, 2, 0, '#8c949d')) +
  r(-17, -74, 34, 24, 4, 'url(#mtl)') + r(-17, -64, 34, 3, 0, '#8c949d') + c(0, -82, 9, '#e9edf2', 'stroke="#8c949d" stroke-width="2"') + c(0, -82, 2.5, 'url(#gld)');
const bottle = (x, col, w = 56, h = 110, y = 140) => r(x, y, w, h, 10, col) + gl(x, y, w * .45, h, 10) + r(x, y + 40, w, 40, 0, '#ffffff', 'opacity=".9"') +
  r(x + 8, y + 52, w - 16, 6, 3, col) + r(x + 8, y + 64, w - 26, 4, 2, '#9aa2ab') + r(x + w / 2 - 12, y - 22, 24, 24, 4, '#e9edf2') + r(x + w / 2 - 16, y - 46, 32, 26, 6, col) + gl(x + w / 2 - 16, y - 46, 32, 12, 6);
const chipRow = (n, x, y, w, h, gap) => rep(n, i => r(x + i * (w + gap), y, w, h, 2, '#111317') + r(x + i * (w + gap), y, w, h * .3, 2, '#2a2d33'));
const fingers = (n, x, y, step, w = 3.2, h = 12) => rep(n, i => r(x + i * step, y, w, h, .5, 'url(#gld)'));
const screw = (x, y, rr = 5) => c(x, y, rr, 'url(#mtl)', 'stroke="#8c949d"') + ln(`M${x - rr * .6} ${y}h${rr * 1.2}`, '#6b7280', 1.2);

/* ---------- scenes ---------- */
const IMG = {};

// cables
IMG.vga = cableScene(vgaPlug(), vgaPlug());
IMG.hdmi = cableScene(hdmiPlug(), hdmiPlug());
IMG['hdmi-braided'] = cableScene(hdmiPlug('url(#gry)'), hdmiPlug('url(#gry)'), '#454b59', 12);
IMG.power = cableScene(indianPlug(), iecPlug());
IMG.usb = cableScene(usbA(), usbB(), '#2b2e33', 9);
IMG.sata = cableScene(sataPlug(), sataPlug(), '#d9262f', 8);
IMG.db9 = cableScene(vgaPlug('url(#gry)'), vgaPlug('url(#gry)'), '#8b929c', 10);
IMG['dp-vga'] = cableScene(dpPlug(), vgaPlug());
IMG.lan = cableScene(rj45('#2b6cff'), rj45('#2b6cff'), '#2b6cff', 9);
IMG.poe = cableScene(rj45('#1c1e22'), dcBarrel(), '#1c1e22', 9);
IMG['cable-box'] = S(
  p('M100 110h170v170h-170z', 'url(#blu)') + p('M270 110l50-30v170l-50 30z', '#0f3a99') + p('M100 110l50-30h170l-50 30z', '#7fb0ff') +
  r(118, 140, 134, 70, 8, '#fff') + txt(185, 172, 22, '#123a99', 'CAT6') + txt(185, 196, 13, '#6b7280', '305 M · 23 AWG', 600) +
  r(118, 228, 134, 6, 3, '#fff', 'opacity=".5"') + r(118, 242, 90, 6, 3, '#fff', 'opacity=".35"') +
  c(296, 196, 9, '#0b2a70') + cable('M296 196C340 205 352 268 300 280S240 286 232 300', '#2b6cff', 7), { cx: 210, rx: 150, cy: 286 });
IMG['rj45-pack'] = S(
  T(120, 230, -30, rj45Head(), 1.5) + T(200, 220, 10, rj45Head(), 1.6) + T(280, 236, 40, rj45Head(), 1.5) +
  T(160, 270, -75, rj45Head(), 1.4) + T(250, 280, 80, rj45Head(), 1.4) + T(205, 150, -5, rj45Head(), 1.3), { cx: 200, rx: 150, cy: 290 });
IMG['cctv-coil'] = S(
  rep(9, i => el(200, 128 + i * 13, 140, 52, 'none', 'stroke="#cfd5dc" stroke-width="13"') + el(200, 128 + i * 13, 140, 52, 'none', 'stroke="#ffffff" stroke-width="9"')) +
  el(200, 232, 82, 26, '#e2e6eb') + r(150, 214, 100, 44, 8, 'url(#org)') + txt(200, 236, 14, '#fff', 'CCTV 3+1') + txt(200, 251, 10, '#fff', 'COPPER', 600) +
  cable('M338 180C370 190 372 240 340 250', '#f3f5f8', 9), { cx: 200, rx: 165, cy: 286 });

// keyboard & mouse
IMG.keyboard = S(keyboard(112, 128, 270, 130), { cx: 200, rx: 180, cy: 218 });
IMG.combo = S(keyboard(86, 118, 230, 118) + G('translate(345 208) scale(.85 .6) rotate(-14)', mouseShape()), { cx: 210, rx: 180, cy: 214 });
IMG.mouse = S(G('translate(200 170) scale(1.9 1.45) rotate(-12)', mouseShape()), { cx: 200, rx: 95, cy: 266 });
IMG['gaming-mouse'] = S(G('translate(200 170) scale(1.9 1.45) rotate(-12)', mouseShape(
  ln('M-37 -8C-42 20-32 48 0 58C32 48 42 20 37 -8', '#2b9bff', 3.5) + ln('M-30 30Q0 44 30 30', '#ff7a1a', 4) + c(0, -40, 3, '#ff3d7f'))), { cx: 200, rx: 95, cy: 266 });
IMG.mousepad = S(
  p('M70 160L330 160L372 248L28 248z', '#1f2226') + p('M28 248L372 248l0 9L28 257z', '#0b0c0e') +
  ln('M76 166L324 166L362 242L38 242z', '#5b6170', 1.5, 'stroke-dasharray="4 4"') +
  G('translate(250 196) scale(.9 .55) rotate(-12)', mouseShape()), { cx: 200, rx: 185, cy: 262 });
IMG['mousepad-xl'] = S(
  p('M40 170L360 170L394 236L6 236z', '#1b1d21') + p('M6 236L394 236l0 7L6 243z', '#0b0c0e') + ln('M40 170L360 170L394 236L6 236z', '#ff7a1a', 3) +
  G('translate(300 202) scale(.7 .42) rotate(-12)', mouseShape()) + G('translate(70 200) scale(.38) ', '') +
  p('M120 184l18-8h96l-6 8z', '#2a2d33', 'opacity=".6"'), { cx: 200, rx: 195, cy: 250 });
IMG['mousepad-rest'] = S(
  p('M70 140L320 140L356 236L34 236z', '#22252a') + ln('M76 146L314 146L348 230L42 230z', '#5b6170', 1.5, 'stroke-dasharray="4 4"') +
  p('M34 236Q195 206 356 236L360 258Q195 240 30 258z', '#15171a') + p('M40 238Q195 212 350 238', 'none', 'stroke="#3d414a" stroke-width="2"') +
  G('translate(220 182) scale(.8 .5) rotate(-10)', mouseShape()), { cx: 196, rx: 185, cy: 266 });

// tools & accessories
IMG.toolkit = S(
  r(56, 82, 288, 184, 20, 'url(#blk)') + r(56, 82, 288, 184, 20, 'none', 'stroke="#ff7a1a" stroke-width="3" stroke-dasharray="6 4"') +
  r(72, 98, 256, 152, 12, '#2a2d33') + rep(12, i => r(86 + i * 20, 112, 12, 46, 3, 'url(#mtl)') + r(86 + i * 20, 112, 12, 14, 2, i % 3 ? '#d9262f' : '#2b6cff')) +
  r(86, 186, 96, 28, 14, 'url(#org)') + gl(86, 186, 96, 12, 14) + r(180, 194, 126, 12, 3, 'url(#mtl)') +
  ln('M90 232L300 226', '#c3cad3', 5) + ln('M90 240L300 236', '#9aa2ab', 4), { cx: 200, rx: 165, cy: 278 });
IMG.paste = S(G('translate(210 170) rotate(-22)',
  r(-170, -6, 52, 12, 3, '#e9edf2') + r(-182, -24, 14, 48, 5, '#d4d9df') + r(-120, -18, 180, 36, 10, 'url(#mtlv)') + r(-110, -12, 150, 24, 8, '#aab2bc') +
  r(-80, -18, 90, 36, 0, 'url(#org)') + txt(-35, 6, 12, '#fff', 'THERMAL') + r(60, -11, 36, 22, 4, 'url(#mtlv)') + p('M96 -8L142 -3V3L96 8z', 'url(#mtlv)')), { cx: 200, rx: 150, cy: 262 });
IMG.wristband = S(
  el(140, 186, 72, 44, 'none', 'stroke="url(#blu)" stroke-width="24"') + el(140, 186, 72, 44, 'none', 'stroke="#ffffff" stroke-width="2" opacity=".35"') +
  c(208, 178, 11, 'url(#mtl)') + rep(16, i => el(220 + i * 8, 184 + i * 2.6, 6, 14, 'none', 'stroke="#d9262f" stroke-width="3"')) +
  r(348, 216, 36, 16, 5, 'url(#mtl)') + p('M382 218l12 -6v24l-12 -6z', 'url(#mtl)'), { cx: 220, rx: 170, cy: 262 });
IMG['hdmi-splitter'] = S(
  box(70, 150, 240, 84, 40, 'url(#blk)', '#3b3f46', '#16181b') + gl(70, 150, 240, 30, 2) +
  port.hdmi(110, 196) + port.hdmi(165, 196) + port.hdmi(220, 196) + led(264, 178) + led(284, 178, '#3b82f6') + port.dc(282, 206), { cx: 210, rx: 170, cy: 254 });
IMG['hdmi-switch'] = S(
  box(50, 140, 220, 80, 36, 'url(#blk)', '#3b3f46', '#16181b') + gl(50, 140, 220, 28, 2) +
  port.hdmi(90, 186) + port.hdmi(140, 186) + port.hdmi(190, 186) + led(236, 168) + led(250, 168, '#3b82f6') +
  G('translate(330 226) rotate(-62) scale(1 .62)', r(-22, -62, 44, 124, 14, 'url(#blk)') + gl(-22, -62, 44, 50, 14) +
    c(0, -40, 7, '#d9262f') + rep(3, i => r(-12, -18 + i * 20, 24, 10, 4, '#3a3e45'))), { cx: 210, rx: 180, cy: 256 });
IMG.kvm = S(
  box(60, 150, 250, 84, 40, 'url(#gry)', '#6b7280', '#2d323b') + gl(60, 150, 250, 30, 2) +
  port.vga(104, 182) + port.vga(170, 182) + port.usb(100, 212) + port.usb(130, 212) + port.usb(166, 212) + port.usb(196, 212) +
  r(236, 176, 48, 30, 6, '#1c1e22') + led(250, 191) + led(270, 191, '#f59e0b'), { cx: 210, rx: 170, cy: 254 });
IMG.extender = S(
  cable('M150 208C190 286 214 286 252 208', '#2b6cff', 8) +
  box(40, 160, 120, 66, 26, 'url(#blk)', '#3b3f46', '#16181b') + port.hdmi(78, 196) + port.rj45(130, 196) + led(64, 176) +
  box(236, 160, 120, 66, 26, 'url(#blk)', '#3b3f46', '#16181b') + port.rj45(266, 196) + port.hdmi(318, 196) + led(342, 176, '#3b82f6'), { cx: 205, rx: 180, cy: 254 });
IMG.webcam = S(
  p('M140 214h120l22 52h-164z', 'url(#blk)') + r(188, 168, 24, 50, 6, '#1d1f23') +
  r(100, 86, 200, 86, 43, 'url(#blk)') + gl(100, 86, 200, 36, 43) + c(200, 129, 32, '#0b0c0e') + c(200, 129, 24, 'url(#lens)') + c(191, 120, 6, '#fff', 'opacity=".6"') +
  rep(4, i => c(130 + i * 6, 129, 1.6, '#6b7280')) + rep(4, i => c(252 + i * 6, 129, 1.6, '#6b7280')) + led(246, 108), { cx: 205, rx: 120, cy: 272 });

// CCTV
IMG.dome = S(
  p('M78 214v20a122 34 0 0 0 244 0v-20z', 'url(#whth)') + el(200, 214, 122, 34, 'url(#wht)') +
  p('M108 212A92 92 0 0 1 292 212z', 'url(#glass)') + c(200, 168, 20, 'url(#lens)') + c(193, 161, 5, '#fff', 'opacity=".7"') +
  p('M128 196A74 74 0 0 1 182 132', 'none', 'stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".35"') +
  rep(6, i => c(168 + i * 13, 196, 3, '#7a1a1a', 'opacity=".8"')), { cx: 200, rx: 135, cy: 266 });
IMG.bullet = S(
  r(170, 188, 26, 62, 8, 'url(#whth)') + r(126, 244, 112, 18, 7, 'url(#wht)') + screw(140, 253, 4) + screw(224, 253, 4) +
  G('translate(200 146) rotate(10)',
    r(-130, -42, 230, 84, 38, 'url(#wht)') + gl(-130, -42, 230, 34, 38) + p('M-120 -50H128Q142 -50 142 -38V-30H-120z', 'url(#whth)') +
    el(98, 0, 16, 40, '#1b1f27') + c(100, 0, 18, 'url(#lens)') + c(96, -6, 4, '#fff', 'opacity=".7"') + rep(6, i => c(106, -30 + i * 12, 2.2, '#7a1a1a'))), { cx: 200, rx: 140, cy: 270 });
IMG['wifi-cam'] = S(
  r(140, 200, 120, 60, 26, 'url(#wht)') + gl(140, 200, 120, 22, 26) + led(200, 246, '#3b82f6') +
  c(200, 146, 76, 'url(#dome)') + el(200, 148, 52, 44, '#141924') + c(200, 146, 20, 'url(#lens)') + c(193, 139, 5, '#fff', 'opacity=".7"') +
  c(232, 128, 3, '#22c55e') + c(168, 128, 3, '#7a1a1a'), { cx: 200, rx: 120, cy: 268 });
IMG.bnc = S(T(110, 250, -55, bnc(), 1.3) + T(180, 262, -15, bnc(), 1.35) + T(250, 258, 25, bnc(), 1.3) + T(310, 240, 70, bnc(), 1.25) + T(210, 180, -80, bnc(), 1.1), { cx: 205, rx: 160, cy: 278 });
IMG['dc-connector'] = S(
  box(70, 168, 86, 48, 18, 'url(#grn)', '#5fd39a', '#0c5a33') + screw(96, 158, 6) + screw(126, 158, 6) + r(156, 180, 56, 26, 8, 'url(#blk)') + r(212, 186, 26, 14, 3, 'url(#mtl)') +
  box(252, 168, 86, 48, 18, 'url(#grn)', '#5fd39a', '#0c5a33') + screw(278, 158, 6) + screw(308, 158, 6) + port.dc(296, 194), { cx: 205, rx: 160, cy: 250 });
IMG['dc-cable'] = S(
  cable('M78 178C150 110 250 280 322 200', '#1c1e22', 8) + cable('M78 188C150 120 250 290 322 210', '#d9262f', 8) +
  T(76, 186, -100, dcBarrel(), 1.1) + T(324, 206, 95, dcBarrel(), 1.1), { cx: 200, rx: 165, cy: 270 });
const dvr = (ledCol, label) => S(
  box(48, 148, 270, 74, 46, 'url(#blk)', '#3b3f46', '#16181b') + rep(10, i => r(100 + i * 16, 112, 10, 3, 1.5, '#23262b', 'transform="skewX(-45) translate(110 0)"')) +
  gl(48, 148, 270, 26, 2) + rep(4, i => led(80 + i * 18, 184, i === 3 ? '#f59e0b' : ledCol)) + r(160, 176, 70, 16, 4, '#26292e') + txt(195, 189, 11, '#9aa2ab', label) +
  port.usb(274, 186) + ln('M60 212H306', '#000', 1, 'opacity=".5"'), { cx: 210, rx: 175, cy: 248 });
IMG.dvr = dvr('#22c55e', 'DVR');
IMG.nvr = dvr('#3b82f6', 'NVR · POE');
IMG.rack = S(
  box(110, 76, 170, 196, 40, 'url(#gry)', '#7d8592', '#2d323b') + r(124, 90, 142, 168, 4, 'rgba(20,28,45,.82)') +
  r(134, 190, 122, 30, 2, '#2a2d33') + rep(3, i => led(146 + i * 10, 205)) + p('M124 90L190 90L124 170z', '#fff', 'opacity=".08"') +
  rep(6, i => r(140 + i * 18, 102, 10, 3, 1.5, '#4b5563')) + r(254, 150, 6, 44, 3, 'url(#mtl)'), { cx: 210, rx: 130, cy: 280 });
IMG.junction = S(
  box(110, 136, 170, 116, 44, 'url(#wht)', '#ffffff', '#c8ced6') + r(118, 144, 154, 100, 8, 'none', 'stroke="#c3cad3" stroke-width="2"') +
  rep(4, i => c([128, 262, 128, 262][i], [154, 154, 234, 234][i], 4.5, '#d4d9df', 'stroke="#aab2bc"')) + c(302, 150, 9, '#e3e7ec', 'stroke="#aab2bc"') + c(302, 200, 9, '#e3e7ec', 'stroke="#aab2bc"'), { cx: 210, rx: 140, cy: 270 });
IMG.bracket = S(
  r(118, 60, 70, 210, 10, 'url(#whth)') + screw(153, 84, 6) + screw(153, 246, 6) +
  p('M188 128h96q22 0 22 22v58h-34v-46h-84z', 'url(#wht)') + gl(188, 128, 118, 30, 10) + el(289, 214, 48, 12, '#dfe3e8') + el(289, 210, 48, 12, 'url(#wht)') +
  rep(3, i => c(270 + i * 18, 210, 3.5, '#aab2bc')), { cx: 210, rx: 130, cy: 278 });
IMG.raincap = S(
  el(200, 226, 136, 28, '#b9c1ca') + p('M64 226A136 130 0 0 1 336 226z', 'url(#dome)') + el(200, 226, 112, 20, '#8c949d') + el(200, 228, 104, 16, '#5b6170') +
  p('M100 190A110 110 0 0 1 180 112', 'none', 'stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".6"'), { cx: 200, rx: 150, cy: 266 });
IMG['ceiling-mount'] = S(
  el(200, 56, 70, 14, '#2a2d33') + r(130, 46, 140, 12, 6, 'url(#blk)') + r(188, 58, 24, 160, 6, 'url(#blkh)') + r(182, 128, 36, 16, 5, 'url(#mtl)') + screw(200, 136, 4) +
  r(176, 210, 48, 18, 6, 'url(#blk)') + ln('M200 228L120 262M200 228L280 262M200 228L150 276M200 228L250 276', '#1d1f23', 10) + rep(4, i => c([120, 280, 150, 250][i], [262, 262, 276, 276][i], 6, 'url(#mtl)')), { cx: 200, rx: 120, cy: 288 });
IMG['tv-mount'] = S(
  r(78, 70, 86, 190, 10, 'url(#blk)') + rep(4, i => r(104, 92 + i * 42, 34, 10, 5, '#0b0c0e')) +
  ln('M164 130L262 150', '#1d1f23', 18) + ln('M164 210L262 190', '#1d1f23', 18) + ln('M164 130L262 150', '#4b5059', 3, 'opacity=".6"') +
  r(250, 66, 28, 200, 8, 'url(#blkh)') + r(306, 66, 28, 200, 8, 'url(#blkh)') + r(250, 160, 84, 20, 6, 'url(#blk)') + screw(264, 86, 5) + screw(320, 86, 5) + screw(264, 246, 5) + screw(320, 246, 5), { cx: 210, rx: 150, cy: 278 });

// printer
IMG.ink = S(
  p('M120 92l30-20h150l-30 20z', '#4b5059') + p('M270 92l30-20v134l-30 34z', '#16181b') +
  p('M120 92h150v136q0 12-12 12h-38v30h-50v-30h-38q-12 0-12-12z', 'url(#blk)') + gl(120, 92, 150, 40, 4) +
  r(136, 110, 118, 50, 6, '#eef1f4') + r(146, 122, 70, 9, 3, '#1c1e22') + r(146, 140, 96, 6, 3, '#9aa2ab') + txt(232, 131, 12, '#1c1e22', 'XL') +
  r(170, 196, 50, 30, 3, 'url(#gld)') + rep(6, i => r(176 + i * 7, 200, 3, 22, 1, '#9c6f12', 'opacity=".5"')), { cx: 210, rx: 120, cy: 278 });
IMG['toner-cart'] = S(
  box(46, 150, 290, 84, 42, 'url(#blk)', '#3b3f46', '#16181b') + ln('M150 128Q210 92 270 128', '#2a2d33', 12) + gl(46, 150, 290, 30, 2) +
  r(58, 162, 20, 60, 4, 'url(#org)') + r(150, 166, 120, 44, 6, '#eef1f4') + txt(210, 194, 18, '#1c1e22', '12A') + rep(6, i => r(296, 170 + i * 8, 26, 3, 1.5, '#0b0c0e')), { cx: 210, rx: 180, cy: 256 });
IMG['ink-bottles'] = S(['#1c1e22', '#00a3e0', '#e6007e', '#f5c400'].map((col, i) => bottle(72 + i * 72, col)).join(''), { cx: 210, rx: 160, cy: 262 });
IMG['toner-bottle'] = S(
  r(110, 112, 130, 156, 24, 'url(#blkh)') + p('M110 136Q110 104 150 100h50q40 4 40 36z', '#2a2d33') + r(150, 80, 50, 26, 6, '#2a2d33') + r(142, 56, 66, 30, 9, 'url(#blk)') + gl(142, 56, 66, 14, 9) +
  r(122, 152, 106, 76, 8, '#fff') + txt(175, 184, 18, '#1c1e22', 'TONER') + r(134, 196, 82, 8, 4, 'url(#org)') + txt(175, 220, 12, '#6b7280', 'POWDER', 600) +
  r(262, 186, 64, 82, 14, 'url(#blkh)') + r(278, 168, 32, 22, 5, '#2a2d33') + r(268, 208, 52, 34, 5, '#fff') + r(276, 222, 36, 6, 3, 'url(#org)'), { cx: 210, rx: 140, cy: 276 });
IMG.drum = S(G('translate(200 172) rotate(-12)',
  r(-176, -5, 30, 10, 2, 'url(#mtlv)') + r(146, -5, 30, 10, 2, 'url(#mtlv)') + r(-150, -32, 300, 64, 6, 'url(#grn)') + gl(-150, -32, 300, 22, 6) +
  el(-150, 0, 14, 32, '#e6e9ee') + el(150, 0, 14, 32, '#e6e9ee') + rep(10, i => r(-160, -30 + i * 6.4, 6, 3, 1, '#c3cad3')) + el(150, 0, 6, 14, '#9aa2ab')), { cx: 200, rx: 175, cy: 262 });
IMG.printer = S(
  p('M100 240h200l14 26h-228z', '#d4d9df') + box(64, 136, 266, 110, 50, 'url(#wht)', '#f6f8fa', '#cdd3da') +
  p('M90 136l26-26h190l-26 26z', '#2a2d33') + p('M136 118l14-14h120l-14 14z', '#ffffff', 'stroke="#cfd5dc"') +
  r(250, 150, 64, 24, 5, '#1c1e22') + led(264, 162) + r(276, 158, 30, 8, 2, '#4b5059') +
  r(64, 214, 266, 4, 0, '#cfd5dc') + r(170, 224, 60, 10, 5, '#c3cad3'), { cx: 210, rx: 175, cy: 270 });

// laptop
IMG['adapter-laptop'] = S(
  cable('M92 206C40 206 38 268 110 268', '#1c1e22', 8) + cable('M302 166C352 146 372 214 330 238C300 258 256 252 240 262', '#1c1e22', 7) +
  box(92, 170, 180, 66, 34, 'url(#blk)', '#3b3f46', '#16181b') + gl(92, 170, 180, 24, 2) + r(112, 186, 96, 34, 4, '#2a2d33') +
  txt(160, 208, 11, '#9aa2ab', '65W · 19.5V', 600) + led(246, 196, '#3b82f6') + T(236, 263, -95, r(-6, -46, 12, 46, 4, 'url(#blk)') + r(-4, -66, 8, 22, 2, 'url(#mtl)')), { cx: 200, rx: 165, cy: 282 });
IMG['charger-c'] = S(
  cable('M196 236C202 296 304 300 320 238', '#e9edf2', 8) + box(136, 128, 116, 116, 30, 'url(#wht)', '#ffffff', '#cdd3da') + gl(136, 128, 116, 40, 2) +
  port.typec(194, 222) + txt(194, 186, 14, '#9aa2ab', '65W') + T(320, 240, 18, typeCPlug('url(#wht)')), { cx: 220, rx: 140, cy: 286 });
IMG.backpack = S(
  r(108, 82, 24, 170, 12, '#1d1f23') + r(268, 82, 24, 170, 12, '#1d1f23') +
  p('M120 84Q120 50 200 50Q280 50 280 84V258Q280 278 260 278H140Q120 278 120 258z', 'url(#gry)') + ln('M180 52Q200 26 220 52', '#1d1f23', 7) +
  ln('M134 120Q200 100 266 120', '#9aa2ab', 2.5) + p('M138 166h124v92q0 10-10 10h-104q-10 0-10-10z', '#2d323b') + ln('M140 182H260', '#9aa2ab', 2.5) +
  r(242, 176, 7, 20, 3, 'url(#org)') + r(158, 110, 7, 20, 3, 'url(#org)') + gl(124, 56, 152, 70, 30), { cx: 200, rx: 110, cy: 284 });
IMG.sleeve = S(G('translate(200 172) rotate(-8)',
  r(-145, -92, 290, 184, 24, '#34425a') + gl(-145, -92, 290, 70, 24) + r(-133, -80, 266, 160, 16, 'none', 'stroke="#6b7c99" stroke-width="2" stroke-dasharray="5 4"') +
  ln('M-120 -92H120', '#1d2533', 5) + r(110, -100, 10, 24, 4, 'url(#mtl)') + r(-40, 40, 80, 22, 6, '#ff7a1a', 'opacity=".9"')), { cx: 200, rx: 165, cy: 278 });
IMG.battery = S(
  box(56, 162, 280, 64, 32, 'url(#blk)', '#3b3f46', '#16181b') + gl(56, 162, 280, 22, 2) + r(76, 174, 160, 40, 5, '#eef1f4') +
  r(88, 184, 90, 8, 3, '#1c1e22') + r(88, 198, 120, 5, 2, '#9aa2ab') + r(254, 178, 54, 18, 3, 'url(#gld)') + rep(6, i => r(258 + i * 8, 181, 3, 12, 1, '#9c6f12')), { cx: 210, rx: 180, cy: 250 });
IMG.otg = S(
  r(146, 140, 108, 64, 12, 'url(#mtlv)') + r(160, 154, 46, 36, 3, '#1c1e22') + r(166, 160, 34, 9, 1, '#2b6cff') +
  r(254, 156, 40, 32, 15, 'url(#mtlv)') + r(262, 166, 24, 12, 6, '#4b5059') + gl(146, 140, 108, 22, 12), { cx: 216, rx: 105, cy: 236 });
IMG['c-hdmi'] = S(
  cable('M132 186C88 186 76 238 112 254', '#5b6170', 8) + T(110, 256, 160, typeCPlug('url(#gry)')) +
  r(130, 150, 170, 72, 22, 'url(#gry)') + gl(130, 150, 170, 28, 22) + port.hdmi(276, 186) + led(160, 186, '#3b82f6'), { cx: 210, rx: 140, cy: 280 });
IMG['c-hub'] = S(
  cable('M74 196C30 196 32 258 86 262', '#454b59', 9) + T(90, 262, 100, typeCPlug('url(#gry)')) +
  box(72, 170, 254, 56, 40, 'url(#mtlv)', '#eef1f4', '#8c949d') + gl(72, 170, 254, 20, 2) +
  port.hdmi(112, 198) + port.usb(160, 198) + port.usb(196, 198) + port.usb(232, 198) + r(256, 194, 30, 6, 2, '#0a0a0a') + port.typec(304, 198), { cx: 210, rx: 175, cy: 270 });

// networking
IMG.crimper = S(
  p('M108 86h134l22 46h-176z', 'url(#mtl)') + gl(108, 86, 134, 18, 4) + r(128, 102, 24, 18, 2, '#2a2d33') + r(166, 104, 18, 14, 2, '#2a2d33') + r(198, 106, 14, 10, 2, '#2a2d33') +
  c(176, 140, 10, 'url(#mtl)', 'stroke="#8c949d"') + p('M126 132L94 278h34l34-146z', 'url(#red)') + p('M226 132L286 268h-34l-58-136z', 'url(#red)') +
  r(96, 220, 30, 56, 8, '#1d1f23', 'transform="rotate(12 111 248)"') + r(256, 210, 30, 56, 8, '#1d1f23', 'transform="rotate(-24 271 238)"'), { cx: 195, rx: 120, cy: 286 });
IMG.tester = S(
  r(70, 100, 150, 176, 16, 'url(#blu)') + gl(70, 100, 150, 60, 16) + r(86, 116, 118, 120, 8, '#0f2a6b') +
  rep(8, i => led(110, 128 + i * 13)) + rep(8, i => r(124, 125 + i * 13, 60, 5, 2, '#2b4f9e')) + port.rj45(145, 254) + c(196, 254, 8, '#d9262f') +
  r(244, 160, 82, 116, 14, 'url(#blu)') + gl(244, 160, 82, 40, 14) + rep(4, i => led(262 + (i % 2) * 18, 186 + Math.floor(i / 2) * 18)) + port.rj45(285, 252), { cx: 200, rx: 150, cy: 286 });
const routerImg = (body, top, side, antennas) => S(
  antennas.map(x => r(x, 56, 16, 140, 8, body) + gl(x, 56, 16, 60, 8)).join('') +
  box(64, 190, 262, 54, 40, body, top, side) + gl(64, 190, 262, 18, 2) + rep(6, i => led(100 + i * 22, 218, i === 0 ? '#3b82f6' : '#22c55e')), { cx: 210, rx: 180, cy: 260 });
IMG.router = routerImg('url(#wht)', '#ffffff', '#cdd3da', [92, 292]);
IMG['router-ac'] = routerImg('url(#blk)', '#3b3f46', '#16181b', [84, 160, 236, 312]);
IMG.switch8 = S(
  box(34, 168, 300, 64, 40, 'url(#gry)', '#6b7280', '#2d323b') + gl(34, 168, 300, 20, 2) +
  rep(8, i => port.rj45(66 + i * 32, 206)) + rep(8, i => c(66 + i * 32, 184, 2.5, i % 3 ? '#22c55e' : '#f59e0b')), { cx: 205, rx: 185, cy: 256 });
IMG['wifi-usb'] = S(
  T(252, 172, 26, r(-11, -140, 22, 140, 11, 'url(#blk)') + gl(-11, -140, 22, 60, 11)) +
  r(70, 182, 54, 32, 2, 'url(#mtl)') + r(80, 192, 8, 8, 1, '#4b5563') + r(102, 192, 8, 8, 1, '#4b5563') +
  r(122, 170, 150, 56, 14, 'url(#blk)') + gl(122, 170, 150, 22, 14) + led(250, 198, '#3b82f6'), { cx: 200, rx: 140, cy: 252 });
IMG['nvme-card'] = S(
  r(318, 86, 20, 178, 2, 'url(#mtlv)') + p('M58 118h262v112h-202v24h-60z', 'url(#pcb)') + fingers(32, 124, 232, 6, 3.6, 22) +
  r(86, 146, 196, 46, 4, '#16181b') + chipRow(3, 100, 154, 40, 30, 14) + r(250, 156, 24, 26, 2, '#2a2d33') + c(272, 169, 6, 'none', 'stroke="url(#gld)" stroke-width="3"') +
  r(78, 132, 16, 76, 2, '#0b0c0e'), { cx: 200, rx: 160, cy: 278 });
IMG['lan-card'] = S(
  r(306, 92, 20, 170, 2, 'url(#mtlv)') + p('M80 128h228v100h-176v24h-52z', 'url(#pcb)') + fingers(28, 138, 230, 5.6, 3.4, 22) +
  r(266, 150, 46, 40, 3, 'url(#mtl)') + port.rj45(289, 170) + r(150, 150, 46, 46, 3, '#111317') + r(150, 150, 46, 12, 3, '#2a2d33') +
  rep(4, i => c(110 + i * 10, 210, 4, '#1c1e22')) + chipRow(2, 210, 156, 22, 16, 8), { cx: 200, rx: 140, cy: 278 });

// storage
const drive = (top, label, thick, frontCol) => {
  const ox = 120, oy = 92, w = 220, h = 160;
  const bl = [ox - .35 * h, oy + .55 * h], br = [ox + w - .35 * h, oy + .55 * h];
  return p(`M${bl[0]} ${bl[1]}L${br[0]} ${br[1]}l0 ${thick}L${bl[0]} ${bl[1] + thick}z`, frontCol) + G(`matrix(1 0 -.35 .55 ${ox} ${oy})`, top) + label;
};
IMG.hdd = S(drive(
  r(0, 0, 220, 160, 10, 'url(#mtl)') + r(14, 16, 110, 128, 6, '#eef1f4') + r(24, 28, 70, 12, 3, '#123a99') + rep(5, i => r(24, 52 + i * 14, 88 - i * 8, 6, 3, '#aab2bc')) +
  c(170, 80, 40, 'none', 'stroke="#9aa2ab" stroke-width="3"') + c(170, 80, 8, 'url(#mtl)', 'stroke="#8c949d"') + rep(4, i => c([10, 210, 10, 210][i], [10, 10, 150, 150][i], 4, '#8c949d')),
  '', 26, '#4b5563'), { cx: 210, rx: 170, cy: 236 });
IMG.ssd = S(drive(
  r(0, 0, 220, 160, 10, 'url(#blk)') + r(18, 20, 184, 120, 8, 'url(#blu)') + r(18, 20, 184, 40, 8, 'url(#gls)') + txt(76, 74, 34, '#fff', 'SSD', 800) + rep(2, i => r(34, 96 + i * 16, 120 - i * 40, 7, 3, '#bcd3ff')),
  r(150, 179, 60, 8, 1, 'url(#gld)') + r(214, 179, 22, 8, 1, 'url(#gld)'), 14, '#0b0c0e'), { cx: 210, rx: 170, cy: 226 });
IMG['hdd-case'] = S(
  cable('M290 190C340 196 352 262 300 268S232 278 218 290', '#1c1e22', 7) +
  drive(r(0, 0, 220, 160, 22, 'url(#blk)') + r(0, 0, 220, 160, 22, 'url(#gls)') + r(150, 64, 40, 32, 6, '#2a2d33') + c(30, 80, 5, '#3b82f6'), '', 16, '#0b0c0e'), { cx: 210, rx: 170, cy: 240 });
IMG.nvme = S(G('translate(200 168) rotate(-10)',
  r(-150, -30, 300, 60, 4, '#1c1e22') + fingers(9, -164, -24, 5.4, 3.6, 48) + chipRow(2, -110, -22, 70, 44, 12) + r(48, -18, 46, 36, 3, '#0b0c0e') +
  r(-110, -22, 152, 44, 3, 'url(#gls)', 'opacity=".4"') + p('M150 -10a10 10 0 0 1 0 20', 'none', 'stroke="url(#gld)" stroke-width="5"') + r(110, -20, 26, 8, 2, '#2b6cff')), { cx: 200, rx: 165, cy: 262 });
IMG.ram = S(G('translate(200 166) rotate(-8)',
  r(-170, -46, 340, 92, 4, 'url(#pcb)') + chipRow(8, -158, -34, 32, 50, 9) + fingers(56, -164, 30, 5.9, 3.6, 14) + r(-12, 34, 8, 14, 1, '#f6f8fb') +
  r(-120, 20, 50, 6, 2, '#fff', 'opacity=".7"')), { cx: 200, rx: 175, cy: 260 });
IMG['ram-laptop'] = S(G('translate(200 166) rotate(-8)',
  r(-110, -52, 220, 104, 4, 'url(#pcb)') + chipRow(4, -96, -40, 36, 46, 10) + fingers(36, -104, 36, 5.8, 3.6, 14) + r(30, 38, 8, 14, 1, '#f6f8fb') +
  c(-110, 0, 10, '#f6f8fb') + c(110, 0, 10, '#f6f8fb') + r(-80, 18, 70, 8, 2, '#fff', 'opacity=".7"')), { cx: 200, rx: 130, cy: 262 });
IMG.cmos = S(
  p('M96 176v26a104 42 0 0 0 208 0v-26z', 'url(#mtl)') + el(200, 176, 104, 42, 'url(#mtlv)') + el(200, 176, 92, 34, 'none', 'stroke="#aab2bc" stroke-width="2"') +
  ln('M120 174h20M130 164v20', '#6b7280', 3) + txt(214, 184, 24, '#6b7280', 'CR2032') + T(200, 176, 0, '', 1), { cx: 200, rx: 125, cy: 248 });
IMG.pendrive = S(G('translate(196 166) rotate(-20)',
  c(-136, 0, 12, 'none', 'stroke="#9aa2ab" stroke-width="6"') + r(-124, -34, 170, 68, 16, 'url(#blk)') + gl(-124, -34, 170, 28, 16) +
  r(46, -24, 74, 48, 4, 'url(#mtlv)') + r(70, -12, 10, 10, 1, '#4b5563') + r(94, -12, 10, 10, 1, '#4b5563') + led(-100, 0, '#3b82f6') + txt(-36, 7, 18, '#9aa2ab', '32GB')), { cx: 200, rx: 150, cy: 262 });
IMG.microsd = S(
  p('M112 70h118l34 34v170h-152z', 'url(#blk)') + gl(112, 70, 152, 70, 6) + r(124, 130, 128, 110, 6, 'url(#red)') + txt(188, 196, 34, '#fff', '64') + txt(188, 222, 14, '#fff', 'GB · C10', 600) +
  rep(8, i => r(122 + i * 14, 76, 8, 22, 1, 'url(#gld)')) +
  p('M262 186h70v22l-6 6v60h-64z', 'url(#blk)') + r(268, 226, 58, 40, 4, 'url(#red)') + txt(297, 252, 13, '#fff', '64GB'), { cx: 220, rx: 150, cy: 286 });

// converters, adaptors, connectors, displays
IMG['hdmi-vga'] = S(
  cable('M128 222C150 274 214 270 238 222', '#1c1e22', 9) + T(126, 224, -12, hdmiPlug()) +
  r(232, 140, 110, 104, 16, 'url(#blk)') + gl(232, 140, 110, 40, 16) + port.vga(287, 182) + port.dc(270, 222) + led(312, 222, '#3b82f6'), { cx: 220, rx: 160, cy: 280 });
IMG['vga-hdmi'] = S(
  cable('M128 222C150 274 214 270 238 222', '#1c1e22', 9) + T(126, 224, -12, vgaPlug()) +
  r(232, 140, 110, 104, 16, 'url(#blk)') + gl(232, 140, 110, 40, 16) + port.hdmi(287, 182) + port.usb(287, 220), { cx: 220, rx: 160, cy: 280 });
IMG.smps = S(
  cable('M190 252C190 304 300 304 302 240', '#1c1e22', 8) + T(302, 240, 18, dcBarrel()) +
  r(158, 78, 12, 36, 5, 'url(#mtl)') + r(210, 78, 12, 36, 5, 'url(#mtl)') + r(128, 106, 124, 148, 18, 'url(#blk)') + gl(128, 106, 124, 54, 18) +
  r(146, 150, 88, 54, 5, '#2a2d33') + txt(190, 174, 14, '#c3cad3', '12V') + txt(190, 194, 12, '#9aa2ab', '2A', 600) + led(190, 228, '#22c55e'), { cx: 210, rx: 130, cy: 286 });
IMG['smps-box'] = S(
  box(56, 150, 262, 92, 52, 'url(#mtlv)', '#e9edf2', '#8c949d') +
  G('matrix(1 0 1 -1 56 150)', rep(7, j => rep(18, i => c(10 + i * 14, 8 + j * 6.6, 2.2, '#8c949d')))) +
  r(70, 170, 130, 44, 3, '#1c1e22') + rep(6, i => screw(84 + i * 20, 192, 5)) + led(226, 182) + c(256, 194, 7, '#2b6cff') + txt(270, 230, 12, '#6b7280', '12V 10A'), { cx: 210, rx: 180, cy: 262 });
IMG.jointer = S(
  r(118, 150, 164, 64, 10, 'url(#blk)') + gl(118, 150, 164, 24, 10) + r(84, 144, 42, 76, 8, 'url(#mtlv)') + r(274, 144, 42, 76, 8, 'url(#mtlv)') +
  p('M90 168h30v18l-6 8h-18l-6-8z', '#0a0a0a') + p('M280 168h30v18l-6 8h-18l-6-8z', '#0a0a0a') + txt(200, 188, 13, '#9aa2ab', 'F — F'), { cx: 200, rx: 140, cy: 246 });
const screen = (x, y, w, h) => r(x, y, w, h, 8, '#111317') + r(x + 7, y + 7, w - 14, h - 18, 3, 'url(#scr)') +
  p(`M${x + 7} ${y + h - 40}C${x + w * .3} ${y + h - 90} ${x + w * .6} ${y + h - 10} ${x + w - 7} ${y + h - 70}V${y + h - 11}H${x + 7}z`, '#fff', 'opacity=".14"') +
  p(`M${x + 7} ${y + 7}L${x + w * .45} ${y + 7}L${x + 7} ${y + h * .6}z`, '#fff', 'opacity=".07"');
IMG.monitor = S(
  p('M184 226h32l10 40h-52z', 'url(#gry)') + el(200, 268, 74, 10, 'url(#gry)') + screen(52, 46, 296, 184) + r(190, 220, 20, 3, 1.5, '#4b5563'), { cx: 200, rx: 110, cy: 276 });
IMG.tv = S(
  ln('M80 238L60 266M320 238L340 266', '#1d1f23', 8) + screen(24, 58, 352, 190) + led(200, 242, '#d9262f'), { cx: 200, rx: 170, cy: 272 });

/* ---------- write ---------- */
let n = 0;
for (const [k, svg] of Object.entries(IMG)) {
  fs.writeFileSync(path.join(OUT, `${k}.svg`), svg.replace(/\s+\/>/g, '/>').replace(/\n/g, ''));
  n++;
}
console.log(`Wrote ${n} images to ${OUT}`);
