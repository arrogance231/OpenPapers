import json, sys
from docling.document_converter import DocumentConverter

path = sys.argv[1]
result = DocumentConverter().convert(path)
text = result.document.export_to_markdown()
print(json.dumps({'title': None, 'sections': [{'level': 0, 'heading': 'Document', 'text': text}], 'references': [], 'warnings': ['Docling fallback returns converted document text; structured references depend on the installed Docling version.']}, ensure_ascii=False))
