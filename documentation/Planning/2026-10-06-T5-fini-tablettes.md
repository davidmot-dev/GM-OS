# T5 · Le fini des deux tablettes — 2026-10-06

David demande **« commit, push et fais T5, GM-os est fermé »** après M2.
T4 est enregistré en commits par écran, avec des commits propres aux segments,
aux cadres communs, aux essais et à la documentation. La série est poussée sur
`origin/feature/tablet-hub-pwa`, jusqu'à **`edcdb68a`**. Les modifications
préexistantes hors chantier sont conservées hors de ces commits.
Le contrôle pré-push valide le typage, la construction et **6 774 tests unitaires**,
quatre ignorés. Le hook NotebookLM synchronise **22 guides sur 22**.
Le lint global s'arrête sur le `scandir` d'une entrée au nom illisible déjà signalée
par `git status` ; le hook traite ce contrôle comme non bloquant. Ce constat est
consigné au § 1 bis du registre. Les comparaisons ciblées des lots T4 sont conservées.

La demande explicite ouvre T5 ; elle ne déclare pas un essai supplémentaire de
J2/M1/M2 sur les appareils physiques. La fermeture confirmée couvre les modifications.

## Ce qui change

`CadreDeTablette` porte le fini commun de la tablette joueur et du pupitre MJ.
Il garde les attributs et la disposition des deux racines ; ses règles CSS sont
bornées à ces surfaces. Les écrans et le poste principal conservent leur disposition.

- **Halo de sélection** : les commandes pressées et l'onglet courant utilisent
  le halo déclaré par le thème du PC et son facteur. Sa teinte peut rester celle
  du thème quand la main choisit un autre accent. Un thème sans halo garde son facteur
  nul ; la couleur et la bordure continuent d'indiquer la sélection.
- **Focus** : un anneau de deux pixels à l'intérieur du contrôle reste visible
  dans les navigations fixes et les lecteurs. Boutons, liens, saisies et curseurs
  suivent l'accent ; sur les commandes remplies d'accent, l'anneau prend la couleur
  de contraste du thème pour rester distinct du fond. Les dimensions des cibles restent celles de T4.
- **Transitions** : 160 ms sur les couleurs, bordures, relief et transformations
  des commandes. Les entrées de panneaux prennent la même durée par défaut.
- **Appareils modestes** : le cadre réutilise la détection et le mode léger
  existants. Il éteint les halos et les mouvements décoratifs ; les sélections
  et les comptes restent visibles.
- **Réduction des animations** : préférence système respectée, entrées sans
  glissement, signaux de message sans pulsation, défilement immédiat. Les images
  projetées passent sans fondu ; la couche sortante est masquée jusqu'à son retrait.

La réduction des animations de Framer Motion supprime aussi les animations de
largeur. Le premier essai révèle ainsi une jauge du résultat immédiatement vide.
La jauge seule garde sa configuration d'animation fonctionnelle : **quinze secondes**,
avec expiration et fermeture conservées. Le maintien **700 ms** de Couper le son
et sa progression ne sont pas modifiés. Aucun changement de transport, de rôle,
de moteur de dés ou de droits de consultation.

## Contrôles

Vérifications terminées le **07/10**, après le passage de minuit. Les bancs utilisent
exclusivement Varn, des profils jetables et le vrai WebSocket.

- Typage et construction de production : **code 0** ; **707 tests unitaires dans
  43 fichiers** passent sur la version finale.
- **45 scénarios T5 distincts validés** sur cinq formats Edge (360 × 800, 390 × 844,
  820 × 1180, 1180 × 820, 1440 × 900), quatre thèmes avec/sans personnalités,
  focus clavier et saisie, accent du PC, graphismes légers et animations réduites.
  Le passage final réussit 44 scénarios. Le dernier comparait encore le contour
  contrasté d'un bouton plein au contour accent d'un bouton sobre : l'assertion est
  corrigée pour vérifier chaque variable du PC, puis ce scénario passe au rejeu,
  sans modification du produit.
- **84 régressions validées** : 39 joueur, 44 meneur et une d'apparence T1.
  Elles précèdent le dernier ajustement de couleur du focus ; aucune disposition
  ni aucun geste n'a changé depuis. Avec T5 : **129 scénarios distincts validés
  sur les passages**, sans échec attendu.
- Comparaison ESLint de cinq fichiers avec `edcdb68a` : **aucun nouveau diagnostic**.
- **132 PNG**, décodés sans erreur et relus sur six planches ; **20 étapes du manuel**
  passent sur la construction finale, **19 JPEG** régénérés et relus.

Les essais contrôlent aussi les cibles de 44 pixels, le contour distinct du fond,
le focus non recouvert, l'absence de débordement horizontal, la pastille d'un vrai
message sans pulsation, la jauge encore visible et l'expiration du résultat.
La relecture a révélé le contour cyan invisible sur un bouton cyan et les captures
prises avant la fin de Synchronisation : couleur contrastée et attente corrigées.
Les autres ajustements du banc portent sur le nom accessible d'Envoyer, un vrai
signal de message et le choix d'une pastille différente de l'accent effectif.

Les résultats, limites et empreintes SHA-256 des sources et images sont dans
le [manifeste de contrôle](tablettes/T5-fini/controles-integration.json).

Commandes de vérification (paquets déjà présents ; Edge/Electron en profils isolés) :

```powershell
npm.cmd run build
npx.cmd vitest run src/modules/remote src/components/socle src/theme src/components/echapFermeLesSurcouches.test.ts electron/couleursBrutes.test.ts --maxWorkers=4
npx.cmd playwright test e2e/finiTablettesT5.spec.ts --reporter=list
npx.cmd playwright test e2e/finiTablettesT5.spec.ts --grep 'accent manuel' --reporter=list
npx.cmd playwright test e2e/tabletteJoueursT0.spec.ts --reporter=list
npx.cmd playwright test e2e/tabletteMeneurT0.spec.ts --reporter=list
npx.cmd playwright test e2e/apparenceTablettesT1.spec.ts --reporter=list
npx.cmd playwright test e2e/capturesDuManuel.spec.ts --grep 'la séance commence|tablette-' --reporter=list
node documentation/Planning/tablettes/T5-fini/verifier-lint.cjs
```

Les captures T4 et leurs empreintes historiques restent intactes. T5 écrit dans
sa [galerie propre](tablettes/T5-fini/index.html) ; les nouveaux rejeux historiques
écrivent dans ses dossiers de régression. Les guides 60/61/62 expliquent le fini.

## Reprise

**Clôture le 07/10 : T5 commité dans `e920abc1`, T6 validé par David**, qui confirme
« j'ai testé c'est bon, tu peux faire le commit et poussé ». La refonte est terminée.
Le [relevé T6](2026-10-07-T6-validation-tablettes.md) consigne cette validation et
l'autorisation de pousser. Les valeurs de commit/push et les limites du manifeste
T5 restent celles du moment de ses vérifications, avant cette clôture.
