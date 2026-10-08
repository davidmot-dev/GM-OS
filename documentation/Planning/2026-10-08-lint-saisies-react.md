# Septième lot du lint — saisies React

David demande le 08/10 **« commit, pousse et passe à l'étape suivante (GM-OS est
éteint) »**. Le sixième lot est commité et poussé sous **`513e4d94`** sur
`origin/feature/tablet-hub-pwa`, après les contrôles complets du hook. Ce lot
commence l'étape 3 de l'audit par les quatre initialisations de saisie.

## État local et ouverture

`ModalProvider` monte `SaisieDuPrompt` seulement pour une saisie. Le champ est
initialisé au montage ; remplacer la valeur initiale remonte cette saisie grâce
à sa clé. Fermer puis rouvrir abandonne le brouillon, même avec le même défaut.
Les boutons, Entrée, Échap et l'ordre des rappels de fermeture sont conservés.

`AIPromptOverlay` monte `InviteOuverte` seulement pendant son ouverture. Son
brouillon commence par la proposition initiale. Si cette proposition change,
un ajustement local conditionnel sert un champ vide et préserve un texte en
cours ; effacer le champ ne réinsère pas une proposition inchangée. L'effet
restant ne fait que focaliser le champ. Suggestions, lancement, désactivation
pendant la génération et fermeture par Échap gardent leurs gestes.

`DamageCalculator` initialise le montant à partir du dernier jet positif,
sinon à 10. Un état local associe le jet vu et le montant édité. Une nouvelle
référence de jet déclenche un ajustement conditionnel pendant le rendu : un
total positif reprend la main, zéro/négatif/absence gardent le montant. Un autre
jet de même total reste un nouveau jet. Un rafraîchissement sans nouveau jet
garde la saisie ; le bouton de reprise explicite peut toujours reprendre zéro.
Les cibles, dégâts, soins et résistances restent ceux du calculateur.

`useSpotlight` porte ouverture, recherche et sélection dans un même état.
Changer la recherche revient au premier résultat dans le même geste ; fermer
abandonne recherche et sélection. Ses setters conservent leurs mises à jour
fonctionnelles. `SpotlightSearch` n'a plus à effacer le champ depuis son effet
de fermeture. Focus, défilement, navigation clavier, survol et actions restent.

Ces ajustements remplacent les cascades de mises à jour depuis un effet. Ils
ne prétendent pas supprimer tous les rendus supplémentaires : les deux
ajustements conditionnels locaux peuvent relancer le rendu avant sa validation.
Aucun gain de fluidité n'est annoncé sans mesure. Aucune temporisation ni
désactivation de règle n'est ajoutée pour obtenir le compteur.

## Contrôles

Types et construction passent. **18 tests ciblés dans quatre fichiers**, dont
**14 nouveaux cas**, gardent les textes, réouvertures, propositions modifiées,
jets positifs/zéro/négatifs, effacement, reprise explicite, recherche identique,
mises à jour fonctionnelles, résultats vides et actions clavier.
La suite complète passe : **6 872 tests dans 536 fichiers**, un fichier et
quatre tests ignorés. `git diff --check` passe.

**Huit scénarios Electron passent** : cinq de Combat-OS et trois nouveaux dans
`e2e/saisiesDesSurcouches.spec.ts`. Ils exercent les vrais champs et boutons,
l'abandon/réouverture, la sélection de recherche et l'application du montant
saisi après un nouveau jet contrôlé. Le lanceur vérifie un profil jetable,
avec campagne fictive et appareils désactivés. Aucune génération IA réelle
n'est déclenchée, ni aucune capture du manuel remplacée.

Lint global : **1 543 fichiers, zéro erreur, 373 avertissements**, contre 377.
**Quatre alertes `set-state-in-effect` retirées**. Restent 353 `any` (130
applicatifs, 223 dans les tests), **16 effets**, trois diagnostics de mémoïsation
et une directive inutile. Les règles restent inchangées et le JSON garde
l'inventaire initial des 540 alertes.

## Reprise

Lot réalisé et documenté, **non commité** : dix fichiers de code/tests et cinq
documents. Le commit publié au début de ce tour concerne le sixième lot.
Continuer les **16 effets restants**, en commençant par les replis asynchrones
de bannière/correspondance : afficher uniquement le résultat du contexte courant
et vérifier l'annulation d'une lecture obsolète. Puis traiter les autres replis
et synchronisations écran par écran. Conserver les durées des dés, les fondus,
les notes et les projections. Les autres domaines et les faux objets de tests
suivent. Les changements antérieurs de Claude restent hors du lot.
