# Consigne pour Character Sheet HTML Studio — Nephilim, le Ka dominant

Rédigée le 2026-10-18 pour David (chantier : [2026-10-17-chantier-nephilim.md](2026-10-17-chantier-nephilim.md),
lot C). À coller dans *Character Sheet HTML Studio*, avec **une pièce jointe** : la fiche actuelle,
`docs/fiches/Nephilim/nephilim-legende-interactive.html` (7 pages).

Pourquoi : la fiche GM-OS porte depuis le 18/10 le **Ka dominant** (le choix de l'élément ; son degré
et le plafond de la Stase s'en déduisent). La fiche HTML ne le porte pas : on ne le voit ni ne le
saisit sur elle. Le contrat des fiches ne permet pas de calcul conditionnel (`derive` ne connaît que
`copy`, `floor-divide`, `round-divide`) : la fiche HTML porte **le choix seulement**, GM-OS calcule
le reste.

---

## Le texte à coller

Bonjour. Je veux **retoucher une fiche existante**, pas en créer une nouvelle.

**Pièce jointe** — `nephilim-legende-interactive.html` : la fiche actuelle, gabarit
`nephilim-legende-fr`, **7 pages**. Des personnages sont déjà remplis avec.

**Ce que tu ajoutes** — un seul champ logique : le **Ka dominant** du Nephilim, c'est-à-dire lequel
des cinq Ka-éléments du Pentacle (page 1) est son élément dominant. Clé : **`ka.dominant`**. Valeurs,
exactement : `Feu`, `Air`, `Eau`, `Terre`, `Lune`.

**Comment, par ordre de préférence**
1. **Une piste de choix en hotspots**, sur le Pentacle de la page 1 : un hotspot par élément, posé
   sur le **nom ou le symbole imprimé** de l'élément — **pas** sur la case du degré (`ka.fire`,
   `ka.air`, `ka.water`, `ka.earth`, `ka.moon`, qui doivent rester saisissables). Les cinq hotspots
   partagent la clé `ka.dominant`, avec pour `value` le texte de l'élément (`"Feu"`, `"Air"`,
   `"Eau"`, `"Terre"`, `"Lune"`). Un clic marque l'élément dominant ; seul celui-là s'allume.
2. À défaut d'une place sûre sur le Pentacle : un champ **`select`** `ka.dominant`, avec ces cinq
   `options`, posé près du Pentacle dans une zone vide, lisible, sans rien recouvrir d'imprimé.

Dis-moi laquelle des deux tu as choisie, et pourquoi.

**Règles impératives (cahier des charges GM-OS, § 6 — les clés sont un contrat)**
1. Garde le `template.id` : **`nephilim-legende-fr`**.
2. Garde **toutes les clés existantes à l'identique** — même nom, même type, même page, même
   position. Ne renomme, ne retire et ne déplace aucune clé. Aucune autre page ne change.
3. **Une clé, un champ** : `ka.dominant` n'existe qu'une fois (ou une fois par hotspot de la même
   piste). Ne recopie pas le degré du Ka dominant : il n'est pas imprimé, et GM-OS le calcule.
4. N'invente **ni règle ni calcul** : pas de `derive`, pas de plafond sur la Stase.
5. Garde la fiche **autonome** : aucune ressource externe, les images de fond intégrées comme
   aujourd'hui.

**Ton résumé de fin** : la page et les coordonnées du ou des champs ajoutés, la solution choisie, et
la confirmation qu'**aucune clé existante n'a été retirée, renommée ni déplacée**.

---

## Ensuite (Claude Code)

1. Déposer la fiche livrée dans `docs/fiches/Nephilim/`, à la place de l'actuelle.
2. `npm run fiche:valider -- Nephilim` : une clé disparue est une **erreur**, et la fiche repart vers
   le Studio avec le rapport.
3. Intégrer le gabarit au moteur et **monter `BUILTIN_VERSION`** d'un cran.
4. Ajouter à `docs/systems/nephilim/fiche/correspondance.json` le lien
   `{ "gmos": "ka_dominant", "fiche": "ka.dominant" }` — les valeurs sont les mêmes des deux côtés
   (`Feu`, `Air`, `Eau`, `Terre`, `Lune`). Le pilote n'a pas à changer : le champ `ka_dominant`
   existe déjà sur la fiche GM-OS.
5. Relancer le validateur et les essais ; David vérifie qu'un Ka dominant choisi sur une fiche se
   retrouve sur l'autre, et que la Stase reste plafonnée.
