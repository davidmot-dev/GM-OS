# 🌑 Jeu — Symbaroum

> **Pilote décrit :** « Symbaroum », exporté le 2026-10-20 et corrigé le 2026-10-21 (un seul attribut au jet, plus de « difficulté » qui faisait tout réussir, santé de départ sur l'Endurance, fiche HTML reliée), puis le 2026-10-22 (modificateur et opposition au seuil ; Endurance raccordée et fin de scène ; Avantage tactique et Corruption au seuil : `Export Dirvers/corriges/Symbaroum_driver_gmos_s3-s4.gmos-driver`). Retour à [Les jeux et leurs mécaniques](./53-Les-jeux-et-leurs-mecaniques.md).

Un seul geste : le **test**, un d20 sous un attribut. Autour de lui, la fiche de personnage HTML,
reliée champ par champ, et la **Corruption**, suivie en jauges.

> Règles relues contre le corpus `docs/systems/symbaroum/` le 2026-10-21 (« Résolution des jets »,
> « Initiative et déroulement du tour », « Santé et blessures », « Composition de la fiche de
> personnage »).

---

## Le test

![Le panneau de jet de Symbaroum : un test de Précision, seuil 15](captures/jeu-symbaroum-jet.jpg)

- On retient **un attribut** parmi les huit : Agilité, Astuce, Discrétion, Force, Persuasion,
  Précision, Vigilance, Volonté. Sa valeur est le seuil.
- On lance **1d20** : **sous ou égal au seuil**, le test réussit.
- Un **1** est une réussite parfaite, un **20** un échec critique : c'est une règle **optionnelle**
  du livre, que le panneau affiche toujours.

![Après le lancer : 13 sous 15, réussite](captures/jeu-symbaroum-jet-lance.jpg)

### Le modificateur et l'opposition

![Précision 15 contre un Attribut adverse de 13, avec l'Avantage : seuil 14](captures/jeu-symbaroum-opposition.jpg)

À l'étape **Préparer**, deux réglages déplacent le seuil, et ils **s'additionnent** :

- **Attribut adverse** : contre un adversaire, saisissez son Attribut. Le livre retire **10 moins
  cet Attribut** : un adversaire à 13 donne −3, un adversaire à 7 donne +3. Case vide, pas
  d'opposition.
- **Modificateur** : la difficulté de la tâche, de **+5** (très facile) à **−5** (très complexe),
  et les bonus de situation.

Le calcul se lit sous **Seuil** : `15 + (10 − 13) + 2`, soit 14. Le dé se juge contre ce seuil, et
le journal redit l'opposition et le modificateur avec le jet (« Attribut · Attribut adverse 13 ·
+2 »). Les deux réglages restent en place d'un jet à l'autre : remettez la case à vide et le
curseur à 0 quand l'adversaire change.

> *Pourquoi ce n'est pas la « difficulté »* : la Forge y avait rangé ce −5 / +5. Or, dans GM-OS,
> la difficulté est un **nombre de réussites à obtenir** (celui de Dune). À 0, chaque test
> réussissait, un 20 compris. Depuis le 2026-10-22, la revue de la Forge refuse ce réglage sur un
> jet d'un seul dé.

> Au **pupitre** de Dice-OS, qui ne lit pas de fiche, le seuil se saisit déjà calculé.

### L'Avantage tactique

![L'Avantage tactique coché : seuil 15 + 2 = 17, et le rappel « +1D4 aux dégâts » après le lancer](captures/jeu-symbaroum-avantage.jpg)

Encerclement, attaque surprise, cible à terre en mêlée… : la case **Avantage tactique** ajoute
**+2** au seuil et rappelle **+1D4 aux dégâts** après le lancer (p. 166). **Un seul d20** : ce
n'est pas un double lancer. Les avantages ne se cumulent pas : une case, pas un compteur. Elle
s'ajoute à l'opposition et au modificateur.

Le sélecteur **« Tirage »** lance, lui, deux d20 et garde le meilleur ou le pire : pour la
cécité, certains Talents, l'option des dégâts critiques. Il s'appelle ici « Deux dés, le
meilleur / le pire », pour ne plus se confondre avec l'Avantage du jeu.

---

## La fiche de personnage

La fiche HTML de Symbaroum (deux pages : identité, attributs, douze cadres de talents et pouvoirs,
armes et protections ; portrait, compagnons, artéfacts, équipement) se relie à son personnage
GM-OS : voir [Fiche de personnage HTML](./63-Fiche-de-personnage-HTML.md).

| Sur la fiche HTML | Dans GM-OS |
| :--- | :--- |
| Les huit attributs | Les huit champs du jet |
| Endurance maximale, Endurance, Résistance à la douleur, Seuil de Corruption | Attributs secondaires |
| Défense, sous chaque protection | « Défense » (la première protection) et « Défense — protection 2 » |
| Corruption, Corruption permanente | Les deux jauges de Corruption |
| Talent ou pouvoir : nom, type, niveau N / A / M, effet | Douze champs « Talent ou pouvoir », niveau Novice, Adepte ou Maître |
| Les 21 lignes d'équipement | Un seul texte « Équipement », une ligne par objet |
| Argent (« 127 thalers ») | « Argent — tel que noté sur la fiche » |
| Apparence | La Description du personnage |
| Portrait | Reste sur la fiche : GM-OS a son propre portrait |

> ⚠️ **Deux argents.** La fiche écrit l'argent en clair ; GM-OS suit aussi un nombre de thalers
> (« Argent (thalers) »), en jauge. Ils ne se recopient pas l'un dans l'autre.
>
> ⚠️ **La fiche ne calcule rien.** Endurance (la Force, au moins 10), Résistance à la douleur (la
> moitié de la Force, arrondie au-dessus), Seuil de Corruption (la moitié de la Volonté) et
> Défense (l'Agilité moins l'encombrement de l'armure) s'écrivent à la main.

L'**archétype** (Guerrier, Mystique, Roublard) n'est pas imprimé sur la fiche : il se choisit dans
le formulaire de GM-OS.

---

## Combat et santé

- **Initiative :** l'**Agilité**, du plus haut au plus bas.
- **Santé :** l'**Endurance** de la fiche est la santé du combat, plafonnée par l'**Endurance
  maximale** : un coup porté au combat s'écrit sur la fiche, une fiche blessée se lit au combat. Un
  personnage **neuf naît à son Endurance maximale** ; un personnage existant garde la sienne —
  vérifiez qu'elle n'est pas restée à 0 avant la première séance.
- **Types de dégâts :** physique, poison, acide, alternatifs, chute.
- **Ressources suivies**, en jauges segmentées : Corruption temporaire, Corruption permanente,
  Argent, Expérience.

### La fin de scène

![L'aperçu de la fin de scène : Éléna des Brumes, Corruption temporaire 2 → 0](captures/jeu-symbaroum-fin-de-scene.jpg)

Le bouton **« Fin de scène »** du bandeau ouvre un aperçu, personnage par personnage : la
**Corruption temporaire** revient à 0, la **permanente** reste. « Appliquer » écrit les fiches. Rien
ne détecte la fin d'une scène — ni la fin d'un combat, ni un changement de lieu : c'est vous qui la
déclarez.

### La Corruption au seuil

![Sous le bandeau : Éléna des Brumes, Corruption totale 5 — Seuil de Corruption : choisir un Stigmate, Corruption permanente +1D4](captures/jeu-symbaroum-stigmate.jpg)

GM-OS surveille la **Corruption totale** (temporaire + permanente) :

- au **Seuil de Corruption** — la moitié de la Volonté, arrondie au-dessus — une ligne paraît
  sous le bandeau : **choisir un Stigmate**. **« Noter »** lance **1D4** et l'ajoute à la
  Corruption permanente (p. 179–180), et le consigne au journal ; **« Écarter »** le laisse ;
- à la **Volonté**, l'**Abomination** (p. 180) : un rappel, que « Noter » consigne. Le
  personnage passe au meneur, sauf accord du groupe pour le jouer (p. 184).

Une fois par passage : ni un rechargement, ni une tablette qui se reconnecte ne la reproposent.
La **fin de scène**, qui vide la Corruption temporaire, fait redescendre la totale : le seuil se
réarme, et un nouveau franchissement se proposera — *le livre n'explicite pas les réentrées
dans une même scène ; c'est la convention retenue.* Une Volonté pas encore remplie ne déclenche
rien. Le Stigmate lui-même (lequel, sa description) s'écrit sur la fiche.

---

## Ce qui reste à la main

- L'**égalité d'initiative** : la Vigilance départage, puis un d20.
- La **Résistance à la douleur** : un coup qui l'atteint fait tomber la victime ou ouvre une
  Attaque gratuite, au choix de l'attaquant.
- **Quel** Stigmate, et sa durée (un jour s'il est temporaire, jusqu'à un rituel s'il est permanent).
- Les **coûts en Corruption** des pouvoirs, rituels et artéfacts, selon les traditions.
- L'**agonie** à 0 d'Endurance : les tests de mort se lancent et se comptent à la main.
- Les **relances** optionnelles contre un point d'Expérience ou de Corruption permanente.
- Les **attributs secondaires**, que ni la fiche ni GM-OS ne calculent.
