import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const p='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
let t=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');
const blocs={
 'Chroniques Oubliées Contemporain':`
**Analyse complémentaire du 01/11/2026 — propositions COC-A1 à COC-A6.**
Le jet, la RD, les vingt cases, Héros/Blues et le raccord HTML sont acquis ; les extensions
ci-dessous complètent les procédures. La relecture porte sur le code courant et le corpus
déjà relu, pas sur une nouvelle lecture intégrale du livre.
Sources : [dégâts](../../docs/systems/coc/rules/degats-et-types-de-degats.md),
[santé](../../docs/systems/coc/rules/sante-et-blessures.md),
[rôles et bandes](../../docs/systems/coc/rules/la-gestion-simplifiee-des-adversaires-par-roles-et-bandes-de-sbires.md),
[règle du jet](../../src/modules/dice/systemes/coc.ts),
[porte des dégâts](../../src/modules/combat/logic/encaissementDeCoc.ts).

| Priorité / lot proposé | Constat vérifié au 01/11 | Amélioration proposée et critère de recette |
| --- | --- | --- |
| 🔴 P1 · COC-A1 — De l'arme aux dommages | Les bonus d'attaque se lancent, mais dés de DM, FOR et bonus critique restent saisis séparément. La RD et la santé sont déjà natives | Ajouter une résolution explicite arme/type/critique, aperçu des DM puis transfert à la cible ; retirer la RD une seule fois. Rejouer les 15 DM de l'exemple contre RD 2 : 13 cases. Ne pas doubler tous les DM pour simuler le bonus critique fixe |
| 🔴 P1 · COC-A2 — États de santé jusqu'au tour suivant | L'état modifie les tests physiques et le Jet système d'initiative ; les effets CON, action perdue, déplacement, inconscience et le malus de DEF sont surtout des messages ou des saisies | Proposer les tests de CON et des effets datés, afficher la DEF effective sans écraser sa base, laisser confirmer l'issue au MJ. À 10 cases : −3 en DEF et CON 10 pour la prochaine action ; un rechargement ne rejoue pas la perte d'action |
| 🔴 P1 · COC-A3 — PNJ par rôle et bandes | Le pilote n'expose pas de procédure de rôle/Pulp ; le calcul du critique borne son seuil au maximum naturel et ne possède pas de choix « aucun critique ». Une simple plage ne neutralise donc pas le 20 d'un figurant | Ajouter rôle, mode standard/Pulp, capacités, santé et règle de critique distincts. Vérifier figurant sans critique sur 20 ; 4/12/24 échelons en Pulp, états tous les 6 pour un premier rôle ; bande de trois sbires : une touche en retire un, sans jet de DM. Ne pas appliquer ces règles Pulp à tous les PNJ |
| 🔴 P2 · COC-A4 — Héroïsme hors du test | Dépenser des échelons pour le résultat du test et appliquer le Blues sont livrés ; bonus d'Init., DEF, DM ou mouvement restent manuels | Proposer la destination et la durée du bonus, débiter une seule fois l'échelle, tracer l'effet jusqu'à son expiration. Vérifier que l'achat d'un bonus de DEF ne modifie pas simultanément le test déjà lancé ; conserver un seul modèle Héros ou Blues |
| 🔴 P2 · COC-A5 — Santé psychique et choc | Le panneau sait lancer VOL et régler une plage d'échec critique ; rang de l'événement, état de choc et suivi des conséquences n'ont pas de parcours dédié | Préparer un événement avec son rang, lancer VOL sous les paramètres du corpus, proposer l'état et sa durée avec validation du MJ. Garder distincts choc ponctuel, état du Blues et séquelle ; ne pas dépenser une seconde échelle d'évolution |
| 🔴 P2 · COC-A6 — Capacités de Voies vérifiables | Les six Voies et leurs cinq rangs sont des champs reliés, sans moteur d'effets ; les PJ de recette n'ont pas de capacités officielles préremplies | Outiller d'abord un petit ensemble de capacités choisies dans le livre : rang, texte sourcé, effet déclaré, coût et durée, puis aperçu avant application. Une case de rang seule ne doit produire aucun bonus inventé ; suivre une capacité du formulaire au Hub et au journal |

**À cadrer avant extension :** la variante 3d6 existe déjà. Son import/remplacement réel
reste à essayer ; les critiques 18/3 sont une convention GM-OS explicitée dans le manuel,
pas une règle chiffrée du livre. Conserver un choix documenté, sans annoncer une correction
canonique. Poursuites et approches/sentiments peuvent rester des aides au MJ après ces lots.
GM-05 et migration des anciennes fiches relèvent des priorités communes en fin de document.
`,
 'Degenesis':`
**Analyse complémentaire du 01/11/2026 — propositions DEG-A1 à DEG-A6.**
La réserve, les déclencheurs, le débit d'Égo au test, les Traumatismes et les deux pistes
sont livrés. Les limites suivantes sont encore visibles dans les lecteurs du code.
Sources : [round et initiative](../../docs/systems/degenesis/rules/initiative-et-deroulement-du-tour.md),
[ressources](../../docs/systems/degenesis/rules/jauges-et-ressources-individuelles.md),
[Brûlure](../../docs/systems/degenesis/rules/la-brulure-et-la-stimulation-des-chakras.md),
[réserves et résolution](../../src/modules/dice/systemes/degenesis.ts),
[pistes](../../src/modules/combat/logic/pistesDeDegenesis.ts),
[Jet système](../../src/modules/combat/useCombatStore.ts).

| Priorité / lot proposé | Constat vérifié au 01/11 | Amélioration proposée et critère de recette |
| --- | --- | --- |
| 🔴 P1 · DEG-A1 — Égo de l'initiative et première action | Le Jet système appelle la réserve avec des choix vides ; le panneau de test débite son Égo, mais sans souvenir partagé de la première action du round. Les actions supplémentaires sont dites au journal | Choisir 0–3 Égo avant initiative, débiter une fois, reporter les dés sur la première action puis les consommer ; suivre les actions disponibles et la surprise. Avec 2 Égo : +2D à initiative et première action, un seul débit de 2, aucun bonus sur la seconde ; rechargement sans second paiement |
| 🔴 P1 · DEG-A2 — Arme, défense et dégâts nets | Les circonstances sont saisissables ; armure, déclencheurs de dégâts et défense active restent arbitrés. La porte des pistes attend des dégâts déjà réduits | Choisir explicitement arme et protection active, calculer l'aperçu brut/déclencheurs/armure, puis envoyer le net aux pistes. Déclarer l'action de défense utilisée plutôt que multiplier librement les réactions ; 10 DM contre armure 3 doivent transmettre 7, pas déduire encore 3 au suivi de santé. Aucun cumul automatique des deux armures |
| 🔴 P2 · DEG-A3 — Maxima calculés et choix exclusifs | Égo maximal est un champ à saisir ; les formules dépendent de Concentration ou Pulsions, et Foi ou Volonté pour la Sporulation. La santé a déjà ses maxima natifs | Déclarer la branche retenue, calculer et expliquer les maxima, avertir d'une exclusivité contradictoire. INT 3 + Concentration 2 donne Égo max 10 ; une variation ne doit ni remplir gratuitement la jauge ni effacer les points permanents |
| 🔴 P2 · DEG-A4 — Coopération, combinaisons et confrontation | Le moteur compte les succès et les 6 ; il ne prépare pas la transmission des déclencheurs entre plusieurs jets ni une comparaison complète des deux camps | Proposer aide, test en chaîne et opposition comme procédures séparées. Pour la coopération, 2 déclencheurs apportent 2D au bénéficiaire ; en combinaison, reporter selon le corpus sans les compter deux fois ; à succès égaux, comparer les 6 avant l'arbitrage final. Conserver plafond de 12 dés et surplus en succès d'office |
| 🔴 P2 · DEG-A5 — Sporulation permanente, Brûlure et Potentiels | La piste de contamination existe, mais le permanent n'est pas isolé ; Brûlure et six textes de Potentiels n'ont pas de suivi d'effets | Séparer subi/permanent, enregistrer les traitements et un usage de Brûlure avec puissance/durée, puis un choix explicite du Potentiel applicable. Puissance 2 : Égo et contamination évoluent de 2 selon leurs bornes ; la fin du bonus ne retire pas la contamination permanente. Valider chaque effet de Potentiel, sans interpréter automatiquement tout texte libre |
| 🔴 P2 · DEG-A6 — Adversaire autonome à deux pistes | PJ et PNJ avec fiche passent par la porte des pistes ; l'adversaire de plateau sans fiche reste sur le suivi de PV générique | Donner à cet adversaire les valeurs minimales du système et utiliser la même résolution, y compris dégâts mentaux sur Égo. Rejouer la même attaque contre un PNJ lié et autonome : Blessures/Traumatismes identiques ; si les maxima manquent, demander une préparation explicite plutôt que prétendre calculer les pistes |

**Décision de périmètre :** conserver défense, cumul éventuel d'armures et Potentiels sous
validation du MJ tant que leurs entrées ne sont pas structurées. La présence de deux champs
d'armure n'autorise pas à additionner leurs protections. Ces propositions n'invalident pas
les 66 cas de recette déjà livrés ; elles demandent des cas supplémentaires après développement.
`,
 'RuneQuest':`
**Analyse complémentaire du 01/11/2026 — propositions RQ-A1 à RQ-A6.**
Le d100, les cinq niveaux, l'opposition et les coups localisés sont livrés. Deux écarts précis
doivent être traités avant d'élargir l'automatisation : version de recette et affichage de cible.
Sources : [inventaire du lot](../../output/campagnes-tests/runequest/inventaire.json),
[générateur 2.1.0](../../outils/runequest/finir_runequest.py),
[suites du jet](../../src/modules/session/components/fields/RuneQuestAuJet.tsx),
[coups localisés](../../src/modules/combat/logic/coupsDeRuneQuest.ts),
[dégâts](../../docs/systems/runequest/rules/degats-et-types-de-degats.md),
[rangs d'action](../../docs/systems/runequest/rules/initiative-et-deroulement-du-tour.md).

| Priorité / lot proposé | Constat vérifié au 01/11 | Amélioration proposée et critère de recette |
| --- | --- | --- |
| 🔴 P1 · RQ-A1 — Recette alignée sur 2.1.0 | Les trois archives et le pilote du lot livré portent encore **2.0.0**, 313 champs et aucun \`combat.coupsLocalises\`. Le générateur courant déclare 2.1.0 et les sept champs de dégâts locaux | Rebaser le générateur de recette sur l'export 2.1.0, ajouter les états de zone et rejouer import/remplacement/Hub/coups localisés avec preuves liées aux nouveaux SHA. Ne pas annoncer que la recette 2.0.0 validait les coups localisés. Ne pas écraser automatiquement un pilote installé du même ID |
| 🔴 P0 · RQ-A2 — PV affichés du bon combattant | La fonction localiser lit les PV dans les valeurs du lanceur ; la cible choisie par « Porter le coup » est lue ailleurs. Les dégâts sont bien appliqués à la cible : l'écart concerne l'information affichée et consignée | Lire la zone de la cible sélectionnée ou annoncer explicitement une localisation sans PV de cible. Cas : bras attaquant 3 PV, cible 5 PV ; la ligne de coup doit montrer 5 et changer quand la cible change, sans toucher l'attaquant. Constat par lecture, pas nouvelle reproduction E2E |
| 🔴 P1 · RQ-A3 — Résultat d'attaque jusqu'au coup | Le résultat spécial/critique est connu, mais « Porter le coup » reçoit une zone et un nombre ; la routine retire toujours l'armure. Dégâts d'arme, bonus, empalement/lacération/écrasement et parade restent à préparer à la table | Ajouter un aperçu selon arme et résultat de combat, avec bypass d'armure explicite sur critique et validation des effets. À dégâts et zone identiques, l'attaque ordinaire retire l'armure ; le critique l'ignore. Préserver le plafond d'un membre et ne pas appliquer deux fois bonus, soins ou dégâts totaux |
| 🔴 P1 · RQ-A4 — Rang d'action selon l'action | Le pilote trie RA DEX + RA TAI ; les RA d'armes sont stockés mais pas inclus dans une préparation d'action. Un tir ou un sort n'utilise pas automatiquement le même total qu'une mêlée | Préparer intention, arme/sort, délais et RA final ; distinguer mêlée et tir/magie, départager par DEX et gérer la limite 12. À RA final 13, ne pas présenter l'action comme exécutée durant le round courant ; conserver la décision de report du MJ |
| 🔴 P2 · RQ-A5 — Dérivés explicables | PV maximum, zones, bonus de dégâts, ENC, vitesse de guérison et modificateurs de catégorie restent principalement saisis | Proposer un calcul depuis les caractéristiques, avec détail et dérogation explicite. Une modification de CON/TAI prépare les nouveaux maxima et zones sans soigner gratuitement ni effacer les dégâts subis ; comparer plusieurs valeurs frontières aux tables relues du livre |
| 🔴 P2 · RQ-A6 — Magie, inspiration et progression assistées | Runes/Passions, PM et deux réserves de PR sont reliés ; coût des sorts, récupération, suites d'inspiration, INT libre et coches d'expérience ne sont pas des procédures persistantes complètes | Commencer par lancement avec coût annoncé et bon culte, puis issue d'inspiration et coche d'expérience nommée ; prévoir annulation et journal. Un coût payé sur le culte 2 ne débite ni culte 1 ni deux fois après reload. Ne pas appliquer l'augmentation générique comme toute la règle d'inspiration ; laisser les effets de sort au MJ hors catalogue vérifié |

**Après ces lots :** organiser les effets temporisés de blessures (hémorragie, perte de PV au
round, incapacité), annoncés mais non appliqués par le moteur. Les 408 clés HTML absentes sont
motivées : famille/ascendance/compagnon ne sont pas toutes des défauts de raccord à corriger.
Les statuts et coches utiles à la procédure de jeu sont à sélectionner, sans imposer de relier
les 735 clés. La campagne 2.0.0 reste utilisable pour ses mécaniques d'origine.
`,
 'Shadowrun Anarchy':`
**Analyse complémentaire du 01/11/2026 — propositions SR-A1 à SR-A6.**
Le risque, RR, Anarchy au jet, moniteur et raccord 120 clés sont livrés ; les lectures suivantes
repèrent les procédures encore manuelles. Aucun second moteur de jet n'est à créer.
Sources : [drain](../../docs/systems/shadowrun-anarchy/rules/le-drain-magique.md),
[Matrice](../../docs/systems/shadowrun-anarchy/rules/le-piratage-et-les-modes-de-connexion-a-la-matrice.md),
[planification](../../docs/systems/shadowrun-anarchy/rules/monnaie-de-table.md),
[rigging](../../docs/systems/shadowrun-anarchy/rules/le-rigging-et-la-plongee-dans-les-vehicules.md),
[moniteur](../../src/modules/combat/logic/moniteurDeShadowrun.ts),
[champs du pilote](../../outils/shadowrun-anarchy/finir_shadowrun.py).

| Priorité / lot proposé | Constat vérifié au 01/11 | Amélioration proposée et critère de recette |
| --- | --- | --- |
| 🔴 P1 · SR-A1 — Blessures, drain et soins admissibles | La grave pèse déjà sur le jet ; légère récente cochée manuellement. Le moniteur ne conserve ni origine drain ni autorisation des soins : son bouton de soin retire simplement la pire blessure | Ajouter origine et terme de la blessure/du malus, conséquences du drain proposées après le jet magique, repos et soins distingués. Une blessure de drain ne doit pas être effacée par premiers soins ou magie ; le désavantage temporaire expire au bon terme de narration, pas au simple passage d'un round |
| 🔴 P2 · SR-A2 — Cohérence des champs et des ressources | Réserve de compétence et seuils sont des nombres saisis ; les calculs du panneau ne réécrivent pas ces dérivés. Anarchy est déclarée max 99 malgré l'absence de plafond dans la règle ; Essence 0 ne marque pas à elle seule un état terminal | Proposer réserve/seuils dérivés avec dérogation explicite, supprimer ou rendre cohérent le plafond d'Anarchy dans tous les lecteurs, faire confirmer les suites d'Essence. Tester Anarchy 99 → 100 et une variation d'attribut sans effacer les blessures ; préserver les protections propres au profil, sans les deviner depuis leur nom |
| 🔴 P1 · SR-A3 — Piratage préparé et surveillance | La fiche contient minimum de risque et hausse du seuil ; mode RA/RV, accès, backdoor et surveillance de DIEU sont réglés à la main | Préparer un contexte de tentative : Firewall, accès visé, préparation, mode et minimum de risque ; garder la progression de surveillance et proposer les conséquences. Accès Aucun → Administrateur : +2 au seuil avant backdoor ; hot-sim : biofeedback mental létal, pas physique. Ne pas donner d'action/avantage RV à une connexion qui ne les permet pas |
| 🔴 P2 · SR-A4 — Planification, flashback et menace | Les deux réserves sont natives et leurs droits déclarés ; succès de préparation, paiement de flashback, alimentation de menace et désastre sont manuels | Proposer crédit des succès, paiement personnel/collectif validé et coût de flashback (1–4), sans achat de dés. En narration totale seulement, proposer les mouvements de menace et le dépassement ; 4 en planification, flashback 2 → 2, un seul débit et même valeur après reconnexion |
| 🔴 P2 · SR-A5 — Opposition et rôles adverses | Le panneau compare les succès à un seuil fixe, y compris celui saisi depuis l'adversaire ; il ne tranche pas la règle d'égalité ni la valeur moyenne d'un second rôle. Le dé spécial alternatif est déjà implémenté | Ajouter une comparaison explicitement opposée, égalité non départagée et arbitrage quand un vainqueur est nécessaire ; proposer le profil de second rôle. Deux camps à 4 succès ne deviennent pas automatiquement une victoire du lanceur. Tester séparément l'import de la variante alternative, sans la réimplémenter |
| 🔴 P3 · SR-A6 — Rigging et véhicule, après arbitrage | Aucun suivi natif des modes de contrôle, de l'appareil et de son biofeedback ; contradiction du livre sur la résistance des véhicules déjà consignée | Fixer d'abord avec David la référence de résistance, puis suivre appareil/rigger séparément, priorité des modes et nature du biofeedback. Une case grave cochée sur l'appareil provoque une légère au rigger, selon le mode ; ne pas copier le moniteur humanoïde comme règle universelle de Structure |

**À conserver comme choix de table :** narration, contenu d'un flashback et effets ouverts
des atouts. Les capacités proposées doivent assister leurs coûts et leur suivi, pas inventer
un catalogue de sorts ou automatiser une décision d'auteur. Les variantes « plus sombre »
demandent une option explicite avant tout changement de durée ou de guérison.
`,
};
for(const [nom,bloc]of Object.entries(blocs)){
 const debut=t.indexOf('## '+nom+'\n');if(debut<0)throw Error(nom+' absent');
 const fin=t.indexOf('\n## ',debut+4);let section=t.slice(debut,fin<0?t.length:fin);
 if(section.includes('— propositions'))throw Error('Analyse deja presente');
 const ancre=section.indexOf('\n**Reste');if(ancre<0)throw Error('Ancre absente '+nom);
 section=section.slice(0,ancre)+'\n'+bloc.trim()+'\n'+section.slice(ancre);
 t=t.slice(0,debut)+section+t.slice(fin<0?t.length:fin);
}
const resumés={
 'RuneQuest':{compte:'🟢 1 · 🟠 7 · 🔴 6',suite:'**Analyse du 01/11 (§ 199)** : aligner la recette encore en 2.0.0 sur 2.1.0 ; corriger les PV de cible affichés, puis dégâts spéciaux/RA ; GM-05 commun, essai de David attendu'},
 'Degenesis':{compte:'🟢 1 · 🟠 6 · 🔴 6',suite:'**Analyse du 01/11 (§ 199)** : Égo initiative/première action, armure et défense, maxima explicites, contamination permanente ; GM-05 commun et essai de David attendu'},
 'Chroniques Oubliées Contemporain':{compte:'🟢 1 · 🟠 9 · 🔴 6',suite:'**Analyse du 01/11 (§ 199)** : arme → DM/critique, états/DEF, rôles PNJ et Pulp ; puis Héros hors test, choc, Voies ; GM-05 commun et essai de David attendu'},
 'Shadowrun Anarchy':{compte:'🟢 0 · 🟠 6 · 🔴 6',suite:'**Analyse du 01/11 (§ 199)** : drain/soins, Matrice préparée, cohérence des dérivés et Anarchy, réserves/opposition ; rigging après arbitrage du livre ; GM-05 et essai de David attendus'},
};
t=t.split('\n').map(l=>{for(const[n,r]of Object.entries(resumés))if(l.startsWith('| ['+n+']')){const c=l.split(' | ');c[1]=r.compte;c[c.length-1]=r.suite+' |';return c.join(' | ');}return l;}).join('\n');
const cadre=`
**Analyse des quatre nouveaux pilotes — 01/11/2026**, base de code 0a9431ef :
RuneQuest 2.1.0 côté générateur (recette encore 2.0.0), Degenesis 2.0.0, COC **Chroniques
Oubliées Contemporain 2e édition** 2.0.0, Shadowrun **Anarchy 2.0** 2.0.0. Ce n'est ni
L'Appel de Cthulhu ni un autre Shadowrun. Les six lignes rouges ajoutées par jeu sont des
**propositions à faire**, distinctes du socle livré et de l'essai attendu de David.
Un traitement laissé au MJ n'est pas, à lui seul, un défaut du pilote.

Lecture croisée : générateurs/exports conservés dans les lots, règles déjà relues, code,
manuels et rapports des quatre recettes. **177 tests ciblés / 12 fichiers passent** le 01/11
(jets, quatre portes de dégâts et quatre panneaux). Aucun nouvel essai Electron ni lecture
des campagnes personnelles ; les preuves d'import/Hub citées restent celles des lots datés.
[Périmètre et constats](2026-11-01-analyse-nouveaux-pilotes.md), registre **§ 199**.
`;
t=t.replace('## Vue d\'ensemble',cadre.trim()+'\n\n## Vue d\'ensemble');
const commun=`
**Priorités transversales réévaluées le 01/11 (les quatre nouveaux pilotes).**
Les validations du 22–24/10 ci-dessus restent des acquis dans leur périmètre ; elles ne
valident pas la confidentialité de tous les champs ajoutés depuis. Les recettes ultérieures
conservent le défaut GM-05. Ne pas relire « rien ne reste » comme une clôture de ces nouveaux cas.

| Priorité / lot proposé | Constat et périmètre | Résultat attendu et preuve à obtenir |
| --- | --- | --- |
| 🔴 P0 · NP-C1 — Secrets de séance / GM-05 | RuneQuest, Degenesis, COC et Shadowrun ont chacun un rapport Electron en échec sur douze chemins de gmSecrets de séance ; défaut commun de synchronisation, pas quatre règles à modifier | Filtrer à la sortie MJ, y compris rechargement et reconnexion ; zéro marqueur dans les trames joueur, toutes les assertions E2E strictes passent. Conserver les champs privés sur le MJ. Aucun correctif réalisé dans cette analyse |
| 🔴 P1 · NP-C2 — Anciennes fiches et versions | Les quatre manuels décrivent des rubriques déplacées ou à ressaisir ; un pilote de même ID conservé à l'import n'est pas nécessairement la dernière version. RuneQuest montre déjà le décalage 2.0.0/2.1.0 dans ses fichiers de recette | Prévoir diagnostic de version et aperçu de conversion à valider, jamais conversion depuis le seul nom des champs. Tester une copie fictive ancienne, conservation des notes/valeurs et retour arrière par export ; ne pas lire ou migrer les campagnes personnelles pour cet audit |
| 🔴 P1 · NP-C3 — Droits et variantes encore non éprouvés | GM-06 (édition du PJ d'autrui) n'est pas une panne démontrée par ces rapports ; c'est un essai restant. COC 3d6 et Shadowrun alternatif sont codés, mais pas validés par l'import des variantes dans leurs parcours E2E | Ajouter tests de refus d'écriture et persistance, puis imports isolés des variantes et retour au standard. Distinguer preuve automatisée, cas humains encore NON TESTÉS et tablette physique ; ne pas transformer une absence d'essai en bug confirmé |

**Ordre conseillé :** NP-C1, preuve RuneQuest alignée (RQ-A1) et information de cible (RQ-A2),
puis un lot central du jeu effectivement joué : DEG-A1, COC-A1/A2/A3 ou SR-A1/A3. Calculs,
progression et confort viennent ensuite. Le rigging reste conditionné à l'arbitrage de sa
référence. Cette analyse ne lance aucun développement et ne choisit pas la campagne de David.
`;
t=t.replace('**Pour choisir une prochaine intervention (revu le 25/10) :**',commun.trim()+'\n\n**Pour choisir une prochaine intervention (historique du 25/10, complété par l’analyse ci-dessus) :**');
fs.writeFileSync(p,t);
const r=JSON.parse(fs.readFileSync('tmp/analyse-nouveaux-pilotes/verification-tests.json','utf8'));
const preuves=['outils/runequest/finir_runequest.py','src/modules/session/components/fields/RuneQuestAuJet.tsx','src/modules/combat/logic/coupsDeRuneQuest.ts','src/modules/combat/useCombatStore.ts','outils/degenesis/finir_degenesis.py','src/modules/combat/logic/pistesDeDegenesis.ts','src/modules/dice/systemes/coc.ts','src/modules/combat/logic/encaissementDeCoc.ts','src/modules/combat/logic/moniteurDeShadowrun.ts','outils/shadowrun-anarchy/finir_shadowrun.py'];
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const etat={date:'2026-11-01',base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),nature:'Analyse et documentation uniquement ; aucune réalisation des lots proposés.',tests:{success:r.success,passes:r.numPassedTests,echecs:r.numFailedTests,fichiers:r.testResults.map(x=>({fichier:x.name.replaceAll('\\','/').split('/GM-OS-v5/').at(-1),passes:x.assertionResults.filter(a=>a.status==='passed').length}))},sources:preuves.map(fichier=>({fichier,sha256:sha(fichier)})),recettes:['runequest','degenesis','coc','shadowrun-anarchy'].map(jeu=>{const racine='output/campagnes-tests/'+jeu+'/';const i=JSON.parse(fs.readFileSync(racine+'inventaire.json'));const e=JSON.parse(fs.readFileSync(racine+'verification-electron.json'));return{jeu,pilote:i.pilote.id,version:i.pilote.version,casHumains:i.casDeRecette,source:racine+'inventaire.json',sha256:sha(racine+'inventaire.json'),rapportElectron:racine+'verification-electron.json',GM05:e.anomalies.filter(a=>a.cas==='GM-05').length};})};
fs.writeFileSync('documentation/Planning/2026-11-01-analyse-nouveaux-pilotes.json',JSON.stringify(etat,null,2)+'\n');
console.log(JSON.stringify({tests:etat.tests.passes,propositions:24,prioritesCommunes:3,recettes:etat.recettes.map(x=>({jeu:x.jeu,version:x.version,GM05:x.GM05}))}));
