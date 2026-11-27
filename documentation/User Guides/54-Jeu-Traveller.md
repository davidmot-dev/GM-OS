# 🚀 Jeu — Traveller

> **Pilote décrit :** « Traveller », forgé par David, exporté le 2026-11-26, **fini le
> 2026-11-26**, essayé par David le 2026-11-27, version 2.0.0 (`Export Dirvers/corriges/Traveller-2.0.0.gmos-driver`, construit par
> `outils/traveller/finir_traveller.py`, contrôlé par `outils/traveller/verifier_pilote.mjs`).
> Thème `traveller`, fiche de personnage HTML, bannière et identité visuelle livrés le même jour par
> GM-OS Studio. Retour à [Les jeux et leurs mécaniques](./53-Les-jeux-et-leurs-mecaniques.md).

Un seul geste : le **test**. Le joueur lance **2D**, ajoute le **MD** de la caractéristique et son
**niveau de compétence**, et doit atteindre le **nombre cible** que fixe l'Arbitre — 8+ pour une
tâche Moyenne. L'écart est l'**Effet**, qui dit comment la tâche réussit ou échoue, et ce qu'elle
donne à la suivante. Il n'y a pas de points de vie : les dégâts frappent les caractéristiques
physiques, et GM-OS les reporte sur la fiche.

> Règles relues contre le livre de règles français v2.2 le 2026-11-26 — page du PDF = page
> imprimée + 1 : 5-13, 58-81, 96-129, 136, 145-171, 224-254. Les vingt et une fiches du corpus
> `docs/systems/traveller/rules/` sont relues ; cinq sont corrigées (registre § 278).

**Réimporter le pilote avec « Remplacer ».** Le pilote forgé comptait des réussites : chaque D6
était comparé à la valeur brute de la caractéristique, et la difficulté exigeait huit réussites de
deux dés — **chaque test échouait**. La version 2.0.0 garde son identifiant, mais **sa fiche
change** : elle reprend une à une 328 des 331 clés de la fiche HTML, dont les **72 lignes de
compétence** qui remplacent la zone de texte unique. Un personnage créé avec la fiche forgée garde
ses anciennes valeurs sans qu'elles paraissent : il faut ressaisir ses caractéristiques, ses
compétences et son équipement.

---

## Le test

![Le panneau de jet : Dextérité 10 et Furtivité 0, 2D + 1 contre 8](captures/jeu-traveller-jet.jpg)

- **Composer** : la **caractéristique** (Force, Dextérité, Endurance, Intellect, Éducation, Statut
  social, Psionique, et les caractéristiques optionnelles de la feuille) et, au choix, la
  **compétence**, nommée avec sa spécialité (« Ingénieur — Propulseur-S »). Le seuil affiché est le
  **MD total** : celui de la caractéristique, lu sur son niveau (table p. 9 : 6-8 → +0, 9-11 → +1,
  12-14 → +2…), plus le niveau de compétence.
- **Sans la compétence**, MD−3 (p. 58), réduit d'un point par niveau de **Polyvalent**, annulé au
  niveau 3 (p. 69). Une **autre spécialité** du même domaine fait passer le test au niveau 0
  (p. 58) — sauf **Profession**, dont chaque spécialité s'apprend à part (p. 69).

> ⚠️ Un niveau de compétence se saisit en **texte** : une case **vide** veut dire « non formé »
> (MD−3), **0** veut dire « formé, sans bonus ». Un champ nombre de GM-OS aurait affiché 0 partout.

![L'étape « Préparer » : Difficile, Coup de pouce, 3D les deux meilleurs + 3](captures/jeu-traveller-preparation.jpg)

- **Préparer** : la **difficulté** de l'Arbitre, de Simple 2+ à Impossible 16+ (p. 60) ; le
  **Coup de pouce** ou le **Coup du sort** — trois dés, on garde les deux meilleurs ou les deux pires ;
  ils s'annulent et ne se cumulent pas (p. 61) ; la **durée** — plus vite MD−2, plus lentement MD+2
  (p. 62) ; les **actions simultanées**, qui montent chacune la difficulté d'un niveau (p. 62) ; le MD
  d'une **chaîne de tâches** (p. 63) ; et les **autres MD** des règles : viser, portée, couvert (p. 72).

## Le résultat

![Le résultat : Effet −2, échec moyen, MD−2 au test suivant](captures/jeu-traveller-suites.jpg)

| Effet | Résultat (p. 61) | MD au test suivant (p. 63) |
| :--- | :--- | :--- |
| 6 ou plus | Succès exceptionnel | +3 |
| 1 à 5 | Succès moyen | +2 |
| 0 | Succès marginal — une condition possible | +1 |
| −1 | Échec marginal — le succès possible contre une conséquence | −1 |
| −2 à −5 | Échec moyen | −2 |
| −6 ou moins | Échec exceptionnel | −3 |

« **Reporter au test suivant** » porte le MD de la chaîne au prochain jet ; il se vide après ce
lancer. Sous une attaque réussie, la carte rappelle les dégâts : les dés de l'arme + l'Effet (+ le MD
de FOR en mêlée), moins l'armure, et au moins 1 point sur un Effet de 6+ (p. 74-75). **Le montant se
saisit encore à la main** dans Combat-OS.

## Les blessures

![La carte de Kathya après un coup de 10 : END 0/7, FOR 3/6, DEX 10/10](captures/jeu-traveller-sante.jpg)

Un Voyageur n'a pas de points de vie (p. 74). Quand un coup arrive — de Combat-OS ou de la console
de santé —, GM-OS l'écrit sur la fiche :

1. l'**END** d'abord ;
2. à 0, l'excédent va à la **FOR** ou à la **DEX**, selon « Excédent des dégâts » sur la fiche (le
   choix de la cible) ;
3. quand l'une des deux tombe à 0, le Voyageur est **inconscient** (un test d'END par minute,
   MD+1 cumulatif, p. 80) et le reste frappe la dernière ; les trois à 0, il est **tué**.

Les **MD** des caractéristiques blessées sont recalculés aussitôt (p. 74) : le test suivant les lit.
Une arme **Incapacitante** ne touche que l'END et neutralise pour autant de rounds que l'excédent
(p. 76). Un **soin** se répartit également entre les caractéristiques blessées (p. 79), sans dépasser
les niveaux **sans blessure** de la fiche. La jauge **Physique** est le total END + FOR + DEX.
Une créature du bestiaire n'a que ses **PdV** (p. 81) : la colonne PDV du bestiaire remplit sa santé.

À l'**enregistrement** de la fiche, GM-OS recalcule les MD, le total physique, et relève un niveau
« sans blessure » qu'une caractéristique saisie dépasse (un personnage qu'on crée ou qui progresse).

## La fiche HTML

![La fiche de Kathya, remplie depuis GM-OS](captures/jeu-traveller-fiche.jpg)

La fiche (`traveller-fr`, deux pages paysage) est intégrée au moteur de fiches (version 30 : les
chiffres des caractéristiques, des MD et des compétences s'y lisent depuis le 2026-11-27) et
reliée par `docs/systems/traveller/fiche/correspondance.json` : 328 clés une à une. Restent à la
fiche : le portrait, et le nom et l'espèce de la page 2, qu'elle recopie seule. Le total physique,
les niveaux sans blessure et le choix de l'excédent n'ont pas de case imprimée : ils restent dans
GM-OS. Une saisie GM-OS ne part vers la fiche HTML qu'après « Sauvegarder ».

## Ce qui n'est pas dans le pilote

- Les **dégâts d'une attaque** ne se calculent pas encore dans Combat-OS (dés de l'arme + Effet −
  armure) : le meneur saisit le montant, que la fiche reporte ensuite.
- L'**initiative** lit 2D + MD DEX − 8 (p. 71) ; un Voyageur qui préfère l'INT, ou l'Effet d'un
  test de Tactique pour son camp, se règle à la main.
- Les **portées** sont les Zones de Portée des rencontres (p. 80) ; le MD d'une portée d'arme
  (courte +1, longue −2, extrême −4, p. 74) se règle au jet, dans « Autres MD ».
- Le **commerce**, le **saut**, la **création de mondes**, les **psioniques** et le **combat
  spatial** vivent dans le corpus et l'Oracle, pas dans des écrans.
