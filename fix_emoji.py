import re
from pathlib import Path

EXCLUDE = {'node_modules', '.venv', '.next', 'out'}

def fix_file(path):
    text = path.read_text(encoding='utf-8')
    # Двойные бэкслеши -> одинарные
    new_text = text.replace('\\\\u', '\\u')
    # \uXXXX -> реальный символ
    new_text = re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m.group(1), 16)), new_text)
    if text != new_text:
        path.write_text(new_text, encoding='utf-8')
        print(f'Fixed: {path}')

for path in Path('.').rglob('*.tsx'):
    if any(part in EXCLUDE for part in path.parts):
        continue
    fix_file(path)

print('Done!')