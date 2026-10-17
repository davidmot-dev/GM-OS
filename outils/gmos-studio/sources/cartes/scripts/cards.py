#!/usr/bin/env python3
"""Inspect sources, then replay an explicitly reviewed card extraction recipe."""
import argparse
import hashlib
import io
import json
import math
import re
import shutil
import tempfile
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageOps, __version__ as pillow_version

VERSION = '1.1.0'


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1048576), b''):
            h.update(chunk)
    return h.hexdigest()


def write_json(path, obj):
    Path(path).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def save_image(im, path, format='PNG', **options):
    """Encode completely before publishing an image to the filesystem."""
    path = Path(path)
    buffer = io.BytesIO()
    im.save(buffer, format=format, **options)
    temporary = path.with_name(path.name+'.tmp')
    temporary.write_bytes(buffer.getvalue())
    temporary.replace(path)


class Source:
    def __init__(self, path):
        self.path = Path(path)
        self.pdf = fitz.open(path) if self.path.suffix.lower() == '.pdf' else None
        if self.pdf is not None:
            if self.pdf.needs_pass:
                raise ValueError('PDF protégé : fournir une copie déverrouillée autorisée.')
            self.count = len(self.pdf)
        else:
            self.image = Image.open(path)
            self.count = getattr(self.image, 'n_frames', 1)

    def render(self, page, dpi):
        if not isinstance(page, int) or isinstance(page, bool) or not 1 <= page <= self.count:
            raise ValueError(f'Page invalide : {page}')
        if self.pdf is not None:
            pix = self.pdf[page-1].get_pixmap(dpi=dpi, colorspace=fitz.csRGB, alpha=False)
            return Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        self.image.seek(page-1)
        return ImageOps.exif_transpose(self.image.copy()).convert('RGB')

    def info(self, page):
        if self.pdf is None:
            return {}
        p = self.pdf[page-1]
        return {'size_points': list(p.rect), 'pdf_rotation': p.rotation,
                'trimbox': list(p.trimbox), 'cropbox': list(p.cropbox),
                'text': p.get_text(),
                'text_directions': [list(line['dir']) for b in p.get_text('dict')['blocks']
                                    for line in b.get('lines', [])]}

    def close(self):
        (self.pdf if self.pdf is not None else self.image).close()


def contact(items, target, cols=6, per_sheet=36):
    for start in range(0, len(items), per_sheet):
        batch = items[start:start+per_sheet]
        sheet = Image.new('RGB', (cols*210, math.ceil(len(batch)/cols)*245), '#e6e6e6')
        draw = ImageDraw.Draw(sheet)
        for i, (label, path) in enumerate(batch):
            with Image.open(path) as original:
                im = original.convert('RGB')
                im.thumbnail((195, 210), Image.Resampling.LANCZOS)
                x, y = (i % cols)*210, (i//cols)*245
                sheet.paste(im, (x+(210-im.width)//2, y+25+(210-im.height)//2))
                draw.text((x+5, y+5), label, fill='black')
        save_image(sheet, f'{target}-{start//per_sheet+1:02d}.jpg', 'JPEG', quality=90)


def inspect(args):
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=False)
    inventory, items = [], []
    for index, path in enumerate(args.inputs):
        source = Source(path)
        sid = f's{index}'
        data = {'id': sid, 'filename': Path(path).name, 'sha256': sha(path), 'pages': []}
        try:
            for page in range(1, source.count+1):
                im = source.render(page, 144)
                name = f'{sid}-p{page:04d}.png'
                save_image(im, out/name)
                digest = hashlib.sha256(im.tobytes()).hexdigest()
                data['pages'].append({'page': page, 'size_pixels': list(im.size),
                                      'preview': name, 'pixel_sha256': digest, **source.info(page)})
                items.append((f'{sid} page {page}', out/name))
        finally:
            source.close()
        groups = defaultdict(list)
        for p in data['pages']:
            groups[(tuple(p['size_pixels']), p['pixel_sha256'])].append(p['page'])
        data['identical_page_groups'] = [v for v in groups.values() if len(v)>1]
        inventory.append(data)
    write_json(out/'inventory.json', {'version': VERSION, 'sources': inventory})
    contact(items, out/'contact')
    print(json.dumps({'inventory': str(out/'inventory.json'), 'pages': len(items)}))


def norm_points(points):
    if not all(isinstance(n, (float, int)) and not isinstance(n, bool)
               and math.isfinite(n) and 0 <= n <= 1 for n in points):
        raise ValueError('Coordonnées normalisées attendues entre 0 et 1.')


def solve(matrix, values):
    a = [list(map(float, row))+[float(v)] for row, v in zip(matrix, values)]
    n = len(a)
    for col in range(n):
        pivot = max(range(col, n), key=lambda i: abs(a[i][col]))
        a[col], a[pivot] = a[pivot], a[col]
        if abs(a[col][col]) < 1e-10:
            raise ValueError('Quadrilatère dégénéré.')
        factor = a[col][col]
        a[col] = [v/factor for v in a[col]]
        for i in range(n):
            if i != col:
                factor = a[i][col]
                a[i] = [u-factor*v for u, v in zip(a[i], a[col])]
    return [row[-1] for row in a]


def crop_card(im, entry):
    if 'quad' in entry and 'bbox' in entry:
        raise ValueError('Choisir bbox ou quad, jamais les deux.')
    if 'quad' in entry:
        quad = entry['quad']
        if len(quad) != 4 or any(len(p)!=2 for p in quad):
            raise ValueError('quad = quatre coins HG, HD, BD, BG.')
        norm_points([v for p in quad for v in p])
        pts = [(x*(im.width-1), y*(im.height-1)) for x,y in quad]
        crosses = []
        for i in range(4):
            a,b,c = pts[i],pts[(i+1)%4],pts[(i+2)%4]
            crosses.append((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]))
        if not all(v>0 for v in crosses):
            raise ValueError('Coins du quad non convexes ou ordre incorrect.')
        w = round(max(math.dist(pts[0],pts[1]), math.dist(pts[3],pts[2])))+1
        h = round(max(math.dist(pts[0],pts[3]), math.dist(pts[1],pts[2])))+1
        if min(w,h)<2:
            raise ValueError('Carte trop petite.')
        matrix, values = [], []
        for (u,v),(x,y) in zip([(0,0),(w-1,0),(w-1,h-1),(0,h-1)], pts):
            matrix += [[u,v,1,0,0,0,-x*u,-x*v], [0,0,0,u,v,1,-y*u,-y*v]]
            values += [x,y]
        coeffs = solve(matrix, values)
        im = im.transform((w,h), Image.Transform.PERSPECTIVE, coeffs, Image.Resampling.BICUBIC)
    else:
        box = entry.get('bbox', [0,0,1,1])
        if len(box)!=4:
            raise ValueError('bbox = [gauche, haut, droite, bas].')
        norm_points(box)
        x0,y0,x1,y1 = box
        if x1<=x0 or y1<=y0:
            raise ValueError('Rectangle vide ou inversé.')
        pixels = (round(x0*im.width), round(y0*im.height), round(x1*im.width), round(y1*im.height))
        if pixels[2]<=pixels[0] or pixels[3]<=pixels[1]:
            raise ValueError('Rectangle inférieur à un pixel.')
        im = im.crop(pixels)
    rotate = entry.get('rotate_cw', 0)
    if rotate not in (0,90,180,270):
        raise ValueError('rotate_cw doit être 0, 90, 180 ou 270.')
    transpose = {90: Image.Transpose.ROTATE_270, 180: Image.Transpose.ROTATE_180,
                 270: Image.Transpose.ROTATE_90}
    return im.transpose(transpose[rotate]) if rotate else im


def extract(args):
    recipe = json.loads(Path(args.recipe).read_text(encoding='utf-8'))
    if recipe.get('schema_version') != 2:
        raise ValueError('schema_version doit être 2 : confirmer le numéro de départ de chaque paquet.')
    starts = recipe.get('start_indices')
    if not isinstance(starts, dict) or not starts:
        raise ValueError('Renseigner start_indices pour chaque type ou série de paquet.')
    if any(not isinstance(n, int) or isinstance(n, bool) or n < 0 for n in starts.values()):
        raise ValueError('Chaque numéro de départ doit être un entier positif ou nul.')
    if recipe.get('numbering_confirmed') is not True:
        raise ValueError('Demander puis consigner les numéros choisis par l’utilisateur avant extraction.')
    cards = recipe['cards']
    requested_decks = {c['deck'] for c in cards if c['role'] != 'ignore'}
    if set(starts) != requested_decks:
        raise ValueError('start_indices doit contenir exactement tous les paquets détectés, sans valeur par défaut.')
    dpi = recipe.get('dpi', 300)
    if not isinstance(dpi, int) or isinstance(dpi, bool) or not 72<=dpi<=600:
        raise ValueError('dpi entier attendu, entre 72 et 600.')
    mapping = dict(args.source or [])
    declared = recipe['sources']
    if len({s['id'] for s in declared}) != len(declared):
        raise ValueError('Identifiants de sources dupliqués.')
    if set(mapping)-{s['id'] for s in declared}:
        raise ValueError('Une substitution --source utilise un identifiant inconnu.')
    out = Path(args.out)
    archive = out.with_suffix('.zip')
    if out.exists() or archive.exists():
        raise ValueError('Choisir un dossier ET un ZIP de sortie inexistants.')
    out.parent.mkdir(parents=True, exist_ok=True)
    sources = {}
    stage = Path(tempfile.mkdtemp(prefix='.cards-', dir=out.parent))
    try:
        for s in declared:
            if not re.fullmatch(r'[a-zA-Z0-9_-]+', s['id']):
                raise ValueError('Identifiant de source invalide.')
            if Path(s['filename']).name != s['filename'] or '/' in s['filename'] or '\\' in s['filename']:
                raise ValueError('filename doit être un simple nom de fichier.')
            if not re.fullmatch(r'[a-f0-9]{64}', s['sha256']):
                raise ValueError('Empreinte SHA-256 invalide.')
            path = Path(mapping.get(s['id'], str(Path(args.recipe).parent/s['filename'])))
            if sha(path) != s['sha256']:
                raise ValueError(f"Source modifiée : {s['id']}; réinspecter avant extraction.")
            sources[s['id']] = Source(path)
        counts, backs = Counter(), Counter()
        covered, rows, items, seen = set(), [], [], set()
        cache_key, cached = None, None
        for entry in cards:
            role, sid, page = entry['role'], entry['source'], entry['page']
            if sid not in sources:
                raise ValueError('Source inconnue.')
            if not isinstance(page, int) or isinstance(page, bool) or not 1<=page<=sources[sid].count:
                raise ValueError('Page hors source.')
            covered.add((sid,page))
            if role == 'ignore':
                if not entry.get('reason'):
                    raise ValueError('Toute exclusion doit avoir une raison.')
                continue
            if role not in ('face','back','duplicate-back'):
                raise ValueError('Rôle inconnu.')
            deck = entry['deck']
            if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', deck):
                raise ValueError('Nom de paquet invalide.')
            if entry.get('orientation_verified') is not True or not entry.get('evidence'):
                raise ValueError('Vérifier visuellement orientation et rôle, puis consigner evidence.')
            identity = (sid,page,json.dumps({k:entry[k] for k in ('bbox','quad') if k in entry},sort_keys=True))
            if identity in seen:
                raise ValueError('Même région déclarée plusieurs fois.')
            seen.add(identity)
            if role == 'duplicate-back':
                rows.append({**entry, 'output': None})
                continue
            key = (sid,page)
            if cache_key != key:
                cached = sources[sid].render(page,dpi)
                cache_key = key
            im = crop_card(cached,entry)
            if role == 'back':
                backs[deck] += 1
                if backs[deck]>1:
                    raise ValueError('Plusieurs dos canoniques dans le même paquet.')
                filename = 'back.jpg'
            else:
                filename = f'{starts[deck] + counts[deck]}.jpg'
                counts[deck] += 1
            dest = stage/deck/filename
            dest.parent.mkdir(parents=True, exist_ok=True)
            save_image(im.convert('RGB'), dest, 'JPEG', quality=95, subsampling=0, optimize=True)
            items.append((f'{deck}/{filename}', dest))
            rows.append({**entry, 'output': f'{deck}/{filename}', 'size_pixels': list(im.size), 'sha256': sha(dest)})
        missing = [(s,p) for s,obj in sources.items() for p in range(1,obj.count+1) if (s,p) not in covered]
        if missing:
            raise ValueError(f'Pages sans décision : {missing}')
        decks = set(counts)|set(backs)|{r['deck'] for r in rows}
        if not decks or any(backs[d]!=1 or counts[d]<1 for d in decks):
            raise ValueError('Chaque paquet doit avoir un dos et au moins une face.')
        write_json(stage/'recipe.json', recipe)
        write_json(stage/'manifest.json', {'tool_version': VERSION, 'pymupdf_version': fitz.VersionBind,
                    'pillow_version': pillow_version, 'dpi': dpi, 'sources': declared,
                    'output_format': 'JPEG', 'jpeg_quality': 95, 'jpeg_subsampling': 0,
                    'start_indices': starts, 'numbering_confirmed': True,
                    'decks': {d: {'faces': counts[d], 'start_index': starts[d],
                                 'end_index': starts[d] + counts[d] - 1,
                                 'back': f'{d}/back.jpg'} for d in sorted(decks)},
                    'cards': rows, 'ignored': [r for r in recipe['cards'] if r['role']=='ignore']})
        contact(items, stage/'preview')
        stage.rename(out)
        with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
            for file in sorted(out.rglob('*')):
                if file.is_file():
                    info = zipfile.ZipInfo(file.relative_to(out).as_posix(), date_time=(2026,1,1,0,0,0))
                    info.compress_type = zipfile.ZIP_DEFLATED
                    z.writestr(info,file.read_bytes())
        print(json.dumps({'out': str(out), 'archive': str(archive), 'faces': dict(counts), 'backs': dict(backs)}))
    except Exception:
        shutil.rmtree(stage,ignore_errors=True)
        raise
    finally:
        for source in sources.values():
            source.close()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest='command',required=True)
    i = sub.add_parser('inspect')
    i.add_argument('inputs',nargs='+')
    i.add_argument('--out',required=True)
    i.set_defaults(run=inspect)
    e = sub.add_parser('extract')
    e.add_argument('recipe')
    e.add_argument('--out',required=True)
    e.add_argument('--source',nargs=2,action='append',metavar=('ID','PATH'))
    e.set_defaults(run=extract)
    args = p.parse_args()
    try:
        args.run(args)
    except (ValueError, KeyError, OSError) as error:
        p.exit(2,f'Erreur : {error}\n')


if __name__ == '__main__':
    main()

