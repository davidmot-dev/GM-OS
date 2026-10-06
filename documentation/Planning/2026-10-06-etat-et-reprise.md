# État et reprise — 2026-10-06

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
Aucun `src/` ni `electron/` modifié à ce stade. Avant T4, appliquer la vérification
« GM-OS tourne-t-il ? » selon `AGENTS.md`.

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
