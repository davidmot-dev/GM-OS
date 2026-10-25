# Dune — fiches interactives PJ et Maison

Livraison GM-OS Studio du 25/10/2026 à partir des deux pages du PDF fourni
`Dune_Aventures_dans_l'Imperium_Fiche PJ.pdf`.

| Fichier | Page du PDF | Modèle | Champs |
| --- | --- | --- | --- |
| `Dune_Fiche_PJ_interactive.html` | 1 | `dune-pj-fr` | 30 |
| `Dune_Fiche_Maison_interactive.html` | 2 | `dune-maison-fr` | 40 |

Les deux HTML sont rangés dans `docs/fiches/Dune/` depuis le 25/10 (intégration au moteur, registre § 176). Ouvrir chaque HTML dans un navigateur. Le fond original, les styles et le code sont
intégrés : aucun accès réseau nécessaire. Les fiches livrées sont vierges ; les noms
présents dans les captures sont des exemples de contrôle.

PJ : identité, personnalité, ambition, cinq principes et maximes, cinq compétences
et spécialisations, talents, atouts, progression et Détermination. Maison : historique,
type, traits, devise, domaines, treize rôles, quatre ennemis et leurs détails, armoiries.
Les valeurs numériques sont libres ; aucun calcul ni règle supplémentaire n'est ajouté.

Commandes communes : sauvegarde locale, import/export JSON, réinitialisation confirmée,
zoom 20–400 %, Ajuster, Ctrl+molette et raccourcis clavier, Zones et impression.
Pour les armoiries : clic pour importer une image locale, Maj+clic ou clic droit pour
la retirer après confirmation. L'image voyage dans le JSON.

Les manifestes sont acceptés par `scripts/fiche-valider.mjs` sans erreur. Les deux
avertissements par modèle sont attendus : nouveaux identifiants et correspondances
au pilote absentes. L'import et le rendu dans une bibliothèque jetable du moteur
ont été vérifiés. **Les modèles ne sont pas intégrés à la bibliothèque livrée de GM-OS
et ne sont pas raccordés aux champs du pilote.** Aucun profil personnel n'a été ouvert.
Premières versions : aucune clé antérieure renommée ou retirée.

Reproduction depuis la racine du dépôt :

```powershell
node outils/dune/fiches/construire.mjs
node outils/dune/fiches/verifier.mjs
node scripts/fiche-valider.mjs docs/fiches/Dune/Dune_Fiche_PJ_interactive.html
node scripts/fiche-valider.mjs docs/fiches/Dune/Dune_Fiche_Maison_interactive.html
```

`fabrication.json` conserve l'empreinte du PDF, les identifiants et les clés.
`verification.json` décrit les contrôles automatisés. Les captures montrent les deux
pages vierges, remplies, avec zones, imprimées, à 390 px et importées dans le moteur.
