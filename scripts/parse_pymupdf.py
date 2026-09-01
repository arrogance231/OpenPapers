import json, sys
import pymupdf

path = sys.argv[1]
doc = pymupdf.open(path)
sections = []
for index, page in enumerate(doc, 1):
    text = ' '.join(page.get_text('text').split())
    if text:
        sections.append({'level': 0, 'heading': f'Page {index}', 'text': text})
print(json.dumps({'title': doc.metadata.get('title') or None, 'sections': sections, 'references': [], 'warnings': ['PyMuPDF fallback provides page text; reference structure may be incomplete.']}, ensure_ascii=False))
