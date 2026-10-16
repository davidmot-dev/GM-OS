# Alien — étape 6 sur les appareils de David

David, 16/10 : *« ok commence 6 alors, GM-OS est éteint »*. Matériel annoncé :
*« Ipad, Ipad Air, Tablette Samsung et smartphone »*. Navigateurs, versions et diffuseur
sonore restent à relever pendant l’essai. Cette fiche accompagne la
[recette logicielle et le lancement isolé](2026-10-15-recette-modules-alien.md).

## État de la recette

Les contrôles sur PC et les résultats matériels se consignent séparément. Une émulation
tactile ne reproduit pas le clavier système, la mise en veille ou le comportement audio
des quatre appareils. Les cases ci-dessous restent ouvertes jusqu’à l’essai de David.

**Volet logiciel validé le 16/10 : huit parcours E2E**, dont les trois parcours étendus
rejoués après correction du banc. HTTP/WebSocket, fichier privé, vidéo et Web Audio réels ;
horloge avancée et voix simulée pour le relais après le film. Build et lint propres.
✅ **Volet matériel éprouvé par David le 16/10** (*« la grille matérielle de l'étape 6 (iPad,
iPad Air, Samsung, smartphone) » parmi « ce qui est testé »*). Aucun écart signalé. Les versions,
orientations et sorties audio n'ont pas été relevées : la grille les laisse à « non relevé »
plutôt que de les inventer.

| Appareil | Système/version | Navigateur/version | Portrait/paysage et clavier | Wi-Fi/veille | Vidéo et son | Résultat/écart |
| --- | --- | --- | --- | --- | --- | --- |
| iPad | Non relevé | Non relevé | Éprouvé | Éprouvé | Éprouvé | Bon, aucun écart signalé |
| iPad Air | Non relevé | Non relevé | Éprouvé | Éprouvé | Éprouvé | Bon, aucun écart signalé |
| Tablette Samsung | Non relevé | Non relevé | Éprouvé | Éprouvé | Éprouvé | Bon, aucun écart signalé |
| Smartphone | Non relevé | Non relevé | Éprouvé | Éprouvé | Éprouvé | Bon, aucun écart signalé |

Diffuseur principal essayé : __________. Sortie audio (appareil/enceinte) : __________.

## Lancer la répétition

Depuis le dossier du dépôt :

```powershell
node outils/modules-du-jeu/recette-alien.mjs
npm.cmd run build
npm.cmd run repetition -- scratch/modules-du-jeu-recette/semence.json
```

L’argument `semence.json` est nécessaire : cette recette utilise uniquement la campagne
fictive. Sans argument, le lanceur cherche une sauvegarde personnelle. Le profil de cette
répétition est supprimé à sa fermeture ; noter les résultats avant de la fermer.

Sur le même Wi-Fi que le PC, ouvrir dans le navigateur de chaque appareil :

```text
http://ADRESSE-IP-DU-PC:4200/?window=tablet&sync=4200
```

Faire deux tours : **iPad / tablette Samsung**, puis **iPad Air / smartphone**.
Sur le premier appareil, choisir **Nel Varga** ; sur l’autre, **Idris Koa**.
Ouvrir **Modules du jeu**. Sur le PC, **Cockpit › Modules du jeu** donne les accès et
les pupitres. Deux appareils utilisant le même personnage partagent son dialogue :
utiliser Nel et Idris pour vérifier la confidentialité.

Parcourir les étapes 1–10 avec chaque paire. Avant de refaire le parcours, **Tout couper**,
puis réinitialiser MU/TH/UR depuis son pupitre **Réglages** avec la confirmation locale
(dans cette répétition fictive). Pour **Coursive**, réutiliser le préréglage existant ou le
supprimer avant de le recréer. Le film entier peut être essayé une fois ; tester ensuite
les transferts courts sur les autres appareils.

## Terminal, clavier et préparation

1. Autoriser MU/TH/UR à Nel seulement. Sa carte apparaît chez Nel et reste absente chez Idris.
2. Depuis Nel, saisir `/M Où est l’équipage ?`, puis `/M Quel secteur est fermé ?` et `HACK`.
   Dans le pupitre MJ, trois demandes restent présentes ; choisir la seconde et lui répondre.
   La première question et le piratage restent en attente. Idris ne reçoit aucun de ces textes.
3. Effacer le journal avec **CLEAR** : les demandes restent dans le pupitre. Traiter le HACK
   en le refusant ; le résultat reste lisible avec CRT et parasites.
4. Avec le clavier virtuel ouvert, essayer `/M Message accentué : où êtes-vous ?`, la touche
   de validation et **Transmettre**. Passer portrait/paysage, fermer le clavier et vérifier
   que saisie, commandes rapides et navigation du Hub restent accessibles.
5. Dans **Dossiers**, créer `recette-a6`, contenu « Évacuation par le secteur sept », accès
   **Code requis**, code `0087`. Monter/descendre le dossier et vérifier **LIST** chez Nel.
   Déverrouiller avec `CODE 0087`, puis `READ recette-a6`. Le MJ confirme sa suppression :
   une nouvelle lecture est refusée ; le texte déjà lu reste dans le journal.
6. Dans le détecteur, appliquer 5 contacts, proximité 75 et un volume modéré. Créer le
   préréglage **Coursive**, puis changer les réglages et démarrer le scan. Charger **Coursive** :
   scan et faux écho s’arrêtent, les réglages reviennent. Le scan suivant démarre sur demande.

## Radar, coupure et veille

7. Autoriser le détecteur aux deux PJ, démarrer et activer les bips localement sur les
   appareils souhaités. Les contacts sont identiques. Retirer Idris : Nel reste actif.
8. Couper le Wi-Fi de Nel, attendre que le Hub constate la déconnexion : instrument fermé,
   sons arrêtés. Le rétablir : les droits ouverts se retrouvent ; réactiver les bips localement.
9. Envoyer une question depuis Nel, couper son Wi-Fi, répondre depuis le PC puis reconnecter :
   la réponse est retrouvée une fois, sans mélange avec Idris.
10. Passer à un autre onglet du navigateur, puis mettre l’appareil en veille et le réveiller.
    Noter quand le son s’arrête et comment il reprend ; vérifier **Tout couper** au retour.
    L’onglet masqué doit couper les bips du radar. La politique réelle de suspension du
    navigateur et de la vidéo se constate ici, appareil par appareil.

## Film entier et transfert du son (environ 15 minutes)

11. Donner MU/TH/UR aux deux PJ. Dans **Protocoles**, choisir **Autodestruction**, durée
    **15 minutes**, puis enregistrer. Ce réglage permet d’entendre la sirène après le film.
12. Sur les appareils, toucher **Activer le son**. Choisir le diffuseur depuis le PC ou avec
    **Diffuser l’alarme ici** sur l’appareil souhaité, puis saisir `CODE OMEGA-10`.
    Les deux appareils montrent la vidéo et le décompte ; seul le diffuseur est audible.
    Si la lecture est bloquée, toucher **Reprendre la vidéo** et noter l’appareil concerné.
13. Pendant le film, transférer la diffusion à l’autre appareil : l’ancien devient muet,
    le nouveau lit la bande-son, sans recommencer le compte à rebours.
14. Laisser le film aller jusqu’au bout (environ 12 min 56). La sirène prend le relais sur
    le seul diffuseur, avec l’annonce du temps restant, puis l’annonce de la minute suivante.
    Si aucune voix française locale n’est disponible, le message doit l’indiquer ; sirène
    et décompte restent utilisables. Noter ce résultat plutôt que de conclure à une voix validée.
15. Saisir `CODE OMEGA-STOP` : film, sirène et annonces s’arrêtent partout. Refaire un court
    déclenchement, puis **Tout couper** : tous les accès et sons s’arrêtent.

Essayer chaque appareil au moins une fois comme diffuseur ; un court transfert suffit pour
les suivants. L’écoute complète du premier tour reste nécessaire pour juger la bande-son.

## Retour utile pour corriger

Pour chaque écart, noter : **appareil + navigateur/version + étape + geste + résultat attendu
+ résultat observé**. Une capture ou un enregistrement du problème peut accompagner le retour.
Exemple : « iPad Air, navigateur/version…, étape 13 : après transfert vers Samsung, l’iPad
reste audible pendant … secondes ». Ne cocher l’ensemble « validé » qu’après ces essais.
