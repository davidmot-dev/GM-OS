# T0 — la tablette des joueurs avant la refonte

Demandé par David le **2026-10-04** : « on peut commencer avec le 1er travail ? T0 joueurs ? ».
Périmètre : § 5 du [plan des tablettes](2026-10-04-refonte-tablettes.md), registre § 123.
Code de référence : `a26f6076`. Aucun changement de `src/` ou `electron/`.

## 1 · Le parcours et ses sources

La tablette est `?window=tablet`, servie par le SyncServer. Elle n'a pas `window.appBridge`.
`src/components/TabletHub.tsx` assemble les écrans ;
`src/modules/session/hooks/useHubSync.ts` reçoit les états et relaie les gestes par WebSocket.
Ne pas la confondre avec le Player Hub projeté, ni avec `?window=remote` (meneur).

Dans le tableau, les fichiers sans chemin sont sous `src/components/hub/`.

| Écran / état | Ce qu'il présente | Gestes existants | Source |
| --- | --- | --- | --- |
| Accueil, aucune séance active | Recherche du signal, explication au joueur, panneau de diagnostic | Attendre le démarrage d'une séance | `LobbyOnboarding.tsx` |
| Accueil, choix du personnage | Campagne, séance, personnages présents et disponibles, nom du joueur, latence | Choisir un personnage ; quitter avec confirmation | `LobbyOnboarding.tsx` |
| Synchronisation / collision | Animation de sélection ; refus si le personnage est déjà pris | Choisir un autre signal après refus ; reconnexion du même appareil | `LobbyOnboarding.tsx`, `useClientStore.ts` sous `src/stores/` |
| Navigation permanente | Direct, Archives, PNJ, Lieux, Inventaire, Cartes ; Fiche, Notes, Messages, Quitter | Changer d'onglet ; ouvrir/fermer une surimpression ; quitter avec confirmation | `TabletHub.tsx` |
| État de connexion et qualité | Synchronisé / déconnecté, latence, qualité/performance | Basculer la qualité si le matériel n'impose pas le mode | `TabletHub.tsx`, `src/hooks/usePerformanceControl.ts` |
| Direct | Campagne, fond, projection courante, favoris partagés, horloge, tensions publiques, résumé public | Consulter ; accéder à la fiche et aux autres outils par la navigation | `TabletHub.tsx`, `FondProjete.tsx`, `HubProjectionCard.tsx` |
| Initiative | Combattant actif et suivants visibles ; panneau latéral sur tablette, bouton sur téléphone | Ouvrir/fermer « Initiative » sur téléphone | `TabletHub.tsx` |
| Archives | Indices révélés de la campagne, compteur, état vide | Ouvrir un indice | `HubArchives.tsx` |
| Indice en grand | Titre, contenu et illustration | Fermer par le fond ou « Fermer l'indice » | `HubClueViewer.tsx` |
| PNJ | Personnages de la campagne marqués visibles par les joueurs, état vide | Ouvrir un portrait | `HubTrombinoscope.tsx` |
| PNJ en grand | Portrait, nom, description publique | Fermer par le fond ou la croix | `HubNpcViewer.tsx` |
| Lieux | Atlas des lieux visités de la campagne, aperçu et description | Ouvrir un lieu | `HubAtlas.tsx` |
| Lieu en grand | Illustration, nom et description | Fermer par le fond ou la croix | `HubAtlasViewer.tsx` |
| Inventaire | Objets structurés du personnage et objets favoris partagés/possédés, compteur, transferts en attente | Donner un objet ; le jeter après confirmation ; ouvrir le détail d'un favori | `HubInventory.tsx` |
| Donner un objet | Objet choisi, autres personnages de la campagne | Choisir le destinataire ; fermer | `HubInventory.tsx` |
| Objet favori en grand | Illustration, nom, description et attributs | Fermer par le fond ou « Fermer l'objet » | `HubItemViewer.tsx` |
| Cartes | Paquets ouverts de ce jeu, cartes en main, cartes scellées comptées, propositions reçues/envoyées | Piocher, accepter/refuser un don, jouer sa carte, proposer à un voisin connecté | `HubMainDeCartes.tsx` |
| Carte agrandie | Image, nom, description | Agrandir sa carte ; fermer au toucher ou avec Échap | `HubMainDeCartes.tsx` |
| Fiche synthétique | Identité, santé selon le système, réserves communes, champs du gabarit, description, notes et inventaire | Ajuster les PV ; modifier le narratif ; utiliser les ressources autorisées | `HubCharacterSheet.tsx`, `src/modules/combat/components/EtatDeSante.tsx` |
| Fiche HTML | Cadre de la fiche associée au personnage, si elle existe | Passer de la synthèse à la fiche et revenir ; fermer | `HubCharacterSheet.tsx`, `src/modules/fiches/FicheHote.tsx` |
| Jets de fiche | Gestes propres au pilote, si son descripteur les prévoit | Sauvegarde/dé de ressource transmis au meneur ; panneau de jet pour les autres systèmes décrits | `JetsDeLaFiche.tsx`, `HubCharacterSheet.tsx` |
| Résultat projeté | Titre, total/degré, dés individuels, puis disparition temporisée | Lecture, sans interception des clics | `DiceResultDisplay` dans `TabletHub.tsx`, `useHubSync.ts` |
| Notes & Feedback | Notes privées ; avis sur plaisir, histoire et combat, commentaire de séance | Écrire (sauvegarde différée chez le MJ), replier, envoyer/modifier l'avis | `src/modules/session/components/PlayerPrivateNotes.tsx` |
| Messagerie | Conversation avec le MJ, tous les joueurs ou un autre personnage ; non-lus | Choisir le destinataire, écrire, envoyer par bouton/Entrée, fermer | `HubMessenger.tsx` |
| Avis de nouveau message | Expéditeur et canal, disparition après 5 secondes | Ouvrir la messagerie | `MessageToast` dans `TabletHub.tsx` |
| Notifications | Cartouches message/système/alerte, contenu Markdown, vibration, fermeture après 8 secondes | Fermer un cartouche | `HubNotificationCenter.tsx` |
| Règle partagée | Titre et texte Markdown transmis | Fermer par le fond, la croix ou « Compris, Fermer » | `HubRuleViewer.tsx` |

Cette liste décrit le code, pas une promesse de couverture de toutes les combinaisons de jeu.
Le contenu des fiches HTML reste hors refonte. Les permissions et le protocole restent inchangés.

## 2 · Banc reproductible

Fichier : [`e2e/tabletteJoueursT0.spec.ts`](../../e2e/tabletteJoueursT0.spec.ts).

- Le meneur utilise `lancerGmOs`, son profil jetable et ses ports de test ; corpus, sauvegardes,
  coffre et appareils physiques sont isolés par le harnais existant.
- La tablette est un navigateur **Edge/Chromium**, sans preload Electron. Edge est déjà installé ;
  aucun paquet ni navigateur n'est téléchargé. Ce choix se limite à ce fichier de test.
- La campagne vient de `e2e/donnees/campagne-de-demo.json` (« Le Silence de Varn »), non modifiée.
  Le test active la séance 2, rend Hale visible et la station visitée, et donne un outil à Nel.
  Le décor est remis côté meneur avant chaque test. Chaque tablette démarre sur un contexte neuf.
- Les images du paquet fictif sont fournies par une route Playwright limitée à ses illustrations.
  Le plan de station est celui du manuel. Aucun état de synchronisation ni geste n'est simulé.
- Personnalités activées explicitement sur le PC. T0 conserve le thème actuel du navigateur :
  la propagation du thème appartient à T1.
- Tailles logiques : **390 × 844**, **820 × 1180**, **1180 × 820**. Pas d'émulation Safari.

```powershell
npm.cmd run build
npx.cmd playwright test e2e/tabletteJoueursT0.spec.ts --reporter=list
```

Le `.cmd` évite la politique PowerShell qui bloque `npm.ps1`. Les essais demandent la possibilité
de lancer Electron et un navigateur ; le bac à sable de cette session bloque ce démarrage.
Ne pas installer Chromium pour contourner : le navigateur fourni pour la version actuelle de
Playwright n'est pas en cache, mais Edge est disponible.

## 3 · Résultat et captures

**Banc livré : 13 scénarios par taille, 39 au total.** La série complète initiale a rendu 38 cas
verts et un échec réel sur « Jouer » à 390 px. Ce dernier a été rejoué seul après avoir borné
l'attente du clic : échec attendu reconnu par Playwright. Les trois variantes du défaut de PV
étaient déjà des échecs attendus. Le bilan par scénario est donc **35 réussites, 4 échecs
attendus** (PV aux trois tailles ; carte sur téléphone). Ce bilan ne signifie pas que les
deux défauts sont corrigés. Le test deviendra rouge si l'un de ces gestes se met à fonctionner
sans que son échec attendu soit retiré. Construction, analyse de types du test et ESLint : verts.

**54 images** ont été produites et comparées visuellement : 18 états sur chacune des trois tailles.
La [galerie locale](tablettes/T0-joueurs/index.html) les met côte à côte ; chaque image reste
ouverte en pleine résolution. Les éléments non présents dans le décor générique (fiche HTML
d'un pilote particulier, jet spécifique à un pilote) sont inventoriés dans le code mais n'ont
pas de capture T0. L'horloge suit l'heure de l'exécution : ces images sont des références de
mise en page, pas des snapshots au pixel près.

**Trois observations à garder pour J1**, consignées au § 1 bis du registre : les PV changés
sur la tablette ne remontent pas au MJ ; « Jouer » sur une carte est masqué par la navigation
à 390 px ; le titre de campagne passe derrière l'horloge aux deux tailles iPad. Le premier
demande un arbitrage, car il touche un comportement de la fiche, hors du réagencement T4.

Le relevé **joueurs** est fait. Le critère de sortie de la phase T0 complète reste ouvert :
la tablette du meneur n'a pas encore son inventaire, ses captures et ses essais.
