---
sujet: Dégâts et types de dégâts
systeme: shadowrun-anarchy
couverture: complète
hors_canevas: false
sources: "anarchy_v2_vf_web_v0.pdf"
sections: "« Plongée dans l’action » ; « Combat » ; « Combat à distance » ; « Combat rapproché » ; « Blessures » ; « Subir des dommages » ; « Dommages des appareils électroniques et des véhicules »"
genere_par: notebooklm
gabarit: v3
relu: true
empreinte: 00a485be
---

# Dégâts et types de dégâts

## Règle
La Valeur de Dommages (VD) finale infligée à une cible est égale à la VD de base de l'arme, du sort ou du programme, à laquelle s'ajoutent les succès nets du test d'attaque (section « Combat à distance », section « Combat rapproché »). Chaque attaque inflige au plus une seule blessure ou un seul dommage, déterminé par la gravité de la VD finale comparée aux seuils de résistance (section « Subir des dommages »).

Les dommages subis se divisent en trois types (section « Subir des dommages »):
- Les dommages physiques, causés par les armes et attaques physiques, sont résistés par la Force et l'Armure (section « Subir des dommages »).
- Les dommages mentaux, causés par les sorts de combat directs, le combat astral et le biofeedback, sont résistés par la Volonté et la Protection (section « Subir des dommages »).
- Les dommages matriciels, causés par le cybercombat, sont résistés par le Firewall (section « Subir des dommages »).

Pour les personnages et créatures, la VD finale est comparée à l'attribut de résistance additionné à la protection applicable (section « Subir des dommages »). Les appareils matriciels (cyberdecks, glaces) résistent comme les personnages, avec leur Firewall (FW, FW + 3, FW + 6); seuls les véhicules et drones appliquent des coefficients à la Structure (section « Subir des dommages »).

## Valeurs
- Calcul de la VD finale: VD de base + succès nets (section « Combat à distance »).
- Échelle des seuils pour personnages et créatures (section « Subir des dommages »):
  - VD <= Force/Volonté + Armure/Protection: aucun dommage.
  - VD > Force/Volonté + Armure/Protection: blessure légère.
  - VD > Force/Volonté + Armure/Protection + 3: blessure grave.
  - VD > Force/Volonté + Armure/Protection + 6: blessure incapacitante.
- Appareils matriciels: VD > FW légère, > FW + 3 grave, > FW + 6 incapacitante (section « Subir des dommages »).
- Échelle des seuils pour véhicules et drones (section « Subir des dommages »):
  - VD <= Structure + Blindage: aucun dommage.
  - VD > Structure + Blindage: dommage léger.
  - VD > (2 x Structure) + Blindage: dommage grave.
  - VD > (3 x Structure) + Blindage: dommage incapacitant.

## À la table
Lors d'un combat, la résolution des dommages s'effectue en plusieurs étapes successives après la réussite d'un test d'attaque (section « Combat »).

L'attaquant détermine d'abord la Valeur de Dommages (VD) finale en additionnant la VD de base de l'arme, du sort ou de l'attaque avec les succès nets obtenus lors du test d'attaque (section « Combat à distance », section « Combat rapproché »).

La cible compare cette VD finale à son seuil de résistance précalculé selon le type de dommages subis (section « Subir des dommages »):
- Dommages physiques: comparés à la Force additionnée à l'Armure (section « Subir des dommages »).
- Dommages mentaux: comparés à la Volonté additionnée à la Protection (section « Subir des dommages »).
- Dommages matriciels: comparés au Firewall (section « Subir des dommages »).

Chaque attaque ne peut infliger au plus qu'une seule blessure ou un seul dommage (section « Subir des dommages »). Le joueur ou le meneur coche ensuite la case correspondante sur le moniteur d'état (blessure légère, grave ou incapacitante) (section « Moniteur d’état »).

## Cas limites
Si toutes les cases d'un niveau de blessure sont déjà cochées sur le moniteur d'état d'un personnage, toute nouvelle blessure reçue de ce même niveau est automatiquement aggravée et monte au degré supérieur (section « Subir des dommages »).

Pour les véhicules et drones, le calcul des dommages multiplie la Structure (section « Subir des dommages »):
- Dommage léger: VD supérieure à Structure + Blindage.
- Dommage grave: VD supérieure à deux fois la Structure + Blindage.
- Dommage incapacitant: VD supérieure à trois fois la Structure + Blindage.

Le meneur de jeu peut appliquer optionnellement la formule des véhicules aux personnages, créatures et appareils matriciels, ce qui accroît l'importance de la Force et du Firewall (section « Subir des dommages »).

En réalité virtuelle (RV) avec IND cybernétique, le biofeedback inflige des dommages mentaux, résistés par la Volonté: étourdissants en cold-sim, létaux en hot-sim (section « Modes de connexion »).

Les sorts de combat directs infligent des dommages mentaux comparés à la Volonté sans test de défense physique, tandis que les sorts indirects génèrent un effet physique infligeant des dommages physiques résistés par Force et Armure (section « Sorts de combat »).

## Non couvert
rien

*Relu le 2026-11-01 contre le livre (PDF = imprimée + 2) ; corrigé : les appareils matriciels résistent avec FW, FW + 3, FW + 6 et seuls les véhicules multiplient la Structure ; le biofeedback reste mental, étourdissant ou létal (p. 66-69, 180, 212).*
