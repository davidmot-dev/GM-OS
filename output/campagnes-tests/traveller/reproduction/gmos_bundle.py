#!/usr/bin/env python3
"""Outils Nexus v1 sans dépendance externe. Contrôle structurel partiel, jamais un import GM-OS."""
import argparse
import csv
import hashlib
import io
import json
import re
import stat
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

ARRAYS = ('players', 'entities', 'sessions', 'atlasMaps', 'wikiEntries', 'timelineEvents', 'clues')
STATS = {'entityCount': 'entities', 'sessionCount': 'sessions', 'atlasMapCount': 'atlasMaps', 'wikiEntryCount': 'wikiEntries', 'clueCount': 'clues'}
PORTÉE = 'Structure Nexus v1 partielle ; règles, satellites, médias décodés, import GM-OS, tablettes et matériel non vérifiés par cet outil.'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def json_lire(data):
    def non_fini(value):
        raise ValueError('Nombre JSON non fini : ' + value)
    return json.loads(data.decode('utf-8-sig'), parse_constant=non_fini)


def json_octets(value):
    return (json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n').encode('utf-8')


def chemin_sûr(name):
    if not isinstance(name, str) or not name or '\\' in name or ':' in name or '\x00' in name:
        raise ValueError('Chemin ZIP dangereux : ' + repr(name))
    p = PurePosixPath(name)
    if p.is_absolute() or any(x in ('', '.', '..') for x in name.split('/')):
        raise ValueError('Chemin ZIP dangereux : ' + name)
    return name


def ouvrir(source):
    b = Path(source).read_bytes()
    z = zipfile.ZipFile(io.BytesIO(b))
    noms = set()
    total = 0
    if len(z.infolist()) > 10000:
        raise ValueError('Archive trop fournie pour ce contrôleur')
    for f in z.infolist():
        chemin_sûr(f.filename.rstrip('/') if f.is_dir() else f.filename)
        if f.filename.casefold() in noms:
            raise ValueError('Entrée ZIP répétée : ' + f.filename)
        noms.add(f.filename.casefold())
        if stat.S_ISLNK(f.external_attr >> 16):
            raise ValueError('Lien symbolique ZIP interdit')
        total += f.file_size
        if f.file_size > 128 * 1024 * 1024 or total > 512 * 1024 * 1024:
            raise ValueError('Archive trop volumineuse pour ce contrôleur')
    m, s = json_lire(z.read('manifest.json')), json_lire(z.read('state.json'))
    if not isinstance(m, dict) or not isinstance(s, dict):
        raise ValueError('manifest.json et state.json doivent être des objets')
    return z, m, s, sha(b)


def verifier(z, m, s, empreinte):
    erreurs, limites = [], [PORTÉE]
    def exige(ok, message):
        if not ok:
            erreurs.append(message)
    exige(m.get('schemaVersion') == 1, 'schemaVersion doit valoir 1')
    exige(m.get('bundleType', 'campaign') == 'campaign', 'Ce contrôle porte sur une campagne')
    campaign = s.get('campaign', {})
    if not isinstance(campaign, dict):
        campaign = {}
    cid = campaign.get('id')
    exige(isinstance(cid, str) and bool(cid), 'ID de campagne manquant')
    exige(m.get('campaignId') == cid, 'campaignId ne correspond pas à state.campaign.id')
    exige(m.get('campaignName') == campaign.get('name') and bool(campaign.get('name')), 'Nom de campagne incohérent')
    for key in ('bundleId', 'exportedAt', 'gmosVersion'):
        exige(isinstance(m.get(key), str) and bool(m[key]), key + ' manquant')
    try:
        datetime.fromisoformat(m.get('exportedAt', '').replace('Z', '+00:00'))
    except (ValueError, TypeError):
        erreurs.append('exportedAt invalide')
    for key in ARRAYS:
        exige(isinstance(s.get(key), list), 'Tableau manquant : ' + key)
    if erreurs:
        return {'valid': False, 'errors': erreurs, 'limits': limites, 'sha256': empreinte}

    def ids(items, label):
        result = []
        for x in items:
            if not isinstance(x, dict):
                erreurs.append(label + ' : entrée non objet')
                continue
            ident = x.get('id')
            exige(isinstance(ident, str) and bool(ident), label + ' : ID manquant')
            if isinstance(ident, str):
                result.append(ident)
        exige(len(result) == len(set(result)), label + ' : IDs répétés')
        return set(result)

    refs = {key: ids(s[key], key) for key in ARRAYS if key != 'players'}
    ids(s['players'], 'players')
    pcs = []
    for p in s['players']:
        if not isinstance(p, dict):
            erreurs.append('Joueur non objet')
            continue
        exige(isinstance(p.get('characters'), list), 'characters manquant chez un joueur')
        pcs.extend(p.get('characters') if isinstance(p.get('characters'), list) else [])
    refs['pcs'] = ids(pcs, 'PJ')
    for field, key in [('requiredDriverIds', 'requiredDriverData'), ('requiredTemplateIds', 'requiredTemplateData')]:
        listed = m.get(field)
        exige(isinstance(listed, list) and all(isinstance(x, str) for x in listed), field + ' invalide')
        embedded = s.get(key, [])
        exige(isinstance(embedded, list), key + ' invalide')
        available = ids(embedded if isinstance(embedded, list) else [], key)
        missing = set(listed or []) - available if isinstance(listed, list) and all(isinstance(x, str) for x in listed) else set()
        if missing:
            limites.append('Dépendances non embarquées, à fournir avant import : ' + ', '.join(sorted(missing)))
    for c in pcs:
        if not isinstance(c, dict):
            continue
        exige(c.get('campaignId') == cid, 'PJ rattaché à une autre campagne : ' + str(c.get('id')))
        exige(c.get('systemId') in m.get('requiredDriverIds', []), 'Pilote du PJ absent des dépendances : ' + str(c.get('id')))
        exige(c.get('templateId') in m.get('requiredTemplateIds', []), 'Gabarit du PJ absent des dépendances : ' + str(c.get('id')))
        exige(isinstance(c.get('sheetData'), dict), 'sheetData manquant : ' + str(c.get('id')))

    for key in ('actes', 'scenes', 'moments'):
        if key in s:
            exige(isinstance(s[key], list), key + ' doit être un tableau')
            refs[key] = ids(s[key] if isinstance(s[key], list) else [], key)
    def lien(value, target, label):
        if value is not None and value != '':
            exige(isinstance(value, str) and value in refs.get(target, set()), label + ' : référence inconnue ' + str(value))
    for scene in s.get('scenes', []) if isinstance(s.get('scenes', []), list) else []:
        if not isinstance(scene, dict):
            continue
        for key, target in [('acteId', 'actes'), ('lieuId', 'atlasMaps'), ('momentDeStoryboardId', 'moments')]:
            lien(scene.get(key), target, key)
        for key, target in [('personnagesIds', 'pcs'), ('entiteIds', 'entities'), ('indiceIds', 'clues')]:
            values = scene.get(key, [])
            exige(isinstance(values, list), key + ' doit être un tableau')
            for value in values if isinstance(values, list) else []:
                lien(value, target, key)
        for e in scene.get('enchainements', []):
            lien(e.get('vers') if isinstance(e, dict) else e, 'scenes', 'enchainement')
    for clue in s['clues']:
        if isinstance(clue, dict):
            lien(clue.get('locationId'), 'atlasMaps', 'Indice/lieu')
            lien(clue.get('ownerId'), 'entities', 'Indice/propriétaire')

    media, tailles = m.get('assetMap', []), []
    exige(isinstance(media, list), 'assetMap doit être un tableau')
    refs_assets, paths = set(), set()
    for a in media if isinstance(media, list) else []:
        try:
            chemin = chemin_sûr(a['relativePath'])
            exige(chemin.startswith('assets/'), 'Média hors assets/')
            exige(a['originalRef'] not in refs_assets, 'Référence média répétée')
            exige(chemin.casefold() not in paths, 'Chemin média répété')
            refs_assets.add(a['originalRef']); paths.add(chemin.casefold())
            data = z.read(chemin)
            exige(sha(data) == a['checksum'], 'SHA-256 incorrect : ' + chemin)
            exige(len(data) == a['sizeBytes'], 'Taille incorrecte : ' + chemin)
            exige(isinstance(a.get('mimeType'), str) and bool(a['mimeType']), 'MIME manquant : ' + chemin)
            tailles.append(len(data))
        except (KeyError, ValueError, TypeError, zipfile.BadZipFile) as e:
            erreurs.append('Média invalide : ' + str(e))
    expected = {key: len(s[array]) for key, array in STATS.items()}
    expected.update(assetCount=len(media) if isinstance(media, list) else 0, totalSizeBytes=sum(tailles))
    for key, value in expected.items():
        exige(isinstance(m.get('stats'), dict) and m['stats'].get(key) == value, 'Statistique incorrecte : ' + key)
    return {'valid': not erreurs, 'errors': erreurs, 'limits': limites, 'sha256': empreinte, 'campaignId': cid, 'players': len(s['players']), 'characters': len(pcs), 'assets': len(tailles)}


def ecrire_exclusif(destination, data):
    p = Path(destination)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open('xb') as f:
        f.write(data)


def construire(args):
    s = json_lire(Path(args.state).read_bytes())
    date = datetime.fromisoformat(args.date.replace('Z', '+00:00'))
    if date.tzinfo is None:
        raise ValueError('La date fixe doit préciser son fuseau horaire')
    date = date.astimezone(timezone.utc)
    if not 1980 <= date.year <= 2107:
        raise ValueError('Date hors de la plage ZIP')
    contents = {'state.json': json_octets(s)}
    assets = []
    index = Path(args.assets).resolve()
    for a in json_lire(index.read_bytes()):
        name = chemin_sûr(a['relativePath'])
        if not name.startswith('assets/') or name.casefold() in {x.casefold() for x in contents}:
            raise ValueError('Chemin média invalide ou répété : ' + name)
        chemin_sûr(a['source'])
        source = (index.parent / a['source']).resolve()
        source.relative_to(index.parent)
        data = source.read_bytes()
        contents[name] = data
        assets.append({'originalRef': a['originalRef'], 'relativePath': name, 'checksum': sha(data), 'sizeBytes': len(data), 'mimeType': a['mimeType']})
    c = s['campaign']
    m = {'schemaVersion': 1, 'bundleType': 'campaign', 'bundleId': c['id'] + '-v1', 'campaignId': c['id'], 'campaignName': c['name'],
         'exportedAt': date.isoformat().replace('+00:00', 'Z'), 'gmosVersion': args.gmos_version,
         'requiredDriverIds': [x['id'] for x in s.get('requiredDriverData', [])], 'requiredTemplateIds': [x['id'] for x in s.get('requiredTemplateData', [])],
         'assetMap': assets, 'stats': {key: len(s[array]) for key, array in STATS.items()}}
    m['stats'].update(assetCount=len(assets), totalSizeBytes=sum(a['sizeBytes'] for a in assets))
    contents['manifest.json'] = json_octets(m)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for name, data in sorted(contents.items()):
            info = zipfile.ZipInfo(name, date.timetuple()[:6]); info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data)
    data = buffer.getvalue()
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        r = verifier(z, m, s, sha(data))
    if not r['valid']:
        raise ValueError('; '.join(r['errors']))
    ecrire_exclusif(args.output, data)
    return dict(r, output=str(Path(args.output)), bytes=len(data))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest='command', required=True)
    for name in ('inspect', 'verify'):
        sub.add_parser(name).add_argument('archive')
    b = sub.add_parser('build')
    for key in ('state', 'assets', 'date', 'gmos-version', 'output'):
        b.add_argument('--' + key, required=True)
    c = sub.add_parser('cases'); c.add_argument('--source', required=True); c.add_argument('--output', required=True)
    args = p.parse_args()
    try:
        if args.command == 'build':
            result = construire(args)
        elif args.command == 'cases':
            cases = json_lire(Path(args.source).read_bytes())
            fields = ['id', 'archive', 'precondition', 'action', 'attendu']
            if not isinstance(cases, list) or not cases:
                raise ValueError('Liste de cas non vide requise')
            seen = set(); out = io.StringIO(newline='')
            w = csv.DictWriter(out, fieldnames=fields + ['statut', 'observe', 'preuve'], delimiter=';')
            w.writeheader()
            for case in cases:
                if any(not isinstance(case.get(k), str) or not case[k].strip() for k in fields):
                    raise ValueError('Cas incomplet')
                if case['id'] in seen:
                    raise ValueError('ID de cas répété')
                seen.add(case['id']); row = {k: case[k] for k in fields}
                w.writerow(dict(row, statut='NON TESTÉ', observe='', preuve=''))
            ecrire_exclusif(args.output, out.getvalue().encode('utf-8-sig'))
            result = {'cases': len(cases), 'initialStatus': 'NON TESTÉ', 'output': args.output}
        else:
            z, m, s, empreinte = ouvrir(args.archive)
            try:
                if args.command == 'verify':
                    result = verifier(z, m, s, empreinte)
                else:
                    drivers = s.get('requiredDriverData', []) or ([s['gameDriver']] if 'gameDriver' in s else [])
                    templates = s.get('requiredTemplateData', []) or ([s['sheetTemplate']] if 'sheetTemplate' in s else [])
                    result = {'sha256': empreinte, 'bundleType': m.get('bundleType', 'campaign'), 'schemaVersion': m.get('schemaVersion'),
                              'campaign': s.get('campaign', {}).get('name'),
                              'drivers': [{k: d.get(k) for k in ('id', 'name', 'version')} for d in drivers],
                              'templates': [{'id': t.get('id'), 'fields': [f for sec in t.get('sections', []) for f in sec.get('fields', [])]} for t in templates],
                              'players': [{'id': x.get('id'), 'realName': x.get('realName')} for x in s.get('players', [])]}
            finally:
                z.close()
        print(json.dumps(result, ensure_ascii=False, indent=2))
        if result.get('valid') is False:
            return 1
        return 0
    except (ValueError, TypeError, KeyError, OSError, zipfile.BadZipFile) as e:
        print(json.dumps({'valid': False, 'error': str(e)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
