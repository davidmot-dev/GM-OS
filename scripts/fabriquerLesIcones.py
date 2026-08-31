"""
Fabrique les six icônes animées du signal du Voight-Kampff.

    python scripts/fabriquerLesIcones.py

**Pourquoi un script et pas seulement six fichiers.** Les GIF sont versés dans
`public/ulanzi/`, et un binaire dans un dépôt est illisible : on ne peut ni voir
ce qui a changé, ni retoucher une courbe sans tout refaire. *La vérité est ici ;
les GIF n'en sont que la sortie.*

**Pourquoi des GIF plutôt qu'un tracé poussé image par image — mesuré le
2026-08-31 sur l'appareil de David.** Une écriture HTTP coûte **253 ms**, et le
même temps pour 59 octets que pour 398 : c'est un coût fixe par requête. Pousser
des images plafonne donc à quatre par seconde, ce qui ne fait pas une animation.

L'appareil, lui, expose un système de fichiers (`/list`, `/edit`) et un dossier
`ICONS`. **Une icône animée déposée là est jouée par l'appareil lui-même**, à
pleine vitesse et sans un octet de trafic. Changer de rythme ne coûte plus qu'une
seule écriture : celle qui change le nom de l'icône.

Vérifié en réel le 2026-08-31 : un GIF **32 × 8** s'affiche sur toute la largeur
et s'anime. David : *« je vois un tracé animé sur toute la largeur »*.
"""

import os
from PIL import Image

LARGEUR, HAUTEUR = 32, 8
"""La matrice de l'Ulanzi. Une icône plus large serait rognée."""

LIGNE = HAUTEUR - 3
"""
La ligne de repos, basse et non centrée : un électro défléchit beaucoup plus
vers le haut que vers le bas, et à huit rangées chaque rangée compte double.
"""

COMPLEXE = [0, 1, -1, -5, -1, 1, 0, -2, -3, -2, 0]
"""
Le profil d'un battement, en décalages verticaux par colonne : le creux Q, le
pic R, le creux S, puis l'onde T arrondie. L'onde P est absente — à six rangées
utiles elle ne se distingue pas du bruit.
"""

COULEURS = ["#00C853", "#64DD17", "#AEEA00", "#FFC400", "#FF6D00", "#FF1744"]
"""Du vert calme au rouge affolé. Les mêmes que `COULEURS_DU_SIGNAL`."""

REGLAGES = [(1, 90), (1, 60), (2, 60), (3, 50), (4, 40), (5, 30)]
"""
Par niveau : (battements visibles, millisecondes par image).

**Le rythme monte de deux façons à la fois** — plus de battements *et* plus vite.
Une seule des deux ne suffisait pas : plus de battements sans accélérer donne un
tracé dense mais placide, accélérer sans en ajouter donne un balayage pressé qui
ne dit rien du cœur.
"""


def couleur_rvb(hexa):
    return tuple(int(hexa[i:i + 2], 16) for i in (1, 3, 5))


def image(couleur, battements, avance):
    """Une image du balayage : le tracé dessiné jusqu'à la colonne `avance`."""
    im = Image.new("RGB", (LARGEUR, HAUTEUR), (0, 0, 0))
    px = im.load()
    ecart = LARGEUR // battements
    departs = [b * ecart + (ecart - len(COMPLEXE)) // 2 for b in range(battements)]

    def hauteur_de(x):
        for d in departs:
            if d <= x < d + len(COMPLEXE):
                return max(0, min(HAUTEUR - 1, LIGNE + COMPLEXE[x - d]))
        return LIGNE

    for x in range(min(avance + 1, LARGEUR)):
        # On relie chaque colonne à la précédente : sans ça, un pic franc
        # laisserait des pixels isolés au lieu d'un trait continu.
        y, precedent = hauteur_de(x), hauteur_de(max(0, x - 1))
        for yy in range(min(y, precedent), max(y, precedent) + 1):
            px[x, yy] = couleur_rvb(couleur)
    return im


def main():
    sortie = os.path.join(os.path.dirname(__file__), "..", "public", "ulanzi")
    os.makedirs(sortie, exist_ok=True)

    for niveau, (battements, duree) in enumerate(REGLAGES, start=1):
        images = [image(COULEURS[niveau - 1], battements, a) for a in range(LARGEUR)]
        chemin = os.path.join(sortie, "gmosvk%d.gif" % niveau)
        images[0].save(chemin, save_all=True, append_images=images[1:],
                       duration=duree, loop=0)
        print("gmosvk%d.gif : %d battement(s), %d ms/image, balayage en %.1f s, %d octets"
              % (niveau, battements, duree, LARGEUR * duree / 1000.0,
                 os.path.getsize(chemin)))


if __name__ == "__main__":
    main()
