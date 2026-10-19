# Consigne pour le Studio — Rêve de Dragon, les champs numériques

> **État après reprise du 19/10/2026** : retouche réalisée, contrôlée et intégrée au moteur
> **v12** par Codex, à la demande de David « Oui, reprends cette retouche », GM-OS confirmé
> fermé. Le texte ci-dessous conserve la consigne initiale. Ne pas relancer le raccord du
> pilote : la correspondance n'a pas changé. [État et vérifications](2026-10-19-etat-et-reprise-codex-rdd-champs-numeriques.md).

Rédigée le 2026-10-19 pour David, après ses captures : dans GM-OS, sur la page 1 du Livret du
voyageur, **les chiffres des caractéristiques sont coupés** (« 11 », « 14 ») et **le sélecteur
haut/bas est trop petit**. À coller dans l'atelier fiche du Studio (*Character Sheet HTML Studio*),
avec **une pièce jointe** : la fiche actuelle,
`docs/fiches/Rêve de Dragon/reve-de-dragon-livret-voyageur-interactif.html`.

## Le diagnostic (vérifié dans le dépôt)

- La fiche **autonome** masque les flèches natives des champs numériques
  (`outils/reve-de-dragon/fiche-voyageur/interface.css:18`). Ouverte seule, elle est juste.
- Mais la CSS que le gabarit transmet à GM-OS (`template.customCss`, gabarit
  `reve-de-dragon-voyageur-fr`) ne le fait pas. Pour `.rdd-number`, elle dit seulement
  `text-align:center; appearance:textfield`, **ce que Chromium (donc Electron) ignore** pour les
  flèches. Elles apparaissent au survol et au focus, et prennent environ 15 px dans des champs qui
  n'en ont que 20 à 45 à l'écran. Les chiffres passent dessous.
- Les champs sont petits par construction : la page fait 595 unités de large, et une
  caractéristique tient dans **23 × 10 unités**, avec une police Georgia de 9. Le gabarit compte
  **483 champs numériques**, de 10 unités de haut pour la plupart, et larges de 7 à 174 unités
  (la plupart entre 12 et 33).
- Le modèle existe chez le Studio : la référence `alien_character_sheet_v2.html` masque les flèches
  avec la bonne règle.

**Le sélecteur haut/bas ne peut pas être agrandi proprement.** La flèche native de Chromium a une
largeur fixe, et le gabarit ne transmet que de la CSS à GM-OS : aucun bouton +/− ne peut y être
ajouté. La solution est donc de **la retirer** et de laisser trois gestes qui restent possibles :
taper la valeur, utiliser **↑ / ↓** au clavier (natif sur un champ numérique), et la molette quand
le champ a le focus.

---

## Le texte à coller

Bonjour. Je veux **retoucher une fiche existante**, pas en créer une nouvelle.

**Pièce jointe** — `reve-de-dragon-livret-voyageur-interactif.html` : le Livret du voyageur de Rêve
de Dragon, gabarit `reve-de-dragon-voyageur-fr`, **5 pages**. Elle est déjà intégrée à GM-OS, et
des personnages sont remplis avec.

**Le défaut** — Dans GM-OS, les champs numériques (`type: "number"`, classe `rdd-number`) montrent
les **flèches natives** du navigateur au survol et au focus. Elles mangent la place des chiffres :
sur la page 1, « 11 » et « 14 » sont coupés dans les caractéristiques. La fiche autonome les masque
dans sa propre CSS, mais le **`template.customCss`** ne le fait pas, et c'est lui seul que GM-OS
applique.

**Ce que tu changes — dans `template.customCss` uniquement**
1. Masque les flèches de **tous** les champs numériques du gabarit :
   ```css
   .sheet[data-template="reve-de-dragon-voyageur-fr"] .rdd-number{-moz-appearance:textfield;appearance:textfield}
   .sheet[data-template="reve-de-dragon-voyageur-fr"] .rdd-number::-webkit-inner-spin-button,
   .sheet[data-template="reve-de-dragon-voyageur-fr"] .rdd-number::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
   ```
2. Donne aux chiffres toute la largeur du champ : `padding:0` sur `.rdd-number`, chiffres à chasse
   fixe (`font-variant-numeric:tabular-nums lining-nums`). La Georgia dessine par défaut des chiffres
   « elzéviriens », qui descendent sous la ligne et paraissent plus petits. Garde `text-align:center`.
3. Vérifie sur les **cinq pages** que **deux chiffres** tiennent sans être coupés dans chaque champ
   numérique, et **trois chiffres** là où la valeur peut dépasser 99 (points d'expérience,
   ressources, monnaie). Si un champ est trop étroit pour son contenu, **élargis-le vers la droite
   le long de la ligne imprimée**, sans rien recouvrir d'imprimé : c'est le seul cas où une position
   bouge, et seulement en largeur.
4. Indique dans l'aide de la fiche qu'une valeur se règle **en tapant**, avec **↑ / ↓**, ou à la
   molette quand le champ a le focus.

**Règles impératives (cahier des charges GM-OS, § 6 — les clés sont un contrat)**
1. Garde le `template.id` : **`reve-de-dragon-voyageur-fr`**.
2. Garde **toutes les clés à l'identique** : même nom, même type (un `number` reste un `number`),
   même page. Seule la **largeur** d'un champ trop étroit peut changer (point 3). Ne renomme, ne
   retire et n'ajoute aucune clé.
3. Les sélecteurs de `customCss` restent préfixés par `.sheet[data-template="reve-de-dragon-voyageur-fr"]`,
   jamais `body`, `html` ni `@import`.
4. N'invente **ni règle ni calcul** : aucun `derive` nouveau.
5. Garde la fiche **autonome** : aucune ressource externe, les fonds intégrés comme aujourd'hui. La
   CSS propre à la fiche autonome peut rester telle quelle.

**Ton résumé de fin** : les règles ajoutées à `customCss`, la liste des champs élargis (clé, page,
ancienne et nouvelle largeur), et la confirmation qu'**aucune clé n'a été retirée, renommée ni
ajoutée**.

---

## Ensuite (Claude Code)

1. Déposer la fiche livrée dans `docs/fiches/Rêve de Dragon/`, à la place de l'actuelle.
2. `npm run fiche:valider -- "Rêve de Dragon"` : une clé disparue est une **erreur**, et la fiche
   repart vers le Studio avec le rapport.
3. Réintégrer le gabarit au moteur (`outils/reve-de-dragon/relier_fiche_voyageur.py`, comme le 19/10)
   et **monter `BUILTIN_VERSION`** d'un cran (11 → 12). La correspondance
   (`docs/systems/reves de dragons/fiche/correspondance.json`) ne change pas : les clés sont les mêmes.
4. Captures de la page 1 dans GM-OS, à juger par David.

## À considérer ensuite

Le même défaut peut toucher **toute fiche** dont la `customCss` oublie les flèches. Une ligne dans
les instructions du Studio (`outils/rpg-sheet-builder/skills/instructions/SKILL.md`) l'éviterait
pour les suivantes. David met alors à jour l'assistant dans ChatGPT (flux des constructeurs, règle 6).
