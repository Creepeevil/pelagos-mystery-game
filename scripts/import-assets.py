"""Export original PDF pages and notebook icons. Requires pymupdf and Pillow."""
import argparse
import json
from pathlib import Path
import pymupdf
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
GROUPS = {
    'suspects': ['bernica', 'alyssa', 'glaucous', 'celadon'],
    'weapons': ['moon-key', 'metal-clamp', 'power-drill', 'repair-drone'],
    'locations': ['control-room', 'old-library', 'underground-tunnel', 'observation-room'],
}
SOURCES = {
    'repair-drone': '3271bfd84630fc6bed24f2630173487b.jpg',
    'control-room': '207475b719ed45c81f4c45422b8eff39.jpg',
    'power-drill': 'dbebcb51124fdb788d6e778a5d1fa072.jpg',
    'underground-tunnel': 'f6a66d47af9815245621f6150818ab60.jpg',
}

def export(pdf_path, image_dir):
    document = pymupdf.open(pdf_path)
    if len(document) != 24:
        raise ValueError('Expected exactly 24 PDF pages.')
    manifest = []
    for index, (group, card_id) in enumerate((g, i) for g, ids in GROUPS.items() for i in ids):
        card_dir = ROOT / 'assets/cards' / group
        icon_dir = ROOT / 'assets/icons' / group
        card_dir.mkdir(parents=True, exist_ok=True)
        icon_dir.mkdir(parents=True, exist_ok=True)
        for side_index, side in enumerate(['front', 'back']):
            page = document[index * 2 + side_index]
            scale = 1200 / page.rect.width
            pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
            image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
            destination = card_dir / f'{card_id}-{side}.webp'
            image.save(destination, quality=92, method=6)
            manifest.append({'page': index * 2 + side_index + 1, 'file': destination.relative_to(ROOT).as_posix(), 'width': image.width, 'height': image.height})
        source = image_dir / SOURCES.get(card_id, '__unused__')
        if source.is_file():
            icon = Image.open(source).convert('RGB')
        else:
            page = document[index * 2]
            # Original front illustration only; exclude the lower title area.
            clip = pymupdf.Rect(330, 400, 870, 910)
            pix = page.get_pixmap(matrix=pymupdf.Matrix(.65, .65), clip=clip, alpha=False)
            icon = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        icon = ImageOps.pad(icon, (160, 160), color='white')
        icon.save(icon_dir / f'{card_id}.webp', quality=92, method=6)
    (ROOT / 'assets/manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print('Exported 24 full-page WebP cards and 12 notebook icons.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('pdf', type=Path)
    parser.add_argument('--image-dir', type=Path, default=Path('.'))
    args = parser.parse_args()
    export(args.pdf, args.image_dir)
