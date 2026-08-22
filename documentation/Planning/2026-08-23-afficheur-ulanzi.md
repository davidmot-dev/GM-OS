# L'afficheur Ulanzi — quatre widgets, pas une bibliothèque par jeu

**Nature de ce document : référence vivante de conception.** Il dit ce qu'on a décidé et *pourquoi*, pas
ce qui est fait. **Rien n'est codé au 2026-08-23** — pas une ligne. À relire avant d'écrire la première.

**Matériel :** Ulanzi TC001 flashé sous **AWTRIX 3**, acquis le 2026-08-21. Matrice **32 × 8 pixels** RVB,
ESP32, trois boutons, buzzer, capteur de luminosité, API HTTP et MQTT.
**Documents liés :** `2026-08-07-acceleration-ia.md` (la plomberie réseau existe déjà) ·
`2026-08-19-reconciliation-plans-aout.md` § 5 (où ce chantier attend une décision).

---

## 1. La contrainte qui décide de tout

**32 × 8, soit environ cinq caractères lisibles en statique.** Au-delà, ça défile — et **un texte qui
défile n'est pas consultable d'un coup d'œil**, ce qui annule la seule chose que cet objet sache faire.

> **Des nombres, des barres, des couleurs, des icônes. Jamais de phrases.**
> Ce qui a besoin d'une phrase a déjà un écran.

**Et ce que l'objet est, qu'aucun autre écran de la table n'est :**

- **Public par construction** — tout ce qui s'y affiche est montrable. C'est un canal de *divulgation*,
  pas d'information, là où le cockpit garde ses secrets.
- **Ambiant** — on ne le regarde pas, on *remarque qu'il a changé*.
- **Permanent** — il est là même quand personne ne l'interroge.

---

## 2. Vingt idées qui sont quatre widgets

**Le tri décisif, fait le 2026-08-23.** La question n'est pas « quel jeu ? » mais « quelle forme ? ».
Toutes les idées rassemblées — 2D20, NOC, Blade Runner, Cthulhu, Nephilim, Rêve de Dragon, W40K,
Star Wars — tombent dans quatre cases et **aucune n'en déborde**.

| Widget | Ce qu'il montre | Exemples |
|---|---|---|
| **La jauge** | une valeur bornée, en barre | SAN, progression d'un piratage, Voight-Kampff, boucliers avant/arrière, fatigue, jauge de Soupçon (NOC), Momentum et Menace (2D20), fiel et menace |
| **Le compte à rebours** | un temps ou des segments qui s'épuisent | Tension Clock, « LOCKDOWN 30s », l'air et l'autodestruction d'Alien |
| **Le rang** | qui joue, et qui suit | initiative |
| **L'icône d'état** | un symbole 8 × 8 qui change de sens ou de couleur | heure draconique, météo, plexus et Champs Magiques (Nephilim), couleur de scène |

### Pourquoi la distinction n'est pas cosmétique

**Une bibliothèque de fonctions par jeu, c'est N implémentations à maintenir et N écrivains vers 256
pixels.** C'est le piège nommé dès le 21/08 : si combat, trame, dés et Forge poussent chacun leurs
pixels, l'afficheur clignote au hasard. *Ici le motif habituel du projet ne produit pas un silence, il
produit du bruit* — ce qui est pire, parce que ça se voit et qu'on ne sait pas d'où ça vient.

**Quatre widgets et une table de correspondances**, c'est un seul arbitre, et ajouter un jeu coûte trois
lignes de déclaration au lieu d'un module.

---

## 3. La correspondance existe déjà — ne pas la réécrire

**C'est le point le plus important du document.**

Le **pilote** déclare déjà ce qu'un jeu suit : les jauges de NOC, le Momentum et la Menace de 2D20, les
ressources individuelles. Si l'Ulanzi se construit sa propre table par jeu, elle devient **le sixième
champ qui redouble une vérité déjà écrite ailleurs**.

> On connaît la fin : le 2026-08-22 a coûté une soirée entière à réparer **cinq champs qui auraient dû
> passer par `resoudreCorpus` et n'y passaient pas**. Voir `2026-08-22-etat-et-reprise.md`, § 2.7.

**L'Ulanzi n'a pas à savoir ce qu'est le Soupçon.** Elle doit savoir afficher *une jauge nommée* ; c'est
au pilote de dire lesquelles méritent les pixels.

---

## 4. Deux natures de jauge, et elles n'ont pas les mêmes exigences

**Distinction relevée le 2026-08-23, à partir d'une idée de David** — *« une jauge verte qui se vide
silencieusement au fil des découvertes macabres, sans que les joueurs sachent exactement pourquoi »*.

| | **Le miroir** | **L'instrument** |
|---|---|---|
| Exemples | SAN réelle, boucliers, Momentum | Voight-Kampff, la jauge qui se vide sans raison |
| Source | le moteur de jeu | le meneur, à la main |
| S'il ment | **c'est un bug** | **c'est le but** |

Le second n'est pas de l'information, c'est de la **désorientation** : il retourne la propriété ambiante
de l'objet contre les joueurs. Il exige donc une poussée manuelle **qu'aucun module ne puisse
contredire** — sans quoi le moteur « corrigerait » une valeur qui n'a jamais eu vocation à être juste.

---

## 5. Ce que 32 × 8 refuse, et ce que le refus apprend

- **« TOUR : Kaelen » ne marchera pas.** Ça défile. Mais l'idée est bonne et c'est la *forme* qui est
  mauvaise : **32 pixels de large, ce sont dix combattants en points** — l'actuel en clair, les morts
  éteints. Ça se lit en un dixième de seconde et ça en dit plus qu'un nom.
- **Deux barres superposées passent très bien** — 8 lignes de haut, deux barres de trois pixels et un
  interstice. C'est le meilleur usage de la hauteur qu'on ait trouvé : boucliers avant/arrière d'un
  vaisseau.
- **Icône + jauge + horloge en même temps : impossible.** Une chose à la fois, et c'est précisément
  pourquoi l'arbitre existe.

---

## 6. Le pad MIDI n'est pas une fonction de l'afficheur

L'idée : *un pad d'un Akai MPK Mini déclenche une sirène, passe les Hue et Govee en rouge clignotant, et
affiche « LOCKDOWN — 30s » sur l'Ulanzi.*

**C'est une scène, pas une fonction Ulanzi.** Un déclencheur (le pad) qui éclate vers plusieurs sorties
(son, lumières, afficheur). Construite comme « une fonction de l'Ulanzi », elle **soude trois
sous-systèmes** et on ne pourra plus les séparer. Construite comme une scène dont l'Ulanzi est **un
abonné parmi d'autres**, le module lumières — qui existe et émet au journal depuis le 2026-08-22 —
devient son pair et non son client.

*Le pad est une entrée, les lumières et l'afficheur sont des sorties. Le seam est là, pas ailleurs.*

---

## 7. L'arbitre des 256 pixels

**Un seul décide.** Les modules déclarent une **prétention** avec priorité ; l'arbitre tranche.

| Priorité | Prétention |
|---|---|
| 1 | **Le coup d'éclat** — critique, souffle de dragon, mort d'un PJ (l'événement existe et est déjà émis). *À doser : un afficheur qui crie tout le temps finit sous un livre.* |
| 2 | **Le compte à rebours** |
| 3 | **Le rang / tour en cours** |
| 4 | **La jauge** |
| 5 | **La couleur de scène, l'heure** |

**Et la règle du journal d'Ollama s'applique telle quelle :** *un afficheur absent, éteint ou hors réseau
ne doit jamais emporter ce qu'il décrivait.* Le compte à rebours vit dans l'application ; l'Ulanzi n'en
est qu'un reflet.

---

## 8. Les usages, classés du plus solide au plus décoratif

*Classement du 2026-08-21, inchangé — et la liste du 23/08 l'a renforcé au lieu de le bousculer.*

1. **Le compte à rebours.** Le meilleur candidat de loin, et **le seul qui change la façon de JOUER**
   plutôt que de s'informer. Barre + nombre : exactement ce que 32 × 8 rend bien. Alien en vit.
2. **Le tour en cours** + les **trois boutons physiques** comme télécommande d'initiative.
   ⚠️ *À vérifier avant de compter dessus : les appuis ne remontent probablement que par MQTT, ce qui
   imposerait un courtier.*
3. **L'heure draconique de Rêves de Dragons.** L'objet **est** une horloge, et RdD compte en douze heures
   draconiques avec leurs signes. **Le seul usage que ce matériel-là rend unique.** Douze icônes 8 × 8 à
   dessiner.
4. **La couleur de la scène.** Pas de l'information, une ambiance ; trivial, la scène ouverte est déjà
   connue de `PanneauDeTrameEnCours`.
5. **Le coup d'éclat.** Voir la mise en garde du § 7.

---

## 9. Le point de départ, et il n'a pas changé

> **Le compte à rebours seul — sans arbitre, sans boutons — posé sur la table à la prochaine séance
> d'Alien, pour voir si les joueurs le regardent.**

**Une soirée au lieu d'une semaine, et une réponse que la lecture du code ne donne pas.** C'est la
discipline du reste du projet : *les défauts se trouvent en jouant.* Aucun des trente-huit commits du
22/08 n'a été trouvé à la lecture.

**La liste du 23/08 renforce ce choix** : le compte à rebours est le seul widget qui apparaît dans
presque tous les exemples, tous jeux confondus. S'il ne prend pas à la table, les dix-neuf autres ne
prendront pas non plus.

**Et la bibliothèque se dessinera seule ensuite** : on saura quelle jauge on a *voulu* pousser en jouant,
ce qu'aucune conception ne peut deviner.

---

## 10. Ce qui reste à trancher

1. **Les boutons remontent-ils autrement que par MQTT ?** Toute l'idée de télécommande d'initiative en
   dépend, et un courtier est un service de plus à faire vivre.
2. **Le compte à rebours à la prochaine séance d'Alien — oui ou non ?** C'est la seule décision qui
   débloque le reste.
3. **La jauge « instrument » se pousse depuis quel écran ?** Le cockpit, le pupitre, un pad ? Elle n'a
   pas de module d'origine, puisqu'elle ne reflète rien.

*Plomberie déjà en place, et c'est ce qui rend le chantier court : `SyncServer`, `PairingManager`,
`netTrust` et `net.fetch` depuis le processus principal.*
