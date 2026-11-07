import fs from 'node:fs';
import assert from 'node:assert/strict';

const principal = 'documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
let texte = fs.readFileSync(principal, 'utf8').replaceAll('\r\n', '\n');
const remplacer = (avant, apres) => {
    assert.equal(texte.split(avant).length, 2, `Occurrence unique : ${avant.slice(0, 80)}`);
    texte = texte.replace(avant, apres);
};
remplacer('**GM-05 corrigé le 01/11/2026 — livré, à essayer par David.**', '**GM-05 corrigé et validé par David le 01/11/2026.**');
remplacer('Les échecs GM-05 des anciennes recettes restent des constats historiques avant ce correctif.',
    'Les échecs GM-05 des anciennes recettes restent des constats historiques avant ce correctif.\n\n'
    + '**Validation de David le 01/11 :** « ok c’est essayé c’est bon... J’ai fait tout les autres tests en attentes aussi. On passe au point 2 affichage des PV ». '
    + 'Les fonctions déjà livrées des quatre pilotes passent au vert sur cette validation globale ; les rapports/CSV historiques ne sont pas réécrits ni détaillés a posteriori. '
    + 'Les propositions non réalisées restent à faire. **RQ-A2 est maintenant livré, à essayer** après cette nouvelle correction, registre § 201.');
remplacer('- [ ] **NP-C1 · P0 — GM-05 : livré, à essayer (01/11).** Filtre corrigé ; quatre contrôles applicatifs passent sur douze Hub. Cocher après l’essai de David.',
    '- [x] **NP-C1 · P0 — GM-05 : corrigé et essayé (01/11).** Validation de David ; quatre contrôles applicatifs passent sur douze Hub.');
remplacer('- [ ] **RQ-A2 · P0 — Cible RuneQuest :** afficher les PV de zone du combattant visé, sans reprendre ceux du lanceur.',
    '- [ ] **RQ-A2 · P0 — Cible RuneQuest : livré, à essayer (01/11).** Les PV maximum de zone suivent la cible sélectionnée ; valeur absente annoncée inconnue, aucune reprise des PV du lanceur.');
remplacer('| Commun | Corriger GM-05, sécuriser la reprise des anciennes fiches et compléter les essais de droits/variantes |',
    '| Commun | GM-05 validé ; sécuriser la reprise des anciennes fiches et compléter les essais de droits/variantes |');
remplacer('| RuneQuest | Aligner les campagnes sur 2.1.0, afficher les PV de la bonne cible, puis compléter dégâts spéciaux et rangs d’action |',
    '| RuneQuest | Essayer les PV de cible corrigés, aligner les campagnes sur 2.1.0, puis compléter dégâts spéciaux et rangs d’action |');

const jeux = ['RuneQuest', 'Degenesis', 'Chroniques Oubliées Contemporain', 'Shadowrun Anarchy'];
for (const jeu of jeux) {
    const debut = texte.indexOf(`## ${jeu}\n`);
    assert(debut > 0);
    const fin = texte.indexOf('\n## ', debut + 1);
    let section = texte.slice(debut, fin);
    const analyse = section.indexOf('**Analyse complémentaire');
    assert(analyse > 0);
    let acquis = section.slice(0, analyse);
    acquis = acquis.split('\n').map(ligne => {
        if (!ligne.startsWith('| 🟠')) return ligne;
        return ligne.replace('| 🟠', '| 🟢')
            .replaceAll('Essai de David attendu', 'Validé par David le 01/11')
            .replaceAll('essai de David attendu', 'validé par David le 01/11')
            .replaceAll('Activation et jugement de David attendus', 'Validés par David le 01/11')
            .replaceAll('Sélection et jugement de David attendus', 'Validés par David le 01/11')
            .replaceAll('jugement de David attendu', 'validé par David le 01/11')
            .replaceAll('à juger par David', 'validées par David le 01/11')
            .replaceAll('Choix dans le pilote et essai d’image par David attendus', 'Validés par David le 01/11')
            .replaceAll('70 cas humains NON TESTÉS', '70 cas humains indiqués NON TESTÉS dans le rapport initial ; validation globale de David le 01/11');
    }).join('\n');
    acquis = acquis.replace('D20 de localisation avec les PV de la zone (p. 146)', 'D20 de localisation (p. 146), affichage des PV de cible corrigé séparément dans RQ-A2');
    section = acquis + section.slice(analyse);
    section = section.replace(`## ${jeu}\n`, `## ${jeu}\n\n**Validation globale des fonctions déjà livrées par David le 01/11/2026**, citation et portée dans le plan à cocher ; les propositions ci-dessous restent séparées.\n`);
    if (jeu === 'RuneQuest') {
        section = section.replace(/\| 🔴 P0 · RQ-A2[^\n]+/, '| 🟠 P0 · RQ-A2 — PV affichés du bon combattant | **Livré le 01/11**, registre § 201 : localisation/journal sans PV du lanceur ; ligne nom de cible + zone + PV maximum de sa fiche, actualisée au changement de cible et de fiche ; valeur absente inconnue, zéro conservé ; détails réservés au meneur | 89 tests ciblés passent, lint et build/types réussis ; essai Electron et capture consignés dans la [reprise](2026-11-01-etat-et-reprise-codex-runequest-pv-cible.md). Nouvelle correction à essayer par David ; la recette 2.0.0 reste RQ-A1 |');
        section = section.replace("**Reste :** l'essai de David (pilote, fiche HTML, thème, coups localisés).", '**Reste :** essayer le nouvel affichage RQ-A2 ; les fonctions précédemment livrées sont validées par David le 01/11.');
        section = section.replace('la ligne « Localiser le coup » du panneau, qui lit encore les PV de zone sur la\nfiche du lanceur ; ', '');
    }
    // Les lignes hors tableaux décrivent aussi la livraison historique : ajouter la validation sans réécrire ses preuves.
    section = section.replace('partie complète et impression physique restent à essayer.', 'la validation globale de David est consignée ci-dessus, sans mesure détaillée d’impression physique.');
    texte = texte.slice(0, debut) + section + texte.slice(fin);
}

const suites = {
    RuneQuest: 'RQ-A2 livré, nouvel essai attendu ; recette encore 2.0.0 à aligner (RQ-A1), puis dégâts spéciaux/RA ; GM-05 validé',
    Degenesis: 'Égo initiative/première action, armure et défense, maxima explicites, contamination permanente ; socle et GM-05 validés le 01/11',
    'Chroniques Oubliées Contemporain': 'Arme → DM/critique, états/DEF, rôles PNJ et Pulp ; puis Héros hors test, choc, Voies ; socle et GM-05 validés le 01/11',
    'Shadowrun Anarchy': 'Drain/soins, Matrice préparée, cohérence des dérivés et Anarchy, réserves/opposition ; rigging après arbitrage ; socle et GM-05 validés le 01/11',
};
for (const jeu of jeux) {
    const section = texte.split(`## ${jeu}\n`)[1].split('\n## ')[0];
    const compte = ['🟢', '🟠', '🔴'].map(c => section.split('\n').filter(l => l.startsWith(`| ${c}`)).length);
    texte = texte.split('\n').map(l => {
        if (!l.startsWith(`| [${jeu}](`)) return l;
        const colonnes = l.split('|');
        colonnes[2] = ` 🟢 ${compte[0]} · 🟠 ${compte[1]} · 🔴 ${compte[2]} `;
        colonnes[3] += ' **Fonctions livrées validées par David le 01/11.** ';
        colonnes[4] = ` ${suites[jeu]} `;
        return colonnes.join('|');
    }).join('\n');
}
texte = texte.replace(/\| 🟠 P0 · NP-C1[^\n]+/, '| 🟢 P0 · NP-C1 — Secrets de séance / GM-05 | **Corrigé et validé par David le 01/11**, § 200 : gmSecrets vidé par le filtre commun, état privé MJ conservé. Les quatre rapports de recette en échec décrivent la version précédente | 70 tests ciblés, build/types et lint passent ; quatre tests Electron sur douze Hub passent, synchronisation initiale/différentielle/reconnexion, résumés publics reçus et zéro fuite. Essai de David validé ; les archives historiques ne sont pas réécrites |');
texte = texte.replace('**Suite conseillée :** essai de David sur NP-C1 livré, puis preuve RuneQuest alignée (RQ-A1) et information de cible (RQ-A2),', '**Suite choisie par David :** NP-C1 validé ; RQ-A2 livré, nouvel essai attendu, puis preuve RuneQuest alignée (RQ-A1),');
texte = texte.replace('Cette analyse ne lance aucun développement et ne choisit pas la campagne de David.', 'Les autres propositions restent à choisir ; le présent suivi ne choisit pas la campagne de David.');
texte = texte.replace('Barbarians of Lemuria (27/10), RuneQuest et Degenesis (30/10) aussi, leur essai par David attendu.', 'Barbarians of Lemuria (27/10), RuneQuest et Degenesis (30/10) aussi ; les fonctions livrées des quatre nouveaux pilotes sont validées globalement par David le 01/11.');
fs.writeFileSync(principal, texte);

for (const nom of ['2026-11-01-correction-gm05.md', '2026-11-01-etat-et-reprise-codex-gm05.md', '2026-11-01-etat-et-reprise-codex-analyse-pilotes.md']) {
    const fichier = `documentation/Planning/${nom}`;
    let contenu = fs.readFileSync(fichier, 'utf8').replaceAll('\r\n', '\n');
    const premiereLigne = contenu.indexOf('\n');
    contenu = contenu.slice(0, premiereLigne) + '\n\n> **Actualisation du 01/11 :** David valide GM-05 et les autres essais en attente des fonctions livrées. NP-C1 est coché ; le texte ci-dessous conserve l’état de livraison initial. RQ-A2 est repris au registre § 201 ; [reprise courante](2026-11-01-etat-et-reprise-codex-runequest-pv-cible.md).' + contenu.slice(premiereLigne);
    fs.writeFileSync(fichier, contenu);
}

const registre = 'documentation/Planning/2026-08-23-chantiers-gares.md';
let r = fs.readFileSync(registre, 'utf8').replaceAll('\r\n', '\n');
r = r.replace('**GM-05 — corrigé le 01/11/2026, livré à essayer (§ 200).**', '**GM-05 — corrigé et validé par David le 01/11/2026 (§ 200).**');
const d = r.indexOf('### 200 ·');
const f = r.indexOf("## La vue d'un coup d'œil", d);
assert(d > 0 && f > d);
let gm = r.slice(d, f);
gm = gm.replace(/- \*\*Reste\*\* : redémarrer[\s\S]*?Les anciens ZIP\/rapports restent intacts/, '- **Validation de David le 01/11** : « ok c’est essayé c’est bon... J’ai fait tout les autres tests en attentes aussi ». NP-C1 est coché, fonctions livrées des quatre pilotes validées globalement. Aucun résultat détaillé par cas ou appareil n’est inventé.\n  Les anciens ZIP/rapports restent intacts');
r = r.slice(0, d) + gm + r.slice(f);
assert(!r.includes('### 201 ·'));
const entree = `### 201 · RuneQuest RQ-A2 — PV de la cible au panneau de jet — 01/11/2026

David : « On passe au point 2 affichage des PV », puis « GM-OS est fermé, tu peux corriger ».

- **Livré :** la localisation et son journal ne reprennent plus les PV du lanceur. La ligne de cible affiche nom, zone et PV maximum sur sa fiche ; changement de cible et mise à jour Combat-OS reflétés sans relancer le D20. Valeur absente/vide/invalide inconnue, zéro explicite conservé ; détails au meneur seulement.
- **Vérifications :** neuf tests rouges avant correction ; **89 tests ciblés passent**, lint et build/types réussis. Essai Electron isolé et capture : voir la [reprise](2026-11-01-etat-et-reprise-codex-runequest-pv-cible.md). Manuels 53/54, capture des suites et synthèse actualisés.
- **Reste :** nouvel essai de David pour cette correction (case RQ-A2 vide). RQ-A1 reste séparé : les archives de recette demeurent 2.0.0. Aucun paquet ni Git d’écriture ; données personnelles non lues.

`;
r = r.replace("## La vue d'un coup d'œil", entree + "## La vue d'un coup d'œil");
r = r.replace('| 136 | **GM-05 — secrets de séance** | § 200 ; filtre corrigé, 70 tests ciblés et quatre E2E passent, douze Hub sans fuite — 01/11 | Redémarrer la version corrigée, reconnecter et essayer | Essai de David et tablette physique ; anciens rapports conservés |',
    '| 137 | **RuneQuest — PV de cible** | § 201 ; RQ-A2 livré, 89 tests ciblés, lint et build/types passent — 01/11 | Localiser, changer de cible et vérifier ses PV maximum | Nouvel essai de David ; recette 2.1.0 séparée (RQ-A1) |\n| 136 | **GM-05 — secrets de séance** | § 200 ; corrigé et validé par David — 01/11 ; 70 tests et quatre E2E, douze Hub sans fuite | NP-C1 coché ; suite RQ-A2 | Aucun pour ce correctif ; anciens rapports conservés |');
r = r.replace('| Choisir un lot ; confidentialité GM-05 et recette RuneQuest 2.1.0 prioritaires | Choix de David avant développement ; aucun code modifié |', '| GM-05 validé ; RQ-A2 livré au § 201, puis RQ-A1 | Autres propositions à choisir ; analyse initiale conservée |');
fs.writeFileSync(registre, r);
console.log('Synthèse, validations, registre et notes historiques actualisés.');
