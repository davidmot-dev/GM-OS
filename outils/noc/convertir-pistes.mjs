/** NOC, 25/10/2026 : hotspots numériques et conservation des 78 anciennes clés (§ 6). */
import fs from 'node:fs';
import assert from 'node:assert/strict';
const fichier = 'docs/fiches/NOC/NOC_fiche_personnage_interactive_pixel_recale_v3.html';
const moteur = 'docs/fiches/Character_Sheet_Manager.html';
const expression = /(<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>)([\s\S]*?)(<\/script>)/i;
let html = fs.readFileSync(fichier, 'utf8');
const bloc = html.match(expression), manifeste = JSON.parse(bloc[2]), t = manifeste.template;
assert.equal(t.id, 'noc-reference');
if (!t.legacySeries) {
    const series = {};
    for (const p of t.pages) for (const f of p.fields) {
        const m = /^(.*)\.(\d+)$/.exec(f.key);
        if (f.type === 'checkbox' && m) (series[m[1]] ??= []).push(f);
    }
    assert.equal(Object.keys(series).length, 9);
    assert.equal(Object.values(series).flat().length, 78);
    t.legacySeries = {};
    const boutons = [], caches = [];
    for (const [cle, champs] of Object.entries(series)) {
        champs.sort((a, b) => Number(a.key.split('.').at(-1)) - Number(b.key.split('.').at(-1)));
        t.legacySeries[cle] = champs.map(f => f.key);
        for (const [i, f] of champs.entries()) {
            const neuf = { ...f, key: cle, type: 'hotspot', value: i + 1, className: 'noc-hotspot' };
            t.pages.find(p => p.fields.includes(f)).fields.push(neuf);
            f.legacy = true; f.className += ' noc-legacy';
            const entree = new RegExp(`<input\\b[^>]*data-key="${f.key.replaceAll('.', '\\.')}"[^>]*>`, 'i');
            assert.ok(entree.test(html), f.key);
            html = html.replace(entree, m => m.replace('class="', 'class="noc-legacy '));
            boutons.push(`<button type="button" class="noc-hotspot" data-track="${cle}" data-value="${i + 1}" aria-label="${f.label}" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px"></button>`);
        }
        caches.push(`<input type="number" class="noc-legacy level-number" data-key="${cle}" aria-label="${cle}">`);
    }
    const css = '.sheet[data-template="noc-reference"] .noc-legacy{display:none!important}.sheet[data-template="noc-reference"] .noc-hotspot{position:absolute;box-sizing:border-box;border:0;border-radius:50%;background:transparent;padding:0;cursor:pointer}.sheet[data-template="noc-reference"] .noc-hotspot.active{background:rgba(36,32,28,.70);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.7)}.sheet[data-template="noc-reference"].zones .noc-hotspot{outline:1px solid #2874a6}.sheet[data-template="noc-reference"] .noc-hotspot:focus-visible{outline:1px solid #2874a6}';
    t.customCss = (t.customCss ?? '') + '\n' + css;
    html = html.replace('</head>', `<style>${css}</style></head>`);
    const fin = html.indexOf('</section>', html.indexOf('id="sheet"'));
    assert.ok(fin > 0); html = html.slice(0, fin) + caches.join('') + boutons.join('') + html.slice(fin);
    const migration = `const series=${JSON.stringify(t.legacySeries)};
 function normaliserPistes(d){d={...d};for(const [cle,anciennes] of Object.entries(series)){const brut=d[cle];const nombre=brut===undefined||brut===null||brut===''?anciennes.filter(k=>d[k]===true||d[k]===1||d[k]==='1'||d[k]==='true'||d[k]==='on').length:Number(brut);const n=Math.max(0,Number.isFinite(nombre)?Math.round(nombre):0);d[cle]=n;anciennes.forEach((k,i)=>d[k]=i<n)}return d}
 function peindrePistes(d){document.querySelectorAll('[data-track]').forEach(b=>b.classList.toggle('active',Number(d[b.dataset.track])>=Number(b.dataset.value)))}
 `;
    html = html.replace(' const fields=[', ' ' + migration + 'const fields=[');
    html = html.replace('return d}\n function apply(d){', 'return normaliserPistes(d)}\n function apply(d){d=normaliserPistes(d);peindrePistes(d);');
    assert.ok(html.includes('function apply(d){d=normaliserPistes(d)'), 'Runtime autonome reconnu');
    html = html.replace(" try{const raw=localStorage.getItem(ROOT)", ` document.querySelectorAll('[data-track]').forEach(b=>b.onclick=()=>{const d=collect(),cle=b.dataset.track,v=Number(b.dataset.value);d[cle]=d[cle]===v?0:v;apply(d);scheduleSave()});
 try{const raw=localStorage.getItem(ROOT)`);
    html = html.replace("say('Réinitialisé')", "apply({});say('Réinitialisé')");
    html = html.replace(expression, (_, a, _b, c) => a + JSON.stringify(manifeste).replaceAll('<', '\\u003c') + c);
    fs.writeFileSync(fichier, html);
}
// Le moteur dessine normalement un rectangle via ::after ; NOC garde ses ronds imprimés.
const finition = '.sheet[data-template="noc-reference"] .noc-hotspot.active::after{display:none}';
if (!t.customCss.includes(finition)) {
    t.customCss += finition;
    html = html.replace('</head>', `<style>${finition}</style></head>`);
    html = html.replace(expression, (_, a, _b, c) => a + JSON.stringify(manifeste).replaceAll('<', '\\u003c') + c);
    fs.writeFileSync(fichier, html);
}
// Les correspondances actives prennent le nombre ; les anciennes clés restent documentées.
const fCorrespondance = 'docs/systems/noc/fiche/correspondance.json';
const correspondance = JSON.parse(fs.readFileSync(fCorrespondance, 'utf8'));
for (const c of correspondance.champs) if (Array.isArray(c.fiche) && c.transforme === 'serie') {
    const cle = Object.keys(t.legacySeries).find(k => JSON.stringify(t.legacySeries[k]) === JSON.stringify(c.fiche));
    if (cle) { c.fiche = cle; delete c.transforme; }
}
correspondance.absents ??= [];
if (!correspondance.champs.some(c => c.fiche === 'favours.max')) correspondance.champs.push({ gmos: 'faveur_max', fiche: 'favours.max' });
for (const anciennes of Object.values(t.legacySeries)) for (const cle of anciennes) {
    const absent = correspondance.absents.find(a => a.fiche === cle);
    if (absent) { absent.pourquoi = absent.pourquoi || absent.motif; delete absent.motif; }
    else correspondance.absents.push({ fiche: cle, pourquoi: 'Ancienne case conservée pour compatibilité ; la piste numérique est désormais la référence.' });
}
if (!correspondance.commentaire.includes('legacySeries')) correspondance.commentaire += ' 25/10/2026 : neuf pistes numériques, anciennes clés conservées et synchronisées par legacySeries.';
fs.writeFileSync(fCorrespondance, JSON.stringify(correspondance, null, 2) + '\n');
let source = fs.readFileSync(moteur, 'utf8');
const exp = /(<script id="builtinTemplates" type="application\/json">)([\s\S]*?)(<\/script>)/;
const modeles = JSON.parse(source.match(exp)[2]);
const index = modeles.findIndex(g => g.id === t.id); assert.ok(index >= 0);
modeles[index] = { ...t, _builtin: true };
source = source.replace(exp, (_, a, _b, c) => a + JSON.stringify(modeles).replaceAll('<', '\\u003c') + c);
if (source.includes('const BUILTIN_VERSION=17;')) source = source.replace('const BUILTIN_VERSION=17;', '/* 18 : pistes NOC numériques, migration des anciennes cases (25/10/2026). */ const BUILTIN_VERSION=18;');
else assert.ok(source.includes('const BUILTIN_VERSION=18;'));
fs.writeFileSync(moteur, source);
console.log(JSON.stringify({ id: t.id, pistes: Object.keys(t.legacySeries), anciennesCles: Object.values(t.legacySeries).flat().length, moteur: 18 }));
