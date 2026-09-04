import contextlib
import io
import json
import re
import sys
with contextlib.redirect_stdout(io.StringIO()):
    import fitz

path = sys.argv[1]
doc = fitz.open(path)
sections = []
current = None
pending_number = None
heading_re = re.compile(r'^\s*(?:(\d+(?:\.\d+)*)\s+)?([A-Z][A-Za-z0-9][^.!?]{1,100})\s*$')
for page_number, page in enumerate(doc, 1):
    for block in page.get_text('dict')['blocks']:
        for line_data in block.get('lines', []):
            raw = ''.join(span['text'] for span in line_data['spans'])
            line = ' '.join(raw.split()).strip()
            if not line:
                continue
            if re.fullmatch(r'\d+(?:\.\d+)*', line):
                pending_number = line
                continue
            if pending_number and len(line) <= 100 and not re.search(r'[.!?]$', line):
                line = f'{pending_number} {line}'
            pending_number = None
            match = heading_re.match(line)
            numbered = bool(match and match.group(1))
            uppercase = line == line.upper() and len(line.split()) <= 14
            looks_heading = numbered or uppercase or line in {'Introduction', 'Conclusion', 'Summary'}
            if looks_heading and len(line) <= 110:
                heading = match.group(2).strip() if match else line
                current = {'level': 1, 'heading': heading, 'text': '', 'page': page_number}
                sections.append(current)
            elif current is not None:
                if current['text'].endswith('-') and line and (line[0].isalnum() or line[0] in 'ﬁﬂ'):
                    current['text'] += line
                else:
                    current['text'] = (current['text'] + ' ' + line).strip()
sections = [section for section in sections if section['text']]
print(json.dumps({'title': '', 'pages': [{'page': index + 1, 'text': page.get_text('text')} for index, page in enumerate(doc)], 'sections': sections, 'references': [], 'warnings': [], 'equations': [], 'figures': [], 'tables': []}))
