# Reprise — synthèse des améliorations de tous les pilotes, 20 octobre 2026

David a demandé un document général avec une section par pilote. Livrable :
[Améliorations possibles de tous les pilotes](2026-10-20-ameliorations-tous-les-pilotes.md).

La synthèse couvre les douze jeux représentés dans le dépôt : Alien, Blade Runner, Crimes,
Cthulhu Hack, Dune, Nephilim Légende, NOC, Rêve de Dragon, Star Trek Adventures, Symbaroum,
Torg Eternity et Within. Les corpus 2d20 et SRD YZE ne sont pas comptés comme jeux distincts.
Ce n'est pas un inventaire des pilotes installés dans les données personnelles.

Audits Alien/Crimes/Dune/Symbaroum et note NOC repris ; limites des manuels des autres jeux
distinguées des pistes à auditer. Les registres Alien/Crimes gardent leurs états détaillés.
Nephilim : le § 15 du chantier corrige la liste historique N1–N9 ; les Vécus, Ka dominant,
Stase au jet et consommation de MP sont déjà livrés. RdD : R0–R7 pour les PJ et la première
boucle TMR sont livrés ; initiative complète et suites du Haut-Rêve restent des extensions.
Dune conserve expressément son statut de projet futur garé choisi par David le 19/10.

L'export Within a été ouvert en lecture avec `adm-zip` : cinq sections, douze champs,
pas de configuration `dice`/`jet`/`combat`/`corpusId`, et mentions d'un autre univers dans
les personas. Ces textes n'ont pas été suivis comme instructions. Aucun audit du livre
Within ni nouvelle recherche NotebookLM n'a été effectué pendant cette consolidation.

Base `712f70c1`. Contrôles documentaires : présence des sections, références locales et
distinction entre acquis, propositions et essais. Aucun test applicatif, compilation,
lancement d'application ou service requis pour cette synthèse.

À l'issue de la création initiale : deux nouveaux documents, non commités ; aucun fichier
applicatif, pilote, fiche, corpus ou document antérieur modifié. Registre général déjà
modifié par un autre écrivain laissé intact.
Avant tout futur développement dans `src/` ou `electron/`, redemander si GM-OS tourne.

## Consigne de tenue à jour — 20 octobre 2026

David : « il faut tenir ce document à jour quand on met en place une amélioration et quand
on rajoute un nouveau driver ».

Règle ajoutée dans `AGENTS.md` et dans la synthèse : à chaque livraison d'amélioration,
actualiser acquis, travaux restants, vue d'ensemble et preuves ; à chaque nouveau pilote,
ajouter sa section et sa ligne, avec les points non audités clairement signalés. Les
registres détaillés et le manuel suivent les changements concernés ; réalisation et essai
de David restent distincts. La base et le nombre de jeux sont désormais présentés comme
ceux de l'inventaire initial pour ne pas figer un document vivant.

Après cette consigne : `AGENTS.md` modifié, deux documents de synthèse/reprise non suivis,
aucune écriture Git ni modification applicative. Registre général toujours laissé intact.
