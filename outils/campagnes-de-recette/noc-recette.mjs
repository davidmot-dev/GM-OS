import fs from 'node:fs';
import path from 'node:path';
import { scenes, indices, pnj } from './noc-scenario.mjs';

const lignes = [
    ['NOC-01', '01', 'Soren, valeurs initiales', 'Comparer Talent et difficulté avec zéro dé de destin.', 'Le Talent seul décide ; aucune goutte de Fiel sans dé.'],
    ['NOC-02', '01', 'Talent Ingénierie / Domaine Technique', 'Faire varier de zéro au plafond les dés de destin.', 'Le plafond suit le Domaine retenu et les malus ; aucune explosion automatique imposée.'],
    ['NOC-03', '01', 'Jet naturel contenant un 10', 'Accepter puis refuser, sur des jets distincts, le dé offert.', 'Un choix par 10 ; le refus conserve le résultat courant. Relever les faces naturelles.'],
    ['NOC-04', '01', 'Jet avec réussites 8/9/10', 'Comparer les faces et le niveau final à la difficulté.', 'Une réussite par 8, 9 ou 10 ; un 1 ne retire pas de réussite.'],
    ['NOC-05', '01', 'Écart final d’un degré', 'Vérifier le libellé et décider de la suite.', 'Échec partiel proposé à la Loi, sans convertir automatiquement l’échec en réussite.'],
    ['NOC-06', '01', 'Vécu 2', 'Engager un Vécu puis tenter d’en engager deux.', 'Un seul point par test ; débit effectif une fois.'],
    ['NOC-07', '01', 'Daria, Ferveur 4', 'Engager un Espoir et comparer à Soren, Ferveur inférieure à 4.', 'Daria reçoit 4 dés par point ; Soren en reçoit 3.'],
    ['NOC-08', '01', 'Singularité du Héros 1', 'Engager de la Singularité et relever les 1 réellement tirés.', 'Seuls les points qui annulent un 1 sont dépensés avant alimentation du Fiel.'],
    ['NOC-09', '01', 'Domaine Technique de Cabale 3', 'Puiser un dé de Cabale sur un jet Technique.', 'Stock groupe:domains.technical réduit d’un ; niveau de la feuille reste 3.'],
    ['NOC-10', '01', 'Atout Atelier 2 ; Salle blanche −1', 'Choisir l’Atelier puis rechercher la Faille.', 'Un point d’Atout au plus par test ; la Faille ne fournit aucun point.'],
    ['NOC-11', '01', 'Capital 3, Fortune de Naël', 'Engager plusieurs points de Capital sur Fortune, puis sur un autre Talent.', 'Exception sans plafond unitaire seulement sur Fortune ; les autres Atouts restent limités.'],
    ['NOC-12', '01', 'Pistes Cabale Espoir/Vécu/Singularité 1', 'Dépenser séparément chaque piste, réimporter entre essais.', 'Bonus et débits portés par la fiche du groupe, distincts des réserves du Héros.'],
    ['NOC-13', '01', 'Fiel 4, Menace 1', 'Ajouter une goutte depuis la tablette.', 'Fiel 0 et Menace 2 ; effet de débordement à choisir par la Loi.'],
    ['NOC-14', '01', 'Fiel 4', 'Ajouter trois gouttes, puis annuler l’essai en réimportant.', 'Une vidange à 5, puis Fiel 2 ; Menace augmente d’un.'],
    ['NOC-15', '03', 'Fiel 0 ; Héros bénéficiaire disponible', 'Au pupitre, obtenir des 1 pour un Rouage hostile et choisir le bénéficiaire.', 'Choix obligatoire avant validation ; Singularité réellement reçue ; aucun second crédit du même jet.'],
    ['NOC-16', '01', 'Rouage allié déclaré', 'Traiter ses 1 selon le rôle allié.', 'Les 1 alliés alimentent le Fiel ; ne pas leur appliquer le retrait réservé au hostile.'],
    ['NOC-17', '03', 'Menace 3', 'Ouvrir les effets du Fiel et répartir le nombre d’effets demandé.', 'Le total suit la Menace ; pertes cumulées avant résistance ; aperçu avant application.'],
    ['NOC-18', '03', 'E02 Lumière 2 ; E03 Lumière 1', 'Intervention : protéger E01 avec deux sources, puis tenter de réutiliser leurs points.', 'Les sources se cumulent, une même unité de Lumière ne protège qu’une fois ; la Loi fixe les Auras.'],
    ['NOC-19', '03', 'E01 et E03 Espoir 0 ; Vassil Espoir 1', 'Appliquer Fatigue aux participants dont le Rouage allié.', 'À zéro, le Héros devient Fatigué ; les alliés perdent leur Espoir sans inventer une Fatigue de Héros.'],
    ['NOC-20', '03', 'Folie mise à −1 sur une copie', 'Appliquer une Tension et comparer à Folie 0.', 'Trauma +3 contre +2 ; bornes et résistances visibles.'],
    ['NOC-21', '03', 'Façade différente sur chaque Héros', 'Appliquer Traque et comparer les gains.', 'Résistance personnelle par Façade, sans mélange avec la Traque de Cabale.'],
    ['NOC-22', '03', 'E02 en Bouleversement', 'Tester un Talent de Statut puis un autre Domaine ; demander une Faveur.', 'Malus réservé au Statut ; sollicitation de Faveur bloquée ; levée à décider au terme du cycle.'],
    ['NOC-23', '02', 'S01/S04/S07/S10 à 4', 'Faire franchir 5 à chacune des quatre jauges, séparément.', 'Blessures/Trauma : Choqué ; Traque : Signalé ; Noirceur : Teinté. Pas de Séquelle à 5.'],
    ['NOC-24', '02', 'S02/S05/S08/S11 à 7', 'Franchir 8 puis rouvrir la fiche sans nouveau franchissement.', 'Séquelle appropriée proposée/consignée une fois ; Blessure lourde, Traumatisé, Recherché ou Possédé.'],
    ['NOC-25', '02', 'S03 à 9 Blessures', 'Ajouter une Blessure puis soigner sur une copie.', 'Dix cases et Agonie, jamais une piste PV inventée ; traitement lourd arbitré par la Loi.'],
    ['NOC-26', '02', 'S06/S09/S12 à 9', 'Franchir 10 dans Trauma/Traque/Noirceur.', 'Pistes bornées, conséquences distinctes ; ne pas transformer toute jauge à 10 en mort physique.'],
    ['NOC-27', '02', 'Copie avec Blessures 5 et Trauma 8', 'Ouvrir le jet puis ajouter Traque 8, Noirceur 8 et Fatigue.', 'Malus cumulés et nommés ; Domaine et Talent diminuent selon chaque seuil.'],
    ['NOC-28', '02', 'Séquelle de Blessures déclarée', 'Moment de calme à proximité du plancher de Séquelle.', 'Récupération ne traverse pas le plancher ; soin lourd non automatisé.'],
    ['NOC-29', '03', 'E01 Soupçon 5', 'Ouvrir le calme, laisser la répartition vide puis allouer les points exigés.', 'Application bloquée avant répartition complète des 2 points effectivement récupérables.'],
    ['NOC-30', '03', 'E02 Soupçon 8 ; E03 Soupçon 10', 'Répartir les amputations de récupération sur deux essais indépendants.', '4 ou 6 demandés, plafonnés aux récupérations réelles ; jamais une perte supplémentaire.'],
    ['NOC-31', '03', 'E03 Extase 3, E01 Extase 0', 'Partager l’Extase vers E01 puis tenter d’en attribuer plus de 3.', 'Bénéficiaire rechargé dans son plafond propre ; total supérieur au budget refusé.'],
    ['NOC-32', '03', 'Repos partiel, puis tous les Héros', 'Comparer la baisse de Fiel avec puis sans tous les Héros présents.', 'Fiel collectif −1 seulement quand tous les Héros partagent le calme.'],
    ['NOC-33', '03', 'Allié Vassil avec Espoir', 'Inclure puis exclure l’allié du repos.', 'Il peut recevoir l’entraide lorsqu’il participe ; ses effets restent ceux d’un allié.'],
    ['NOC-34', '01', 'Cabale déjà remplie', 'Ouvrir la fiche depuis la campagne puis sur les trois tablettes.', 'Même nom, sept Domaines, Atouts, sept pistes et trois Contacts ; aucune Cabale à recréer.'],
    ['NOC-35', '01', 'Faveurs Réseau 2/1/2', 'Solliciter successivement 1, 3 et 5, réimporter entre essais.', 'Débits des Contacts sélectionnés seulement ; énorme faveur possible avec les trois Contacts ; aucune réserve négative.'],
    ['NOC-36', '01', 'Réseau 3', 'Renommer un Contact, réduire Réseau puis le rétablir.', 'Anciennes données conservées ; Contacts hors niveau inactifs, sans remise à zéro silencieuse.'],
    ['NOC-37', '03', 'Pistes Cabale et deux stocks à zéro', 'Nouveau scénario, confirmer la remise.', 'Espoir 3, Vécu 2, Singularité 2 ; Contacts à 2 chacun ; Technique et Capital à 3 ; Menace 0.'],
    ['NOC-38', '03', 'Périls Cabale 2/1/1/2', 'Comparer avant/après Nouveau scénario.', 'Traque, Noirceur, Division et Dégradation conservées ; les autres campagnes ne changent pas.'],
    ['NOC-39', '01', 'Vécu 2 et Menace 1', 'Début de séance puis nouveau scénario ; essayer aussi Vécu supérieur à 3 sur copie.', 'Séance : Vécu +1 jusqu’à 3, Menace −1 ; un Vécu déjà au-dessus du plafond de base n’est pas réduit.'],
    ['NOC-40', '01', 'Fiche HTML du Héros', 'Cliquer le sixième rond Vécu, le niveau courant pour zéro, puis exporter/recharger.', 'Valeur numérique cumulative, zéro possible, anciennes clés compatibles ; aucun compteur de PV/Endurance.'],
    ['GM-01', '01/02/03', 'Joueurs p-1/p-2/p-3 existants', 'Importer telle quelle les trois archives et comparer inventaire.json.', 'Trois joueurs réutilisés ; 18 nouveaux PJ au total, sans écraser les anciens ; trois Cabales indépendantes.'],
    ['GM-02', '01', 'Séance prévue, trois tablettes', 'Choisir Soren, Daria et Naël ; ouvrir leurs fiches.', 'Le bon jeu et le bon personnage pour chacun ; aucun débordement aux trois tailles.'],
    ['GM-03', '01', 'Fiches ouvertes sur PC et tablette', 'Modifier un champ, une note, puis lancer un jet.', 'Modification et jet reçus par la Loi ; résultat consigné sans double débit.'],
    ['GM-04', '01', 'Indices cachés au départ', 'Révéler le carbone, ouvrir son document côté joueur, puis le recacher.', 'Seule la convocation est visible initialement ; aucun autre document caché exposé dans les écrans.'],
    ['GM-05', '01', 'Marqueur SECRET_MJ_NOC_RECETTE', 'Examiner écrans et données WebSocket des joueurs.', 'Aucun secret transmis ; défaut connu gmSecrets à consigner comme ÉCHEC tant qu’il subsiste.'],
    ['GM-06', '01', 'Atlas au refuge', 'Suivre un lien de lieu puis un lien PNJ ; projeter le plan.', 'Huit plans embarqués et liens exacts ; brouillard à configurer sur le poste.'],
    ['GM-07', '01', 'Trame quatre actes', 'Suivre les branches administrative, maintenance et passerelle.', 'Branches rejoignent la chambre ; atelier hors fiction distinct ; aucun lien orphelin.'],
    ['GM-08', '01', 'Rencontres R01/R02/R03', 'Lancer une rencontre, ajouter les Héros, infliger puis soigner une Blessure.', 'Alliés et hostiles corrects, santé en dix cases alignée à la fiche.'],
    ['GM-09', '01', 'Relations de Soren, Daria, Naël et Nora', 'Ouvrir le graphe social et chaque cible.', 'Liens famille, alliés, hostilité vers les bonnes fiches.'],
    ['GM-10', '01', 'Butin disponible', 'Donner une lampe puis transférer un objet ; refuser puis accepter.', 'Quantités et propriété correctes, pas d’effet Lumière automatique.'],
    ['GM-11', '01', '101 jetons de transit', 'Partager équitablement aux trois PJ ; archiver le reliquat.', '33 chacun, reste 2 ; aucun changement de Fortune/Capital.'],
    ['GM-12', '01', 'Wiki et chronologie', 'Lire neuf entrées et quatre repères relatifs.', 'Liens lisibles, Cabale documentée, aucun faux événement déjà joué.'],
    ['GM-13', '01', 'Sound-OS', 'Lancer puis arrêter les trois pads à volume modéré.', 'Trois WAV locaux, pas de média distant ou manquant.'],
    ['GM-14', '01', 'Music-OS', 'Charger les deux boucles en A/B et essayer le fondu.', 'Lecture/arrêt des signaux synthétiques ; aucune connexion externe requise.'],
    ['GM-15', '01', 'Quatre moments Storyboard', 'Projeter chaque moment depuis sa scène.', 'Carte, titre et signal associés ; pas de réglage de projecteur inventé.'],
    ['GM-16', '01', 'Trois tuiles Light-OS', 'Vérifier les tuiles et assigner vos lampes seulement pour l’essai matériel.', 'Tuiles présentes, lightStates vides ; couleur de tuile distincte d’une commande physique.'],
    ['GM-17', 'Tables', 'Table-OS → Atelier, nouvel univers de recette', 'Importer les trois JSON, Ranger tel quel ; tirer un objet et envoyer son butin.', 'Couverture 1–6, trois tables originales ; aucun remplacement des règles du pilote.'],
    ['FIN-01', '01/02/03', 'Après changements', 'Fermer et rouvrir GM-OS puis chaque campagne.', 'Cabales, Contacts, pistes, indices, inventaires et réserves persistent.'],
    ['FIN-02', '03', 'Laboratoire altéré', 'Réimporter seulement 03 avec Remplacer.', 'État initial de 03 restauré ; enquête 01, laboratoire 02 et anciens PJ inchangés.'],
    ['FIN-03', '01', 'Après progression', 'Exporter puis importer en Cloner.', 'Nouvelle campagne avec sa Cabale et ses renvois ; original conservé.'],
    ['FIN-04', '01', 'Campagne jouée', 'Importer en Rejouer et comparer à l’archive.', 'Parcours réinitialisé, séances retirées ; PJ conservés tels quels, pas une guérison générale.'],
    ['FIN-05', 'Toutes', 'Un essai terminé', 'Remplir observé/verdict/reproduction dans le CSV.', 'PASSÉ, ÉCHEC, NON TESTÉ ou NON APPLICABLE ; ne pas confondre données livrées et validation humaine.'],
];
export const casNoc = lignes.map(([id, archive, precondition, action, attendu]) => ({ id, archive, precondition, action, attendu }));
const cellule = s => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
const csv = s => '"' + String(s).replaceAll('"', '""') + '"';
export function ecrireRecetteNoc(sortie, { scenario, seuils, entraide, archives, rattachement }) {
    const ecrire = (nom, texte) => fs.writeFileSync(path.join(sortie, nom), texte.trimEnd() + '\n');
    ecrire('LIRE-MOI.md', `# Campagnes de recette NOC — Le neuvième timbre

## Importer

Dans **Bibliothèque des campagnes → Importer un bundle Nexus**, choisir **01-Le-neuvieme-timbre.gmos → Importer telle quelle**. Pas besoin de recharger l’application. Le pilote NOC et sa fiche sont ajoutés s’ils manquent ; si le même pilote existe, vérifier qu’il est en **2.0.0**. L’archive de pilote fournie permet son remplacement explicite au besoin.

Les PJ se rattachent aux joueurs existants **Thomas D. (p-1), Marie C. (p-2), Lucas R. (p-3)**. Identifiants relevés dans l’export fourni par David : \`${rattachement.source}\`. Aucun ancien PJ de cet export n’est recopié. Leurs profils et leurs PJ des autres campagnes sont conservés par Nexus.

La **Cabale Les Veilleurs du Palier est déjà créée** sur la campagne : ouvrir **Cabale — Fiche du groupe** pour sa feuille. Si le bouton **Créer une fiche pour Cabale** apparaît à la première ouverture, le choisir : il lie la feuille HTML et reprend les valeurs déjà remplies. Sur tablette, choisir son Héros, puis l’onglet Cabale. Elle n’est pas un PJ supplémentaire rattaché à un joueur.

| Joueur | Héros | Fonction |
| --- | --- | --- |
${scenario.players.map(p => `| ${p.realName} | ${p.characters[0].name} | ${p.characters[0].classRace} |`).join('\n')}

## Contenu

Enquête originale dans le **Bloc Vesper**, inventé pour les essais : trois Héros, une Cabale, trois Contacts de Réseau (Nora, Vassil, Mina), 12 PNJ/Rouages, huit lieux avec plans, 12 indices documentés, quatre actes et 16 scènes dont quatre ateliers hors fiction, trois rencontres, quatre séances prévues, neuf entrées de Wiki, quatre repères chronologiques, inventaires et butin. Lire **SCENARIO.md** pour mener l’enquête.

**02-Seuils-et-Sequelles.gmos** : 12 Héros préparés à 4/7/9 dans chaque jauge, pour franchir 5/8/10. **03-Repos-Auras-et-Cabale.gmos** : trois Héros préparés avec Soupçon 5/8/10, Extase/Lumière différentes, Ferveur 4 et réserves de Cabale épuisées. Chaque laboratoire possède sa propre Cabale, ses propres campagnes/PJ/renvois, mais les mêmes trois joueurs. Au total : **18 nouveaux PJ** sous trois joueurs existants.

Pour recommencer un essai destructif : réimporter **le fichier de ce laboratoire avec Remplacer**. Les autres campagnes restent intactes. Cloner garde l’essai précédent. Rejouer efface le parcours et les séances mais conserve les PJ : ce n’est pas une guérison générale.

## Cabale prête pour la recette

Sept Domaines, 28 Atouts renseignés dont une Faille à −1 (Salle blanche), sept pistes. Espoir/Vécu/Singularité à 1 au départ ; Credo 3, Légendes 2, Observatoire 2. Réseau 3 et Faveurs 2/1/2. Capital 3 permet l’essai de Fortune. Fiel 4 et Menace 1 permettent un débordement rapide. Ce sont des valeurs de recette, pas une création complète et validée par les livres. Les Contacts du Réseau et leurs deux Faveurs suivent **Diffractions obsidionales p. 134**, distinct du livre de base.

## Outils GM-OS

39 médias embarqués par archive : 36 SVG schématiques et trois WAV synthétiques originaux de quatre secondes. Quatre moments Storyboard, trois pads Sound-OS, deux pads Music-OS, trois tuiles Light-OS **sans lampe assignée**. Les cartouches sont des documents de test, pas des portraits illustrés. Les Auras sont appréciées par la Loi, jamais calculées sur ces plans sans échelle.

Trois tables 1d6 dans **tables-a-importer/** : **Table-OS → Atelier → Ranger tel quel**, dans un univers de recette. Elles ne voyagent pas dans les archives Nexus. Bibliothèque globale Image-OS, brouillard des cartes, calendriers, lampes, projecteurs, IA/TTS et services externes se configurent sur le poste. Aucun compte, clé ou appareil n’est inventé. Aucun nouveau module de jeu n’est créé.

## Tests et limites

**${casNoc.length} cas manuels** avec préconditions et attendus, dans CAHIER-DE-RECETTE.md et resultats.csv, encore NON TESTÉS par David. Les jets ordinaires restent aléatoires ; noter les faces observées. Les états de laboratoire sont reproductibles, pas leurs futurs tirages.

**Défaut connu GM-05** : l’application transmet actuellement les secrets de séance gmSecrets aux tablettes. Les notes de ce lot portent un marqueur fictif pour le vérifier. Lire ANOMALIES-CONNUES.md et RAPPORT-DE-VERIFICATION.md ; ne pas annoncer tous les cas réussis. Les conséquences narratives, les Auras, les Séquelles et les soins lourds restent à la Loi.

## Archives et reproduction

${archives.map(a => `- **${a.fichier}** : ${a.personnages} PJ ; SHA-256 ${a.sha256}`).join('\n')}

Générateur : \`node outils/campagnes-de-recette/noc.mjs\`. Sources : \`outils/campagnes-de-recette/noc*.mjs\`. Aucun import automatique dans l’application de David ni accès à son profil personnel.
`);
    ecrire('SCENARIO.md', `# Le neuvième timbre — dossier de la Loi

Fiction originale de recette pour NOC. Bloc Vesper, personnes et lieux sont inventés ; aucune prétention à un scénario officiel. Trois séances d’enquête et un atelier séparé. Les valeurs chiffrées servent à tester le pilote.

## Situation et vérité

La Cabale **Les Veilleurs du Palier** protège une ancienne laverie devenue refuge. Nora y apporte une convocation au nom de Maëla, disparue pendant une relève. L’original comportait huit timbres ; le greffe en montre neuf. Soren connaît un autre disparu, son apprenti Teren. Daria reconnaît une rupture dans les copies. Naël a porté le premier pli de Maëla.

Ozren Tall détourne des convois pour un dispositif dans une chambre de répartition. Il a ajouté un timbre après signature, puis fait classer les vivants parmi les absents. La vérificatrice Vera a noté les incohérences ; elle attend une preuve solide pour bloquer la relève. Le Chiffreur sait préparer un contre-ordre. La vanne de Vassil peut isoler la chambre sans couper les conduites habitées. Maëla peut organiser l’évacuation si les portes restent ouvertes.

## Mener l’enquête

Ne pas réserver une preuve essentielle à un jet réussi. Une action précise, une Faveur ou un détour peuvent donner l’information ; un échec change le prix, le délai, la surveillance ou l’état des lieux. La Loi règle la difficulté après avoir entendu l’approche. Aucun pouvoir inédit de l’Arpenteur ne s’applique automatiquement.

Trois approches atteignent le dénouement : **administrative** (Nora → Chiffreur → Vera → contre-ordre), **maintenance** (Teren → Vassil → vanne → chambre), **passerelle** (Mina → billet → coursive → captifs). Les informations se recoupent. Un Contact indisponible peut laisser sa copie à un allié ; ne pas verrouiller toute l’enquête.

Si les Héros temporisent, la Loi peut faire avancer la relève : le brigadier inspecte le triage, Ozren déplace les captifs, puis annonce une purge des copies. Ce sont des pressions narratives, sans augmentation automatique de Fiel/Menace ni chronomètre réel. Prévenir la table avant une conséquence irréversible.

## Cabale et liens

Devise : **Aucun nom ne disparaît seul**. Couverture : entretien des textiles. Ressources : abri, copies, atelier, passages, réseau de trois Contacts. Faiblesse : salle blanche inutilisable et couverture fragile au greffe. Nora offre des preuves ; Vassil demande de sauver les apprentis ; Mina ouvre les bacs de tri. Ilyan reçoit les réfugiés. Les Domaines et Atouts de la fiche ont un usage mécanique ; leur description ne donne pas de bonus supplémentaire.

## Déroulé des scènes

${scenes.filter(s => s[1] < 4).map(s => `### ${s[2]}\n\nLieu : ${s[3]}. ${s[6]}\n\nÀ jouer : ${s[4].map(x => pnj.find(p => p[0] === x)).map(p => `${p[1]} : « ${p[5]} »`).join(' ')}\n\nPour la Loi : ${s[4].map(x => pnj.find(p => p[0] === x)[6]).join(' ')}\n\nTraces disponibles : ${s[5].map(x => indices.find(i => i[0] === x)[1]).join(', ') || 'relations, décisions et témoignages'}. ${s[7].length ? 'Suites : ' + s[7].map(x => scenes.find(sc => sc[0] === x)[2]).join(' / ') + '.' : 'Épilogue selon les décisions de la table.'}`).join('\n\n')}

## Résolutions possibles

- **Le contre-ordre aboutit** : Vera bloque la relève et Ozren perd sa couverture. La Cabale choisit où déposer les copies ; les civils évacués ont besoin d’un nouvel abri.
- **La vanne est isolée** : le dispositif cesse d’être alimenté, l’évacuation commence. Ozren peut fuir avec son exemplaire ; les conduites habitées restent en service si le plan a été suivi.
- **Le groupe privilégie les captifs** : Maëla mène les civils par la passerelle. Les preuves laissées derrière peuvent disparaître. La Cabale garde une victoire humaine et une question ouverte.
- **Retraite** : la Cabale conserve les informations déjà obtenues. Déplacer le refuge et reprendre l’enquête demeure possible ; ne pas effacer les choix joués pour forcer un final.

Après la partie : relever les personnes sauvées, les copies conservées, l’état des Contacts et le devenir du Palier. Puis seulement essayer l’acte IV et les laboratoires, clairement hors fiction.
`);
    const labs = [seuils, entraide].map(s => `## ${s.campaign.name}\n\n` + s.players.map(p => `### ${p.realName}\n\n` + p.characters.map(c => `- **${c.name}** : Blessures ${c.sheetData.blessures}, Trauma ${c.sheetData.trauma}, Traque ${c.sheetData.traque}, Noirceur ${c.sheetData.noirceur}, Soupçon ${c.sheetData.soupcon}, Espoir ${c.sheetData.espoir}, Extase ${c.sheetData.extase}, Lumière ${c.sheetData.lumiere}.`).join('\n')).join('\n\n')).join('\n\n');
    ecrire('CAHIER-DE-RECETTE.md', `# Recette manuelle NOC

Consigner l’observé, sans cocher un cas sur la foi de son attendu. Un essai destructif indépendant repart de son archive avec Remplacer. Sources mécaniques : manuel **54-Jeu-NOC.md**, pilote **2.0.0**, bilan **2026-10-25-noc-finir.md** ; livre de base p. 220, 231–234, 248 et règles de Réseau de Diffractions p. 134. La recette ne prétend pas couvrir toutes les combinaisons.

| Cas | Archive | Précondition | Action | Attendu |
| --- | --- | --- | --- | --- |
${casNoc.map(c => `| ${[c.id, c.archive, c.precondition, c.action, c.attendu].map(cellule).join(' | ')} |`).join('\n')}

${labs}
`);
    ecrire('cas-de-recette.json', JSON.stringify(casNoc, null, 2));
    ecrire('resultats.csv', '\uFEFF' + ['id', 'archive', 'precondition', 'action', 'attendu', 'observe', 'verdict', 'anomalie', 'reproduction'].map(csv).join(';') + '\r\n' + casNoc.map(c => [c.id, c.archive, c.precondition, c.action, c.attendu, '', 'NON TESTÉ', '', ''].map(csv).join(';')).join('\r\n'));
    const tables = [
        ['rumeurs', ['Il y a neuf timbres pour huit destinations.', 'Les plis de Maëla n’arrivent plus au même bac.', 'Le registre de Nora possède un double.', 'Le Chiffreur vit au milieu des copies réformées.', 'Vera a déjà refusé un ordre incohérent.', 'La vanne de Vassil peut sauver les conduites.']],
        ['incidents', ['Une annonce couvre les dernières paroles.', 'Un chariot obstrue le passage direct.', 'Un commis reconnaît un visage de la Cabale.', 'Une lampe s’éteint au prochain palier.', 'La relève arrive en avance dans la fiction.', 'Un apprenti demande une place au refuge.']],
        ['objets', ['Carnet de carbone', 'Mèche de lampe', 'Jetons de transit', 'Pansements scellés', 'Clef de bac', 'Bobine de fil']],
    ];
    fs.mkdirSync(path.join(sortie, 'tables-a-importer'), { recursive: true });
    tables.forEach(([genre, textes], n) => ecrire(`tables-a-importer/${n + 1}-${genre}.json`, JSON.stringify({ name: `RECETTE Vesper — ${genre}`, dice: '1d6', entries: textes.map((texte, i) => ({ min: i + 1, max: i + 1, title: genre === 'objets' ? texte : `Entrée ${i + 1}`, description: texte,
        ...(genre === 'objets' ? { butin: [{ name: texte, type: i === 2 ? 'currency' : 'item', quantite: i === 2 ? 7 : 1, rarity: 'common', weight: 0, value: 0, description: 'Objet de recette ; aucun débit ou bonus automatique sur les pistes NOC.' }] } : {}) })) }, null, 2)));
}
