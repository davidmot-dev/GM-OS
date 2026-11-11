import json
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).parent
inspection = root / 'inspection'
pages = list(range(1, 81, 2)) + [2]
for offset in range(0, len(pages), 12):
    batch = pages[offset:offset + 12]
    sheet = Image.new('RGB', (1533, ((len(batch)+2)//3)*394), '#e6e6e6')
    draw = ImageDraw.Draw(sheet)
    for i, page in enumerate(batch):
        with Image.open(inspection / f's0-p{page:04d}.png') as source:
            im = source.transpose(Image.Transpose.ROTATE_270)
            x, y = (i % 3)*511, (i//3)*394
            sheet.paste(im, (x+6, y+26))
            draw.text((x+6, y+6), f'Page source {page} / rotation 90 CW', fill='black')
    sheet.save(inspection / f'orientation-action-{offset//12+1:02d}.png')

inventory = json.loads((inspection / 'inventory.json').read_text(encoding='utf-8'))
s = inventory['sources'][0]
report = {
    'status': 'source_inspected_awaiting_numbering',
    'source_sha256': s['sha256'],
    'source_pages': len(s['pages']),
    'decks': {
        'action': {'faces': 40, 'backs_in_source': 40, 'rotate_cw': 90},
        'cosm-aysle': {'faces': 10, 'backs_in_source': 10, 'rotate_cw': 0},
        'destin': {'faces': 5, 'backs_in_source': 5, 'rotate_cw': 0},
    },
    'expected_export': {'faces': 55, 'distinct_backs': 3, 'jpeg_cards': 58},
    'identical_back_page_groups': s['identical_page_groups'],
    'reference_recipe_available': False,
    'previous_card_hash_comparison': 'unavailable_without_reference_manifest',
}
(inspection / 'source-checks.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=False))
