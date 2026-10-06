# T4 — début du lot joueurs J1, 2026-10-06

David : « commit et push T3, met à jour la documentation, et commence T4 », puis
**« gm-os est fermé »** le 06/10 avant l'intégration dans src/.
T3 est clôturé dans **`1a8c8019`**, poussé sur `origin/feature/tablet-hub-pwa` ; les
références retenues sont dans [tablettes-joueurs](stitch/tablettes-joueurs/README.md) et
[tablette-meneur](stitch/tablette-meneur/README.md).

## Premier écran intégré : accueil « Qui es-tu ? »

Source : `src/components/hub/LobbyOnboarding.tsx`. GabaritDeModule, EnTeteDeModule,
Panneau, Bouton et Etiquette donnent le rendu final avec les jetons de GM-OS.
La référence T3 guide l'agencement ; aucun composant n'est extrait de l'HTML Stitch.

- L'en-tête campagne/séance et la commande Quitter restent accessibles pendant le défilement.
- Les cartes sont compactes sur téléphone, en deux colonnes à 820 px et trois à 1180 px.
- Portraits existants ou silhouette, noms complets, joueur et état Connectable sont conservés.
- Le pied technique reste accessible dans la zone de lecture.
- Non annule la sortie ; Oui, quitter appelle la sortie existante et referme la confirmation.

Le filtrage des personnages présents, leurs verrous, l'inscription WebSocket, les étapes
Recherche/Synchronisation et les collisions gardent leur logique existante.

[Galerie de l'application intégrée](tablettes/T4-joueurs/accueil/index.html) : quatre formats,
état initial et confirmation. Les huit captures ont été regardées.

## Vérifications

[Résultats et empreintes de l'intégration](tablettes/T4-joueurs/accueil/controles-integration.json).

[`e2e/tabletteAccueilT4.spec.ts`](../../e2e/tabletteAccueilT4.spec.ts) : **4 cas réussis**,
à 360 × 800, 390 × 844, 820 × 1180 et 1180 × 820. Ils vérifient les cibles de 44 px,
l'absence de débordement horizontal, la carte compacte, les trois colonnes en paysage,
l'accès au dernier personnage et au pied, Quitter accessible après défilement, Non puis
Oui, quitter, et le choix transmis au meneur avec retour du verrou par WebSocket.

- Construction de production et typage `npm run build` : verts.
- ESLint sur le composant et le nouveau banc : zéro erreur ou avertissement.
- Tests du socle et de l'apparence tablettes : **35 réussites**.
- Banc T0 joueurs : **39 scénarios validés**, dont quatre échecs attendus déjà présents en T0
  (PV non transmis au meneur aux trois tailles, bouton Jouer masqué sur téléphone).
  55 captures dans `tablettes/T4-joueurs/regressions-accueil/`, dont les trois accueils regardés.
- Guides 61/62 relus et capture `captures/tablette-des-joueurs.jpg` régénérée puis regardée.
  Le banc du manuel passe ses deux étapes nécessaires, lancement de séance puis capture.

Commandes des bancs :

```powershell
npx.cmd playwright test e2e/tabletteAccueilT4.spec.ts --reporter=list
$env:GMOS_TABLET_CAPTURES_DIR='documentation/Planning/tablettes/T4-joueurs/regressions-accueil'
npx.cmd playwright test e2e/tabletteJoueursT0.spec.ts --reporter=list
npx.cmd playwright test e2e/capturesDuManuel.spec.ts --grep 'la séance commence|tablette-des-joueurs' --reporter=list
```

Les commandes Electron se jouent successivement, leurs profils/ports partagent l'index du worker.
**Piège du manuel** : le grep réduit à `tablette-des-joueurs` passe mais capture Recherche de
session, car il omet le test préalable qui lance la séance. Cette image a été remplacée par
la bonne capture après les deux étapes. Regarder l'image reste nécessaire.

Les essais utilisent la campagne fictive de Varn, des profils jetables et un véritable
navigateur sans appBridge côté tablette. Les captures T4 sont séparées des références T0/T2/T3.
Aucune donnée de David n'est utilisée. Les quatre formats vérifiés dans Edge ne remplacent
pas une séance jouée ni l'épreuve de Safari sur le vrai iPad.

## Constat avant T4 et préparation conservée

Le banc a d'abord été joué sur la version avant T4. Il échouait sur la carte de 374 px à
360 px, la sortie hors écran après défilement à 390/820 px et la confirmation restant
présente après Oui, quitter en paysage. Un faux échec de mesure pendant l'animation a été
éliminé en attendant la stabilisation. Le [constat avant](tablettes/T4-joueurs/accueil/constat-avant.json)
et les captures `avant-T4/` conservent cette référence.

Le candidat complet, son fragment de sélection et `preparer-candidat.mjs` sont gardés comme
traces de la préparation hors de src/. Le helper avait vérifié syntaxe, ESLint et types en
mémoire, puis enregistré l'empreinte de la source avant intégration. **Ne pas le relancer sur
la source intégrée** : son marqueur de remplacement décrit l'ancienne version.
`candidat-controles.json` indique maintenant que le candidat a été appliqué.

## État de reprise

**Accueil, Direct, Inventaire et Cartes J1 intégrés ; T4 reste ouvert.** Le
[relevé Direct](2026-10-06-T4-Direct-joueurs.md) et sa
[galerie](tablettes/T4-joueurs/direct/index.html) consignent le deuxième écran, après
une nouvelle confirmation de David : « gm-os est fermé ».
Le [relevé J1](2026-10-06-T4-J1-joueurs.md) et sa [galerie](tablettes/T4-joueurs/j1/index.html)
prennent la suite. Relancer le banc joueurs après chaque écran, regarder les captures,
mettre à jour les guides et garder un commit par écran lorsqu'il est demandé.
David a testé J1 puis autorisé J2 le 06/10, « ok c'est testé fais J2 » ;
le [relevé J2](2026-10-06-T4-J2-joueurs.md) prend la suite. **T4 non commité** ; la demande de commit/push
portait sur T3. Les fichiers modifiés avant cette session sont laissés à leur auteur.
