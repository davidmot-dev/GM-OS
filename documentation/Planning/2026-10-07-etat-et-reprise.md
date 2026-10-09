# État et reprise — 2026-10-07

**Lint global remis en service le 07/10** : demande **« corrige le lint global »**,
fermeture de GM-OS confirmée. [Réalisation et périmètre](2026-10-07-lint-global.md).
Parcours des fichiers connus de Git, y compris les nouveaux non ignorés ; premier
passage corrigé : 1 526 fichiers, zéro erreur, 540 avertissements visibles. Le lint
devient bloquant dans la validation. Le témoin non suivi est bien refusé (code 1),
puis retiré. **Validation complète réussie** : types, lint, 6 797 tests dans
528 fichiers (un fichier et quatre tests ignorés), construction ; code 0.
La passation est actualisée ; correctif commité dans `57d0193c`. David demande
**« commit et push »** : envoi avec le hook complet vers `origin/feature/tablet-hub-pwa`.

**Refonte des tablettes clôturée : T6 validé par David ; T5 commité dans `e920abc1`.**

**Trame clôturé après l'essai G7 du 07/10** : David confirme **« j'ai testé Trame
et notamment les 6 dispositions »**. [Essai consigné](2026-10-07-trame-validation.md).
Réalisation et documentation poussées (`1d94f84f`, `ed29f301`) ; les attentes d'essai
dans les bilans ci-dessous sont historiques. Les évolutions proposées restent
distinctes du chantier livré. La clôture est enregistrée à la demande de David
**« commit et push »**, avec le bilan du lint global.

**Enregistrement de Trame demandé le 07/10** : David dit **« document, commit et
push »**. [Bilan et périmètre](2026-10-07-trame-enregistrement.md) : tous les lots
Trame ci-dessous, sans les modifications étrangères au chantier. La documentation
est finalisée et les hooks conservés. Les mentions « aucun commit/push demandé »
ci-dessous décrivent l'état historique de chaque lot avant cette autorisation.
L'essai global G7 des derniers arrangements n'est pas déclaré fait par cette demande.
**Réalisation commitée dans `1d94f84f`**, branche `feature/tablet-hub-pwa` ; guide 11
synchronisé vers NotebookLM (1/1). L'envoi vers `origin` conserve le hook pré-push
complet. Les autres modifications locales sont préservées hors du commit Trame.

**Chantier Trame repris le 07/10 par Codex**, demande **« reprendrre le chantier “Trame” »**.
Le [plan G0–G7 préparé](2026-10-07-graphe-trame-en-cartes.md) est mis en œuvre après les tablettes.
David confirme **« Non, GM-OS est fermé »** et **« Oui, installer @xyflow/react »** : version
12.12.0 verrouillée, cartes/courbes/inspecteur construits, positions et rangement adaptés.
Le [relevé de réalisation](2026-10-07-trame-cartes-realisation.md) porte les validations et
les pièges payés. **G0–G6 achevés** : construction/types et lint ciblé réussis,
712 tests, 33 scénarios E2E, 29 PNG finaux et trois vues du manuel relus.
**L'essai G7 de David reste à faire**. Aucun
commit/push demandé pour Trame. Le registre, cette note et le guide 11 sont complétés avec
l'autorisation de David en conservant leurs modifications antérieures.

**Suite Trame demandée le 07/10** : après « c'est bien », David demande des options
d'édition des liens, des pointillés et du gras, puis **« oui prévoit la couleurs
(GM-OS est éteint) »**. Les [réglages des liens](2026-10-07-trame-edition-des-liens.md)
sont consignés : tracé, épaisseur et couleur indépendants, aperçu et retour au
style du thème ; autres gestes proposés. David demande ensuite **« implémente »**.
Inspecteur et styles construits, construction/types et lint ciblé réussis,
715 tests dans 57 fichiers et 39 scénarios E2E passent (six nouveaux, 33 régressions).
Les 24 captures des réglages et trois vues du manuel sont relues ; preuves dans la
[galerie de l'extension](graphe-trame/edition-liens/index.html) et son manifeste.
Piège du banc : attendre la carte témoin affichée avant d'ajouter la branche,
car l'import de la fixture peut encore suivre `persist.hasHydrated()`.
Ces contrôles sont ceux du lot d'apparence. Formes, commentaires et autres gestes
restent des propositions pour un autre lot ; aucun commit/push Trame demandé.

**Connexions de Trame, suite de l'essai du 07/10** : David dit « je n'arrive pas à
déplacer une connexion sur le dessus ou le dessous d'une case » et confirme
**« GM-OS est fermé »**. Les [jonctions](2026-10-07-trame-jonctions.md) sont construites :
départ et arrivée sur quatre côtés, dans l'inspecteur ou en glissant une extrémité.
Aperçu jusqu'à Appliquer ; dépôt sur une autre carte refusé. Le retour au thème
garde les jonctions, leur retour par défaut est distinct. Construction/types et
lint réussis, 716 tests dans 57 fichiers et 33 scénarios E2E distincts passent.
Les deux captures de jonctions et 24 captures de cartes régénérées sont relues.
Le banc compare le bord extérieur de l'accroche, et cadre la toile avant un
glissement pour que le panneau ne recouvre pas la cible du geste.
Reprendre par l'essai de David ; aucun commit/push demandé.

**Organisation automatique de Trame, suite du 07/10** : David demande un moteur
pour répartir les scènes et limiter le mélange des éléments, puis accepte la
proposition : **« ok vas y gm-os est éteint »**. [ELK.js 0.12.0 intégré](2026-10-07-trame-organisation-elk.md),
version verrouillée : regroupement par acte, trajets à angles droits, trois
espacements, aperçu sans écriture, application et retour à la disposition précédente.
Le retour reste disponible après relance, par campagne, en conservant Libre/Figé.
Organiser porte sur la vue visible ; Ranger reste le rangement complet en chaînes
ou étoiles. Les jonctions et styles choisis sont conservés ; un déplacement manuel
écarte les trajets périmés. Construction/types, lint ciblé et 720 tests dans
58 fichiers réussis ; 46 scénarios Electron distincts passent (cinq nouveaux,
41 régressions), dont 137 cartes et 195 trajets sans chevauchement. Les 28 captures
d'organisation, trois vues du manuel et huit planches de cartes/liens régénérées
sont relues. [Galerie et manifeste](graphe-trame/organisation/index.html)
portent les contrôles finaux. Ne pas repayer : au clavier, Entrée sélectionne la
carte avant les flèches. Reprendre par l'essai G7 de David ; aucun commit/push Trame.

**Prise des extrémités, suite de l'essai du 07/10** : David dit « j'ai beaucoup de
difficulté à déplacer les extrémités, peux-tu m'aider à cela ? » et confirme
**« GM-OS est fermé »**. [Prise facilitée](2026-10-07-trame-prise-des-jonctions.md) :
clic direct sur les quatre points d'une carte, Entrée/Espace au clavier, zones de
clic de 32 pixels, cercles de glissement de 28 pixels à l'écran et attraction de
24 pixels. Le lien sélectionné passe au premier plan ; l'ouverture du panneau
recadre la toile. Les mêmes cartes, styles et règles d'aperçu/Appliquer sont gardés.
Construction/types, lint de six fichiers et 16 tests ciblés passent ; 31 scénarios
Electron distincts réussis (deux nouveaux, 29 régressions). Deux captures et quatre
planches de réglages sont relues ; [galerie et manifeste](graphe-trame/prise-jonctions/index.html).
Pièges : une cible masquée par le panneau n'est pas saisissable ; ne pas relâcher
un essai d'attraction dans une carte voisine. La grande cible d'un point pouvait
masquer la prise d'un cercle, d'où le premier plan du lien sélectionné.
Reprendre par l'essai de David ; aucun commit/push demandé.

**Sélection multiple de Trame, suite du 07/10** : après **« c'est beaucoup mieux »**,
David demande de déplacer plusieurs éléments en un mouvement, accepte par **« ok »**
et confirme **« GM-OS est fermé »**. [Sélection multiple construite](2026-10-07-trame-selection-multiple.md) :
Ctrl + clic pour ajuster, Maj + rectangle, glisser une carte ou le cadre,
flèches au clavier et Échap. Le groupe garde ses écarts ; une écriture conserve
toutes ses positions au lâcher. Figé bloque le mouvement ; Relier libère la
sélection ; les filtres retirent les cartes masquées. L'ordre des scènes et les
actes sont conservés. Construction/types, lint ciblé et 721 tests dans 59 fichiers
réussis. 45 scénarios Electron distincts passent (trois nouveaux, 42 régressions) ;
deux captures et douze planches sont relues. Les preuves finales sont dans la
[galerie et son manifeste](graphe-trame/selection-multiple/index.html).
Ne pas repayer : `onNodeDragStop` est aussi appelé pour le cadre de sélection ;
une sauvegarde supplémentaire dans `onSelectionDragStop` ferait écrire deux fois.
Reprendre par l'essai de David ; aucun commit/push Trame demandé.

**Formes de rangement de Trame, suite du 07/10** : David valide la sélection
multiple par **« ok c'est très bien »**, puis demande **« des types de rangement
automatique, en étoile et ligne etc... ? »**. Il confirme **« GM-OS est fermé »**.
[Six formes construites](2026-10-07-trame-types-de-rangement.md) : Automatique,
Étoile, Ligne horizontale, Colonne verticale, Arbre et Grille. Le menu Disposition
conserve les trois espacements, l'aperçu, Appliquer et le retour précédent.
Les formes imposées gardent les courbes ; Automatique et Arbre gardent les trajets
ELK. Forme et espacement reviennent après relance et retour arrière. Les scènes,
leurs actes, leur ordre et les styles des liens sont conservés.
Ne pas repayer : centrer l'étoile sur la scène, pas sur le milieu de ses annexes ;
réserver aux actes leur propre taille ; dès quatre scènes, une grille doit avoir
plusieurs rangées. La fenêtre étroite a révélé un cadrage coupant le bas des cartes :
le cadrage repart des rectangles déclarés et de l'espace disponible, avec contrôle
des bords dans le banc. Les preuves finales sont dans la [galerie et son manifeste](graphe-trame/formes/index.html).
Construction/types et lint ciblé passent ; **724 tests dans 60 fichiers et 34
scénarios Electron distincts** sont validés (trois nouveaux, 29 régressions dans
le lot final et deux régressions relancées avec le banc de glissement corrigé).
Sept captures et douze planches dans les quatre apparences sont relues.
Essai de David attendu ; aucun commit/push Trame demandé.

La demande de David du 06/10 est « commit, push et fais T5, GM-os est fermé ».
La fermeture confirmée couvrait les modifications T5. Le 07/10, après l'explication
des essais T6, David confirme **« j'ai testé c'est bon, tu peux faire le commit et poussé »**.
Cette réponse valide T6 et autorise le commit et le push ; aucun appareil ni détail
de geste supplémentaire n'est inventé. Cette clôture ne modifie pas le code.

Branche `feature/tablet-hub-pwa`. T4 poussé jusqu'à **`edcdb68a`** ; le code et
le témoin T5 sont enregistrés dans **`e920abc1`**. La documentation de clôture
accompagne ce commit dans la série dont David demande le push.
La série de 25 commits T4 conserve un commit par écran. Pré-push : typage,
construction, 6 774 tests réussis, quatre ignorés. Hook NotebookLM : 22 guides
synchronisés. Le lint global rencontre une entrée préexistante au nom illisible
à la racine ; défaut consigné au § 1 bis, hors chantier, entrée non modifiée.

T5 ajoute `CadreDeTablette` et sa CSS aux racines joueur et meneur : focus intérieur
contrasté, halos du thème du PC, transitions de 160 ms, mode léger et préférence
de réduction des animations. La jauge fonctionnelle du résultat garde ses quinze
secondes, avec expiration et fermeture éprouvées ; Couper le son garde 700 ms.

La version finale construit et passe **707 tests ciblés dans 43 fichiers**.
**45 scénarios T5 distincts validés** : 44 au passage final, puis le dernier après
correction d'une assertion devenue obsolète, sans changement du produit.
**84 régressions** passent avant le dernier ajustement de couleur du focus ;
aucune disposition ni aucun geste n'a changé depuis. Comparaison ESLint de cinq
fichiers avec `edcdb68a` : zéro nouveau diagnostic. **132 PNG** relus sur six
planches ; **20 étapes du manuel** passent sur la construction finale,
**19 JPEG** régénérés et relus. Guides 60/61/62 actualisés.

Les détails et les empreintes vivent dans le [relevé T5](2026-10-06-T5-fini-tablettes.md),
la [galerie](tablettes/T5-fini/index.html) et le
[manifeste](tablettes/T5-fini/controles-integration.json).

**T6 validé et refonte clôturée.** [Validation de David et enregistrement](2026-10-07-T6-validation-tablettes.md).
Il ne reste pas de développement prévu par le plan des tablettes. Les appareils et gestes
précis de l'essai ne sont pas détaillés dans sa réponse. Le manifeste T5 conserve
ses valeurs historiques, antérieures au commit et à la validation T6.

Ne pas repayer : attendre la fin de Synchronisation avant une capture joueur ;
un focus de la couleur d'un bouton plein est invisible et doit prendre le contraste
de l'accent. Le halo peut garder sa teinte de thème quand l'accent manuel change.
Framer Motion supprime les animations de largeur en mode réduit : la jauge du
résultat a donc sa configuration fonctionnelle propre.

Les modifications préexistantes hors T5 restent à leur propriétaire : notamment
`.claude/settings.local.json`, `e2e/lancerGmOs.ts`, `HubDiceDisplay.tsx` et les guides
hors 60/61/62. Ne pas les remettre à zéro ni les inclure automatiquement dans un commit.
