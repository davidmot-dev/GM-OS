"""Extraction du sommaire fourni et index dérivé, sans consulter le livre complet."""
from pathlib import Path
from collections import Counter
import hashlib
import json
import re
import unicodedata

import pdfplumber

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs/Reference/Pénombre/penombre___livre_02___TOC.pdf"
OUT = ROOT / "docs/systems/penombre/index"
SCRATCH = ROOT / "tmp/penombre-index"

# Les séparations changent sur la troisième page. Vérifiées sur les quatre rendus.
COLONNES = [
    [(210, 380), (380, 612)],
    [(55, 235), (235, 400), (400, 612)],
    [(50, 220), (220, 385), (385, 612)],
    [(55, 235), (235, 400), (400, 612)],
]

# Bandeaux relus en image : les textes cachés du PDF superposent parfois un
# ancien titre « Les Éminences grises » aux vrais bandeaux. Aucun numéro de
# page n'est imprimé pour ces bandeaux ; on n'en déduit donc aucun.
BANDEAUX = [
    [
        "I — Sous les branches du Souffre-jour — Prologue",
        "II — Les règles du collège — Système de jeu",
    ],
    [
        "III — Les Éminences grises — Création et évolution de personnages",
        "IV — Quelques agents — Personnages prêts à jouer",
        "V — Les cahiers gris des peuples — Contexte et ressources",
    ],
    [
        "VI — Les cahiers gris des royaumes — Contexte et ressources",
        "VII — Les cahiers gris des magies — Contexte et ressources",
        "VIII — Les cahiers gris des organisations — Contexte et ressources",
    ],
    [
        "IX — Les cahiers gris du Souffre-jour — Contexte et ressources",
        "X — Vivre des aventures en Harmonde — Conseils et scénarios",
        "XI — Un dernier verre avec Arlequin — Appendices",
    ],
]


def sans_espaces(texte):
    return re.sub(r"\s+", "", texte)


def extraire_colonne(texte):
    entrees = []
    for ligne in texte.splitlines():
        ligne = ligne.strip()
        if not ligne:
            continue
        m = re.fullmatch(r"(\d{1,3})\s+(.+)", ligne)
        if m:
            entrees.append({"page": int(m[1]), "titre": m[2]})
        else:
            assert entrees, f"Fragment sans entrée : {ligne}"
            entrees[-1]["titre"] += " " + ligne
    # Même contenu que la colonne extraite, hors espaces et retours de ligne.
    assert sans_espaces(texte) == sans_espaces(
        "".join(str(e["page"]) + e["titre"] for e in entrees)
    )
    return entrees


def cle_alphabetique(entree):
    return "".join(
        c for c in unicodedata.normalize("NFD", entree["titre"].casefold())
        if unicodedata.category(c) != "Mn"
    )


def ecrire_sans_ecraser_autrui(chemin, contenu):
    if chemin.exists():
        assert chemin.read_text(encoding="utf-8") == contenu, str(chemin)
    else:
        chemin.write_text(contenu, encoding="utf-8")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    SCRATCH.mkdir(parents=True, exist_ok=True)
    sommaire = ["# Table des matières — Pénombre", ""]
    toutes = []
    relevé = []
    with pdfplumber.open(SOURCE) as doc:
        assert len(doc.pages) == 4
        for i, page in enumerate(doc.pages):
            entrees_page = []
            for j, (x0, x1) in enumerate(COLONNES[i]):
                texte = page.crop((x0, 425, x1, 775)).extract_text(
                    x_tolerance=1.2, y_tolerance=3
                )
                (SCRATCH / f"page-{i+1}-col-{j+1}.txt").write_text(
                    texte, encoding="utf-8"
                )
                entrees = extraire_colonne(texte)
                sommaire.append("- " + BANDEAUX[i][j])
                for entree in entrees:
                    sommaire.append(f"- {entree['titre']} — {entree['page']}")
                toutes.extend(entrees)
                entrees_page.extend(entrees)
            relevé.append({
                "pageSource": i + 1,
                "colonnes": len(COLONNES[i]),
                "entreesPaginees": len(entrees_page),
                "premiere": entrees_page[0],
                "derniere": entrees_page[-1],
            })
    assert [p["entreesPaginees"] for p in relevé] == [12, 22, 18, 19]
    assert len(toutes) == 71
    assert toutes[0] == {"page": 8, "titre": "À propos de Pénombre"}
    assert toutes[-1] == {"page": 373, "titre": "Ressources"}
    assert len(set((e["titre"], e["page"]) for e in toutes)) == 71
    assert [e["page"] for e in toutes] == sorted(e["page"] for e in toutes)

    index = [
        "# Index alphabétique du sommaire — Pénombre", "",
        "Index de repérage construit à partir des 71 entrées paginées du sommaire fourni. "
        "Les intitulés et numéros imprimés sont conservés. "
        "Ce document ne reproduit pas un index éditorial et ne constitue pas un index exhaustif du livre.",
        "",
    ]
    for e in sorted(toutes, key=cle_alphabetique):
        index.append(f"- {e['titre']} — {e['page']}")

    fichiers = {
        "Penombre_table_des_matieres_flat.md": "\n".join(sommaire) + "\n",
        "Penombre_index_flat.md": "\n".join(index) + "\n",
    }
    for nom, contenu in fichiers.items():
        assert not re.search(r"^[ \t]+- ", contenu, re.M)
        assert not re.search(r"David Mot|@|20260805", contenu)
        ecrire_sans_ecraser_autrui(OUT / nom, contenu)

    # Vérification des fichiers relus depuis le disque : mêmes couples titre/page.
    def lignes_paginees(chemin):
        return Counter(
            ligne for ligne in chemin.read_text(encoding="utf-8").splitlines()
            if re.search(r"^-.+ — \d+$", ligne)
        )
    assert lignes_paginees(OUT / "Penombre_index_flat.md") == lignes_paginees(
        OUT / "Penombre_table_des_matieres_flat.md"
    )
    rapport = {
        "date": "2026-11-21",
        "source": str(SOURCE.relative_to(ROOT)),
        "sha256Source": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "pagesReluesEnImage": [1, 2, 3, 4],
        "entreesSommaire": 82,
        "entreesPaginees": 71,
        "bandeauxSansPage": 11,
        "entreesIndexDerive": 71,
        "indexEditorialPresentDansLesSources": False,
        "verificationCaracteresColonnes": "Identité hors espaces de mise en page",
        "relevePages": relevé,
        "fichiers": {
            n: hashlib.sha256((OUT / n).read_bytes()).hexdigest() for n in fichiers
        },
    }
    (SCRATCH / "verification.json").write_text(
        json.dumps(rapport, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(rapport, ensure_ascii=False))


if __name__ == "__main__":
    main()
