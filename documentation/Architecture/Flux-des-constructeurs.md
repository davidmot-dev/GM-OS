# Flux des constructeurs — une boucle commune, deux chantiers indépendants

**Version 1 — 2026-09-26.** Pour David, les deux constructeurs (dans ChatGPT) et Claude Code.

GM-OS reçoit deux sortes d'objets fabriqués **hors du dépôt**, par des assistants ChatGPT : les
**thèmes de jeu** et les **fiches de personnage**. Les deux chantiers sont **indépendants** —
une fiche ne lit jamais un thème, un thème n'habille jamais une fiche (décision de David,
2026-09-26). Mais ils suivent **la même boucle de travail**, pour qu'on ne réapprenne pas deux
façons de faire.

Ce document décrit la boucle commune. Chaque chantier garde sa page, qui porte ses spécificités :

| | Thèmes de jeu | Fiches de personnage |
| --- | --- | --- |
| **Contrat** | [`Cahier-des-charges-theme-de-jeu.md`](./Cahier-des-charges-theme-de-jeu.md) | ⏳ Cahier des charges des fiches — à écrire |
| **Page du chantier** | [`Pipeline-des-themes.md`](./Pipeline-des-themes.md) | [`Pipeline-des-fiches.md`](./Pipeline-des-fiches.md) |
| **Constructeur** | *RPG Theme Builder* | *Character Sheet HTML Studio* |
| **Source du constructeur** | [`outils/rpg-theme-builder/`](../../outils/rpg-theme-builder/) | [`outils/rpg-sheet-builder/`](../../outils/rpg-sheet-builder/) |

---

## 1 · La boucle commune

```text
① David ─ demande au constructeur, dans ChatGPT, avec ses références
   ↓   il copie la réponse (ou télécharge les fichiers) et la donne à Claude Code
② Claude Code ─ dépose les fichiers TELS QUELS à leur place dans le dépôt
   ↓
③ Claude Code ─ lance le validateur du chantier → rapport chiffré
   ↓ refusé ─→ David colle le rapport dans ChatGPT ─→ ①
   ↓ accepté
④ Claude Code ─ lance la vitrine → captures
   ↓
⑤ David ─ juge sur image ─→ au besoin, retour au constructeur ─→ ①
   ↓ bon
⑥ Claude Code ─ commit et envoi ; les essais tournent avant chaque envoi
```

## 2 · Les règles communes

1. **Le contrat est la source de vérité.** Il l'emporte sur les instructions du constructeur, sur
   ses fichiers de connaissance et sur toute habitude. Ce qu'il ne mentionne pas n'a aucun effet
   dans GM-OS.
2. **Ce qui se prouve par du code ne se demande pas à un modèle.** Le validateur passe **avant**
   le jugement sur image : on ne regarde pas un objet refusé.
3. **Claude Code dépose, il ne retouche pas.** Une correction repasse par le constructeur — sinon
   deux auteurs se contredisent au tour suivant.
4. **Signaler plutôt que contourner.** Un constructeur qui ne peut pas rendre une chose le dit ;
   il ne la simule pas.
5. **David fait le lien entre les deux fenêtres.** Aucune API n'est payée : un assistant ChatGPT
   ne peut être appelé par un programme que par un serveur HTTPS **public**, et exposer la machine
   du meneur ne vaut pas deux copier-coller par tour.
6. **La source du constructeur est versionnée dans `outils/`** — ses instructions (`SKILL.md`) et
   ses fichiers de connaissance. **Un essai vérifie que ses copies suivent les originaux du
   dépôt.** Quand le dépôt change une référence, David met à jour l'assistant dans ChatGPT.
7. **Rien de ce flux ne vit dans `docs/`**, qui est le corpus de l'Oracle : les documents sont dans
   `documentation/`, les constructeurs dans `outils/`, et les notes d'atelier déposées sous
   `docs/` sont exclues de l'index par un `.ragignore`.

## 3 · Ce qui diffère — et pourquoi chaque page existe

| | Thèmes | Fiches |
| --- | --- | --- |
| **Entrée** | Captures, PDF, références graphiques | Le PDF de la fiche du jeu |
| **Visée** | Une **identité** traduite en jetons | Une **reproduction fidèle** : l'image de la page, des champs posés dessus |
| **Livrables** | `theme.css` + `intention.md` | Un HTML autonome portant son **manifeste** |
| **Emplacement** | `docs/systems/<jeu>/theme/` | `docs/fiches/<Jeu>/`, et la correspondance dans `docs/systems/<jeu>/fiche/` |
| **Ce que GM-OS en lit** | 13 réglages aujourd'hui, plus en V2 | Les **clés de données** de la fiche, par le moteur de fiches |
| **Le risque principal** | Un contraste faux sur le fond de GM-OS | **Une clé renommée** à la régénération, qui casse la correspondance en silence |
| **Validateur** | `npm run theme:valider -- <jeu>` ✅ | `fiche:valider` — à construire ; sa pièce maîtresse existe déjà |
| **Vitrine** | Les écrans de GM-OS, thème du jeu actif (`GMOS_VITRINE_JEU=<jeu>`) ✅ | La fiche ouverte dans le moteur, zones visibles, face au PDF |
