# Consigne pour Character Sheet HTML Studio — Nephilim, trois champs du 23/10

Rédigée le 2026-10-23 pour David (chantier : [2026-10-17-chantier-nephilim.md](2026-10-17-chantier-nephilim.md),
§ 16 ; registre § 165). À coller dans *Character Sheet HTML Studio*, avec **une pièce jointe** : la
fiche actuelle, `docs/fiches/Nephilim/nephilim-legende-interactive.html` (7 pages).

Pourquoi : le pilote 2.0.0 du 23/10 ajoute des champs à la fiche GM-OS. Trois d'entre eux décrivent le
personnage et méritent d'être sur la fiche HTML ; les autres restent dans GM-OS seul, exprès :

| Champ GM-OS | Sur la fiche HTML ? | Pourquoi |
| :--- | :--- | :--- |
| `falls_khaiba_form` — la forme du Khaïba | **Oui** (`falls.khaiba.form`) | Elle décide des interdits au jet (p. 150-151) |
| `alchemy_formulas_N_element2` — le second Ka-élément d'une formule | **Oui** (`alchemy.formulas.N.element2`) | Une formule de l'Œuvre au blanc mêle deux éléments (p. 220) |
| `alchemy_constructs_<c>_assembly` — l'Œuvre de l'assemblage | **Oui** (`alchemy.constructs.<c>.assembly`) | « Le PJ coche sur sa feuille chaque construct assemblé et indique avec quel Art occulte » (errata p. 217) |
| `health_<piste>_case_N` — les cases de santé nommées | Non | La fiche HTML garde son compte (`health.physical`, `health.magical`), que GM-OS tient à jour en cochant |
| `falls_*_misenjeu`, `resources_sapience_chute` | Non | État de la séance, effacé à « Début de séance » |

---

## Le texte à coller

Bonjour. Je veux **retoucher une fiche existante**, pas en créer une nouvelle.

**Pièce jointe** — `nephilim-legende-interactive.html` : la fiche actuelle, gabarit
`nephilim-legende-fr`, **7 pages**. Des personnages sont déjà remplis avec.

**Ce que tu ajoutes** — trois groupes de champs, des `select`, posés dans des zones vides et lisibles,
sans rien recouvrir d'imprimé :

1. **La forme du Khaïba**, près de la jauge du Khaïba (`falls.khaiba`). Clé : **`falls.khaiba.form`**.
   Options, exactement : `Nanisme`, `Gigantisme`, `Forme éthérale`, `Forme élémentaire`, et une option
   vide.
2. **Le second Ka-élément de chaque formule d'Alchimie** (page 7), sur la ligne de la formule, près de
   son Ka-élément (`alchemy.formulas.N.element`). Clés : **`alchemy.formulas.N.element2`**, pour chaque
   `N` déjà présent. Options : `Feu`, `Air`, `Eau`, `Terre`, `Lune`, et une option vide.
3. **L'assemblage de chaque construct** (page 6), près du nom du construct. Clés :
   **`alchemy.constructs.retort.assembly`**, **`alchemy.constructs.aludel.assembly`**,
   **`alchemy.constructs.athanor.assembly`**, **`alchemy.constructs.crucible.assembly`**,
   **`alchemy.constructs.alembic.assembly`**. Options : `Œuvre au noir`, `Œuvre au blanc`,
   `Œuvre au rouge`, et une option vide.

**Règles impératives (cahier des charges GM-OS, § 6 — les clés sont un contrat)**
1. Garde le `template.id` : **`nephilim-legende-fr`**.
2. Garde **toutes les clés existantes à l'identique** — même nom, même type, même page, même
   position. Ne renomme, ne retire et ne déplace aucune clé.
3. **Une clé, un champ.**
4. N'invente **ni règle ni calcul** : pas de `derive`.
5. Garde la fiche **autonome** : aucune ressource externe.

**Ton résumé de fin** : la page et les coordonnées de chaque champ ajouté, et la confirmation
qu'**aucune clé existante n'a été retirée, renommée ni déplacée**.

---

**Livrée le 23/10 au soir** : 30 clés nouvelles (`falls.khaiba.form` page 1, cinq
`alchemy.constructs.<c>.assembly` page 6, vingt-quatre `alchemy.formulas.N.element2` page 7), aucune
clé retirée (1 017 clés) ; validateur **ACCEPTÉE** après les 30 correspondances ; moteur
`BUILTIN_VERSION` 16 (`outils/nephilim-vecus/mettre_a_jour_au_moteur.mjs`). Éprouvé par David le 23/10.

## Ensuite (Claude Code)

1. Déposer la fiche livrée dans `docs/fiches/Nephilim/`, à la place de l'actuelle.
2. `npm run fiche:valider -- Nephilim` : une clé disparue est une **erreur**.
3. Intégrer le gabarit au moteur et **monter `BUILTIN_VERSION`** d'un cran.
4. Ajouter à `docs/systems/nephilim/fiche/correspondance.json` les liens `falls_khaiba_form` ↔
   `falls.khaiba.form`, `alchemy_formulas_N_element2` ↔ `alchemy.formulas.N.element2`,
   `alchemy_constructs_<c>_assembly` ↔ `alchemy.constructs.<c>.assembly`. Le pilote n'a pas à changer.
5. Éprouver avec David : un choix fait sur une fiche se retrouve sur l'autre, après « Sauvegarder ».
