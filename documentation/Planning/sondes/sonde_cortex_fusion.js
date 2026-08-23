/**
 * Sonde — fusionner les deux appels du Cortex ?
 *
 * Le module lance DEUX passes sur le MEME rapport tactique : une narration en
 * streaming, puis des conseils en JSON. Sous `OLLAMA_NUM_PARALLEL: 1` elles se
 * sérialisent, donc le rapport est **préfixé deux fois**.
 *
 * La sonde mesure les trois temps et les compte de tokens rendus par Ollama, et
 * ne conclut rien : elle rapporte.
 *
 * Usage : node documentation/Planning/sondes/sonde_cortex_fusion.js
 */
const MODELE = process.env.MODELE || 'gemma4:12b';
const URL = 'http://127.0.0.1:11434/api/generate';

/** Un rapport tactique réaliste, de la forme que `TacticalNarrativeService` produit. */
const RAPPORT = `RAPPORT TACTIQUE — Tour 4
ACTEUR : Kaelen Vasquez (PJ, Rôdeur)
- Santé : 14 / 22 (blessé)
- États : Saignement (1 dégât par tour), Concentration
- Position : Valide (Atlas). Zone : ruines du dépôt est.
- ALERTE : FLANQUÉ par Écorcheur alpha et Écorcheur bêta !
ENNEMIS EN VUE :
- Écorcheur alpha — 9/16 PV — distance 3 m (corps à corps) — état : enragé
- Écorcheur bêta — 16/16 PV — distance 4 m (corps à corps) — intact
- Tireur embusqué — 21/21 PV — distance 22 m (longue) — à couvert derrière la citerne
ALLIÉS :
- Maera (PJ, Mage) — 11/14 PV — distance 8 m — réserve de sorts : 3
- Doran (PJ, Guerrier) — 19/25 PV — distance 12 m — engagé avec le Tireur
TERRAIN : décombres (couvert partiel au nord), citerne (couvert total),
passerelle effondrée à l'est, portée d'engagement moyenne 6 m.
RESSOURCES DE TABLE : Impulsion 2 / 6 — Menace 5.
RÈGLES DU SYSTÈME : les attaques d'opportunité se déclenchent en quittant le
corps à corps ; un personnage flanqué subit un désavantage sur sa défense ;
la Concentration tombe si son porteur subit des dégâts.`;

const SYS_CONSEILS = 'Tu es "Le Stratège", expert en JDR. Réponds exclusivement en JSON valide avec ce '
    + 'format exact : [ { "id": "...", "type": "attack|move|spell|defense", "message": "...", "priority": 1-5 } ]. '
    + 'Ne parle pas avant ni après le JSON.';

const P_NARRATION = `Analyse la situation suivante pour Kaelen Vasquez et donne une brève "narration `
    + `stratégique" (2-3 phrases) décrivant l'ambiance et l'opportunité tactique principale.\n`
    + `SITUATION : ${RAPPORT}`;

const P_CONSEILS = `Basé sur ce rapport tactique : ${RAPPORT}. Génère 2 à 3 conseils concrets de `
    + `combat, de mouvement ou de magie.`;

/** La passe unique : le rapport n'est envoyé qu'une fois, les deux sorties sont demandées ensemble. */
const P_FUSION = `Analyse la situation suivante pour Kaelen Vasquez.\nSITUATION : ${RAPPORT}\n\n`
    + `Réponds exclusivement en JSON valide avec ce format exact, et rien avant ni après :\n`
    + `{ "narration": "2-3 phrases décrivant l'ambiance et l'opportunité tactique principale", `
    + `"conseils": [ { "id": "...", "type": "attack|move|spell|defense", "message": "...", "priority": 1-5 } ] }`;

const ns = n => (n ?? 0) / 1e9;

async function passe(nom, prompt, system) {
    const t0 = Date.now();
    const r = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODELE,
            prompt,
            system,
            stream: false,
            think: false,
            keep_alive: '10m',
            options: { temperature: 0.7 },
        }),
    });
    const d = await r.json();
    const mur = (Date.now() - t0) / 1000;
    return {
        nom,
        mur,
        prefillTokens: d.prompt_eval_count ?? 0,
        prefill: ns(d.prompt_eval_duration),
        sortieTokens: d.eval_count ?? 0,
        redaction: ns(d.eval_duration),
        total: ns(d.total_duration),
        extrait: (d.response || '').slice(0, 90).replace(/\s+/g, ' '),
    };
}

function ligne(r) {
    console.log(
        `${r.nom.padEnd(24)} mur ${r.mur.toFixed(1).padStart(6)} s  |  prefill ${String(r.prefillTokens).padStart(5)} tok `
        + `en ${r.prefill.toFixed(1).padStart(5)} s  |  sortie ${String(r.sortieTokens).padStart(4)} tok `
        + `en ${r.redaction.toFixed(1).padStart(5)} s`);
}

(async () => {
    console.log(`Modèle : ${MODELE}\nRapport : ${RAPPORT.length} caractères\n`);

    // Une passe à blanc : la première requête paie le chargement du modèle.
    process.stdout.write('chauffe… ');
    await passe('chauffe', 'Réponds « ok ».');
    console.log('faite\n');

    const a = await passe('1. narration', P_NARRATION);
    ligne(a);
    const b = await passe('2. conseils (JSON)', P_CONSEILS, SYS_CONSEILS);
    ligne(b);
    const f = await passe('3. passe FUSIONNÉE', P_FUSION);
    ligne(f);

    const sequentiel = a.mur + b.mur;
    const prefillDouble = a.prefillTokens + b.prefillTokens;

    console.log(`\n── Ce que la mesure dit ──`);
    console.log(`Deux passes  : ${sequentiel.toFixed(1)} s de mur, ${prefillDouble} tokens de prefill`);
    console.log(`Une passe    : ${f.mur.toFixed(1)} s de mur, ${f.prefillTokens} tokens de prefill`);
    const gain = sequentiel - f.mur;
    console.log(`Écart        : ${gain >= 0 ? '−' : '+'}${Math.abs(gain).toFixed(1)} s `
        + `(${((gain / sequentiel) * 100).toFixed(0)} % du temps actuel)`);
    console.log(`\nExtraits :\n  narration : ${a.extrait}\n  conseils  : ${b.extrait}\n  fusion    : ${f.extrait}`);
})();
