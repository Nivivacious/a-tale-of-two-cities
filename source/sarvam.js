// Makes the Kannada audio with Sarvam (bulbul:v3) and a Kannada check report
// with Mayura. Run once with a key; the site plays the files it writes.
//   SARVAM_API_KEY=... node source/sarvam.js           (skips files that exist)
//   SARVAM_API_KEY=... node source/sarvam.js --force   (remakes everything)
// Writes: audio/kn/<card>.mp3, audio/voice/<name>.mp3, audio/manifest.json,
//         source/docs/kannada-check.md
const fs = require('fs');
const path = require('path');
const T = require('./cards.js');
for (const f of ['hearts', 'diamonds', 'clubs', 'spades']) require(`./deck/${f}.js`);
require('./copy.js');

const KEY = process.env.SARVAM_API_KEY;
if (!KEY) { console.error('Set SARVAM_API_KEY first.'); process.exit(1); }
const force = process.argv.includes('--force');
const root = path.join(__dirname, '..');
const dirKn = path.join(root, 'audio', 'kn'), dirVoice = path.join(root, 'audio', 'voice');
fs.mkdirSync(dirKn, { recursive: true }); fs.mkdirSync(dirVoice, { recursive: true });

// Hidden-line reader and the street voices.
const READER = 'kavitha', STREET = 'anand';
// Short lines said on the Bangalore side of a few cards' soundtracks.
const VOICES = {
  'c4-adjust': ['ಸ್ವಲ್ಪ ಅಡ್ಜಸ್ಟ್ ಮಾಡಿ!', STREET],
  'c6-soppu': ['ಸೊಪ್ಪು... ಸೊಪ್ಪು!', STREET],
  'cj-right': ['ರೈಟ್, ರೈಟ್!', STREET],
  'ride-barlla': ['ಬರಲ್ಲ ಸಾರ್.', STREET],
  'usual-bytwo': ['ಒಂದು ಬೈ ಟು ಕಾಫಿ.', STREET]
};

async function call(endpoint, body) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`https://api.sarvam.ai/${endpoint}`, { method: 'POST', headers: { 'api-subscription-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) return r.json();
    const t = await r.text();
    if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 1500 * (attempt + 1))); continue; }
    throw new Error(`${endpoint} ${r.status}: ${t.slice(0, 200)}`);
  }
  throw new Error(`${endpoint}: gave up after retries`);
}
async function speak(text, speaker, file, pace) {
  if (!force && fs.existsSync(file)) return false;
  const d = await call('text-to-speech', { text, language_code: 'kn-IN', model: 'bulbul:v3', speaker, pace: pace || 0.95, output_audio_codec: 'mp3', speech_sample_rate: 24000 });
  fs.writeFileSync(file, Buffer.from(d.audios.join(''), 'base64'));
  return true;
}
const translate = (input, from, to, extra) => call('translate', Object.assign({ input, source_language_code: from, target_language_code: to, model: 'mayura:v1' }, extra || {})).then((d) => d.translated_text);

(async () => {
  const made = { kn: [], voice: [] };
  const ids = Object.keys(T.KANNADA).filter((id) => id !== 'return');
  for (const id of ids) {
    const fresh = await speak(T.KANNADA[id], READER, path.join(dirKn, `${id}.mp3`), 0.9);
    made.kn.push(id);
    console.log(fresh ? 'made' : 'kept', `kn/${id}.mp3`);
  }
  // Both Jokers share one line, so they share one file.
  if (fs.existsSync(path.join(dirKn, 'departure.mp3'))) { fs.copyFileSync(path.join(dirKn, 'departure.mp3'), path.join(dirKn, 'return.mp3')); made.kn.push('return'); }
  for (const [name, [text, speaker]] of Object.entries(VOICES)) {
    const fresh = await speak(text, speaker, path.join(dirVoice, `${name}.mp3`), 1);
    made.voice.push(name);
    console.log(fresh ? 'made' : 'kept', `voice/${name}.mp3`);
  }
  fs.writeFileSync(path.join(root, 'audio', 'manifest.json'), JSON.stringify(made));

  // Kannada check: what our line says back in English, and how Sarvam would put the English line in spoken Kannada.
  const rows = [];
  for (const id of ids) {
    const c = [...T.CARDS, ...T.JOKERS].find((x) => x.id === id);
    const english = c && c.sentence ? c.sentence.join(' ') : 'Funny how you can miss two places at once.';
    const back = await translate(T.KANNADA[id], 'kn-IN', 'en-IN');
    const spoken = await translate(english, 'en-IN', 'kn-IN', { mode: 'modern-colloquial' });
    rows.push(`| ${c ? c.title : id} | ${english} | ${T.KANNADA[id]} | ${back} | ${spoken} |`);
    console.log('checked', id);
  }
  fs.writeFileSync(path.join(__dirname, 'docs', 'kannada-check.md'), `# Kannada check

Made with Sarvam Mayura. "Says back" is our Kannada line translated back to English: if it drifts from the English line, the Kannada needs another look. "Spoken Kannada" is Sarvam's modern-colloquial take on the English line, as a second opinion. A native speaker still has the final word.

| Card | English line | Our Kannada | Says back | Spoken Kannada (Sarvam) |
| --- | --- | --- | --- | --- |
${rows.join('\n')}
`);
  console.log(`Done: ${made.kn.length} line readings, ${made.voice.length} street voices, docs/kannada-check.md`);
})().catch((e) => { console.error(e.message); process.exit(1); });
