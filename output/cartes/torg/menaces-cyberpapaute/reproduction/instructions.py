import argparse
import hashlib
import io
import json
from pathlib import Path

import fitz
from PIL import Image

def render(recipe_path, source_path, output_dir):
    recipe=json.loads(Path(recipe_path).read_text(encoding='utf-8'))
    assert hashlib.sha256(Path(source_path).read_bytes()).hexdigest()==recipe['sources'][0]['sha256']
    output_dir=Path(output_dir).resolve()
    rows=[]
    with fitz.open(source_path) as pdf:
        for entry in recipe['supplementary_exports']:
            assert entry['source']=='s0' and 1<=entry['page']<=len(pdf)
            target=(output_dir/entry['output']).resolve()
            target.relative_to(output_dir)
            assert not target.exists(), 'Instruction output already exists'
            pix=pdf[entry['page']-1].get_pixmap(dpi=entry['dpi'],colorspace=fitz.csRGB,alpha=False)
            image=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
            buffer=io.BytesIO()
            image.save(buffer,format='JPEG',quality=95,subsampling=0,optimize=True)
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(buffer.getvalue())
            rows.append({**entry,'size_pixels':[pix.width,pix.height],
                'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
    return rows

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('recipe')
    parser.add_argument('--source',required=True)
    parser.add_argument('--out',required=True)
    args=parser.parse_args()
    print(json.dumps(render(args.recipe,args.source,args.out)))
