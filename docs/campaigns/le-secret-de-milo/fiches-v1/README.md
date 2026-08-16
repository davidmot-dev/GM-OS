# Fiches supplantées — Le secret de Milo

Ce dossier garde les versions **précédentes** des fiches, pour qu'une reforge reste comparable à ce
qu'elle remplace — et rattrapable si elle est moins bonne.

Il est **exclu de l'index de l'Oracle** (`docs/.ragignore`, entrée `fiches-v1/`). Sans cette exclusion,
l'Oracle recevrait les deux versions d'une même fiche, dont celle que la reforge venait de remplacer.

## L'instantané du 2026-08-16

Les quatorze fichiers déposés ici ce jour-là sont une **copie de l'état initial**, prise avant toute
reforge — pas le produit d'un archivage automatique. Elles sont donc, à cette date, identiques à celles
de `fiches/`.

Ce qu'elles attestent, si la comparaison est un jour nécessaire :

- treize fiches en `couverture: complète` (la quatorzième est l'inventaire, qui n'en déclare pas) ;
- toutes en `gabarit: v3`, toutes porteuses de `jeu: custom-1774643419710` ;
- **aucun renvoi interne du carnet** (`[1-4]`, `[3, 5, 6]`) : le correctif du 2026-08-15 était déjà
  en place quand elles ont été produites ;
- trois actes, nommés par le livre : *Scénario 1 : Manigances d'Arlequin*, *Scénario 2 : Mystères en
  Italie*, *Scénario 3 : Voyage en Mésopotamie*.

**Ce qui manque à ce corpus**, et qui a motivé l'instantané : la fiche `structure-en-actes.md`.
L'Atelier lisait la structure et la gardait en mémoire — les *titres* d'actes ont survécu, portés par le
`partie:` de chaque fiche, mais l'*enjeu* de chaque acte s'est perdu. C'est ce que `Acte.resume` attend.
Relancer la seule étape « Structure » de l'Atelier suffit à le combler : elle écrit un fichier neuf et
n'écrase rien.

## Ensuite

À partir du 2026-08-16, `publierLaFiche` archive ici automatiquement la version précédente avant de la
remplacer. Le slug d'une fiche de campagne étant déterministe, une reforge **écrase** le fichier : sans
cet archivage, la version précédente ne devenait pas un doublon, elle disparaissait.

Une seule génération est conservée : un second archivage du même sujet remplace le premier.
