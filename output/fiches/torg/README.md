# Fiche PJ Torg vierge — GM-OS Studio

Demande de David du 07/11/2026 : vider la fiche fournie, conserver la Table des Bonus.

- [HTML interactif autonome](../../../docs/fiches/Torg/torg-eternity-fiche-pj-vierge-interactive.html)
- [PDF vierge à imprimer](torg-eternity-fiche-pj-vierge.pdf)
- [PNG vierge](torg-eternity-fiche-pj-vierge.png)

Une page, 152 zones et 145 clés, modèle nouveau `torg-eternity-fr` ; aucune clé retirée.
[Liste des clés](cles-du-modele.json).
Les données de Vikas Ord ont été retirées de la page PDF 84 des prétirés, sans réécrire
les commandes graphiques. [Contrôle : zéro pixel modifié dans la Table des Bonus](controle-du-fond.json).

Les champs démarrent vides. Rangs, valeurs, Choc et Blessures sont saisis manuellement ;
les trois pistes verticales sont cliquables et cumulatives. Le compteur de Blessures et
la piste de niveau sont indépendants. Les deux repères de Blessures sans libellé restent
tels qu'imprimés. Aucun calcul de règles ajouté.

Zoom 20–400 %, Ajuster, Zones, sauvegarde locale, export/import JSON, remise à zéro
avec confirmation et impression. Fonctionnement hors ligne, sans ressource externe.

## Contrôles

[Validation GM-OS](validation.md) acceptée, zéro erreur. Les deux avertissements concernent
le modèle nouveau absent des gabarits intégrés et l'absence de correspondance avec le pilote.
Le HTML est importable dans le moteur ; le raccord GM-OS n'est pas installé dans cet atelier.

[Recette](verification.json) : données vides, saisie et pistes, sauvegarde/rechargement,
import/export, refus d'un mauvais modèle sans perte, reset confirmé, zoom et raccourcis,
impression, tablette tactile simulée, import dans un moteur de navigateur jetable et retour JSON.
Zéro erreur JavaScript et zéro requête réseau. Six captures relues ; aucun appareil physique testé.

Reproduction : `outils/torg/preparer-fiche-vierge.py`, `outils/torg/construire-fiche.mjs`,
`outils/torg/verifier-fiche.mjs`. Aucun paquet installé, service démarré ou profil personnel lu.
Le PDF source est lu à sa place ; seule la page vierge est livrée.
