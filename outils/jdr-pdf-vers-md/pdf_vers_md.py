#!/usr/bin/env python3
"""PDF de JdR -> Markdown paginé, pensé pour l'index de l'Oracle de GM-OS.

Sortie (dans <sortie>/<systeme>/) :
  chapitres/NNN_titre.md     un fichier par chapitre (titres # / ##), repère « [p. N] »
                             au début de chaque page, ~4500 caractères au plus
  full_book_by_pdf_page.md   dump brut, une section « ## PDF Page N » par page
  manifest.json              fichiers + statistiques (pages, tableaux, pages vides)
  .ragignore                 écarte le dump brut de l'index (voir plus bas)

Pourquoi ces choix (lus dans electron/RAGEngine.ts et electron/ragSelection.ts) :
  - GM-OS lit un .md en tronquant à 50 000 caractères, puis plafonne un fichier brut
    à MAX_RAW_FILE_TOKENS (1200 tokens, ~4800 caractères). Un chapitre plus long est
    coupé : d'où la taille cible de 4500 caractères, avec coupe aux frontières de page.
  - Le frontmatter `sujet:` fait d'un fichier une « fiche » (rang supérieur, passe-droit
    de budget). Ces chapitres sont de la matière brute : ils n'écrivent NI `sujet:` NI
    `relu:`. Les fiches se fabriquent ensuite, comme aujourd'hui.
  - Le dump complet est tronqué à 50 000 caractères par l'index : il ne sert qu'aux
    Forges et au lecteur, d'où le .ragignore.

Les numéros de page sont ceux du PDF (1 = première page), comme les dumps existants.
`--offset` les décale vers les numéros imprimés dans le livre.
"""
import argparse
import json
import re
import sys
from pathlib import Path

# Marker écrit « \n\n{N}------------------------------------------------\n\n »
# (N compté depuis 0). Tolérant sur les sauts de ligne ; la variante sans
# accolades est gardée au cas où une version de Marker changerait de format.
PAGE_RE = re.compile(r"\n*\{(\d+)\}-{20,}\n*")
PAGE_RE_ALT = re.compile(r"\n+(\d+)\n-{20,}\n+")
HEADING_RE = re.compile(r"^(#{1,2})\s+(.+?)\s*#*\s*$")
MIN_CHARS_PAGE = 80
MAX_CHARS_DEFAUT = 4500


def split_pages(text: str, offset: int = 0) -> list[tuple[int, str]]:
    """Découpe le texte de Marker en [(numéro_de_page, contenu)]. Échoue fort si
    aucun séparateur n'est trouvé : sans lui, aucune citation de page n'est possible."""
    for rx in (PAGE_RE, PAGE_RE_ALT):
        parts = rx.split(text)
        if len(parts) >= 3:
            pages = []
            for i in range(1, len(parts) - 1, 2):
                pages.append((int(parts[i]) + 1 + offset, parts[i + 1].strip()))
            return pages
    raise SystemExit(
        "[!] Aucun séparateur de page trouvé dans la sortie de Marker. "
        "Relancez avec --debug et regardez _marker_brut.md : le format a peut-être changé."
    )


def slug(titre: str, n: int = 50) -> str:
    s = re.sub(r"[*_`]", "", titre)
    s = re.sub(r"[^\w\-]+", "-", s, flags=re.UNICODE).strip("-").lower()
    return s[:n].strip("-") or "section"


def build_chapters(pages: list[tuple[int, str]], max_chars: int = MAX_CHARS_DEFAUT):
    """Regroupe les pages en chapitres : [(titre, [(page, texte), ...])].
    Un titre # ou ## ouvre un chapitre. Le texte reste attaché à la page où il figure,
    donc la page de début d'un chapitre est toujours exacte."""
    chapitres: list[tuple[str, list[tuple[int, str]]]] = []
    titre = "Introduction"
    courant: list[tuple[int, str]] = []

    def clore():
        if any(t.strip() for _, t in courant):
            chapitres.append((titre, list(courant)))

    for page, contenu in pages:
        morceau: list[str] = []
        for ligne in contenu.split("\n"):
            m = HEADING_RE.match(ligne)
            if m:
                if morceau:
                    courant.append((page, "\n".join(morceau).strip()))
                    morceau = []
                clore()
                titre, courant = m.group(2), []
                continue  # le titre va dans le H1 du fichier, pas dans le corps
            morceau.append(ligne)
        if morceau:
            courant.append((page, "\n".join(morceau).strip()))
    clore()

    # Un chapitre trop gros est coupé aux frontières de page (jamais au milieu d'une page).
    final = []
    for titre, blocs in chapitres:
        groupe, taille, k = [], 0, 1
        for bloc in blocs:
            if groupe and taille + len(bloc[1]) > max_chars:
                final.append((titre if k == 1 else f"{titre} (suite {k})", groupe))
                groupe, taille, k = [], 0, k + 1
            groupe.append(bloc)
            taille += len(bloc[1])
        if groupe:
            final.append((titre if k == 1 else f"{titre} (suite {k})", groupe))
    return final


def plage(blocs) -> str:
    a, b = blocs[0][0], blocs[-1][0]
    return f"{a}" if a == b else f"{a}-{b}"


def ecrire(pdf: Path, pages, systeme: str, out: Path, max_chars: int) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    chap_dir = out / "chapitres"
    chap_dir.mkdir(exist_ok=True)

    with open(out / "full_book_by_pdf_page.md", "w", encoding="utf-8") as f:
        f.write(f"# {pdf.stem} — Extraction complète par page\n\n> Source: {pdf.name}\n\n")
        for p, t in pages:
            f.write(f"## PDF Page {p}\n{t}\n\n")

    fichiers = []
    for i, (titre, blocs) in enumerate(build_chapters(pages, max_chars)):
        nom = f"{i:03d}_{slug(titre)}.md"
        corps = "\n\n".join(f"[p. {p}]\n{t}" for p, t in blocs)
        with open(chap_dir / nom, "w", encoding="utf-8") as f:
            f.write(
                "---\n"
                f"systeme: {systeme}\n"
                f"sources: {pdf.name} (p. {plage(blocs)})\n"
                "genere_par: marker\n"
                "---\n\n"
                f"# {titre}\n\n{corps}\n"
            )
        fichiers.append(f"chapitres/{nom}")

    (out / ".ragignore").write_text(
        "# Tronqué à 50 000 caractères par l'index : inutile pour l'Oracle, utile aux Forges.\n"
        "full_book_by_pdf_page.md\n",
        encoding="utf-8",
    )
    vides = [p for p, t in pages if len(t) < MIN_CHARS_PAGE]
    manifest = {
        "source_pdf": pdf.name,
        "systeme": systeme,
        "pages": len(pages),
        "premiere_page": pages[0][0],
        "derniere_page": pages[-1][0],
        "pages_quasi_vides": vides,
        "tableaux": sum(len(re.findall(r"^\|[-: |]+\|\s*$", t, re.M)) for _, t in pages),
        "files": ["full_book_by_pdf_page.md"] + fichiers,
    }
    (out / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return manifest


def convertir(pdf: Path, force_ocr: bool, page_range: str | None) -> str:
    # Import tardif : le reste du script (et --selftest) marche sans Marker.
    from marker.config.parser import ConfigParser
    from marker.converters.pdf import PdfConverter
    from marker.models import create_model_dict
    from marker.output import text_from_rendered

    cfg = {
        "output_format": "markdown",
        "paginate_output": True,
        "disable_image_extraction": True,
    }
    if force_ocr:
        cfg["force_ocr"] = True
    if page_range:
        cfg["page_range"] = page_range
    cp = ConfigParser(cfg)
    conv = PdfConverter(
        config=cp.generate_config_dict(),
        artifact_dict=create_model_dict(),
        processor_list=cp.get_processors(),
        renderer=cp.get_renderer(),
        llm_service=cp.get_llm_service(),
    )
    texte, _, _ = text_from_rendered(conv(str(pdf)))
    return texte


def selftest() -> None:
    brut = (
        "{0}" + "-" * 48 + "\n\n# Règles\nIntro\n\n{1}" + "-" * 48 +
        "\n\nSuite des règles\n\n## Combat\nBagarre\n\n{2}" + "-" * 48 + "\n\nFin du combat\n"
    )
    pages = split_pages(brut)
    assert [p for p, _ in pages] == [1, 2, 3], pages
    ch = build_chapters(pages)
    assert [t for t, _ in ch] == ["Règles", "Combat"], ch
    assert plage(ch[0][1]) == "1-2" and plage(ch[1][1]) == "2-3", (plage(ch[0][1]), plage(ch[1][1]))
    assert "# Règles" not in ch[0][1][0][1], "le titre ne doit pas être dupliqué dans le corps"
    assert [p for p, _ in split_pages(brut, offset=4)] == [5, 6, 7]
    gros = [(1, "x" * 3000), (2, "y" * 3000), (3, "z" * 3000)]
    assert len(build_chapters(gros, 4500)) == 3
    try:
        split_pages("pas de séparateur")
    except SystemExit:
        pass
    else:
        raise AssertionError("doit échouer sans séparateur")
    print("selftest OK")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf", nargs="?", type=Path)
    ap.add_argument("--systeme", help="identifiant du jeu, ex. alien (défaut : nom du PDF)")
    ap.add_argument("--sortie", type=Path, default=Path("sortie"))
    ap.add_argument("--offset", type=int, default=0, help="numéro imprimé = page PDF + offset")
    ap.add_argument("--max-chars", type=int, default=MAX_CHARS_DEFAUT, help="taille max d'un chapitre")
    ap.add_argument("--force-ocr", action="store_true", help="PDF scanné ou texte illisible")
    ap.add_argument("--pages", help="test rapide, ex. 0-9 (index PDF depuis 0)")
    ap.add_argument("--debug", action="store_true", help="écrit aussi le texte brut de Marker")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()

    if a.selftest:
        return selftest()
    if not a.pdf or not a.pdf.is_file():
        ap.error("PDF introuvable")

    systeme = a.systeme or slug(a.pdf.stem)
    out = a.sortie / systeme
    print(f"[*] Conversion de {a.pdf.name} (le 1er lancement télécharge les modèles)…")
    texte = convertir(a.pdf, a.force_ocr, a.pages)
    if a.debug:
        out.mkdir(parents=True, exist_ok=True)
        (out / "_marker_brut.md").write_text(texte, encoding="utf-8")
    pages = split_pages(texte, a.offset)
    m = ecrire(a.pdf, pages, systeme, out, a.max_chars)
    print(f"[✓] {m['pages']} pages, {len(m['files']) - 1} chapitres, {m['tableaux']} tableaux -> {out}")
    if m["pages_quasi_vides"]:
        print(f"[!] Pages quasi vides (essayer --force-ocr ?) : {m['pages_quasi_vides'][:30]}")


if __name__ == "__main__":
    sys.exit(main())
