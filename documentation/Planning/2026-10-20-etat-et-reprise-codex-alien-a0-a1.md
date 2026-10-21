# Reprise — Alien A0/A1, 20 octobre 2026

David a choisi A0/A1 et confirmé « Non, GM-OS est fermé. », puis déposé son export.
Réalisation et contrôles terminés sur la base `712f70c1`, sans commit/push.
Voir le [bilan complet et les limites](2026-10-20-alien-a0-a1.md), le
[registre Alien](2026-10-19-registre-ameliorations-alien.md) et la
[synthèse tenue à jour](2026-10-20-ameliorations-tous-les-pilotes.md).

## Premier geste

David importe `Export Dirvers/corriges/Alien_driver_gmos_a0_a1.gmos-driver` et essaie en
séance. Le script `outils/alien/ameliorer-pilote-a0-a1.mjs` conserve l'original, ses
identifiants et quarante champs. Ne pas repartir d'un export fictif des accessoires.
A2–A8 ne sont pas engagés ; les prochains lots proposés sont A2/A3.

Avant toute nouvelle modification de `src/` ou `electron/`, redemander si GM-OS tourne
s'il a été relancé pour cet essai. Aucune donnée installée de David n'a été consultée
ou modifiée. Les changements déjà présents des autres chantiers sont restés intacts,
notamment le registre général et les anciens exports supprimés.

## Ce qui est vérifié

867 tests de régression (50 fichiers), types, build et lint ciblé réussis. Contrôle du
ZIP rouvert, Forge sans constat, 39 correspondances sans clé manquante ; Santé principale
désormais reconnue. Fiche HTML inchangée, acceptée avec cinq avertissements préexistants.

Recette `e2e/capturesDesJeux.spec.ts` filtrée Alien réussie : vrai Electron et vrai Hub Edge
à 360/768/1 180 px, profil fictif isolé. Résultat provisoire puis annulé à 10, Point de Récit
bloqué, contagion ciblée, rechargement sans Stress répété, demande hors jet consommée et
écriture depuis le Hub au MJ. Captures relues dans le manuel 54.

Les durées, pertes d'actions, portées et victimes restent validées par Maman. Le bilan
Empathie/traumatisme et le rappel à la clôture sont testés. Le pupitre manuel reste avec
son annonce de Stress à reporter ; pas de budget automatique d'actions ni de combat spatial.

## Pièges à ne pas repayer

- `AdmZip.updateFile` sur cet export en flux conservait un drapeau qui rendait le ZIP
  illisible. Le script reconstruit les entrées et vérifie la réouverture.
- L'isolation E2E redirige USERPROFILE pour le journal du pont MCP. Il faut créer et
  rediriger aussi ses AppData/Roaming et AppData/Local, sinon Electron ne crée aucune fenêtre.
  Le helper le fait maintenant dans le seul processus enfant ; ne pas changer le profil réel.
- Une Panique sur la relance aléatoire du scénario historique doit être résolue avant
  la nouvelle scène déterministe ; Lancer reste volontairement bloqué pendant l'attente.
- Le livre français p. 104 dit « inférieur » pour le cumul ; l'égalité n'escalade pas
  dans le nouveau profil A1. Le comportement des anciens profils est préservé.

Pour les captures, utiliser `GMOS_PILOTES_DES_JEUX` avec un dossier contenant le seul
corrigé, et `GMOS_SORTIE_CAPTURES_JEUX` vers scratch, puis copier les seules images relues.
Ne pas lancer tous les E2E : certains lisent les sauvegardes personnelles ou réécrivent
les captures des autres chantiers. Aucun besoin d'installer un paquet ou de lancer Vite.
