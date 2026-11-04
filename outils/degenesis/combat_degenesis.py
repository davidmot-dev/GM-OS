# Pilote Degenesis 2.1.0 — DEG-A1 et DEG-A2, 2026-11-03, Claude Code, à la demande de David
# (« on va commencer DEG-A1 et DEG-A2 »). Livre de base français Katharsys, pages imprimées (PDF − 1).
#
# Part du pilote 2.0.0 (`finir_degenesis.py`, réimporté le 30/10) et garde l'identifiant du pilote et de
# son modèle de fiche : la réimportation se fait avec « Remplacer ». La fiche ne change pas (131 champs).
#
# - `jet.degenesis.combat` : ce que lit l'attaque au panneau de jet —
#   F = PHY + Force (p. 103, 156) ; les compétences d'attaque Corps à corps, Lutte et Armes à
#   projectiles, celle-ci à distance (p. 102) ; les trois armes de la fiche (dégâts, maniabilité,
#   propriétés : Mortel, Pénétration, Étourdissement, armes soniques, p. 155-156, 160) ; les deux
#   armures, dont une seule compte (p. 104, 107) ; les défenses actives : esquive AGI + Mobilité,
#   parade PHY + Corps à corps ou PHY + Lutte (p. 102).
# - Le round (DEG-A1) n'a besoin d'aucun nouveau champ : `combat.initiativeEnReserve` ouvre le panneau
#   « Round de Degenesis » de Combat-OS, l'Égo se lit dans `jet.degenesis.ego` (p. 100-101).
# - version 2.1.0.
#
# Usage : python -I -X utf8 outils/degenesis/combat_degenesis.py <pilote 2.0.0> <sortie .gmos-driver>
import json, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    contenus = {n: z.read(n) for n in z.namelist()}
etat = json.loads(contenus['state.json'])
pilote = etat['gameDriver']
if pilote.get('corpusId') != 'degenesis':
    sys.exit(f"Ce n'est pas le pilote Degenesis : {pilote.get('name')!r}.")
if not str(pilote.get('version', '')).startswith('2.'):
    sys.exit(f"Il faut le pilote 2.x (finir_degenesis.py), pas {pilote.get('version')!r}.")

pilote['jet']['degenesis']['combat'] = {
    'force': ['physique', 'force'],
    'attaques': ['corps_a_corps', 'lutte', 'armes_a_projectiles'],
    'aDistance': ['armes_a_projectiles'],
    'armes': [{'nom': f'arme{i}', 'degats': f'arme{i}_degats', 'maniabilite': f'arme{i}_maniabilite',
               'proprietes': f'arme{i}_proprietes'} for i in (1, 2, 3)],
    'armures': [{'nom': f'armure{i}', 'valeur': f'armure{i}_valeur'} for i in (1, 2)],
    'defenses': {
        'esquive': ['agilite', 'mobilite'],
        'parade-corps-a-corps': ['physique', 'corps_a_corps'],
        'parade-lutte': ['physique', 'lutte'],
    },
}
pilote['version'] = '2.1.0'

# Chaque champ nommé doit exister dans la fiche : la Forge le refuserait sinon.
champs = {f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']}
c = pilote['jet']['degenesis']['combat']
lus = c['force'] + c['attaques'] + [v for a in c['armes'] for v in a.values()] \
    + [v for a in c['armures'] for v in a.values()] + [x for d in c['defenses'].values() for x in d]
absents = sorted({x for x in lus if x not in champs})
if absents:
    sys.exit(f'Champs absents de la fiche : {absents}')

contenus['state.json'] = json.dumps(etat, ensure_ascii=False, indent=2).encode('utf-8')
if 'manifest.json' in contenus:
    manifeste = json.loads(contenus['manifest.json'])
    if isinstance(manifeste, dict) and 'version' in manifeste:
        manifeste['version'] = '2.1.0'
    contenus['manifest.json'] = json.dumps(manifeste, ensure_ascii=False, indent=2).encode('utf-8')
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    for nom, octets in contenus.items():
        z.writestr(nom, octets)
print(f"Pilote {pilote['name']} 2.1.0 : attaque (F, {len(c['armes'])} armes, {len(c['armures'])} armures, "
      f"{len(c['defenses'])} défenses), {len(champs)} champs → {sortie}")
