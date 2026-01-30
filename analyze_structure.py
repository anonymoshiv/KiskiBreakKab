import pdfplumber
import re

pdf = pdfplumber.open(r'D:\shivansh Programming\KISKIBREAKKAB\B3 3rd year roomwise_5th Jan.pdf')

pages_to_check = [0, 1, 2, 12, 13, 20]

print('Analyzing timetable structure:\n')
print('='*80)

for i in pages_to_check:
    page = pdf.pages[i]
    text = page.extract_text()
    
    # Find the identifier (room/section number)
    lines = text.split('\n')
    identifier = None
    for line in lines[:10]:
        if re.match(r'^\d{3}$', line.strip()) or re.match(r'^[A-Z]+-\d+$', line.strip()):
            identifier = line.strip()
            break
    
    # Get first cell content
    tables = page.extract_tables()
    first_cell = "No table"
    if tables and len(tables[0]) > 1 and len(tables[0][1]) > 1:
        first_cell = tables[0][1][1][:100] if tables[0][1][1] else "Empty"
    
    print(f'\nPage {i+1}:')
    print(f'  Identifier: {identifier}')
    print(f'  First Monday Slot 1 content: {first_cell}')

pdf.close()
