# État et reprise — le 2026-09-21, **les étiquettes du Media Hub**

> **Base saine.** `tsc -b` propre, **5 703 essais Vitest** (446 fichiers, 1 ignoré), E2E de la
> traversée des modules et d'Image-OS au vert, branche `feature/tablet-hub-pwa`.
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md).
>
> Il prend la suite de [`2026-09-20-etat-et-reprise.md`](./2026-09-20-etat-et-reprise.md).

---

## Ce que la journée a produit

| § | Chantier | Éprouvé ? |
| --- | --- | --- |
| **96** | Les étiquettes du Media Hub — saisie assistée, lot, propositions, refus | ✅ **oui** (*« ça fonctionne »*) |
| **97** | La boucle d'une vidéo se choisit — le « choix à confirmer » du 05/09, tranché | ⚠️ non, **et deux portes à éprouver** |
| **98** | La porte de l'atelier d'effets — **et les E2E qui tournaient sur le build de la veille** | ✅ **oui** (*« ça fonctionne »*) |

⭐ **Les quatre demandes n'étaient pas quatre fonctionnalités.** C'étaient les deux bouts d'un même
problème : ce qui **empêche** le doublon, et ce qui **répare** celui qui est déjà là. Le champ de
saisie ne proposant rien, chaque frappe créait un `tavernes` à côté d'un `taverne` — et rien ne
permettait de les fusionner ensuite.

---

## Par quoi reprendre

1. ~~**Éprouver les étiquettes à l'écran** (§ 96)~~ — ✅ **fait le 21/09** : *« ça fonctionne »*.
2. **La boucle d'une vidéo** (§ 97) — la **pastille d'Image-OS** au survol (ou le Media Hub) →
   **Joue une fois**, puis projeter.
   ⚠️ Ce qui compte : **sur les deux écrans**. Le moniteur lit le réglage dans la base, la
   tablette le reçoit par le pont — ce sont deux chemins, et c'est là qu'un défaut se logerait.
3. **Les trois chantiers du 20/09 non vus** : l'essai d'une ambiance lumineuse (§ 92), le thème
   d'ambiance dans un moment (§ 94), le dosage des sources (§ 95) — **dont le curseur du soundboard
   de la tablette**, réparé sans avoir été demandé.
4. **La restauration** (§ 87) — dans `npm run repetition`, jamais sur le vrai profil.

---

## Ce qu'il ne faut pas repayer

### ⭐ Une fonctionnalité qu'on ne voit pas est une fonctionnalité absente

L'interrupteur de boucle existait au Media Hub, derrière un `+` qui n'annonce pas « détails » —
et David l'a cherché dans **Image-OS**, là où le geste se fait. C'est le bon endroit pour
chercher. Une seconde porte y est posée. ⚠️ **Deux portes, une seule vérité** : *deux portes vers
un même réglage sont un confort ; deux réglages derrière deux portes sont un défaut.*

Deuxième fois en deux jours qu'une porte manque — voir l'atelier d'effets, plus bas.

### ⛔⛔ Un harnais qui ne dit pas sur quoi il a tourné rend des verts qui ne prouvent rien

`lancerGmOs` démarre Electron sur **`dist/`**, pas sur les sources — son propre commentaire
l'avertit. **Toutes les exécutions E2E des 20 et 21/09 ont donc éprouvé le build de la veille.**
Elles valaient comme non-régression sur ce build, et pas du tout comme preuve du code du jour.

⚠️ **`npm run build` avant toute exécution E2E** qui prétend éprouver le code du jour. C'est le
premier essai de l'atelier qui l'a révélé, en échouant pour cette seule raison.

### ⛔⛔ Un contrôle mécanique qu'on explique au lieu de l'écouter ne sert à rien

L'essai E2E a **trouvé** la fenêtre illisible une heure avant David : Playwright refusait de
cliquer, `elementFromPoint` ne rendait rien. J'ai mis ça sur le compte du harnais et contourné par
`dispatchEvent`. C'étaient les deux symptômes exacts d'un élément `fixed` retenu par un ascendant
en `backdrop-filter`.

⭐ C'est le **symétrique** du faux positif du menu d'atmosphère : là-bas l'essai passait sur du
code fautif, ici il échouait sur un défaut réel et j'ai cru le harnais coupable.

### ⭐ Un élément ne peut pas sortir de l'ordre de peinture de son parent — troisième fois

Media Hub, menu d'atmosphère (§ 90), écran des effets. ⚠️ **`backdrop-filter` crée un bloc
conteneur pour les éléments `fixed`** : un `fixed inset-0` monté sous un bandeau flouté vise le
bandeau, pas la fenêtre. Remède constant : un portail vers `document.body`.

### ⭐ Un garde qui protège un geste doit rendre la main quand il n'a plus rien à protéger

Échap était arrêté **toujours** par le champ de recherche, qui porte `autoFocus` : l'écran des
effets s'ouvrait donc dans un état où Échap ne pouvait plus jamais le fermer.

### ⭐ Une porte manquante est un défaut, et c'est le motif de ces deux jours

Trois fois : l'atelier d'effets atteignable seulement par une lampe, la boucle d'une vidéo rangée
au Media Hub alors qu'on la cherche dans Image-OS, et la pastille posée ensuite sur le mauvais
identifiant. *La fonctionnalité existe, et le chemin depuis l'endroit où le meneur se trouve n'a
pas été pensé.*

### ⛔ Deux identifiants sur un même objet finissent toujours par être confondus

Un pad d'Image-OS porte `media.id` (le pad) **et** `media.path` (le fichier au Media Hub). Le
premier jet de l'interrupteur de boucle lisait `id` : bouton visible, fiche introuvable, clic sans
effet, erreur dans une console que personne ne lit.

⭐ *Celui qui est juste est celui que le reste du code emploie déjà* — `projectSolo` envoie
`media.path`. Le garde-fou lit la **source**, parce qu'aucun type n'exprime cette règle et qu'un
identifiant confondu ne lève aucune erreur : il rend `undefined`.

### ⭐ Un champ neuf ne doit jamais rendre faux ce qui marchait avant lui

`boucler` absent vaut **boucle** : toutes les vidéos déjà rangées continuent exactement comme
avant. Le lire autrement aurait changé le comportement de toutes les ambiances d'un coup, sans que
personne ne l'ait demandé.

### ⛔ Deux lecteurs d'une même vérité, dont un qui ne peut pas la lire

Une vidéo projetée est rendue par **deux** `<video>` : le moniteur et l'écran de la table. Le
second est parfois une **tablette**, sur une autre origine, qui ne lit pas la base du meneur — le
réglage doit donc **voyager**, comme la nature du média depuis le 05/09.

### ⭐ Un vocabulaire qu'on ne peut pas corriger se corrompt à chaque ajout

C'est la phrase qui explique les quatre demandes d'un coup. Une liste d'étiquettes n'est pas une
donnée qu'on saisit : c'est une donnée qui **se dégrade**, et il faut donc la maintenir.

### ⛔ Une proposition automatique doit préférer le vocabulaire existant

Proposer `tavernes` quand `taverne` existe, c'est fabriquer le doublon qu'on veut éviter — **par
automatisme, donc à grande échelle.** Un mot deviné s'aligne sur un mot connu avant d'être offert.

### ⛔ On propose, on ne pose jamais

Un nom de fichier est un indice, pas une déclaration. *Une étiquette fausse posée d'office est pire
qu'une absence d'étiquette : elle se retrouve dans un filtre.*

### ⛔ Un avertissement arrive avant la validation, ou il n'arrive pas

*C'est le seul moment où corriger ne coûte rien.* Après, il faut un second geste, et personne ne le
fait.

### ⛔ Un refus ne se négocie pas

Une exclusion s'applique quelle que soit la logique ET/OU choisie. *Dire « sauf les combats » et
voir quand même des combats serait un réglage qui ment.*

### ⚠️ Un geste de masse dit ce qu'il a fait, et ne réécrit que ce qui change

Renommer une étiquette ne touche que les médias qui la portent — sinon c'est deux cents écritures
IndexedDB et un miroir qui recopie tout. Et un échec au milieu n'arrête pas les autres : le compte
rendu porte sur ce qui a **réellement** été écrit.

---

## ⚠️ Ce qui reste ouvert

- ~~**L'atelier d'effets n'est atteignable que par une lampe**~~ — ✅ **fait le 21/09** (§ 98).
- ~~**À rouvrir : Playwright et `elementFromPoint` ne parlent pas des mêmes coordonnées**~~ —
  ✅ **expliqué le 21/09, et ce n'était pas le harnais** : `backdrop-filter` sur le `<header>` de
  Light-OS retenait l'écran `fixed`. Corrigé par un portail.
- **Les specs E2E des gestes des deux jours.** Aucune n'exerce l'essai d'ambiance, l'atelier, le
  thème d'un moment, le dosage, ni les étiquettes.
- **⏸ Les lampes qui suivent la voix** (§ 3 bis, ligne h) — construit le 31/08, jamais essayé au
  pont.

---

*Écrit le 2026-09-21. Guides mis à jour : **92** (les tags dans la barre, le renommage-fusion,
l'étiquetage en lot, le champ qui aide, et la boucle d'une vidéo) et **24** (boucler ou jouer une fois).*
