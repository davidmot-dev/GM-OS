# T3 — propositions des lots joueurs J1 et J2, 2026-10-05

David : « reprends T3 ». T2 est livré dans `1b6a991f`. Les prompts effectivement envoyés sont
conservés dans les fichiers `*-requete.json` de ce dossier.
Les requêtes Inventaire et Cartes sont aussi lisibles dans
[les prompts de la suite J1](../../2026-10-05-prompts-stitch-tablettes-J1-suite.md).

**À montrer à David : [la galerie](index.html).** Les quatre écrans J1 et les cinq écrans J2,
chacun en téléphone et iPad paysage. **David retient Accueil et Direct le 05/10 : « je suis satisfait continue ».**
Les références choisies sont copiées dans [les maquettes retenues](../../stitch/tablettes-joueurs/README.md).
Inventaire et Cartes restent à choisir. À la demande « on fait J2 », Archives, PNJ, Lieux,
Messagerie et Notifications ont aussi été produits ; ils attendent le choix de David.
Leurs requêtes sont dans [les prompts J2](../../2026-10-05-prompts-stitch-tablettes-J2.md).
T4 ne commence pas ici.

## Production

Projet existant : [Système Design Bureau Modulaire](https://stitch.withgoogle.com/projects/14179472786712390673).
Système réutilisé : `assets/f715d3f70c644671a1bdf4670b677326`, avec les jetons et les familles
du `stitch/DESIGN.md` précisés dans les prompts. Aucun système existant modifié.
Une génération neuve par écran, puis `edit_screens` pour produire une déclinaison paysage
distincte depuis le cadre téléphone. Les dix-huit identifiants sont dans [ecrans.json](ecrans.json).

Le MCP expose seulement un prompt texte, sans champ pour joindre les captures. Les captures
T0 téléphone et paysage et la référence Combat ont été relues localement ; leurs informations
ont été transcrites dans les requêtes. Ne pas prétendre que Stitch a reçu les images.

Les `*-original.html` sont les exports bruts. Les `*.html` sans ce suffixe sont les propositions
locales corrigées. Les `*-requete.json` et `*-reponse.json` conservent la provenance. Les messages
et suggestions bruts de Stitch sont consultables en pied de galerie : **ses affirmations ne
valent pas validation**. Ses suggestions n'ont pas été acceptées automatiquement.

## Écarts des exports, corrigés avant présentation

Vérifiés contre `LobbyOnboarding.tsx`, `TabletHub.tsx` et les captures de démonstration :

- Accueil téléphone : retrait du faux `PORT: 8080` et du texte de conseil ajouté ; identifiant
  fictif ramené à celui du relevé, « Session 2 » conservé ; retours à la ligne des cartes et du
  pied ; confirmation « Vraiment ? / Non / Oui, quitter » avec boutons de 44 px plutôt que 36.
- Accueil paysage : retrait des faux `UNIT`, `SPEC`, `LOC`, pourcentages `SYNC`, `ID-LINK`,
  `LINK : STABLE` et `HARDWARE LEVEL` ; les trois portraits sont des silhouettes neutres ;
  pied rendu lisible ; confirmation de sortie simulée dans le prototype.
- Direct téléphone et paysage : retrait des faux niveaux « Vigilance / Palier 3 enclenché »,
  messages d'attente et diagnostics de projection ; surface de projection laissée libre.
  Rétablissement des noms complets Archives, Inventaire, Messages et Alerte de la station.
  Pas de tension secrète ni de média inventé.
- Direct téléphone : six onglets sur deux rangées, quatre actions en dessous, pour conserver
  leurs noms dès 360 px ; anneau réellement composé de huit segments, dont trois allumés.
- Inventaire : contenu et surcouche vérifiés dans `HubInventory.tsx`, la
  semence de démonstration et le banc T0. Suppression des emplacements, diagnostics d'intégrité,
  portée des destinataires et autorisations inventés. Une sélection de destinataire soumet
  directement le don, sans ajouter de confirmation. Le badge d'attente ne masque plus le nom
  de l'objet. Donner et Jeter se bloquent tant que le meneur n'a pas validé.
- Cartes : contenu vérifié dans `HubMainDeCartes.tsx`, les traductions françaises et le banc
  T0. Retrait des matricules, du faux type et des faux textes de carte, des diagnostics et de
  l'action supplémentaire Agrandir ; le toucher de la carte ouvre déjà le détail. Le visuel
  est le SVG fictif exact du banc T0, identique au dos et à la face. La main du voisin ne
  s'affiche jamais ; « Donner à » n'a aucun destinataire Meneur et ne paraît qu'avec un autre
  PJ connecté de la campagne. Les cartes scellées ont un dos anonyme, sans nom ni image.
- Les prototypes simulent le choix, la sortie et la bascule de qualité. Ils ne synchronisent
  rien et ne modifient aucune campagne. L'HTML exporté utilise Tailwind CDN et Google Fonts ;
  la galerie d'images fonctionne localement sans ces dépendances. L'intégration T4 utilisera
  le socle, les jetons et les polices locales de GM-OS, pas ce code de démonstration.

Pour J2, les captures T0 et `HubArchives.tsx`, `HubTrombinoscope.tsx`, `HubAtlas.tsx`, `HubMessenger.tsx`
et `HubNotificationCenter.tsx` ont servi à contrôler les exports. La campagne, les personnages,
les indices et les messages sont les données fictives du banc T0 et de la semence de démonstration.

- Archives : deux indices révélés, leurs textes exacts et leur détail refermable. Retrait des
  matricules, tailles de paquets, diagnostics de sécurité et métadonnées inventés ; les deux
  cartes restent lisibles à 360 px et côte à côte en paysage.
- PNJ : seul Superviseur Hale est partagé. Silhouette neutre, description publique dans le
  détail ; retrait de l'inspecteur et des données ajoutées par Stitch. Aucun secret du meneur.
- Lieux : seul Station Varn est visité. Le plan est la copie exacte de
  `e2e/donnees/plan-station-varn.png`, dans la carte et le détail. Retrait de la fausse validation
  locale et des commandes de cartographie ajoutées.
- Messagerie : surcouche de Direct, destinataires MJ, tous les joueurs, Idris Koa ou Sora Adebayo.
  Champ vide désactivé, Enter envoie, Shift+Enter insère une ligne ; conversations séparées,
  fermeture et réouverture. Retrait des faux états de confinement et de synchronisation.
- Notifications : Nouveau Message ouvre la conversation et efface le badge. Expiration à cinq
  secondes avec maintien du badge non lu ; une alerte générale se ferme au toucher ou après
  huit secondes. L'état `?etat=alerte` reprend le texte public fictif du banc T0 pour montrer
  cette variante, distincte d'un message. Horloge remise à celle du relevé T0.

## Validation effectuée

Commandes : `node documentation/Planning/tablettes/T3-propositions/rendre.mjs` (J1),
`node documentation/Planning/tablettes/T3-propositions/rendre-j2.mjs` (J2) et
`node documentation/Planning/tablettes/T3-propositions/verifier-galerie.mjs` (comparaison).
Chromium d'Edge via Playwright installé, pages `file://`, sans Electron ni serveur local.
Le build de l'application n'est pas requis pour ce rendu de documents statiques.

**Trente-six rendus** : les neuf écrans à 390 × 844, 360 × 800, 820 × 1180 et 1180 × 820.
Les [mesures](controles.json) relèvent zéro débordement horizontal, zéro erreur JavaScript,
zéro ressource en échec et zéro commande visible sous 44 × 44 px.

Sur l'accueil : confirmation cachée au repos, affichée au toucher, refermée par « Non » ;
les deux boutons de confirmation respectent 44 × 44 px ; le troisième choix reste atteignable
par défilement. Sur Direct : les dix commandes sont dans le cadre visible, la bascule
Performance → Qualité fonctionne et Quitter ouvre une confirmation annulable.
Les captures 360 px et paysage des deux écrans et la confirmation ont été relues visuellement.

Inventaire : les actions restent au-dessus du pied ; Jeter demande confirmation ; le don
s'ouvre, se ferme et soumet le destinataire ; l'attente bloque les deux actions et laisse
le titre lisible. Cartes : Jouer et Piocher restent au-dessus du pied ; le détail se ferme
au toucher et par Échap ; piocher ajoute Carte 3 et décrémente 4 → 3 ; jouer retire la carte.
Proposition entrante en tête, Accepter/Refuser, don sortant sans actions tant qu'il attend,
dos scellé anonyme et paquet vide désactivé ont aussi été contrôlés à chaque taille.
Les captures 360 px, paysage et surcouches ont été relues visuellement.

J2 ajoute vingt rendus. Les dix commandes du pied restent dans le cadre ; les détails Archives,
PNJ et Lieux s'ouvrent et se ferment au bouton et par Échap ; les états vides remplacent les
listes et remettent les compteurs à zéro. Les gestes Messagerie et Notifications décrits
ci-dessus passent à chaque taille, avec vérification des deux délais. Le texte saisi reste
du texte, même s'il contient des chevrons. Les captures téléphone et paysage ont été relues.
La galerie charge ses dix-huit images en T3/390, T3/360 et comparaison T0 ; ses liens locaux
existent et elle ne déborde pas à 360 px.

Les états supplémentaires de Cartes se consultent depuis les liens de la galerie, ou par
`?etat=proposition`, `?etat=voisin`, `?etat=attente`, `?etat=scellee`, `?etat=vide` sur l'un
des deux prototypes. Ce sont des fixtures locales ; aucun bouton de diagnostic ajouté
dans l'interface. Les changements de main simulent la réponse du meneur, pas une écriture réelle.

Ce sont des contrôles des **prototypes**, pas de la synchronisation ni du Safari réel de l'iPad.
Les différences de couleur entre T0 et T3 proviennent aussi du système de design de référence.

## Reprendre

Accueil et Direct sont retenus. Faire choisir Inventaire et Cartes,
ainsi que les cinq écrans J2, puis produire les écrans du meneur suivant le plan T3.
T3 n'est pas terminé : les choix restants et les lots meneur manquent encore.
Aucun fichier `src/` ou `electron/` modifié ici. David demande ensuite « commit J2 », le 05/10 :
le commit archive J2 et les supports J1 nécessaires à sa galerie, sans changer les statuts de
choix ci-dessus. T3 reste ouvert ; aucun push demandé.

**Piège de connexion payé** : les outils MCP Stitch intégrés répondent « Authentication required »
car le processus n'a pas hérité de `STITCH_API_KEY`, bien que la variable **Machine** existe.
Le helper `stitch.ps1` lit cette variable en mémoire et utilise uniquement l'hôte Stitch
documenté. Il n'affiche ni n'enregistre la clé. Un accès réseau autorisé est nécessaire depuis
le shell restreint. Les générations prennent plusieurs minutes : ne pas les relancer pendant
qu'elles sont encore en cours.

Une demande Inventaire a d'abord été rejetée par la revue automatique, qui supposait des
données privées. La provenance fictive (`e2e/donnees/campagne-de-demo.json` et le banc T0)
a été vérifiée et explicitée dans les requêtes ; les appels suivants ont été autorisés.
