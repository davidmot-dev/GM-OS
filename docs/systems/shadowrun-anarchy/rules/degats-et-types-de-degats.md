---
sujet: Dégâts et types de dégâts
systeme: shadowrun-anarchy
couverture: complète
hors_canevas: false
sources: "anarchy_v2_vf_web_v0.pdf"
sections: "« Plongée dans l’action » ; « Combat » ; « Combat à distance » ; « Combat rapproché » ; « Blessures » ; « Subir des dommages » ; « Dommages des appareils électroniques et des véhicules »"
genere_par: notebooklm
gabarit: v3
relu: false
empreinte: 00a485be
---

# Dégâts et types de dégâts

## Règle
La Valeur de Dommages (VD) finale infligée à une cible est égale à la VD de base de l'arme, du sort ou du programme, à laquelle s'ajoutent les succès nets du test d'attaque (section « Combat à distance », section « Combat rapproché »). Chaque attaque inflige au plus une seule blessure ou un seul dommage, déterminé par la gravité de la VD finale comparée aux seuils de résistance (section « Subir des dommages »).

Les dommages subis se divisent en trois types (section « Subir des dommages »):
- Les dommages physiques, causés par les armes et attaques physiques, sont résistés par la Force et l'Armure (section « Subir des dommages »).
- Les dommages mentaux, causés par les sorts de combat directs, le combat astral et le biofeedback, sont résistés par la Volonté et la Protection (section « Subir des dommages »).
- Les dommages matriciels, causés par le cybercombat, sont résistés par le Firewall (section « Subir des dommages »).

Pour les personnages et créatures, la VD finale est comparée à l'attribut de résistance additionné à la protection applicable (section « Subir des dommages »). Pour les objets technologiques (véhicules, drones, cyberdecks, glaces), la résistance applique des coefficients à la Structure ou au Firewall (section « Subir des dommages »).

## Valeurs
- Calcul de la VD finale: VD de base + succès nets (section « Combat à distance »).
- Échelle des seuils pour personnages et créatures (section « Subir des dommages »):
  - VD <= Force/Volonté + Armure/Protection: aucun dommage.
  - VD > Force/Volonté + Armure/Protection: blessure légère.
  - VD > Force/Volonté + Armure/Protection + 3: blessure grave.
  - VD > Force/Volonté + Armure/Protection + 6: blessure incapacitante.
- Échelle des seuils pour objets technologiques (section « Subir des dommages »):
  - VD <= Structure/Firewall + Blindage: aucun dommage.
  - VD > Structure/Firewall + Blindage: dommage léger.
  - VD > (2 x Structure/Firewall) + Blindage: dommage grave.
  - VD > (3 x Structure/Firewall) + Blindage: dommage incapacitant.

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

Pour les objets technologiques, véhicules, drones et cyberdecks, le calcul des dommages applique une échelle multipliant la Structure ou le Firewall (section « Subir des dommages »):
- Dommage léger: VD supérieure à Structure ou Firewall + Blindage.
- Dommage grave: VD supérieure à deux fois la Structure ou le Firewall + Blindage.
- Dommage incapacitant: VD supérieure à trois fois la Structure ou le Firewall + Blindage.

Le meneur de jeu peut appliquer optionnellement la formule des objets technologiques aux êtres vivants pour renforcer l'impact de la Force et accroître la létalité (section « Subir des dommages »).

En réalité virtuelle (RV), le biofeedback inflige des dommages mentaux en cold-sim et des dommages physiques en hot-sim, résistés par la Volonté du decker (section « Modes de connexion »).

Les sorts de combat directs infligent des dommages mentaux comparés à la Volonté sans test de défense physique, tandis que les sorts indirects génèrent un effet physique infligeant des dommages physiques résistés par Force et Armure (section « Sorts de combat »).

## Non couvert
rien
