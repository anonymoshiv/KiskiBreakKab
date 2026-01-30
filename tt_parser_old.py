"""
Timetable Parser for College Room Vacancy Detection
Scans PDF timetables and identifies vacant rooms at specific time slots
"""

import re
import json
from typing import Dict, List, Tuple, Optional
from datetime import datetime, time
from dataclasses import dataclass, asdict
import pdfplumber
from collections import defaultdict


@dataclass
class TimeSlot:
    """Represents a time slot in the timetable"""
    slot_number: int
    start_time: str
    end_time: str


@dataclass
class RoomSchedule:
    """Represents a room's schedule entry"""
    room_number: str
    day: str
    slot_number: int
    subject_code: str
    teacher_name: str
    is_vacant: bool


# Define standard time slots (adjust according to your college timings)
TIME_SLOTS = {
    1: TimeSlot(1, "09:30", "10:20"),
    2: TimeSlot(2, "10:20", "11:10"),
    3: TimeSlot(3, "11:20", "12:10"),
    4: TimeSlot(4, "12:10", "13:00"),
    5: TimeSlot(5, "13:05", "13:55"),
    6: TimeSlot(6, "13:55", "14:45"),
    7: TimeSlot(7, "14:45", "15:35"),
    8: TimeSlot(8, "15:35", "16:25"),
}

DAYS = ["Mo", "Tu", "We", "Th", "Fr"]


class TimetableParser:
    """Main parser class for extracting and analyzing timetable data"""
    
    def __init__(self):
        self.timetable_data: Dict[str, List[RoomSchedule]] = defaultdict(list)
        self.all_rooms: set = set()
    
    def extract_room_number(self, text: str) -> Optional[str]:
        """Extract room number from timetable header or text"""
        # Exclude year patterns (2026, Jan 2026, etc.)
        text_without_year = re.sub(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*\d{4}(-\w+\s*\d{4})?\b', '', text, flags=re.IGNORECASE)
        
        # Look for patterns like "104", "S-606", "RG-1", etc.
        # Priority order: specific formats first, then generic numbers
        room_patterns = [
            r'\b([A-Z]{2}-\d+)\b',  # Patterns like RG-1, RG-2
            r'\b([A-Z]-\d{3,4})\b',  # Patterns like S-606
            r'\b(\d{3})\b(?!\s*year)',  # 3 digit room numbers like 104 (not followed by 'year')
        ]
        
        for pattern in room_patterns:
            match = re.search(pattern, text_without_year)
            if match:
                room_num = match.group(1)
                # Additional validation: skip if it's part of a year reference
                if not re.search(r'year|semester|CSE|3rd', room_num, re.IGNORECASE):
                    return room_num
        return None
    
    def parse_cell_content(self, cell_text: str) -> Tuple[Optional[str], Optional[str], bool]:
        """
        Parse a timetable cell to extract subject code, room, and vacancy status
        Returns: (subject_code, room_number, is_vacant)
        """
        if not cell_text or cell_text.strip() == "":
            return None, None, True
        
        # Clean the text
        cell_text = cell_text.strip()
        
        # Extract subject code (pattern like "23BCS_FS-606")
        subject_match = re.search(r'([A-Z0-9]+_[A-Z]+)', cell_text)
        subject_code = subject_match.group(1) if subject_match else None
        
        # Extract room number (pattern like "S-606", "RG-1")
        room_match = re.search(r'([A-Z]+-?\d+)', cell_text)
        room_number = room_match.group(1) if room_match else None
        
        # Extract teacher name (usually at the beginning)
        teacher_match = re.search(r'^([A-Za-z\s\.]+?)(?=\d|[A-Z]{2})', cell_text)
        teacher_name = teacher_match.group(1).strip() if teacher_match else ""
        
        is_vacant = subject_code is None and room_number is None
        
        return subject_code, room_number, is_vacant
    
    def parse_pdf(self, pdf_path: str) -> Dict[str, List[RoomSchedule]]:
        """
        Parse a PDF timetable file and extract all room schedules
        """
        print(f"[PDF] Parsing PDF: {pdf_path}")
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    print(f"  Processing page {page_num}...")
                    
                    # Extract text to find room number
                    page_text = page.extract_text()
                    room_number = self.extract_room_number(page_text)
                    
                    if not room_number:
                        print(f"  [WARN] Could not find room number on page {page_num}")
                        continue
                    
                    self.all_rooms.add(room_number)
                    print(f"  [OK] Found room: {room_number}")
                    
                    # Extract table data
                    tables = page.extract_tables()
                    
                    if not tables:
                        print(f"  [WARN] No tables found on page {page_num}")
                        continue
                    
                    # Process the main timetable table
                    for table in tables:
                        self._process_table(table, room_number)
            
            print(f"\n[OK] Parsing complete! Found {len(self.all_rooms)} rooms.")
            return self.timetable_data
        
        except FileNotFoundError:
            print(f"[ERROR] File not found - {pdf_path}")
            return {}
        except Exception as e:
            print(f"[ERROR] Error parsing PDF: {str(e)}")
            return {}
    
    def _process_table(self, table: List[List[str]], room_number: str):
        """Process a single table from the PDF"""
        if not table or len(table) < 2:
            return
        
        # The first row should be the header with time slots
        # Days start from row 1 onwards (Mo, Tu, We, Th, Fr)
        for row_idx in range(1, len(table)):
            row = table[row_idx]
            if not row or len(row) < 2:
                continue
            
            # Get day from first column
            day = str(row[0]).strip() if row[0] else ""
            if day not in DAYS:
                continue
            
            # Process each time slot (columns 1-8)
            for slot_num in range(1, 9):
                # Column index is slot_num (since column 0 is the day)
                cell_text = ""
                if slot_num < len(row) and row[slot_num]:
                    cell_text = str(row[slot_num])
                
                # Check if cell is empty (vacant)
                is_vacant = not cell_text or cell_text.strip() == "" or cell_text.strip() == "None"
                
                # Extract subject code if present
                subject_code = ""
                if not is_vacant:
                    # Look for subject code pattern like "23BCS_F"
                    subject_match = re.search(r'(\d{2}[A-Z]+_[A-Z])', cell_text)
                    if subject_match:
                        subject_code = subject_match.group(1)
                
                schedule_entry = RoomSchedule(
                    room_number=room_number,
                    day=day,
                    slot_number=slot_num,
                    subject_code=subject_code,
                    teacher_name="",  # Can be extracted if needed
                    is_vacant=is_vacant
                )
                
                self.timetable_data[room_number].append(schedule_entry)
    
    def find_vacant_rooms(self, day: str, slot_number: int) -> List[str]:
        """
        Find all vacant rooms for a specific day and time slot
        
        Args:
            day: Day of the week (Mo, Tu, We, Th, Fr)
            slot_number: Time slot number (1-8)
        
        Returns:
            List of vacant room numbers
        """
        if day not in DAYS:
            raise ValueError(f"Invalid day. Must be one of: {', '.join(DAYS)}")
        
        if slot_number not in range(1, 9):
            raise ValueError("Invalid slot number. Must be between 1 and 8")
        
        vacant_rooms = []
        
        for room_num in self.all_rooms:
            schedules = self.timetable_data.get(room_num, [])
            
            # Find the schedule for this specific day and slot
            schedule = next(
                (s for s in schedules if s.day == day and s.slot_number == slot_number),
                None
            )
            
            # If no schedule found or marked as vacant, room is available
            if schedule is None or schedule.is_vacant:
                vacant_rooms.append(room_num)
        
        return sorted(vacant_rooms)
    
    def find_vacant_rooms_now(self) -> List[str]:
        """
        Find vacant rooms at the current time
        """
        now = datetime.now()
        current_day_idx = now.weekday()  # Monday is 0
        
        if current_day_idx >= 5:  # Weekend
            return sorted(list(self.all_rooms))  # All rooms vacant on weekends
        
        day = DAYS[current_day_idx]
        current_time = now.time()
        
        # Find current slot
        current_slot = None
        for slot_num, slot in TIME_SLOTS.items():
            start = datetime.strptime(slot.start_time, "%H:%M").time()
            end = datetime.strptime(slot.end_time, "%H:%M").time()
            
            if start <= current_time < end:
                current_slot = slot_num
                break
        
        if current_slot is None:
            return sorted(list(self.all_rooms))  # Outside class hours
        
        return self.find_vacant_rooms(day, current_slot)
    
    def get_room_schedule(self, room_number: str) -> List[RoomSchedule]:
        """Get the complete schedule for a specific room"""
        return self.timetable_data.get(room_number, [])
    
    def export_to_json(self, output_path: str):
        """Export parsed timetable data to JSON"""
        data = {
            "rooms": list(self.all_rooms),
            "schedules": {
                room: [asdict(schedule) for schedule in schedules]
                for room, schedules in self.timetable_data.items()
            },
            "time_slots": {
                str(num): asdict(slot) for num, slot in TIME_SLOTS.items()
            }
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"[OK] Exported to {output_path}")
    
    def print_vacancy_report(self, day: str, slot_number: int):
        """Print a formatted report of vacant rooms"""
        vacant_rooms = self.find_vacant_rooms(day, slot_number)
        slot_info = TIME_SLOTS[slot_number]
        
        print(f"\n{'='*60}")
        print(f"VACANT ROOMS REPORT")
        print(f"{'='*60}")
        print(f"Day: {day}")
        print(f"Time Slot: {slot_number} ({slot_info.start_time} - {slot_info.end_time})")
        print(f"{'='*60}")
        
        if vacant_rooms:
            print(f"\n[OK] {len(vacant_rooms)} vacant room(s) found:")
            for room in vacant_rooms:
                print(f"  - Room {room}")
        else:
            print("\n[NONE] No vacant rooms found for this slot.")
        
        print(f"{'='*60}\n")


def main():
    """Example usage of the TimetableParser"""
    parser = TimetableParser()
    
    # Parse the PDF file
    pdf_path = r"D:\shivansh Programming\KISKIBREAKKAB\B3 3rd year roomwise_5th Jan.pdf"
    parser.parse_pdf(pdf_path)
    
    # Example 1: Find vacant rooms for Monday, Slot 3
    print("\n--- Example 1: Find vacant rooms for Monday, Slot 3 ---")
    parser.print_vacancy_report("Mo", 3)
    
    # Example 2: Find vacant rooms right now
    print("\n--- Example 2: Find vacant rooms right now ---")
    vacant_now = parser.find_vacant_rooms_now()
    print(f"Currently vacant rooms: {', '.join(vacant_now)}")
    
    # Example 3: Get schedule for a specific room
    print("\n--- Example 3: Get schedule for Room 104 ---")
    room_schedule = parser.get_room_schedule("104")
    if room_schedule:
        print(f"\nRoom 104 Schedule:")
        for entry in room_schedule[:5]:  # Show first 5 entries
            status = "VACANT" if entry.is_vacant else f"{entry.subject_code}"
            print(f"  {entry.day} Slot {entry.slot_number}: {status}")
    
    # Export to JSON
    parser.export_to_json("timetable_data.json")


if __name__ == "__main__":
    main()
