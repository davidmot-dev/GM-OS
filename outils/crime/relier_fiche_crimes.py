# Relie la fiche HTML Crimes (crimes-fr, livrée par Codex le 2026-10-19) à la fiche GM-OS du pilote
# « Crimes » créé par David dans la Forge — 2026-10-19, Claude Code.
#
# La Forge avait produit une fiche générique (« Compétence 1 » à « Compétence 12 », un seul style
# d'enquête, contacts en texte libre). Choix de David : aucun personnage n'existe encore, la fiche
# GM-OS est refaite sur la fiche HTML. Chaque clé de la fiche HTML est citée :
#   - reliée à un champ GM-OS qui existait déjà (il garde son identifiant) ;
#   - ou reliée à un champ NOUVEAU : identifiant français pour ce qu'une formule ou le jet liront
#     (compétences, styles), sinon la clé de la fiche, points changés en « _ » ;
#   - ou déclarée ABSENTE, avec sa raison.
# Les champs du pilote sans place sur la fiche (profession, famille, convictions, fiche d'équipe
# du livre) sont gardés : la fiche HTML n'est pas la seule source.
# Le JET n'est pas touché (chantier séparé, décision de David) : seule l'initiative, qui citait
# « competence_1 », est réécrite selon la règle du corpus.
#
# Usage : python -I -X utf8 outils/crime/relier_fiche_crimes.py <export du pilote> <sortie .gmos-driver>
# Écrit aussi docs/systems/crime/fiche/correspondance.json.
import json, os, re, sys, zipfile

entree, sortie = sys.argv[1:3]
ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.join(ICI, '..', '..')
FICHE = os.path.join(RACINE, 'docs', 'fiches', 'Crimes', 'crimes-fiche-personnage-interactive.html')
CORRESPONDANCE = os.path.join(RACINE, 'docs', 'systems', 'crime', 'fiche', 'correspondance.json')

# — La fiche HTML : ses clés, dans l'ordre des pages.
html = open(FICHE, encoding='utf-8').read()
bloc = re.search(r'<script\b[^>]*\bid=["\']character-sheet-template["\'][^>]*>(.*?)</script>', html, re.S)
gabarit = json.loads(bloc.group(1))['template']
cles = {}
for page in gabarit['pages']:
    for f in page['fields']:
        c = cles.setdefault(f['key'], {'type': f['type'], 'label': f.get('label') or f['key'], 'values': []})
        if f['type'] == 'hotspot':
            c['values'].append(f.get('value'))

def libelle(cle):
    """L'intitulé de la fiche, sans le « — 1 » d'une case de piste."""
    return re.sub(r'\s*—\s*(piste( à cinq cases)?\s*—\s*)?(1|Oui|Primaire)$', '', cles[cle]['label'])

def ident(cle):
    return cle.replace('.', '_')

# — Le pilote.
with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))
ancien = {f['id']: f for s in etat['sheetTemplate']['sections'] for f in s['fields']}

champs = []      # (identifiant GM-OS, clé de la fiche, traduction des valeurs)
absents = {'portrait': 'Une image : elle reste sur la fiche, GM-OS a son propre portrait du personnage.'}

def garde(gid, cle=None, **retouche):
    """Un champ qui existait dans le pilote, éventuellement retouché."""
    if gid not in ancien:
        sys.exit(f'Champ GM-OS attendu absent du pilote : {gid} — l’export a changé.')
    champ = {**ancien[gid], **retouche}
    if cle:
        champs.append((gid, cle, None))
    return champ

def nouveau(gid, cle, typ, label=None, valeurs=None, **extra):
    defaut = {'number': 0, 'gauge': 0, 'checkbox': False}.get(typ, '')
    champ = {'id': gid, 'label': label or libelle(cle), 'type': typ, 'defaultValue': defaut, **extra}
    if valeurs:
        champ['options'] = list(valeurs.values())
        champ['defaultValue'] = ''
    champs.append((gid, cle, valeurs))
    return champ

COMPETENCES = [  # (identifiant GM-OS, clé de la fiche) — l'ordre du livre : Physique, Mental, Social
    ('combat', 'combat'), ('sport', 'sport'), ('cirque', 'circus'), ('traque', 'tracking'), ('larcin', 'larceny'),
    ('sciences_abstraites', 'abstract'), ('sciences_du_vivant', 'life'), ('sciences_de_l_homme', 'humanities'),
    ('occultisme', 'occultism'), ('pratique', 'practical'), ('intrigues', 'intrigue'), ('societe', 'society'),
]
STYLES = [('conde', 'constable'), ('limier', 'hound'), ('illumine', 'visionary'), ('mentaliste', 'mentalist'), ('fouineur', 'snoop')]
# Compétences et styles : un nombre de 0 à 3 — 0 non apprise, 1 Novice, 2 Pratiquant, 3 Maître (dés gardés).
OUI_NON = {'yes': 'Oui', 'no': 'Non'}

sections = [
    {'id': 'identite', 'label': "L'identité", 'fields': [
        garde('concept', 'identity.concept'),
        garde('nom', 'identity.name'),
        garde('prenom', 'identity.first'),
        # La fiche imprime une seule ligne « Sexe et âge » : les deux champs du pilote deviennent un.
        nouveau('sexe_age', 'identity.sexage', 'text'),
        nouveau('role', 'identity.role', 'text'),
        garde('profession'),
        garde('origines', 'identity.origin', label='Origine géographique'),
        nouveau('origine_sociale', 'identity.social', 'text'),
        garde('famille'),
        nouveau('bande', 'identity.gang', 'text'),
        nouveau('refuge', 'profile.refuge', 'text'),
        garde('description', 'profile.description'),
        # « select » sans options dans l'export : le niveau de fortune est un nombre de 1 à 4.
        garde('fortune', 'fortune.level', label='Niveau de fortune', type='number', defaultValue=1, max=4),
        nouveau('fortune_piste', 'fortune.points', 'number', label='Fortune — piste de la fiche', max=10),
        garde('equipement', 'equipment.notes'),
    ]},
    {'id': 'potentiels', 'label': 'Potentiels', 'fields': [
        garde('physique', 'attributes.physical'),
        garde('mental', 'attributes.mental'),
        garde('social', 'attributes.social'),
    ]},
    {'id': 'competences', 'label': 'Compétences', 'fields': [
        nouveau(g, f'skills.{k}.level', 'number', max=3) for g, k in COMPETENCES
    ]},
    {'id': 'competences_compteurs', 'label': 'Compétences — compteurs', 'fields': [
        nouveau(f'compteur_{g}', f'skills.{k}.counter', 'number') for g, k in COMPETENCES
    ]},
    {'id': 'specialisations', 'label': 'Spécialisations', 'fields': [
        nouveau(ident(cle), cle, 'checkbox') for cle in cles if cle.startswith('specialties.')
    ]},
    {'id': 'psychologie_surface', 'label': 'Psychologie de surface', 'fields': [
        nouveau('psychology_emotivity', 'psychology.emotivity', 'select', label='Émotivité', valeurs=OUI_NON),
        nouveau('psychology_activity', 'psychology.activity', 'select', label='Activité', valeurs=OUI_NON),
        nouveau('psychology_reactivity', 'psychology.reactivity', 'select', label='Réactivité',
                valeurs={'primary': 'Primaire', 'secondary': 'Secondaire'}),
        garde('tempérament', 'psychology.temperament'),
        # Le pilote n'avait qu'une ligne « Passions » ; la fiche en imprime deux.
        nouveau('passion_primaire', 'psychology.passions.primary', 'text'),
        nouveau('passion_secondaire', 'psychology.passions.secondary', 'text'),
        garde('convictions'),
        nouveau('psychology_needs_primary', 'psychology.needs.primary', 'text'),
        nouveau('psychology_needs_secondary', 'psychology.needs.secondary', 'text'),
        nouveau('psychology_needs_internal', 'psychology.needs.internal', 'text'),
    ]},
    {'id': 'psychologie_profonde', 'label': 'Psychologie profonde', 'fields': [
        garde('inclinaison_psychotique', 'psychology.inclination'),
        garde('tabous', 'psychology.taboo'),
        garde('folies', 'psychology.madness'),
        garde('decheances', 'psychology.decline'),
    ]},
    {'id': 'jauges_mentales', 'label': 'Jauges mentales', 'fields': [
        garde('angoisse', 'tracks.anxiety'),
        garde('nevrose', 'tracks.neurosis'),
        nouveau('seuil_nevrose', 'psychology.neurosis.threshold', 'number'),
        garde('psychose', 'tracks.psychosis'),
        nouveau('base_psychose', 'psychology.psychosis.base', 'number'),
        garde('innocence', 'tracks.innocence'),
        nouveau('seuil_innocence', 'psychology.innocence.threshold', 'number'),
    ]},
    {'id': 'styles_d_enquete', 'label': "Styles d'enquête", 'fields': [
        champ for g, k in STYLES for champ in (
            nouveau(g, f'investigation.styles.{k}.level', 'number', max=3),
            nouveau(f'compteur_{g}', f'investigation.styles.{k}.counter', 'number'),
        )
    ]},
    {'id': 'contacts', 'label': 'Contacts', 'fields': [
        champ for n in range(8) for champ in (
            nouveau(f'contacts_{n}_name', f'contacts.{n}.name', 'text'),
            nouveau(f'contacts_{n}_rating', f'contacts.{n}.rating', 'number', label=f'Contact {n + 1} — valeur',
                    max=4, libelleSur=f'contacts_{n}_name'),
        )
    ]},
    {'id': 'indices', 'label': 'Indices', 'fields': [
        nouveau(ident(cle), cle, 'number' if cles[cle]['type'] == 'number' else 'text')
        for cle in cles if cle.startswith('clues.')
    ]},
    {'id': 'enquete_et_equipe', 'label': 'Équipe', 'fields': [
        garde('nom_equipe', 'team.name'),
        garde('reputation_equipe', 'team.reputation', type='textarea'),
        nouveau('team_objectives', 'team.objectives', 'textarea'),
        garde('plots', 'team.committed', label='Plots engagés'),
        nouveau('team_track', 'team.track', 'number', label='Équipe — piste de la fiche', max=5),
        nouveau('team_contact_name', 'team.contact.name', 'text'),
        nouveau('team_contact_rating', 'team.contact.rating', 'number', label='Contact de groupe — valeur',
                max=4, libelleSur='team_contact_name'),
        garde('fortune_commune'),
        garde('niveau_fichage'),
        garde('cohésion'),
        garde('resistance_decheance'),
    ]},
]
# — Contrôles : chaque clé citée une fois, chaque identifiant unique, les retraits voulus seulement.
cites = [c for _, c, _ in champs] + list(absents)
doublons = {c for c in cites if cites.count(c) > 1}
oublies = [c for c in cles if c not in cites]
inconnues = [c for c in cites if c not in cles]
if doublons or oublies or inconnues:
    sys.exit(f'Correspondance incomplète — doublons {sorted(doublons)}, oubliées {oublies}, inconnues {inconnues}')
ids = [f['id'] for s in sections for f in s['fields']]
if len(ids) != len(set(ids)):
    sys.exit(f'Identifiants en double : {sorted({i for i in ids if ids.count(i) > 1})}')
RETIRES = {'sexe', 'age', 'passions', 'style_enquete', 'contacts'} | {f'competence_{n}' for n in range(1, 13)}
retires = set(ancien) - set(ids)
if retires != RETIRES:
    sys.exit(f'Retraits inattendus : {sorted(retires ^ RETIRES)}')

etat['sheetTemplate']['sections'] = sections
# L'initiative citait « competence_1 », qui n'existe plus. Règle du corpus (« L'initiative ») :
# Potentiel utilisé + Compétence utilisée − Angoisse ; surtout pour les tirs, d'où Physique + Combat.
etat['gameDriver']['combat']['initiativeFormula'] = 'physique + combat - angoisse'

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))
json.dump(etat, open(os.path.join(os.path.dirname(sortie) or '.', 'crime_state.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)

# — La correspondance.
def entree_de_table(gid, cle, valeurs):
    e = {'gmos': gid, 'fiche': cle}
    if valeurs:
        e['valeurs'] = valeurs
    return e

table = {
    'version': 1,
    'gabaritDeLaFiche': gabarit['id'],
    'commentaire': ('Correspondance entre la fiche GM-OS de Crimes et le gabarit crimes-fr (fiche de personnage, '
                    'livrée par Codex le 2026-10-19). Écrite par outils/crime/relier_fiche_crimes.py : les champs du '
                    'pilote gardent leur identifiant, compétences et styles prennent un identifiant français, les '
                    'autres reprennent la clé de la fiche, points changés en « _ ».'),
    'champs': [entree_de_table(*c) for c in champs],
    'absents': [{'fiche': k, 'pourquoi': p} for k, p in absents.items()],
}
os.makedirs(os.path.dirname(CORRESPONDANCE), exist_ok=True)
open(CORRESPONDANCE, 'w', encoding='utf-8').write(json.dumps(table, ensure_ascii=False, indent=2) + '\n')

print(f"Fiche HTML : {len(cles)} clés — {len(champs)} reliées, {len(absents)} absente(s) motivée(s).")
print(f"Fiche GM-OS : {len(sections)} sections, {len(ids)} champs ; retirés : {', '.join(sorted(retires))}.")
