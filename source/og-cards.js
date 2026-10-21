// Renders og/<id>.jpg at the repo root: one 1200x630 link preview per card, so a
// shared card link shows that card and its hidden line.
const path = require('path');
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const T = require('./cards.js');
for (const f of ['hearts', 'diamonds', 'clubs', 'spades']) require(`./deck/${f}.js`);
require('./copy.js');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const outDir = path.join(__dirname, '..', 'og');
fs.mkdirSync(outDir, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const items = [...T.CARDS, ...T.JOKERS];
  for (const c of items) {
    const joker = !c.sentence;
    const line = joker ? ['Funny how you can miss', 'two places at once.'] : c.sentence;
    const kicker = joker ? 'Joker' : `${c.rankName} of ${T.SUIT_NAME[c.suit]}${T.HOURS[c.rank] ? ' · ' + T.HOURS[c.rank] : ''}`;
    const html = `<html><head><link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..600&family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Archivo+Narrow:wght@700&display=swap" rel="stylesheet">
    <style>body{margin:0;width:1200px;height:630px;background:#12151f;color:#f4ecdc;font-family:'Cormorant Garamond',serif;position:relative;overflow:hidden}
    .glow{position:absolute;inset:0;background:radial-gradient(ellipse 80% 70% at 30% 0%,#2a3156,transparent 70%)}
    .t{position:absolute;left:80px;top:0;bottom:0;width:600px;display:flex;flex-direction:column;justify-content:center;gap:22px}
    .k{font:700 18px 'Archivo Narrow',sans-serif;letter-spacing:.16em;color:#a8a294;text-transform:uppercase}
    h1{font:500 76px/1.02 'Bodoni Moda',serif;margin:0}
    .s{font:italic 500 36px/1.25 'Bodoni Moda',serif}.s b{display:block;font-weight:500;color:#f2b330}
    .f{font:700 15px 'Archivo Narrow',sans-serif;letter-spacing:.16em;color:#a8a294;text-transform:uppercase;margin-top:10px}
    .c{position:absolute;right:110px;top:65px;width:357px;height:500px;border-radius:17px;overflow:hidden;box-shadow:0 40px 70px -24px #000;transform:rotate(3deg)}.c svg{width:100%;height:100%;display:block}</style></head>
    <body><div class="glow"></div><div class="t"><div class="k">${esc(kicker)}</div><h1>${esc(c.title)}</h1><div class="s">${esc(line[0])}<b>${esc(line[1])}</b></div><div class="f">A Tale of Two Cities</div></div><div class="c">${T.render(c.id, { static: true, uid: '-ogc' })}</div></body></html>`;
    await pg.setContent(html, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(outDir, `${c.id}.jpg`), type: 'jpeg', quality: 82 });
  }
  await b.close();
  console.log(`${items.length} previews written`);
})();
