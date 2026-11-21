# Recette de Combat-OS — le jet des adversaires et les dégâts (§ 263) — 21/11/2026

> Demande de David (21/11) : « fais moi un plan détaillé des gestes à faire pour tester les
> dernières modifications de Combat-OS ».
> Chantier essayé : registre § 263, [spécification](2026-11-19-combat-jets-des-adversaires-et-degats.md).
> Les manuels décrivent chaque geste : [Blade Runner](../User%20Guides/54-Jeu-Blade-Runner.md),
> [Alien](../User%20Guides/54-Jeu-Alien.md), [Cthulhu Hack](../User%20Guides/54-Jeu-Cthulhu-Hack.md),
> [Dune](../User%20Guides/54-Jeu-Dune.md).

Durée prévue : 30 à 45 minutes, soit 5 à 10 minutes par jeu. Cocher chaque case au fur et à
mesure. Une case qui ne donne pas le résultat attendu : noter ce qui s'affiche, faire une capture
d'écran, puis passer à la case suivante.

## 0 · Avant de commencer

- [ ] **Les pilotes installés.** Ouvrir *Modèles de fiches* et vérifier les versions :
  - Blade Runner **2.1.0** ;
  - Cthulhu Hack **1.2.0**, réimporté le 19/11 au soir, avec son catalogue ;
  - Alien, la version installée ;
  - Dune **2.0.0**.
- [ ] ⚠️ **Une campagne d'essai, pas une campagne de jeu.** Ces gestes retirent de vrais points de
  Santé sur la **fiche** des personnages joueurs. Prendre une campagne de recette, ou noter la
  Santé des PJ avant de commencer pour la remettre à la fin.
- [ ] Pour chaque jeu, la campagne doit avoir **au moins un PJ** dans la séance, avec sa fiche
  remplie (Santé, et une Armure pour Cthulhu Hack).

**Le geste qui revient dans tout le plan : donner une cible.** Sur la carte d'un adversaire, la
première ligne a une liste **CIBLE** (une petite mire). On y choisit le PJ visé. Sans cible, les
boutons « Attaquer » et « Riposte » le disent.

**Poser un adversaire du livre** : dans les contrôles de droite, *Fabriquer des adversaires*,
onglet **Livre**, choisir la créature, puis la poser sur le plateau.

## 1 · Blade Runner — un adversaire qui tire

Campagne Blade Runner, Combat-OS ouvert, un PJ (par exemple Rachel) sur le plateau.

- [ ] **1.1 Poser l'adversaire.** Onglet *Livre* › **Agent du LAPD en uniforme**.
  - Attendu : sa carte affiche **Points de vie 5/5**, sans aucune jauge « Sang-froid ».
- [ ] **1.2 Sa fiche est remplie.** Cliquer **Fiche** sur sa carte.
  - Attendu : Vigueur, Agilité, Intelligence, Empathie et les compétences sont **dans les champs**,
    avec des niveaux comme « B (D10) », et pas seulement dans les notes.
  - Fermer la fiche.
- [ ] **1.3 Le bouton.** Choisir Rachel comme **CIBLE** de l'Agent.
  - Attendu : un bouton **Attaquer** à côté de **Fiche**, et **aucun autre bouton nouveau** sur
    la carte.
- [ ] **1.4 Le jet prérempli.** Cliquer **Attaquer**.
  - Attendu : la fiche s'ouvre **sur son jet**, avec en tête « Agent du LAPD en uniforme 1
    attaque Rachel ».
  - Attendu : l'attaque proposée suit son arme. Avec la Matraque, c'est **Vigueur + Corps à
    corps** ; avec une arme à feu, **Agilité + Armes à feu**.
- [ ] **1.5 Lancer.** Cliquer **Lancer**.
  - Attendu : deux dés. Le forçage reste possible, comme sur la fiche d'un PJ.
- [ ] **1.6 Appliquer.** Sous le résultat, le bloc **Appliquer à Rachel** doit montrer :
  - l'arme, avec ses dégâts déjà remplis ;
  - le calcul en clair : « arme 2 + N succès − 1 = … ». Avec **0 succès**, il ne doit rien
    proposer ;
  - un bouton **Protection de Rachel : …**.
  - Cliquer la Protection : ses réussites se retirent des dégâts. Cliquer ensuite
    **Appliquer N à Rachel**.
  - Attendu : la **Santé de la fiche de Rachel** descend de N. Vérifier sur sa carte **et** en
    ouvrant sa fiche.
- [ ] **1.7 Une seule fois.** Le même résultat ne doit pas pouvoir s'appliquer une deuxième
  fois.
- [ ] **1.8 La dernière attaque.** Refermer la fenêtre, puis cliquer de nouveau **Attaquer**.
  - Attendu : l'attaque proposée est **celle lancée la fois d'avant**.
- [ ] **1.9 « Dernier jet » dans le calculateur.** Juste après un jet à deux dés, ouvrir
  **Calculer** sur une carte.
  - Attendu : « Dernier jet » ne propose pas « 2 Succès » comme 2 dégâts, et dit pourquoi.
- [ ] **1.10 Calculer, puis la console, sans perte.** Sur la carte de Rachel :
  - noter sa Santé, par exemple 8 ;
  - **Calculer** 3, ce qui donne 5 ;
  - puis **Dégâts** 1 dans la console de la carte.
  - Attendu : **4**, pas 7. Le coup de « Calculer » ne doit pas se perdre. C'était le défaut
    corrigé au § 263.
- [ ] **1.11 Calculer ne frappe que la cible.** Ouvrir **Calculer** depuis la carte de l'Agent,
  qui vise Rachel.
  - Attendu : **seule Rachel** est cochée, pas l'Agent. Ce point a déjà été validé le 19/11 :
    un coup d'œil suffit.

## 2 · Alien — une créature, puis un humain

Campagne Alien, un PJ (par exemple Vasquez) sur le plateau.

### 2.A · Le Rôdeur

- [ ] **2.1 Poser la créature.** Onglet *Livre* › **Rôdeur**.
  - Attendu : **une seule** santé, **Points de vie 6/6**, identique à « Santé xénomorphe : 6/6 ».
    Avant le § 263, la carte affichait 10/10 au-dessus de 6/6.
- [ ] **2.2 Attaquer.** Choisir Vasquez comme **CIBLE**, puis cliquer **Attaquer**.
  - Attendu : la fenêtre « Rôdeur 1 attaque Vasquez » s'ouvre.
- [ ] **2.3 Tirer l'attaque.** Cliquer **Tirer l'attaque (D6)**. On peut aussi choisir le
  résultat soi-même puis cliquer **Prendre cette attaque**.
  - Attendu : la fenêtre dit d'où vient l'attaque, des attaques propres à l'espèce ou de la table
    du jeu.
  - Attendu : l'attaque s'affiche, par exemple « 3 — Enlèvement : … 10 dés de base, Dégâts 1 ».
  - Attendu : elle est notée sur la carte et dans le **journal du jet**.
- [ ] **2.4 Lancer la réserve.** Si l'attaque a des dés de base, cliquer **Lancer N dés —
  Dégâts M**.
  - Attendu : le jet entre au journal, et le bloc d'application affiche « arme M + S succès − 1
    = … ».
  - Une attaque sans dés de base, comme un cri, se résout telle quelle, sans bouton de jet.
- [ ] **2.5 Préparer le coup.** Cliquer **Préparer ce coup de N sur Vasquez**.
  - Attendu : la Santé de Vasquez **ne bouge pas encore**.
- [ ] **2.6 Résoudre sur la cible.** Sur la carte de Vasquez, ouvrir « Blessures et soins
  Alien » : le coup y attend.
  - Cliquer **Lancer la Protection**. Contre une attaque perforante, ce n'est que la moitié des
    dés d'armure.
  - Cliquer ensuite **Appliquer les dégâts restants**.
  - Attendu : la Santé de la fiche de Vasquez descend, et son **Stress** et ses conséquences
    suivent comme pour un coup préparé à la main.
- [ ] **2.7 Test opposé.** Si l'attaque tirée dit « contre le Combat rapproché de la cible »,
  la fenêtre doit le signaler.

### 2.B · Un humain ou un synthétique

- [ ] **2.8 Le jet.** Prendre un PNJ humain armé : un garde, un marine fabriqué ou un PNJ de la
  Galerie. Lui donner Vasquez comme **CIBLE**, puis cliquer **Attaquer**.
  - Attendu : sa fiche s'ouvre sur son jet, Vasquez en tête.
  - Attendu : l'attaque proposée est **Agilité + Combat à distance** avec une arme à distance, ou
    **Force + Combat rapproché** au Contact.
  - Attendu : l'arme est **déjà choisie** dans « Préparer le test Alien ».
- [ ] **2.9 Lancer, puis Préparer.** Cliquer **Lancer**, puis **Préparer ce coup de N sur
  Vasquez**.
  - Attendu : sur la carte de Vasquez, la Protection se lance comme en 2.6.
- [ ] **2.10 Pas d'écrasement.** Laisser un coup en attente sur Vasquez, puis attaquer de
  nouveau.
  - Attendu : le premier coup **n'est pas écrasé**. La fenêtre demande de le résoudre ou de
    l'abandonner d'abord.

## 3 · Cthulhu Hack — la riposte et l'Armure

Campagne Cthulhu Hack, un investigateur (par exemple Harvey) qui a de l'Armure dans son
Matériel.

- [ ] **3.0 Le catalogue est revenu.** Ouvrir le Matériel d'un investigateur, ou le catalogue
  dans Loot-OS.
  - Attendu : les **57 objets** du jeu sont là. Le premier 1.2.0 les avait perdus ; le
    réimport du 19/11 au soir les a rendus.
- [ ] **3.1 Poser l'adversaire.** Onglet *Livre* › **Garde**.
  - Attendu sur sa carte : **Points de vie 14/14**.
  - Attendu dans ses notes : Dés de Vie, Points d'Armure, Malus au toucher, et « Revolver (4),
    Matraque (2) ×2 ».
- [ ] **3.2 Le bouton.** Choisir Harvey comme **CIBLE** du Garde.
  - Attendu : un bouton **Riposte**, et non « Attaquer », à côté de **Fiche**.
- [ ] **3.3 Riposte simple.** Cliquer **Riposte**.
  - Attendu : la fenêtre « Garde 1 riposte contre Harvey » s'ouvre.
  - Choisir **Revolver (4)**.
  - Attendu : l'Armure de Harvey est **déjà lue** sur sa fiche. On peut la modifier, par
    exemple pour ajouter un Couvert.
  - Attendu : le calcul affiché est « 4, − Armure 1 = 3 », avec l'Armure réelle de Harvey.
- [ ] **3.4 Le 20 naturel.** Cocher **20 naturel**.
  - Attendu : « 4 × 2 (20 naturel) = 8, − Armure 1 = 7 ». Les dégâts sont doublés **avant**
    l'Armure, comme décidé le 19/11.
  - Décocher, puis cliquer **Appliquer 3 à Harvey**.
  - Attendu : les PV de la **fiche** de Harvey descendent de 3, et le journal le dit.
  - Attendu : un deuxième clic n'applique rien.
- [ ] **3.5 Plusieurs coups par round.** Choisir **Matraque (2) ×2**.
  - Attendu : un rappel qu'il y a une riposte par Sauvegarde ratée.
- [ ] **3.6 L'Armure de l'adversaire, par Calculer.** Un investigateur touche le Garde pour 6.
  Cliquer **Calculer**, cocher le Garde, saisir 6.
  - Attendu : le Garde passe de **14 à 9**, et le journal affiche « 6 − Armure 1 ».
- [ ] **3.7 L'Armure de l'adversaire, par la console.** Faire la même chose avec le bouton
  **Dégâts** de la carte du Garde.
  - Attendu : l'Armure est retirée aussi.
- [ ] **3.8 Un soin n'est pas réduit.** Soigner le Garde de 2.
  - Attendu : il gagne **2**, et pas 1.

## 4 · Dune — un PNJ qui attaque

Campagne Dune, un PJ (par exemple Duncan) sur le plateau.

- [ ] **4.1 Pas de points de vie.** Poser un **Soldat Harkonnen**.
  - Attendu : sur sa carte, **ni « Calculer » ni console Dégâts / Soins**.
- [ ] **4.2 Le jet.** Lui donner Duncan comme **CIBLE**, puis cliquer **Attaquer**.
  - Attendu : la fenêtre « Fiche » s'ouvre sur son test, avec « Soldat Harkonnen attaque Duncan »
    en tête.
  - Attendu : le test proposé est **Combat + le principe le plus haut**. Si aucun principe n'est
    chiffré, la fenêtre ne propose rien.
  - Attendu : **PNJ ennemi** est déjà coché.
- [ ] **4.3 Lancer.** Sur un test **réussi**, la fenêtre doit ouvrir **Appliquer cette attaque
  réussie**, avec **Duncan déjà choisi**.
- [ ] **4.4 Défaut connu, hors de cette recette.** La jauge Détermination de la carte affiche
  « 0/10 » au lieu de 3, même sur un PNJ, qui n'en a pas. C'est noté au registre (§ 1 bis) : il
  suffit de dire si cela vous gêne.

## 5 · Rien d'autre n'a bougé

- [ ] **5.1 Un autre jeu.** Ouvrir une carte de Combat-OS dans un jeu hors du chantier, par
  exemple Torg, NOC ou Symbaroum.
  - Attendu : **ni « Attaquer » ni « Riposte »**, et la carte est la même qu'avant.
- [ ] **5.2 Vampire.** Sur une carte de Vampire, il ne doit pas y avoir de bouton « Attaquer » :
  son jet passe toujours par **Fiche**, comme avant. Le § 267 garé prévoit d'ajouter ce bouton.

## Ce qu'il faut me rendre

Une ligne par jeu, par exemple : « Blade Runner OK », ou « Alien : 2.6, le Stress n'a pas bougé
(capture) ». Avec ces réponses, je passerai le § 263 au 🟢, jeu par jeu, dans le registre et la
synthèse des pilotes. Je corrigerai ce qui ne va pas un défaut à la fois, après « GM-OS
tourne-t-il ? ».
