# État et reprise — sources des outils RdD et TMR, 18/10/2026

Registre § 141, ligne 76. David fournit <https://scriptarium.org/RdD/tmr/>, demande d’étudier
la carte et les autres outils, puis : **« est-ce que tu peux récupérer une partie du code ? »**.

## Livraison

Le [dossier de référence](../../outils/reve-de-dragon/reference-cyol/README.md) contient :

- Cinq originaux : `tmr.js`, `tmrHexagon.js`, `tmr.css`, HTML en ligne et HTML de l’archive.
- Cinq extraits : dés, résolution, stress, astrologie, géométrie ; **26 fonctions**, corps
  inchangés, avec notice d’attribution et de modification.
- Index des **74 fonctions** de premier niveau du script principal, lignes de début/fin.
- Provenance, URLs et empreintes SHA-256 dans `sources.json` ; scripts de préparation et de
  vérification. `.gitattributes` conserve les octets des originaux et extraits.

L’archive complète publique est dans `scratch/reve-de-dragon-sources/tmr.zip` (ignoré par Git),
1 008 828 octets, SHA-256 `a748bdf7a28049467a9b5a08903a92efd45f756dde822f4773527736fe3b8e9e`.
Les scripts et la CSS sont identiques dans l’archive et sur le site ; le HTML diffère.
Les images et les bibliothèques tierces de l’archive ne sont pas extraites dans le paquet suivi.

Crédits : **Cyol**, correction **Kroc**, version annoncée 21 du 04/01/2017, licence annoncée
CC BY 3.0 France. Mentions d’origine conservées ; `tmrHexagon.js` cite aussi Hexagon.js et sa
source géométrique. Les HTML conservés documentent les crédits mais ne constituent pas une
application autonome locale. Ne pas supposer que l’annonce de licence de l’aide détermine à elle
seule les conditions de tous les éléments tiers.

## Conclusions de l’étude

- La carte gère déjà fatigue, rêve, rencontres, maîtrise, dérobade et refoulement dans son
  interface. Elle n’est pas reliée aux fiches GM-OS.
- Les outils annexes fournissent résolution, points de tâche par jet, qualité de l’action,
  dés, conversion du stress en expérience, roue astrologique et position aléatoire du demi-rêve.
- Proposition nouvelle par rapport à R0–R8 : afficher la **qualité des actions** concernées.
  Calculer un résultat ponctuel n’équivaut pas à tenir un ouvrage ou répartir l’expérience.
- Les fonctions `souffleDragon`, `queueDragon`, `teteDragon` ont encore des `TODO`.
- Le seuil d’échec total à 30 % est 93 dans le code du site et 94 dans la table GM-OS.
  À confronter à l’édition et au livre ; aucun calcul du site ne remplace le moteur existant.

## Architecture proposée, non encore implémentée

**Consigne de David le 18/10 : « n’oublie pas effectivement de créditer le travail d’autrui ».**
Un [fichier de crédits dédié](../../outils/reve-de-dragon/reference-cyol/CREDITS.md) accompagne
désormais la référence. Prévoir une entrée « Crédits et licences » dans le futur module,
conserver les notices avec les sources distribuées et documenter les modifications de chaque
contribution tierce. Aucun écran du module n’existe encore dans cette livraison.

**Répartition actualisée par David le 18/10, en fin d’échange : « bonne nuit, tu t’occuperas
de la partie Rêve de Dragons ». Codex prend en charge l’ensemble du volet RdD : pilote,
règles communes et module TMR (R0–R8).** Cette consigne remplace la répartition précédente
qui laissait R0–R7 à Claude. Coordonner les fichiers partagés avec Claude ; l’ordre et le
périmètre détaillé des lots restent à préciser. Aucun développement n’est lancé pendant cet
échange de clôture.
Les règles communes vivent côté GM-OS ; le module fournit la carte et transmet les choix ; la
fiche porte les ressources. Une commande doit traiter ensemble position et conséquences, avec
reprise sans double dépense et filtrage des secrets. **Ce pont mécanique reste à concevoir.**
Le mode assisté avec validation du MJ est recommandé, mais non encore choisi par David.

## Contrôles et reprise

`node outils/reve-de-dragon/reference-cyol/verifier-reference.mjs` : cinq originaux, cinq extraits,
26 corps inchangés et 74 fonctions indexées ; empreintes et syntaxe conformes. Aucun script tiers
exécuté lors de ce contrôle, aucune règle validée contre le livre. La préparation rejette une
archive ou des téléchargements différents des empreintes enregistrées.

Reprendre par le README et `fonctions.json`, puis le cadrage de la première boucle
montée → déplacement → rencontre → conséquences sur la fiche. Coordonner les champs et les
règles avec Claude avant adaptation. La demande de récupération ne vaut pas lancement du
développement de R8 ; avant toute modification de `src/` ou `electron/`, demander si GM-OS tourne.

Aucun paquet installé ni service réseau lancé ; aucun code applicatif ou donnée personnelle
modifié. Sources téléchargées par HTTPS depuis les URLs publiques fournies. Les changements
préexistants des guides et autres fichiers sont restés intacts. **Non commité à la livraison.**
