# Les Vécus de Nephilim — extraction depuis le livre

Ouvert le 2026-10-17 (chantier : `documentation/Planning/2026-10-17-chantier-nephilim.md`).
Source : *Nephilim5 — Livre 0 — Quintessence*, chapitre « Les époques d'incarnation », p. 62 à
98 : **7 ères, 31 époques, 5 Vécus par époque** (un par Ka-élément), soit 155 Vécus, corrigés par
l'errata officiel V1.3.

## Contenu

- `extraire_du_livre.py <quintessence.pdf>` — lit le PDF du livre (pypdf, et `pdftotext -layout`
  pour les noms) et écrit `livre/epoques.json` : titre, ère, page, date, lieux, coût en PI,
  introduction, apports, et les cinq Vécus. Applique l'errata V1.3 (p. 94, 97–98) et signale
  l'erreur du livre sur le Druide (p. 70). Le PDF et l'errata sont chez David :
  `Z:\Jeux de Rôle\02. Contemporain\2. Ambiance\Nephilim\Nephilim 5\`.
- `ecrire_vecus.py` — met `livre/epoques.json` en forme dans `docs/systems/nephilim/vecus/` : un
  Markdown par époque (2 600 à 4 000 caractères), `index.json` (les Vécus), `epoques.json` et
  `epoques.md` (les époques). **Remplace** les Markdown d'époque existants.
- `extraire_vecus.py`, `bruts/`, `hors-sujet/`, `catalogue-des-epoques.json` — la première
  extraction, par le carnet NotebookLM (17/10). **Ne servent plus** : le carnet donnait vingt
  époques dont quatre inventées (Salomon, Syracuse, Al-Andalus, l'An Mil) et des titres approchés.
- `etendre_fiche_nephilim.py` — l'extension de la fiche GM-OS du pilote aux pages 3 à 7 de la
  fiche HTML (servie le 17/10 ; gardée pour une prochaine régénération).
- `relier_vecus.py` — relie les noms des Vécus à `vecus/index.json` (liste selon les
  incarnations) et les huit époques d'incarnation à `vecus/epoques.json`.
- `ranger_incarnations.py` — place la section « Incarnations » juste avant « Les Vécus » :
  on lit l'époque avant le Vécu qui en vient (18/10). Sans effet si c'est déjà fait.
- `sections_des_arts.py` — découpe « Sciences occultes » en trois sections d'Arts (Magie, Kabbale,
  Alchimie) que le menu « Vécu ou Art occulte » propose en sous-groupes, et une section des voies,
  en texte, hors du menu. Les clés ne bougent pas (18/10). Refuse si c'est déjà fait.
- `suites_des_critiques.py` — pose `jet.suitesDesCritiques` : +1 Khaïba sur une maladresse
  d'Art occulte, +1 Ombre sur le Vécu contemporain, +1 Sapience sur un critique de Science
  occulte, proposés d'un bouton au panneau de jet (18/10). À passer après `sections_des_arts.py` ;
  le repasser remplace les suites.
- `stase_et_ka_dominant.py` — lots B et C (18/10) : une section « Ka dominant » (le choix de
  l'élément et son degré calculé) après le Pentacle, la Stase plafonnée dessus (`maxSur`), et deux
  réserves au jet qui ajoutent des degrés à la cible — la Stase sur un sort de Magie, l'Effet Mnémos
  (1 PS : +2) sur un test de Vécu. À passer après `sections_des_arts.py`.

## État au 18/10 — complet

- **155 Vécus, 31 époques**, extraits du livre. Contrôle : les 80 Vécus de la première extraction
  ont gardé leur nom et leur Ka ; trois descriptions du carnet étaient fausses (Marchand romain,
  Voltigeur, Druide).
- **Titres renommés** par rapport au 17/10 (une incarnation déjà saisie sous l'ancien nom est à
  choisir de nouveau) : *Les premières pierres dressées* → *Le premier peuple* ; *La Mésopotamie
  des prédictions* → *L'empire magique des Perses* ; *L'empire de Carthage* → *L'empire lunaire de
  Carthage* ; *L'empire de Rome* → *L'empire profane de Rome*. Accents et apostrophes ne comptent
  pas (`cleDuNom`).

```sh
python -I -X utf8 outils/nephilim-vecus/extraire_du_livre.py "<chemin du PDF>"
python -I -X utf8 outils/nephilim-vecus/ecrire_vecus.py
```
