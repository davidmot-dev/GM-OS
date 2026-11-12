# Argyropée — Les Comptes de la marée

Demande de David le 09/11/2026 : « peux-tu faire une campagne test pour Argyropee? »
Méthode GM-OS Campagnes de test, contrat d’une campagne complète et d’un seul `.gmos`.

## Livraison et import

**PRÉPARÉE — import natif Electron et Hub réseau NON EXÉCUTÉS.**

- [ZIP complet](../../output/campagnes-tests/argyropee/Argyropee-Les-Comptes-de-la-maree-Recette.zip).
- [Unique campagne .gmos](../../output/campagnes-tests/argyropee/01-Les-Comptes-de-la-maree.gmos).
- [Guide d’import](../../output/campagnes-tests/argyropee/LIRE-MOI.md),
  [cahier des 61 cas](../../output/campagnes-tests/argyropee/CAHIER-DE-RECETTE.md),
  [états de référence](../../output/campagnes-tests/argyropee/ETATS-DE-REFERENCE.md),
  [anomalies](../../output/campagnes-tests/argyropee/ANOMALIES-CONNUES.md).

Vérifier le pilote **2.1.0**, ID `custom-1794176660508`, gabarit `tpl-1794176660508`,
137 champs. Copie identique fournie séparément ; original dans
[`Export Dirvers/corriges/Argyropee-2.1.0.gmos-driver`](../../Export%20Dirvers/corriges/Argyropee-2.1.0.gmos-driver).
Si un pilote ancien est installé, son remplacement doit être choisi explicitement.
Importer ensuite le seul `.gmos`, **Tel quel** au premier import.

## L’histoire et les ateliers

Fiction originale urbaine Renaissance : des maisons sont déclarées en péril avant les expertises,
des créances sont rachetées et les réparations des vannes servent à négocier le droit de rester.
Douze séances préparées, quatre actes, 36 scènes de fiction ; réactions, conséquences,
plusieurs voies d’indices et trois fins avec compromis possibles.

Trois PJ nouveaux rattachés aux profils autorisés : Marin Valque à Thomas D. `p-1`,
Alix Sorel à Marie C. `p-2`, Noéline Sève à Lucas R. `p-3`. Seuls les noms et identifiants du
relevé autorisé sont réutilisés ; aucun ancien personnage ou avatar copié.
Les huit `[RECETTE]` n’apparaissent que dans les ateliers. Seize PNJ de fiction et deux
PNJ synthétiques de pupitre, douze lieux, douze indices. Les sites, institutions locales,
PNJ et valeurs sont originaux, sans budget novice réglementaire revendiqué.

Dans la Trame, ouvrir directement le cinquième acte **ATELIERS DE RECETTE — hors fiction** :

1. R1 : jets, métier, paliers, Panache, coopération, action complexe et opposition.
2. R2 : réveil, repas, Faveur divine et Exubérance ; profils à zéro, sous trois Panache et inconscients.
3. R3 : magie, deux domaines identiques, refus, silenciada à sept, fin du combat.
4. R4 : santé, protections X/Y, initiative, deux actions, portées et course.
5. R5 : test de PNJ et Guigne, dépense magique exclue, offrande au prochain réveil.
6. R6 : fiche HTML, droits, médias, persistance et restauration locale.

61 cas humains **NON TESTÉS**, dix-huit couvertures sourcées. Les dés ne sont pas forcés dans
l’archive ; les faces contrôlées n’existent que dans les tests automatiques.
Les deux effets magiques de recette sont originaux, destinés aux consommations : pour une
partie réglementaire, choisir les vrais sorts dans le livre. Armes initiales : poings/pieds 1d4.

## Modules, médias et remise en état

Aucun module indépendant compatible Argyropée au catalogue actuel, vérifié par la vraie fonction
`modulesDuPilote`. Les outils sont natifs ; aucun module emprunté à un autre jeu, aucune réserve
collective ou paquet de cartes inventé. Aucun import Table-OS nécessaire.

44 SVG de plans et cartouches documentaires originaux, une bannière JPEG du lot Studio,
trois signaux WAV synthétiques de quatre secondes : embarqués, décodés hors ligne, rendus relus.
Ils ne sont pas présentés comme portraits peints ou voix enregistrées. Le thème et le modèle HTML
intégré restent des dépendances du poste, pas une installation effectuée par le `.gmos`.

Restaurer uniquement les champs indiqués du personnage de recette ; conserver la note d’une scène
et le Panache de Marin comme témoins. **Nexus Remplacer restaure toute la campagne**, pas un atelier.
`Guigne réglée` est collectif : il touche les onze personnages de la campagne, ajoute trois
à leur offrande déjà présente et remet leurs repères à zéro. Il ne sert pas de reset local.

## Vérifications et écarts conservés

**120 essais Vitest réussis / sept fichiers**, dont la recette de l’archive et les composants
avec ses vrais profils. Manifeste Nexus, champs et liens, règles du jet, Panache, action complexe,
opposition, journée, magie, PNJ, Guigne et correspondance HTML contrôlés en mémoire.
L’injection réelle de `NexusService` conserve des anciens PJ et avatars fictifs dans les trois profils ;
ce n’est pas un import Electron. Une restauration ciblée par `updateCharacter` conserve une note
de scène et le Panache 17 de Marin après sérialisation JSON, sans preuve de rechargement sur disque.
Le caviardage retire les marqueurs fictifs complets et partiels (GM-05), sans test réseau réel.

**Deux écarts de règle sont reproduits, pas validés comme conformes :**

- `ARGY-SANTE-NEGATIVE` / SAN-02 : `HealthInterpreter.handleHP`, santé 4 moins impact 5 →
  **0, état générique `dead`**, alors que la règle attend −1 et l’inconscience sans mort automatique.
- `ARGY-INITIATIVE-ZERO` / COM-01 : `CombatRules.resolveInitiativeFormula`, d10 moteur 10,
  Agilité 2, Détection 2, bonus 0 → **14**, alors que la lecture zéro attend 4.

Preuves et SHA dans `verification-ecarts.json` ; gestes manuels et portée dans les anomalies.

✅ **Corrigés dans GM-OS le 12/11/2026** (registre § 245) : sous zéro, l'avatar tombe à −1 et
inconscient ; le d10 d'initiative se lit de 0 à 9. Pilote 2.1.0 inchangé. Les gestes manuels
ci-dessus ne servent plus, sauf le réveil (test d'Endurance morale), qui reste à la main.
Ces diagnostics réussis ne signifient pas que le combat est conforme à ces règles. Aucun correctif
applicatif glissé dans la création de campagne. Constat au registre § 1 bis, suivi § 240.

L’utilitaire du plugin accepte la structure. 45 images et trois WAV décodés ; 45 rendus et cinq
planches examinés. Rapports liés au SHA de l’unique `.gmos` :
`99ab03140af10542e26006d9bead494fd9f7fd7f11064711cee0a2525c1bdcaa`.

Import natif, rechargement Electron, trois Hub 360/768/1180 px, réception des jets en réseau,
matériel physique, IA/TTS, MIDI et lumières **NON EXÉCUTÉS**. Aucun service lancé ni paquet installé.
Les 61 cas de David demeurent vierges ; pas de campagne personnelle lue ou modifiée.

## Reproduire

Voir [REPRODUIRE.md](../../output/campagnes-tests/argyropee/REPRODUIRE.md).
Sources nouvelles sous `outils/campagnes-de-recette/argyropee*`, config
`vitest-argyropee.config.mts` et `emballer-argyropee.mjs`. Date fixe du lot :
`2026-11-09T12:00:00.000Z`. Le générateur appelle `ficheNeuve`, `santeDeDepart` et
`HealthInterpreter` ; les fonctions et composants natifs sont éprouvés par Vitest.
L’emballeur refuse les preuves périmées et toute archive différente de celle vérifiée.

Les dépendances existantes suffisent. Une future recette applicative demande l’autorisation
locale des services et une instance entièrement jetable ; ne pas employer les dossiers privés.
Tout le lot reste non commité, aucune écriture git demandée.
