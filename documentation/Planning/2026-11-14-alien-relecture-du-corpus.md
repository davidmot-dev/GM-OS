# Alien — relecture du corpus contre les livres, 14/11/2026

> David : « On va faire le 3 et le 4 », puis « on commence le point 4 ». Point 4 : relire les
> fiches de règles d'Alien encore `relu: false` contre le livre (skill `relire-un-corpus`).
> Aucun code applicatif touché : seulement des fiches de `docs/systems/alien/`.

## Résultat

**27 fiches relues, toutes passées à `relu: true`** ; empreintes laissées intactes. Chaque
fiche porte en pied une note datée : son corps a changé, elle est donc marquée « corrigée »,
à l'abri d'une reforge.

| Ensemble | Relues | Corrigées sur le fond | Livre (PDF = imprimée + n) |
| --- | --- | --- | --- |
| Livre de base, `rules/` | 23 + le guide de synthèse | 22 | *ALIEN, le jeu de rôle*, édition française, + 3 |
| *Building Better Worlds* | 2 | 2 | édition anglaise, + 4 |
| *Cœur de Ténèbre* | 1 | 1 | édition anglaise, + 2 |

Le corpus d'Alien n'a plus de fiche `relu: false` dans `rules/` ni dans `supplements/`. Les
deux qui restent sont dans `rules-v1/`, l'ancienne version archivée, que la Forge ne lit pas.

## Ce que la relecture a trouvé

- **Erreurs répétées d'une fiche à l'autre** :
  - « quarante-six » blessures critiques au lieu de **trente-six** (D66 de 11 à 66), dans trois fiches ;
  - « les synthétiques ne sont pas Brisés » : le livre dit le contraire (p. 111). Ils sont
    Brisés, mais continuent d'agir sauf en cas d'Arrêt du système. L'erreur figurait dans trois fiches.
- **Règles fausses** :
  - le stress monte d'un point par attaque qui blesse, pas par point de dégât (p. 103) ;
    le moteur le faisait déjà bien ;
  - l'asphyxie fait tomber la Santé à zéro au premier échec (p. 107) ;
  - la Réserve de consommables n'a pas de maximum : c'est le test qui lance six dés au plus (p. 34) ;
  - l'Observation de groupe est confiée à un PJ choisi par les joueurs, pas au plus fort (p. 68) ;
  - le critique 3 des xénomorphes fait attaquer sur 4-6, pas sur 1-6 (p. 291) ;
  - le gaz T3 de *Cœur de Ténèbre* frappe les humains et les félins non protégés.
- **Retiré, faute de le trouver dans le livre entier** :
  - les « angles morts » du Conestoga ;
  - un critique synthétique « à zéro Coque » ;
  - un critique à chaque blessure d'un xénomorphe à zéro Santé ;
  - les « guerres de ruches à mort » ;
  - un feu d'Intensité 9 ;
  - des objets « lâchés » à l'état Brisé.
- **Rendu à sa vraie source** : la cécité des Perfectionnés face au cryosommeil n'est pas dans
  *Building Better Worlds*. C'est un fait du scénario *Cœur de Ténèbre* (p. 14 et 32).
- **Complété** :
  - les tables d'attaques du Popper, de la Naïade et du Trilobite, auxquelles il manquait des lignes ;
  - les trois profils de l'Abomination humaine (Revenant, Tête-de-béluga, Shambler) ;
  - les hausses et baisses du stress, l'entraide, la Retraite et les véhicules ;
  - l'errata de Guérison rapide, les PX par question du bilan.
- **Pages** :
  - cinq fiches citaient des pages qui ne renvoient pas au livre (p. 187-199 pour forcer un test,
    p. 579, 1213…). Elles sont refaites, et le drapeau `pages_fiables: false` est retiré des cinq
    fiches qui le portaient ;
  - le guide de synthèse renvoyait à 65 « sources » du carnet entre crochets, qui ne sont pas des pages :
    elles sont retirées, et la colonne des pages refaite ligne par ligne.
- **Erreur de ma part, attrapée en cours de route** : j'avais retiré « aider interrompt
  l'initiative » de la fiche de résolution en ne lisant que la p. 63. Le livre le dit p. 89 ;
  la phrase est rétablie.

## Budget de l'invite de la Forge

Les ajouts portaient le groupe « Dés et composition du jet » à 22 381 caractères pour une
borne de 21 024. Il est revenu en dessous sans perdre de correction : la liste détaillée des
hausses du stress, et deux points traités dans la fiche des jets opposés, renvoient
désormais à leur fiche.

## Vérifications

- `npx vitest run src/modules/forge src/modules/ai electron --maxWorkers=4` : **181 fichiers,
  2 832 essais réussis** (budget de l'invite, empreintes, marque de relecture, index du livre, RAG).
- Suite complète `npx vitest run --maxWorkers=4` : **894 fichiers, 10 483 essais réussis**, 4 ignorés.
- Les livres ont été lus dans des copies de travail, hors du dépôt. Le livre de base vient de `scratch/` ;
  les deux suppléments ont été copiés depuis le NAS dans le scratchpad de la session.

## Reste

Rien pour le corpus. La relecture est inscrite au registre (§ 251, ligne « Corpus et contrôles
de la Forge ») et dans la section Alien de la synthèse, une fois le travail de Codex commité
(A11, `00727f64`). Le point 3, l'étape 2 de la Forge des suppléments, est fait le même jour
(A12, § 252).
