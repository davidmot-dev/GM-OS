# Recette de l’intégration Alien — étapes 4 et 6

**Suite du 16/10 — étape 6 :** la [fiche matérielle adaptée aux appareils de David](2026-10-16-recette-materielle-alien.md)
couvre iPad, iPad Air, tablette Samsung et smartphone, ainsi que les dossiers, demandes
et préréglages de l’étape 5. Elle fournit la grille de résultats et les gestes à la table.

Demande de David le 15/10/2026 : *« on fait le step 4 »*. GM-OS confirmé fermé avant
les travaux. Cette recette distingue le réseau local éprouvé par automatisation et
les appareils physiques, qui demandent une manipulation à la table.

**Résultat du 15/10 : six parcours E2E au vert (environ 2 min 24), cinq captures du
vrai Hub relues, build/types et lint propres. Aucun changement applicatif nécessaire
pendant cette recette. La partie matérielle ci-dessous reste à éprouver.**

**Résultat du 16/10 — volet logiciel de l’étape 6 : huit parcours validés sur la version
0.4 de MU/TH/UR / 0.2 du détecteur.** Cinq parcours existants passent, puis les trois parcours
étendus passent après correction de la navigation et des sélecteurs du banc. Persistance
des dossiers/demandes/préréglages, réponses hors ordre et pendant une déconnexion, saisie tactile
et rotation émulées, relais film → sirène et annonces simulées sont couverts. Build et lint
du scénario propres ; sept captures du vrai Hub disponibles dans `scratch/modules-du-jeu-e2e/`.
Aucun code applicatif modifié. **Aucun résultat sur appareil physique annoncé.**

## Essai automatique reproductible

```powershell
npm.cmd run build
npx.cmd playwright test e2e/modulesDuJeuAlien.spec.ts --reporter=list --output=scratch/modules-du-jeu-e2e/resultats
```

Le scénario lance le vrai paquet Electron sur un profil temporaire, les serveurs
sur 4100/4101, puis deux contextes Edge indépendants, sans `appBridge`.
Les commandes et projections empruntent le vrai WebSocket ; le film vient du vrai
serveur HTTP, sans interception ni simulation de ces transports. Les ressources
extérieures sont bloquées. Aucun paquet ou navigateur n’est téléchargé.

La semence dérive uniquement de `e2e/donnees/campagne-de-demo.json` et du pilote
fictif `pilote-alien-accessoires.json`. Ce pilote sert à déclarer les accessoires ;
il ne constitue pas un pilote complet des règles Alien. Aucun export de David lu.
Les profils et semences temporaires sont supprimés à la fin. Captures et traces
vont dans `scratch/`, sans réécrire le manuel ou les images de référence.

| Parcours automatique | Vérification |
| --- | --- |
| Deux PJ, instruments distincts | MU/TH/UR pour Nel, détecteur pour Idris ; aucun accès implicite. |
| Confidentialité | Code MJ absent des paquets joueurs ; réponse de Nel absente chez Idris et du flux commun. |
| Rôles | Commande de scan avec rôle MJ injecté dans la charge refusée depuis une socket joueur. |
| Radar à 360/768/1180 px | Scan partagé, réglages, faux écho, absence de débordement et retrait partiel préservant l’autre vue. |
| Son et reconnexion | Vrai AudioContext sur clic ; coupure de connexion ferme instrument et graphe audio ; reprise reconnue et muette. |
| Film d’alerte | WebM décodé, plage HTTP 206, durée autoritaire ≥ 775,701 s, un seul lecteur non muet, transfert sans report d’échéance, annulation. |
| Persistance | Fichier privé réellement écrit dans le profil jetable ; redémarrage/import conservent contacts et proximité, sans scan ni droits ouverts. |
| Préparation de l’étape 5 | Dossiers classés/supprimés, demande en attente et préréglage nommé conservés après redémarrage/import ; accès et effets arrêtés. |
| Questions et tactile émulé | Seconde question traitée avant la première, réponse reçue après reconnexion, HACK indépendant, confidentialité entre PJ ; saisie accentuée, validation, viewport réduit et rotation. |
| Relais après le film | Horloge avancée après la durée du film : sirène Web Audio réelle, voix française simulée, deux puis une minute ; transfert et annulation sans son résiduel. |

L’audio du navigateur et d’Electron est rendu muet vers les enceintes ; le graphe
audio reste réel et observé. L’essai du film vérifie son chargement et son annulation,
sans attendre treize minutes ni certifier la qualité de la bande-son. Voix et sirènes
de secours gardent leurs essais à horloge simulée ; leur restitution se juge sur le matériel.
Le parcours ajouté en étape 6 avance l’horloge du navigateur à treize puis quatorze minutes.
Il éprouve la transition dans les vrais composants et le graphe audio, mais ne lit pas les
treize minutes du fichier et ne synthétise pas une vraie voix. Le clavier système et la veille
ne sont pas reproduits par l’émulation tactile ; ces points restent sur la fiche matérielle.

## Préparer l’essai matériel sans campagnes personnelles

```powershell
node outils/modules-du-jeu/recette-alien.mjs
npm.cmd run build
npm.cmd run repetition -- scratch/modules-du-jeu-recette/semence.json
```

Passer explicitement cette semence à `repetition` : sans argument, ce script cherche
la dernière sauvegarde personnelle. La commande ci-dessus charge seulement la fiction,
dans un profil jetable avec sauvegardes isolées. Fermer la répétition supprime ce profil.
Les appareils domotiques restent désactivés ; cela ne coupe pas l’audio Web des tablettes.

Sur deux appareils du même réseau, ouvrir
`http://ADRESSE-IP-DU-PC:4200/?window=tablet&sync=4200`, choisir **Nel Varga** et
**Idris Koa**, puis **Modules du jeu**. Les ports habituels de GM-OS ne sont pas utilisés.

| Geste à la table | Résultat attendu |
| --- | --- |
| Ouvrir MU/TH/UR à Nel et détecteur à Idris | Chaque carte n’apparaît que chez son destinataire. |
| Poser une question et répondre à Nel | Réponse visible uniquement chez Nel ; aucune directive protégée sans code. |
| Ouvrir le radar aux deux, régler puis démarrer | Mêmes contacts, positions dans la proximité choisie ; intensité sans écriture du Stress. |
| Activer les bips ici, retirer un PJ puis Tout couper | Un retrait ne coupe pas l’autre appareil ; la coupure générale ne laisse aucun bip. |
| Désactiver le Wi-Fi du porteur du radar puis le rétablir | Instrument fermé et silence pendant la coupure ; retour autorisé avec son local à réactiver. |
| Jouer OMEGA-10 et choisir un seul diffuseur | Film complet, échéance ≥ 12 min 56 ; bande-son uniquement sur l’appareil choisi. |
| Transférer le diffuseur pendant le film | Ancien appareil muet, nouveau audible après activation locale, échéance inchangée. |
| Laisser une alerte de 15 minutes dépasser la fin du film | Sirène et annonces reprennent sur le seul diffuseur ; CODE OMEGA-STOP coupe la séquence. |
| Tester clavier virtuel, rotation, veille et mouvements réduits | Commandes accessibles et lisibles, pas de bips persistants après sortie ou retrait. |

Consigner navigateur/OS, largeur/orientation, sortie audio utilisée et résultat pour
chaque appareil. Ne pas annoncer cette dernière partie validée à partir des seuls navigateurs
de test du PC. Les fichiers de session et archives de campagne contiennent des secrets MJ.
