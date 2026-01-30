"""
Timetable Parser for College Room Vacancy Detection (CORRECTED VERSION)
This parser understands that the PDF contains SECTION-WISE timetables,
where each page shows where a section has classes, not what's in a room.
"""

import re
import json
from typing import Dict, List, Set, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
import pdfplumber
from collections import defaultdict


@dataclass
class TimeSlot:
    """Represents a time slot in the timetable"""
    slot_number: int
    start_time: str
    end_time: str


# Define standard time slots
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
    """Parser that correctly handles section-wise timetables to find vacant rooms"""
    
    def __init__(self):
        # Store which rooms are OCCUPIED at each day/slot
        # Structure: occupied_rooms[day][slot_number] = Set of room numbers
        self.occupied_rooms: Dict[str, Dict[int, Set[str]]] = {
            day: {slot: set() for slot in range(1, 9)}
            for day in DAYS
        }
        # All unique room numbers found across all timetables
        self.all_rooms: Set[str] = set()
        # Section timetables for reference
        self.section_schedules: Dict[str, List] = defaultdict(list)
    
    def extract_room_from_cell(self, cell_text: str) -> Optional[str]:
        """
        Extract room number from a timetable cell.
        Cells contain patterns like "23BCS_F\\nS-606" or "23BCS_K\\nRG-1"
        """
        if not cell_text or cell_text.strip() in ["", "None"]:
            return None
        
        # Look for room patterns (more specific patterns first)
        room_patterns = [
            r'\b([A-Z]{2,3}-\d+)\b',  # SS-101, OT-801, PP-802
            r'\b([A-Z]-\d{3,4})\b',    # S-606, L-307, M-703
            r'(?<!\d)(\d{3})(?!\d)',   # 104, 605, 801 (not part of longer number)
        ]
        
        for pattern in room_patterns:
            match = re.search(pattern, cell_text)
            if match:
                room = match.group(1)
                # Validate it's not a year or ID number
                if not re.search(r'(18|19|20)\d{2,3}|[Ee]\d{4,5}', room):
                    return room
        
        return None
    
    def parse_pdf(self, pdf_path: str):
        """
        Parse section-wise timetable PDF and build room occupancy data
        """
        print(f"[PDF] Parsing section timetables: {pdf_path}")
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    tables = page.extract_tables()
                    
                    if not tables:
                        continue
                    
                    # Process the main timetable table
                    self._process_table(tables[0], page_num)
            
            print(f"\n[OK] Parsing complete!")
            print(f"  Total unique rooms found: {len(self.all_rooms)}")
            print(f"  Sample rooms: {', '.join(sorted(list(self.all_rooms))[:10])}")
            
        except FileNotFoundError:
            print(f"[ERROR] File not found - {pdf_path}")
        except Exception as e:
            print(f"[ERROR] Error parsing PDF: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def _process_table(self, table: List[List[str]], page_num: int):
        """Process a single timetable table from a section's page"""
        if not table or len(table) < 2:
            return
        
        # Skip header row (row 0), process data rows (Mo, Tu, We, Th, Fr)
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
                if slot_num >= len(row):
                    continue
                
                cell_text = str(row[slot_num]) if row[slot_num] else ""
                
                # Extract room number from cell
                room = self.extract_room_from_cell(cell_text)
                
                if room:
                    # Mark this room as occupied for this day/slot
                    self.occupied_rooms[day][slot_num].add(room)
                    self.all_rooms.add(room)
    
    def find_vacant_rooms(self, day: str, slot_number: int) -> List[str]:
        """
        Find all vacant rooms for a specific day and time slot
        
        Args:
            day: Day of the week (Mo, Tu, We, Th, Fr)
            slot_number: Time slot number (1-8)
        
        Returns:
            List of vacant room numbers (sorted)
        """
        if day not in DAYS:
            raise ValueError(f"Invalid day. Must be one of: {', '.join(DAYS)}")
        
        if slot_number not in range(1, 9):
            raise ValueError("Invalid slot number. Must be between 1 and 8")
        
        # Rooms that are occupied at this time
        occupied = self.occupied_rooms[day][slot_number]
        
        # Vacant rooms = all rooms - occupied rooms
        vacant = self.all_rooms - occupied
        
        return sorted(list(vacant))
    
    def find_vacant_rooms_now(self) -> List[str]:
        """Find vacant rooms at the current time"""
        now = datetime.now()
        current_day_idx = now.weekday()  # Monday is 0
        
        if current_day_idx >= 5:  # Weekend
            return sorted(list(self.all_rooms))
        
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
    
    def get_room_occupancy(self, room_number: str) -> Dict:
        """Get the occupancy schedule for a specific room"""
        if room_number not in self.all_rooms:
            return {}
        
        schedule = {}
        for day in DAYS:
            schedule[day] = {}
            for slot_num in range(1, 9):
                is_occupied = room_number in self.occupied_rooms[day][slot_num]
                schedule[day][slot_num] = "OCCUPIED" if is_occupied else "VACANT"
        
        return schedule
    
    def print_vacancy_report(self, day: str, slot_number: int):
        """Print a formatted report of vacant rooms"""
        vacant_rooms = self.find_vacant_rooms(day, slot_number)
        occupied_rooms = self.occupied_rooms[day][slot_number]
        slot_info = TIME_SLOTS[slot_number]
        
        print(f"\n{'='*60}")
        print(f"VACANT ROOMS REPORT")
        print(f"{'='*60}")
        print(f"Day: {day}")
        print(f"Time Slot: {slot_number} ({slot_info.start_time} - {slot_info.end_time})")
        print(f"{'='*60}")
        print(f"Total Rooms: {len(self.all_rooms)}")
        print(f"Occupied: {len(occupied_rooms)}")
        print(f"Vacant: {len(vacant_rooms)}")
        print(f"{'='*60}")
        
        if vacant_rooms:
            print(f"\n[OK] {len(vacant_rooms)} vacant room(s):")
            for room in vacant_rooms:
                print(f"  - Room {room}")
        else:
            print("\n[NONE] No vacant rooms found for this slot.")
        
        print(f"\n[INFO] Occupied rooms at this time:")
        for room in sorted(occupied_rooms):
            print(f"  - Room {room}")
        
        print(f"{'='*60}\n")
    
    def export_to_json(self, output_path: str):
        """Export parsed timetable data to JSON"""
        data = {
            "all_rooms": sorted(list(self.all_rooms)),
            "time_slots": {
                str(num): asdict(slot) for num, slot in TIME_SLOTS.items()
            },
            "occupied_rooms": {
                day: {
                    str(slot): sorted(list(rooms))
                    for slot, rooms in slots.items()
                }
                for day, slots in self.occupied_rooms.items()
            }
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"[OK] Exported to {output_path}")


def main():
    """Example usage"""
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
    print(f"Currently vacant rooms ({len(vacant_now)}): {', '.join(vacant_now[:20])}")
    if len(vacant_now) > 20:
        print(f"  ... and {len(vacant_now) - 20} more")
    
    # Example 3: Get occupancy for a specific room
    print("\n--- Example 3: Get occupancy for Room S-606 ---")
    occupancy = parser.get_room_occupancy("S-606")
    if occupancy:
        print("\nRoom S-606 Schedule:")
        for day in DAYS:
            occupied_slots = [str(slot) for slot in range(1, 9) if occupancy[day][slot] == "OCCUPIED"]
            if occupied_slots:
                print(f"  {day}: Occupied during slots {', '.join(occupied_slots)}")
    
    # Export to JSON
    parser.export_to_json("timetable_data.json")


if __name__ == "__main__":
    main()
