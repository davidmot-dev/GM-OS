# Relie la fiche HTML « Livret du voyageur » (reve-de-dragon-voyageur-fr) à la fiche GM-OS du pilote
# Rêve de Dragon — 2026-10-19, Claude Code, après la livraison de Codex (5426215f).
#
# Choix de David : « Tout, comme Nephilim ». Chaque clé de la fiche HTML est citée :
#   - reliée à un champ GM-OS EXISTANT (les 99 champs gardent leur identifiant : le jet les lit) ;
#   - ou reliée à un champ NOUVEAU de la fiche GM-OS (identifiant = la clé, points → « _ ») ;
#   - ou déclarée ABSENTE, avec sa raison : ce que GM-OS calcule (formules) et les copies que la
#     fiche calcule elle-même (`derive`).
# Les champs nouveaux vont dans des sections NOUVELLES : le menu d'une composante du jet propose tous
# les champs de ses sections, une expérience ou un nom n'a rien à y faire. Exceptions voulues : les
# cinq survies manquantes rejoignent les compétences particulières, et les « autres compétences »
# (nom + niveau, `libelleSur`) deviennent une section du jet.
#
# Usage : python -I -X utf8 outils/reve-de-dragon/relier_fiche_voyageur.py <export du pilote> <sortie>
# Écrit aussi docs/systems/reves de dragons/fiche/correspondance.json.
import json, os, re, sys, zipfile

entree, sortie = sys.argv[1:3]
ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.join(ICI, '..', '..')
FICHE = os.path.join(RACINE, 'docs', 'fiches', 'Rêve de Dragon', 'reve-de-dragon-livret-voyageur-interactif.html')
CORRESPONDANCE = os.path.join(RACINE, 'docs', 'systems', 'reves de dragons', 'fiche', 'correspondance.json')

# — La fiche HTML : ses clés, dans l'ordre des pages.
html = open(FICHE, encoding='utf-8').read()
gabarit = json.loads(re.search(r'<script type="application/json" id="character-sheet-template">(.*?)</script>', html, re.S).group(1))['template']
cles = {}
for page in gabarit['pages']:
    for f in page['fields']:
        c = cles.setdefault(f['key'], {'type': f['type'], 'label': f.get('label') or f['key'], 'values': [], 'derive': f.get('derive')})
        if f['type'] == 'hotspot':
            c['values'].append(f.get('value'))

# — Les 99 champs de la fiche GM-OS et leur clé HTML.
EXISTANTS = {
    'nom': 'identity.name', 'age': 'identity.age', 'sexe': 'identity.gender', 'taille_cm': 'identity.height',
    'poids_kg': 'identity.weight', 'cheveux': 'identity.hair', 'yeux': 'identity.eyes', 'beaute': 'identity.beauty',
    'heure_naissance': 'identity.birthHour',
    'taille': 'attributes.size.value', 'apparence': 'attributes.appearance.value', 'constitution': 'attributes.constitution.value',
    'force': 'attributes.strength.value', 'agilite': 'attributes.agility.value', 'dexterite': 'attributes.dexterity.value',
    'vue': 'attributes.sight.value', 'ouie': 'attributes.hearing.value', 'odorat_gout': 'attributes.smellTaste.value',
    'volonte': 'attributes.will.value', 'intellect': 'attributes.intellect.value', 'empathie': 'attributes.empathy.value',
    'reve': 'attributes.dream.value', 'chance': 'attributes.luck.value',
    'vie': 'resources.life.current', 'endurance': 'resources.endurance.current', 'malus_armure': 'resources.armorPenalty',
    'reve_pts': 'resources.dream.current', 'reve_seuil': 'resources.dream.recoveryThreshold',
    'bricolage': 'skills.craft.level', 'chant': 'skills.sing.level', 'course': 'skills.run.level', 'cuisine': 'skills.cook.level',
    'danse': 'skills.dance.level', 'dessin': 'skills.draw.level', 'discretion': 'skills.stealth.level',
    'escalade': 'skills.climb.level', 'saut': 'skills.jump.level', 'seduction': 'skills.seduce.level',
    'vigilance': 'skills.awareness.level', 'charpenterie': 'skills.carpentry.level', 'comedie': 'skills.act.level',
    'commerce': 'skills.trade.level', 'equitation': 'skills.ride.level', 'maconnerie': 'skills.masonry.level',
    'musique': 'skills.music.level', 'pickpocket': 'skills.pickpocket.level', 'survie_cite': 'skills.survivalCity.level',
    'survie_exterieur': 'skills.survivalOutdoors.level', 'survie_foret': 'skills.survivalForest.level',
    'travestissement': 'skills.disguise.level', 'acrobatie': 'skills.acrobatics.level', 'chirurgie': 'skills.surgery.level',
    'jeu': 'skills.gaming.level', 'jonglerie': 'skills.juggle.level', 'maroquinerie': 'skills.leatherwork.level',
    'metallurgie': 'skills.metalwork.level', 'natation': 'skills.swim.level', 'navigation': 'skills.navigation.level',
    'orfevrerie': 'skills.goldsmith.level', 'serrurerie': 'skills.locksmith.level', 'alchimie': 'skills.alchemy.level',
    'astrologie': 'skills.astrology.level', 'botanique': 'skills.botany.level', 'ecriture': 'skills.writing.level',
    'legendes': 'skills.legends.level', 'medecine': 'skills.medicine.level', 'zoologie': 'skills.zoology.level',
    'corps_a_corps': 'combat.0.level', 'dague_melee': 'combat.1.level', 'esquive': 'combat.2.level',
    'dague_jet': 'combat.3.level', 'bouclier': 'combat.4.level', 'epee_1m': 'combat.5.level', 'arc': 'combat.6.level',
    'onrios': 'draconic.oniros.level', 'hypnos': 'draconic.hypnos.level', 'narcos': 'draconic.narcos.level',
    'thanatos': 'draconic.thanatos.level',
    'fatigue': 'tracks.fatigue', 'charge_totale': 'equipment.totalEncumbrance',
    'stress': 'resources.stress', 'points_de_chance': 'resources.luck.current', 'points_de_destinee': 'resources.destiny',
    'moral': 'route.morale',
}
# Les quatre armes de GM-OS occupent les lignes 4 à 7 de la fiche : leur nom y est écrit d'avance.
NOMS_DES_ARMES = {'combat.3.name': 'Dague de jet', 'combat.4.name': 'Bouclier', 'combat.5.name': 'Épée à une main', 'combat.6.name': 'Arc'}

CALCULE_PAR_GMOS = 'GM-OS le calcule (formule de la fiche GM-OS) : saisi sur la fiche HTML, il n’y remonte pas, pour ne pas faire deux vérités.'
ABSENTS = {
    'derived.melee': CALCULE_PAR_GMOS, 'derived.shoot': CALCULE_PAR_GMOS, 'derived.throw': CALCULE_PAR_GMOS,
    'derived.dodge': CALCULE_PAR_GMOS, 'resources.life.base': CALCULE_PAR_GMOS, 'resources.endurance.base': CALCULE_PAR_GMOS,
    'resources.sustenance': CALCULE_PAR_GMOS, 'resources.constitutionThreshold': CALCULE_PAR_GMOS,
    'resources.encumbrance': CALCULE_PAR_GMOS, 'resources.damageBonus': CALCULE_PAR_GMOS,
}
for cle, c in cles.items():
    if c['derive']:
        ABSENTS[cle] = f"Copie calculée par la fiche (« {c['derive'].get('source')} ») : en lecture seule, la source est reliée."

# — Où va chaque champ nouveau : (motif de clé, section, libellé, après quelle section). Le premier qui répond.
RANGEMENT = [
    (r'^identity\.', 'identite', None, None),
    (r'^attributes\.\w+\.experience$', 'experience_des_caracteristiques', 'Expérience des caractéristiques', 'caracteristiques_derivees'),
    (r'^skills\.survival(Desert|Ice|Swamp|Mountain|Underground)\.level$', 'competences_particulieres', None, None),
    (r'^skills\.custom\.\d+\.(name|level)$', 'autres_competences', 'Autres compétences', 'connaissances'),
    (r'^skills\.', 'experience_des_competences', 'Expérience des compétences', 'autres_competences'),
    (r'^combat\.', 'combat_details', 'Combat — initiative, dommages, expérience', 'combat'),
    (r'^draconic\.', 'experience_draconique', 'Draconic — expérience', 'draconic'),
    (r'^resources\.', 'suivi_des_points', 'Vie, endurance, rêve et chance — suivi', 'reve'),
    (r'^(magic|astrology)\.', 'magie', 'Magie et astrologie', 'sorts'),
    (r'^spells\.', 'sorts_connus', 'Sorts connus', 'magie'),
    (r'^reservedSpells\.', 'sorts_en_reserve', 'Sorts en réserve', 'sorts_connus'),
    (r'^equipment\.money\.', 'monnaie', 'Monnaie', 'equipement'),
    (r'^equipment\.worn', 'equipement_porte', 'Équipement — porté sur soi', 'monnaie'),
    (r'^equipment\.weapons\.', 'equipement_armes', 'Équipement — armes', 'equipement_porte'),
    (r'^equipment\.armor\.', 'equipement_armures', 'Équipement — armures', 'equipement_armes'),
    (r'^equipment\.containers\.', 'equipement_contenants', 'Équipement — contenants', 'equipement_armures'),
    (r'^equipment\.pouches\.', 'equipement_bourses', 'Équipement — bourses et sacoches', 'equipement_contenants'),
    (r'^equipment\.boxes\.', 'equipement_coffres', 'Équipement — coffres et caisses', 'equipement_bourses'),
    (r'^(route|tracks)\.', 'feuille_de_route_suivi', 'Feuille de route — suivi', 'route'),
    (r'^injuries\.', 'blessures', 'Blessures', 'feuille_de_route_suivi'),
    (r'^calendar\.', 'calendrier', 'Calendrier et nombres astraux', 'blessures'),
    (r'^archetype\.', 'archetype_niveaux', 'Archétype — niveaux', 'archetype'),
]

def champ_nouveau(cle, c):
    ident = cle.replace('.', '_')
    if c['type'] == 'hotspot':
        nombres = all(isinstance(v, (int, float)) for v in c['values'])
        champ = ({'type': 'number', 'defaultValue': 0} if nombres
                 else {'type': 'select', 'options': [str(v) for v in c['values']], 'defaultValue': ''})
        label = re.sub(r'\s*[—-]\s*(case|degré|jour du mois).*$', '', c['label'], flags=re.I)
        label = {'injuries.light.count': 'Blessures légères', 'injuries.serious.count': 'Blessures graves',
                 'injuries.critical.count': 'Blessures critiques', 'calendar.day': 'Jour du mois',
                 'astrology.referenceHour': 'Repère zodiacal', 'tracks.inebriation': 'Éthylisme'}.get(cle, label)
    else:
        champ = {'type': c['type'] if c['type'] in ('number', 'text', 'textarea') else 'text',
                 'defaultValue': 0 if c['type'] == 'number' else ''}
        label = c['label']
    if cle in NOMS_DES_ARMES:
        champ['defaultValue'] = NOMS_DES_ARMES[cle]
    return {'id': ident, 'label': label, **champ}

# — Le pilote.
with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))
sections = etat['sheetTemplate']['sections']
par_id = {s['id']: s for s in sections}
ids_gmos = {f['id'] for s in sections for f in s['fields']}
manquants = [g for g in EXISTANTS if g not in ids_gmos]
if manquants:
    sys.exit(f'Champs GM-OS attendus absents du pilote : {manquants} — l’export a changé.')
inconnues = [k for k in list(EXISTANTS.values()) + list(NOMS_DES_ARMES) if k not in cles]
if inconnues:
    sys.exit(f'Clés absentes de la fiche HTML : {inconnues}')

reliees = set(EXISTANTS.values()) | set(ABSENTS)
champs_nouveaux = []
for cle, c in cles.items():
    if cle in reliees:
        continue
    regle = next((r for r in RANGEMENT if re.search(r[0], cle)), None)
    if not regle:
        sys.exit(f'Clé sans rangement : {cle}')
    _, sid, label, apres = regle
    if sid not in par_id:
        nouvelle = {'id': sid, 'label': label, 'fields': []}
        ordre = [s['id'] for s in sections]
        sections.insert(ordre.index(apres) + 1 if apres in ordre else len(sections), nouvelle)
        par_id[sid] = nouvelle
    nouveau = champ_nouveau(cle, c)
    if nouveau['id'] in ids_gmos:
        sys.exit(f'Identifiant déjà pris : {nouveau["id"]}')
    par_id[sid]['fields'].append(nouveau)
    ids_gmos.add(nouveau['id'])
    champs_nouveaux.append((nouveau['id'], cle))

# Les autres compétences : le niveau porte le nom saisi, et la section entre au jet.
for f in par_id['autres_competences']['fields']:
    m = re.fullmatch(r'skills_custom_(\d+)_level', f['id'])
    if m:
        f['libelleSur'] = f'skills_custom_{m.group(1)}_name'
par_id['autres_competences']['fields'].sort(key=lambda f: (int(f['id'].split('_')[2]), f['id'].endswith('_level')))
competences = next(c for c in etat['gameDriver']['jet']['cible']['ajustement'] if c['id'] == 'competences_gen')
if 'autres_competences' not in competences.get('sectionsSupplementaires', []):
    competences.setdefault('sectionsSupplementaires', []).append('autres_competences')

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))
json.dump(etat, open(os.path.join(os.path.dirname(sortie) or '.', 'rdd_state.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# — La correspondance.
table = {
    'version': 1,
    'gabaritDeLaFiche': gabarit['id'],
    'commentaire': ('Correspondance entre la fiche GM-OS de Rêve de Dragon et le gabarit reve-de-dragon-voyageur-fr '
                    '(Livret du voyageur 2.0, livré par Codex le 2026-10-19). Écrite par '
                    'outils/reve-de-dragon/relier_fiche_voyageur.py : les 99 champs historiques gardent leur '
                    'identifiant, les autres reprennent la clé de la fiche, points changés en « _ ».'),
    'champs': [{'gmos': g, 'fiche': k} for g, k in EXISTANTS.items()] + [{'gmos': g, 'fiche': k} for g, k in champs_nouveaux],
    'absents': [{'fiche': k, 'pourquoi': p} for k, p in ABSENTS.items()],
}
os.makedirs(os.path.dirname(CORRESPONDANCE), exist_ok=True)
open(CORRESPONDANCE, 'w', encoding='utf-8').write(json.dumps(table, ensure_ascii=False, indent=2) + '\n')

print(f"Fiche HTML : {len(cles)} clés — {len(EXISTANTS)} reliées aux champs existants, {len(champs_nouveaux)} à des champs "
      f"nouveaux, {len(ABSENTS)} absentes motivées ({len(EXISTANTS) + len(champs_nouveaux) + len(ABSENTS)} au total).")
print(f"Fiche GM-OS : {len(sections)} sections, {sum(len(s['fields']) for s in sections)} champs.")
