"""Debug script to inspect PDF table structure"""
import pdfplumber

pdf_path = r"D:\shivansh Programming\KISKIBREAKKAB\B3 3rd year roomwise_5th Jan.pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Check first page (Room 104 from the image)
    for page_num in [1, 2]:  # Check first 2 pages
        page = pdf.pages[page_num - 1]
        print(f"\n{'='*80}")
        print(f"PAGE {page_num}")
        print(f"{'='*80}")
        
        # Get page text
        text = page.extract_text()
        print(f"\n--- Page Text (first 500 chars) ---")
        print(text[:500])
        
        # Get tables
        tables = page.extract_tables()
        print(f"\n--- Found {len(tables)} table(s) ---")
        
        for table_idx, table in enumerate(tables):
            print(f"\nTable {table_idx + 1}:")
            print(f"Rows: {len(table)}, Columns: {len(table[0]) if table else 0}")
            
            # Print first 10 rows
            for row_idx, row in enumerate(table[:10]):
                print(f"Row {row_idx}: {row}")
