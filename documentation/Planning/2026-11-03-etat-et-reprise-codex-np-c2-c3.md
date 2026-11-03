# Reprise Codex — NP-C2 / NP-C3 — 03/11/2026

David demande de continuer NP-C2 et NP-C3 le 02/11 ; il confirme GM-OS fermé.

## Produit

NP-C2 réalisé : diagnostic de version/gabarit, correspondances explicites, aperçu,
export JSON avant reprise et restauration protégée des seules rubriques reprises.
Anciennes clés, notes, inventaire et santé conservés. Nouveaux PJ : référence de
création. Nexus signale les dépendances différentes laissées en place, même à version
identique. Voyageur : parcours spécifique conservé. Aucun pilote exporté modifié.

NP-C3 : politique existante éprouvée par six parcours Electron : quatre jeux sur les droits,
reprise/export/restauration et persistance, puis COC 3d6 et Shadowrun alternatif avec retour
au standard. Aucun bug GM-06 trouvé ; huit captures relues, trois reprises au manuel.

**252 tests ciblés verts sur 22 fichiers**, types, lint et construction finale valides ;
**six parcours applicatifs verts**. Autorisation explicite reçue, instances jetables seulement.
David valide le 03/11 : « ok tout est testé, commit et pousse ». [Suivi et checklist](2026-11-03-np-c2-c3-reprises-droits-variantes.md),
registre § 204, synthèse et manuels 53, 54 des quatre jeux, 63 et 90 actualisés.

## Reprendre

Pas de développement NP-C2/NP-C3 en attente. Commit et push demandés par David ; le push
lance sa validation complète, résultat communiqué après l'envoi. Choisir ensuite le lot
suivant dans la synthèse. La validation humaine globale ne constitue pas une nouvelle preuve
instrumentée sur tablette physique. [Preuves durables](../../output/verification-np-c2-c3/README.md).

## Pièges et coexistence

Vitest refuse les renommages de cache dans ce bac à sable (`EPERM`) ; relance hors de
cette contrainte, sans serveur ni données personnelles. AdmZip sous jsdom demande les
Uint8Array Node, comme dans les anciens tests de recette. Les snapshots de reprise ne
restaurent pas tout le personnage : les notes/PV ultérieurs restent en place, une saisie
ultérieure des rubriques reprises bloque le retour arrière.

Les guides 10/12 de l'autre agent sont laissés intacts. Pas d’installation ; Git d’écriture demandé par David le 03/11. Les données personnelles de GM-OS n'ont pas été lues.
