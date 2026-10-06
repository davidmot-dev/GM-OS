# État et reprise — 2026-10-06

**État courant : les quatre lots de T4 sont développés et vérifiés ; J1 testé par David.** Accueil, Direct,
Inventaire, Cartes, fiche et réserves tactiles intégrés. Typage/construction et 6 774 tests
unitaires verts ; 59 scénarios Electron validés après rejeu ciblé, sans échec attendu.
PV vers le meneur, horloge statique initiale et Jouer recouvert sur téléphone réparés.
44 captures J1 regardées et guides 61/62 actualisés ; cinq étapes du manuel passent,
ses quatre JPEG sont régénérés puis regardés. Lint comparé sur 22 fichiers sans nouveau diagnostic. Voir le
[relevé J1](2026-10-06-T4-J1-joueurs.md) et la [galerie](tablettes/T4-joueurs/j1/index.html).
**J2 terminé côté développement : Archives/PNJ/Lieux, messagerie, notifications, Notes et feedback tactile.**
David confirme « Non, GM-OS est fermé » après son essai de J1 ; les candidats préparés
hors de `src/` sont ensuite intégrés. Typage/construction réussis ; **88 scénarios
distincts et 6 774 tests unitaires validés après rejeux ciblés**, quatre tests unitaires
ignorés et aucun échec E2E attendu. 104 PNG J2 et six JPEG du manuel regardés ; sept
étapes du manuel passent. Guides 61/62 actualisés, lint comparé sur 20 fichiers sans
nouveau diagnostic. Voir le [relevé J2](2026-10-06-T4-J2-joueurs.md) et la
[galerie](tablettes/T4-joueurs/j2/index.html).
**David confirme « GM-OS est éteint », puis demande « commence M1 ».** M1 est intégré :
Pads, Dés, Combat, navigation, ligne d'état et Couper le son. Typage/construction
et **201 tests unitaires ciblés** verts ; **81 scénarios distincts validés après
rejeux ciblés**, sans échec attendu. Lint comparé sur 13 fichiers sans nouveau
diagnostic. 66 PNG et trois JPEG du manuel regardés, quatre étapes du manuel
passent ; guide 60 actualisé. Voir le [relevé M1](2026-10-06-T4-M1-meneur.md) et la
[galerie](tablettes/T4-meneur/m1/index.html). Aucun essai de J2 par David n'est
déclaré dans cet échange.
**Après M1, David demande « continue » : M2 est développé et vérifié.** Sons,
Scénario, Tableau, les six vues des Notes et Messages sont intégrés. Le flux rapide
du Tableau transmet maintenant l'outil, la couleur et l'épaisseur choisis sur le PC.
Typage/construction et 201 tests unitaires ciblés verts ; **36 scénarios M2 distincts
et 81 régressions M1/T0 validés sur les passages**, sans échec attendu. 116 PNG et
cinq JPEG du manuel regardés ; six étapes du manuel passent, guide 60 actualisé.
Lint comparé sur 11 fichiers sans nouveau diagnostic. Voir le
[relevé M2](2026-10-06-T4-M2-meneur.md) et la [galerie](tablettes/T4-meneur/m2/index.html).
La confirmation « GM-OS est éteint » reste valable ; aucun essai de M1 par David
n'est déclaré depuis. **Reprise : essai de M2 par David.** T5/T6 restent ouverts.
T4 non commité ; T3 reste poussé à `1a8c8019`.
Les paragraphes suivants conservent les étapes précédentes et leurs résultats à ce moment-là.

Suite de [la note du 05/10](2026-10-05-etat-et-reprise.md). David demande « fait M1 et M2 »,
puis « continue », après le commit J2 **`0064f67a`**. Production Stitch commencée le 05/10,
terminée et vérifiée le 06/10. **À montrer : [la galerie meneur M1/M2](tablettes/T3-meneur-propositions/index.html)**,
accessible aussi depuis la galerie joueurs déjà ouverte dans son IDE.

M1 : Pads, Dés, Combat, ligne d’état et « Couper le son ». M2 : Sons, Scénario, Tableau,
les six vues des Notes et Messages. Seize exports Stitch, leurs requêtes/réponses et rendus
bruts sont conservés ; les versions locales reconstruisent les propositions avec le contenu
du T0. Le [relevé M1/M2](tablettes/T3-meneur-propositions/README.md) précise les corrections,
la provenance et les limites. Les [prompts](2026-10-05-prompts-stitch-tablettes-M1-M2.md)
conservent les seize demandes effectivement envoyées au projet existant.

Quarante formats sont vérifiés dans Edge : huit écrans × trois tailles portrait et deux
paysage, de 360 à 1440 px, plus les états particuliers. Les gestes des prototypes comprennent
le maintien 700 ms, l’expiration du résultat 15 s, le filtrage, les sorties, les dés et pilotes,
les tours/PV, le dessin et son historique, la lecture des six vues et les messages privés
ou collectifs. Les résultats sont dans `controles.json` et `galerie-controles.json`, sous
`tablettes/T3-meneur-propositions/`. Ce sont des simulations statiques : aucune validation
de la synchronisation, du moteur de dés ou de Safari sur le vrai iPad.

**Mise à jour après David : « ok c'est bon pour moi, est-ce que t3 est fini ? » (06/10).**
Son accord est consigné pour l’ensemble des propositions présentées J1, J2, M1 et M2.
Accueil et Direct étaient déjà retenus depuis le 05/10 ; les autres écrans sont maintenant
retenus aussi. **T3 est terminé. Reprendre par T4, lot J1**, suivant la grammaire commune et
les maquettes corrigées. Les références sont archivées dans
[`stitch/tablettes-joueurs/`](stitch/tablettes-joueurs/README.md) et
[`stitch/tablette-meneur/`](stitch/tablette-meneur/README.md). Le manifeste
`tablettes/T3-references-retenues.json` vérifie les copies par SHA-256.
**Demande suivante de David : « commit et push T3, met à jour la documentation, et commence T4 ».**
Commit et push T3 autorisés ; T4 s'ouvre par J1, premier écran accueil « Qui es-tu ? ».
**Commit T3 : `1a8c8019`, poussé sur `origin/feature/tablet-hub-pwa`.** Le contrôle pré-push
compte 6 757 tests réussis et quatre ignorés ; typage et construction de production verts.
Le lint global signale 94 erreurs et 513 avertissements que le hook traite comme non bloquants.
**T4/J1 commencé : accueil « Qui es-tu ? » intégré après David, « gm-os est fermé ».**
`src/components/hub/LobbyOnboarding.tsx` emploie le gabarit commun : en-tête et Quitter fixes,
cartes compactes sur téléphone, trois colonnes en paysage, confirmation repliée après sortie.
Les quatre cas de `e2e/tabletteAccueilT4.spec.ts` passent de 360 à 1180 px ; les huit captures
ont été regardées. Typage, construction, ESLint ciblé et 35 tests socle/apparence sont verts.
Le banc T0 joueurs termine avec **39 scénarios validés**, dont quatre échecs attendus connus
(PV aux trois tailles, Jouer masqué sur téléphone). 55 captures T4 conservées, trois accueils
regardés. Guides 61/62 relus et capture du manuel régénérée puis regardée ; deux étapes passent.
[Relevé T4](2026-10-06-T4-tablette-joueurs.md) et
[galerie de l'accueil intégré](tablettes/T4-joueurs/accueil/index.html).
Le constat avant T4 et le candidat préparé hors de src/ sont conservés. Ne pas relancer
`preparer-candidat.mjs` sur la source intégrée : son marqueur décrit l'ancienne version.
**À cette étape : T4 non commité ; prochaine intégration Inventaire, puis Cartes.** J1 restait ouvert ;
une séance jouée est requise avant J2. Aucun changement dans electron/.
Piège payé : pour la capture du manuel seule, le grep doit inclure `la séance commence`
et `tablette-des-joueurs`. Sans le premier, le test passe mais l'image montre l'attente de séance.

**Deuxième écran T4/J1 : Direct intégré**, après la nouvelle confirmation « gm-os est fermé ».
`HubDirect.tsx` met en pile horloges/projection/chroniques en portrait et en colonnes en paysage.
Les dix commandes restent nommées et accessibles dès 360 px. `ClockVisualizer` réutilise ses
calculs dans une variante compacte ; l'initiative s'ouvre depuis la barre d'outils.
[Relevé Direct](2026-10-06-T4-Direct-joueurs.md),
[galerie](tablettes/T4-joueurs/direct/index.html). Typage/construction et 31 tests horloge verts.
Le rejeu complet passe : 47 scénarios validés, dont quatre échecs attendus connus du banc T0.
Seize captures Direct regardées, 55 captures du banc conservées ; les deux étapes du manuel
passent et sa nouvelle capture Direct a été regardée. Guides 61/62 relus.
Le lint garde seulement l'erreur déjà présente dans
TabletHub (ligne 193) ; les nouveaux fichiers sont propres. Aucun changement du transport.
Un défaut existant avait été consigné au § 1 bis : le snapshot initial de l'horloge omettait mode/theme,
alors que le segment après une modification les transmet. Les captures ciblées jouent ce
changement réel côté meneur ; elles ne validaient pas encore la première arrivée en mode statique.
Cette arrivée est maintenant réparée et éprouvée pour J1 ; voir le relevé courant en tête.

Le plan et le registre, précédemment laissés en place car déjà modifiés, sont maintenant
rapprochés de cette note pour T3 et l'ouverture de T4, conformément à la demande explicite
de mise à jour documentaire. Leurs modifications préexistantes ont été conservées. Les modifications préexistantes
des guides, de `e2e/lancerGmOs.ts`, de `HubDiceDisplay.tsx` et des réglages Claude sont conservées.

Pièges payés : Stitch ajoute encore des commandes d’édition aux Notes, un D66 et des diagnostics
fictifs malgré les prompts. Les exports bruts restent visibles ; les versions locales sont
explicitement décrites comme reconstruites. Un sélecteur CSS `.des` touchait aussi le body
du même nom et agrandissait tous ses boutons ; il est limité à `section.des`. Le libellé
« CLIQUER POUR FERMER » reste inopérant dans la maquette parce que le défaut T0 n’est pas
corrigé par ce chantier de présentation. « Tous » inclut les fils privés dans la télécommande
actuelle, contrairement à une supposition facile ; ce comportement est conservé.
