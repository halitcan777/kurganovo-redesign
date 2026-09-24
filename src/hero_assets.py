# Для фото шапок: мобильная версия <name>-900.webp и крошечное размытое превью (LQIP) в src/lqip.json.
# Запуск: python3 src/hero_assets.py <name> [<name> ...]
import sys, io, json, base64, os
from PIL import Image, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); IMG = os.path.join(HERE, '..', 'assets', 'img')
out = os.path.join(HERE, 'lqip.json')
data = json.load(open(out)) if os.path.exists(out) else {}
for name in sys.argv[1:]:
    im = Image.open(os.path.join(IMG, f'{name}.webp')).convert('RGB')
    m = im.copy(); m.thumbnail((900, 900)); m.save(os.path.join(IMG, f'{name}-900.webp'), 'WEBP', quality=74, method=6)
    t = im.copy(); t.thumbnail((40, 40)); t = t.filter(ImageFilter.GaussianBlur(1.2))
    b = io.BytesIO(); t.save(b, 'WEBP', quality=45); data[name] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
json.dump(data, open(out, 'w'), ensure_ascii=False, indent=0)
print({k: len(v) for k, v in data.items()})
