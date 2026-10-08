# Seizième lot du lint — contrats de projection des médias

David demande le 08/10 **« passe à l'étape suivante (GM-OS est éteint) »**.
Le lot reprend les six `any` de `ImageService.ts` et les cinq de
`useImageStore.ts`, après la fenêtre de projection. Dernier publié :
**`861eaca4`** sur `feature/tablet-hub-pwa`. Aucun commit ni push demandé
pour cette reprise.

## Le service lit le vrai contrat du magasin

`ImageService` emploie `magasinDuHub('useImageStore')`, déjà typé à partir du
magasin réel. Il conserve la frontière globale : le magasin charge le service
à la demande, et un import direct du magasin dans le service refermerait ce
cycle. Le petit accès `etatDesImages` vérifie la présence du magasin aux
endroits où il était déjà nécessaire ; son absence produit une erreur explicite,
au lieu d'une lecture de propriété sur `undefined`. Le recensement des écrans
reste facultatif, pour ne pas refuser une projection avant sa première lecture.

Les cibles de projection sont déjà des chaînes dans les contrats. Les cinq
`as any` du magasin et ses conversions inutiles de cibles sont retirés.
Auto-synchronisation des projecteurs, image seule, URL, retour au décor,
extinction et instantané passent leur cible au service sans la déguiser.

Le fichier envoyé reste distinct de la marque d'occupation : pour une fiche,
le portrait part vers l'écran et l'identifiant de l'entité reste dans le
magasin. Le moniteur reçoit le chemin brut ; le Hub reçoit l'adresse résolue,
avec la boucle avant l'adresse vidéo. Les marqueurs contournent le résolveur.
L'extinction du Hub reste un message d'image vide ; celle d'un moniteur reste
un tableau vide qui ferme sa fenêtre. Réglages, IPC, persistance, temporisations,
diaporamas et affichage ne changent pas. Aucune règle abaissée ou désactivée.

## Contrôles

Types et construction passent. **179 tests ciblés dans seize fichiers** passent,
dont **17 nouveaux cas** dans `ImageService.test.ts`. Ils emploient les vrais
magasins et des méthodes de pont typées : chemin brut vers le moniteur,
portrait distinct de la marque, refus d'un écran absent, recensement inconnu,
trois marqueurs, image résolue, boucle avant vidéo, échec de résolution,
cible courante de l'entité, absence de portrait, extinction du Hub, du
moniteur et de toutes les cibles, magasin absent. Les essais existants des
fiches, du retour au décor, des diaporamas et du projecteur restent.
Suite complète : **7 042 tests dans 548 fichiers**, un fichier et quatre tests
ignorés.

**Sept scénarios Electron sont validés** : les deux du fondu Player Hub,
puis les cinq de `projecteur.spec.ts`. Ce dernier passe désormais par
`useImageStore.projectUrl` et `ImageService`, avec le vrai IPC ; le volume
se règle aussi par `setVolumeVideo`. L'ancien envoi de niveau isolé du test
était écrasé par le recalcul normal à la projection : le premier essai l'a
montré, et les cinq scénarios passent après correction du test. Un nouveau
cas exerce `useImageStore.blackout`, la fermeture de la fenêtre et l'effacement
de son occupation. Rechargement, fondus, remplacement pendant la sortie,
vidéo WebM avec volume/boucle et cadre YouTube sont toujours vérifiés.
YouTube reste intercepté, sans lecture distante ni accès au réseau.
Profils, sauvegardes, corpus et coffre Obsidian jetables, appareils désactivés.
Aucune donnée réelle ni capture du manuel modifiée.

Lint global : **1 563 fichiers, zéro erreur, 346 avertissements**, contre 357.
**Onze `any` applicatifs retirés** ; restent 342 `any` (119 applicatifs,
223 dans les tests), trois diagnostics de mémoïsation et une directive
inutile. Aucune alerte `set-state-in-effect` ne revient. Lint ciblé final
propre, règles et JSON des 540 alertes initiales inchangés.
`git diff --check` passe.

## Reprise

Lots 14 à 16 réalisés, documentés et **non commités : 23 fichiers Codex**,
seize de code/tests et sept documents. Dernier publié : **`861eaca4`**.
Reprendre les douze `any` du
`StoryboardDashboard.tsx`, puis les autres modules et les faux objets des
tests selon l'audit. Les trois diagnostics de mémoïsation et la directive
inutile gardent leurs lots ciblés. Préserver les changements de Claude.
