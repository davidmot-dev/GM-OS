/**
 * Sonde de suivi — le gain vient-il de la fusion, ou de la brièveté ?
 *
 * La première sonde a montré que le double prefill ne coûte que 3,5 s sur 75, et
 * que la passe fusionnée gagne surtout parce qu'elle **écrit moins**. Si c'est
 * la brièveté qui paie, on peut l'obtenir **sans fusionner**, donc **sans perdre
 * le retour progressif**. Cette sonde tranche.
 */
const MODELE = process.env.MODELE || 'gemma4:12b';
const URL = 'http://127.0.0.1:11434/api/generate';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const ICI = dirname(fileURLToPath(import.meta.url));
const RAPPORT = readFileSync(join(ICI, 'rapport_tactique.txt'), 'utf8');

const SYS_CONSEILS = 'Tu es "Le Stratège", expert en JDR. Réponds exclusivement en JSON valide avec ce '
    + 'format exact : [ { "id": "...", "type": "attack|move|spell|defense", "message": "...", "priority": 1-5 } ]. '
    + 'Ne parle pas avant ni après le JSON.';

/** Les deux passes actuelles, mais bornées : c'est le seul changement. */
const P_NARRATION_BREVE = `Analyse la situation suivante pour Kaelen Vasquez et donne une brève `
    + `"narration stratégique" décrivant l'ambiance et l'opportunité tactique principale.\n`
    + `CONTRAINTE : deux phrases, quarante mots au maximum. Pas de titre, pas de liste, pas d'analyse `
    + `préalable — la narration seule.\n`
    + `SITUATION : ${RAPPORT}`;

const SYS_CONSEILS_BREF = SYS_CONSEILS
    + ' Chaque "message" fait vingt-cinq mots au maximum. Exactement trois conseils.';

const P_CONSEILS = `Basé sur ce rapport tactique : ${RAPPORT}. Génère 2 à 3 conseils concrets de `
    + `combat, de mouvement ou de magie.`;

const ns = n => (n ?? 0) / 1e9;

async function passe(nom, prompt, system) {
    const t0 = Date.now();
    const r = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODELE, prompt, system, stream: false, think: false,
            keep_alive: '10m', options: { temperature: 0.7 } }),
    });
    const d = await r.json();
    return { nom, mur: (Date.now() - t0) / 1000,
        prefillTokens: d.prompt_eval_count ?? 0, prefill: ns(d.prompt_eval_duration),
        sortieTokens: d.eval_count ?? 0, redaction: ns(d.eval_duration),
        extrait: (d.response || '').slice(0, 100).replace(/\s+/g, ' ') };
}

const ligne = r => console.log(
    `${r.nom.padEnd(28)} mur ${r.mur.toFixed(1).padStart(6)} s  |  prefill ${String(r.prefillTokens).padStart(5)} tok `
    + `en ${r.prefill.toFixed(1).padStart(5)} s  |  sortie ${String(r.sortieTokens).padStart(4)} tok `
    + `en ${r.redaction.toFixed(1).padStart(5)} s`);

(async () => {
    console.log(`Modèle : ${MODELE}\n`);
    process.stdout.write('chauffe… '); await passe('c', 'Réponds « ok ».'); console.log('faite\n');

    const a = await passe('1. narration BORNÉE', P_NARRATION_BREVE); ligne(a);
    const b = await passe('2. conseils BORNÉS', P_CONSEILS, SYS_CONSEILS_BREF); ligne(b);

    console.log(`\nDeux passes bornées : ${(a.mur + b.mur).toFixed(1)} s de mur, `
        + `${a.sortieTokens + b.sortieTokens} tokens écrits`);
    console.log(`\nExtraits :\n  narration : ${a.extrait}\n  conseils  : ${b.extrait}`);
})();
