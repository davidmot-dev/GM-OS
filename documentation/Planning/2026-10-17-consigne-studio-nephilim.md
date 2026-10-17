# Consigne pour Character Sheet HTML Studio — Nephilim, pages des Sciences occultes

Rédigée le 2026-10-17 pour David (chantier : [2026-10-17-chantier-nephilim.md](2026-10-17-chantier-nephilim.md)).
À coller dans *Character Sheet HTML Studio*, avec **deux pièces jointes** :

1. la fiche actuelle, `docs/fiches/Nephilim/nephilim-legende-interactive.html` ;
2. le fichier des nouvelles fiches (5 pages : Magie, Kabbale ×2, Alchimie ×2).

---

## Le texte à coller

Bonjour. Je veux **enrichir une fiche existante**, pas en créer une nouvelle.

**Pièces jointes**
- `nephilim-legende-interactive.html` : la fiche actuelle, gabarit `nephilim-legende-fr`,
  2 pages, 239 clés. Des personnages sont déjà remplis avec.
- Un fichier de 5 pages à ajouter : page 1 = la **Magie**, pages 2 et 3 = la **Kabbale**,
  pages 4 et 5 = l'**Alchimie**.

**Ce que tu livres** : un seul fichier HTML, la même fiche avec **7 pages** — les 2 pages actuelles
inchangées, puis les 5 nouvelles dans cet ordre (page 3 Magie, pages 4–5 Kabbale, pages 6–7
Alchimie).

**Règles impératives (cahier des charges GM-OS, § 6 — les clés sont un contrat)**
1. Garde le `template.id` : **`nephilim-legende-fr`**. Ne le change pas.
2. Garde **toutes les clés existantes à l'identique** — même nom, même type, même page. Ne renomme,
   ne retire et ne déplace aucune clé. Les pages 1 et 2 ne changent pas.
3. **Une clé, un champ.** Si une valeur déjà présente en pages 1–2 réapparaît sur les nouvelles
   pages (degrés des cercles de Magie, Sephiroth, Œuvres d'Alchimie, Ka-éléments, Stase), ne crée
   **pas** une deuxième saisie de la même valeur : pose un champ calculé
   `derive: { "source": "<clé existante>", "operation": "copy" }` sous une clé nouvelle, ou laisse
   la zone sans champ. Dis-moi lequel tu as choisi pour chaque cas.
4. Chaque nouvelle page déclare ses dimensions natives et **intègre son image de fond** en
   `backgroundData` (`data:image/png` ou `jpeg` ou `webp`). Aucune ressource externe : la fiche doit
   marcher hors ligne.
5. **Une piste imprimée** (des cases ou des chiffres qu'on coche pour atteindre un niveau) se fait en
   **hotspots** sous une seule clé, avec des `value` numériques 1, 2, 3… — jamais en cases à cocher
   numérotées.
6. N'invente **ni règle ni calcul** : un champ calculé n'existe que si la fiche l'imprime.

**Nommage des nouvelles clés** — en minuscules, en anglais court, avec des points, comme les
clés existantes (`occult.magic.first`, `pastlives.0.degree`). Adapte au contenu réellement imprimé ;
voici ce que j'attends quand la fiche le porte :

- **Magie** (page 3) — une ligne par sortilège : `magic.spells.0.name`, `.circle`, `.element`,
  `.degree`, `.effect`, `.page` (puis `magic.spells.1.…`).
- **Kabbale** (pages 4–5) — une ligne par invocation ou créature : `kabbalah.invocations.0.name`,
  `.sephirah`, `.element`, `.degree`, `.pact` (case cochée si un pacte est noué), `.notes` ; les
  mondes, Sceaux, Pentacles ou Clés imprimés sous `kabbalah.…`.
- **Alchimie** (pages 6–7) :
  - le **Ka de chaque construct** (athanor, creuset, cornue, alambic, aludel) :
    `alchemy.constructs.athanor`, `.crucible`, `.retort`, `.alembic`, `.aludel` ;
  - les **jauges de Materiae Primae**, une par Ka-élément, en piste de hotspots :
    `alchemy.materia.fire`, `.air`, `.water`, `.earth`, `.moon` ;
  - une ligne par formule : `alchemy.formulas.0.name`, `.work` (noir, blanc, rouge),
    `.construct`, `.degree`, `.effect`, `.page`.
- **Ka dominant** : s'il est imprimé quelque part, `ka.dominant` (liste Feu, Air, Eau, Terre, Lune).

**Ton résumé de fin** : pages, zones, fonctions, ambiguïtés, et surtout **la liste exacte des clés
ajoutées** (et la confirmation qu'aucune clé existante n'a été retirée ni renommée).

---

## Ensuite (Claude Code)

1. Déposer la fiche telle quelle dans `docs/fiches/Nephilim/`, à la place de l'actuelle.
2. `npm run fiche:valider -- Nephilim` : une clé disparue est une **erreur**, et la fiche repart vers
   le Studio avec le rapport.
3. Intégrer le gabarit au moteur et monter `BUILTIN_VERSION` (8 → 9).
4. Ajouter les nouvelles clés à la fiche GM-OS de Nephilim (pilote à réexporter puis réimporter) et
   à la correspondance.
5. Relancer le validateur et les essais.
