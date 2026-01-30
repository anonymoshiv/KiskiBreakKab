# Timetable Parser

A Python tool to parse college timetable PDFs and find vacant rooms at specific time slots.

## Features

- 📄 **PDF Parsing**: Extracts timetable data from PDF files for all rooms
- 🔍 **Vacancy Detection**: Find which rooms are vacant at any day/time slot
- ⏰ **Real-time Check**: Find vacant rooms right now based on current time
- 📊 **Schedule View**: View complete schedule for any room
- 💾 **JSON Export**: Export parsed data to JSON for integration with other apps

## Installation

1. Install dependencies:
```bash
pip install pdfplumber Pillow
```

or using the requirements file:
```bash
pip install -r requirements_parser.txt
```

## Usage

### CLI Tool (Interactive)

Run the interactive query tool:
```bash
python query_rooms.py
```

This provides an interactive menu to:
- Find vacant rooms right now
- Find vacant rooms for specific day/time
- View a room's complete schedule
- List all available rooms

### Python API

```python
from tt_parser import TimetableParser

# Initialize parser
parser = TimetableParser()

# Parse PDF file
parser.parse_pdf("B3 3rd year roomwise_5th Jan.pdf")

# Find vacant rooms for Monday, Slot 3
vacant_rooms = parser.find_vacant_rooms("Mo", 3)
print(f"Vacant rooms: {vacant_rooms}")

# Find vacant rooms right now
vacant_now = parser.find_vacant_rooms_now()
print(f"Currently vacant: {vacant_now}")

# Get schedule for a specific room
schedule = parser.get_room_schedule("104")
for entry in schedule:
    print(f"{entry.day} Slot {entry.slot_number}: {'VACANT' if entry.is_vacant else entry.subject_code}")

# Export to JSON
parser.export_to_json("timetable_data.json")
```

## Time Slots

The parser is configured with the following time slots (CSE 3rd year):

| Slot | Time |
|------|------|
| 1 | 09:30 - 10:20 |
| 2 | 10:20 - 11:10 |
| 3 | 11:20 - 12:10 |
| 4 | 12:10 - 13:00 |
| 5 | 13:05 - 13:55 |
| 6 | 13:55 - 14:45 |
| 7 | 14:45 - 15:35 |
| 8 | 15:35 - 16:25 |

## Days

- `Mo` - Monday
- `Tu` - Tuesday
- `We` - Wednesday
- `Th` - Thursday
- `Fr` - Friday

## Output Example

```
============================================================
VACANT ROOMS REPORT
============================================================
Day: Mo
Time Slot: 3 (11:20 - 12:10)
============================================================

[OK] 18 vacant room(s) found:
  - Room 208
  - Room 613
  - Room 701
  - Room 801
  - Room L-506
  ...
============================================================
```

## Integration with Next.js App

The parsed data can be exported to JSON and used in your Next.js application:

1. Parse the PDF and export to JSON:
```python
parser.export_to_json("public/timetable_data.json")
```

2. Import in your Next.js API route:
```typescript
import timetableData from '@/public/timetable_data.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get('day');
  const slot = parseInt(searchParams.get('slot') || '0');
  
  // Filter vacant rooms based on day and slot
  const vacantRooms = findVacantRooms(timetableData, day, slot);
  
  return Response.json({ vacantRooms });
}
```

## File Structure

```
├── tt_parser.py              # Main parser class
├── query_rooms.py            # Interactive CLI tool
├── requirements_parser.txt   # Python dependencies
├── debug_pdf.py             # Debug tool for PDF inspection
└── timetable_data.json      # Exported timetable data
```

## Supported Room Formats

The parser can detect various room number formats:
- Simple numbers: `104`, `208`, `605`
- Letter-Number: `S-606`, `S-620`, `L-307`
- Double Letter-Number: `RG-1`, `RG-2`, `SS-101`
- Complex: `OT-801`, `PP-802`, `M-703`

## Troubleshooting

### Room numbers not detected
If the parser can't find room numbers on some pages, check the PDF structure using the debug tool:
```bash
python debug_pdf.py
```

### Wrong time slots
Update the `TIME_SLOTS` dictionary in `tt_parser.py` to match your college timings.

### Missing schedule data
Ensure the PDF has proper table structure. The parser expects:
- Header row with slot numbers (1-8)
- Data rows starting with day abbreviations (Mo, Tu, We, Th, Fr)
- Cell content with subject codes and room numbers

## License

Feel free to use and modify for your college timetable needs!
