"""
CLI Tool to query vacant rooms from parsed timetable data
Usage: python query_rooms.py
"""

from tt_parser import TimetableParser, TIME_SLOTS, DAYS
from datetime import datetime


def display_menu():
    """Display the main menu"""
    print("\n" + "="*60)
    print("          VACANT ROOM FINDER")
    print("="*60)
    print("\n1. Find vacant rooms right now")
    print("2. Find vacant rooms for specific day/time")
    print("3. View a room's schedule")
    print("4. List all rooms")
    print("5. Re-parse PDF")
    print("6. Exit")
    print("="*60)


def find_rooms_now(parser):
    """Find and display vacant rooms right now"""
    now = datetime.now()
    day_names = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
    
    if now.weekday() >= 5:
        print("\n[INFO] It's the weekend! All rooms are vacant.")
        print(f"Total rooms: {len(parser.all_rooms)}")
        return
    
    day = DAYS[now.weekday()]
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
        print("\n[INFO] Outside class hours. All rooms are vacant.")
        print(f"Total rooms: {len(parser.all_rooms)}")
        return
    
    parser.print_vacancy_report(day, current_slot)


def find_rooms_by_schedule(parser):
    """Find vacant rooms for a specific day and time"""
    print("\n--- Select Day ---")
    for idx, day in enumerate(DAYS, 1):
        full_day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][idx-1]
        print(f"{idx}. {full_day} ({day})")
    
    try:
        day_choice = int(input("\nEnter day number (1-5): "))
        if day_choice < 1 or day_choice > 5:
            print("[ERROR] Invalid choice!")
            return
        
        day = DAYS[day_choice - 1]
    except ValueError:
        print("[ERROR] Please enter a valid number!")
        return
    
    print("\n--- Select Time Slot ---")
    for slot_num, slot in TIME_SLOTS.items():
        print(f"{slot_num}. {slot.start_time} - {slot.end_time}")
    
    try:
        slot_choice = int(input("\nEnter slot number (1-8): "))
        if slot_choice < 1 or slot_choice > 8:
            print("[ERROR] Invalid choice!")
            return
    except ValueError:
        print("[ERROR] Please enter a valid number!")
        return
    
    parser.print_vacancy_report(day, slot_choice)


def view_room_schedule(parser):
    """View schedule for a specific room"""
    room = input("\nEnter room number (e.g., 104, S-606, RG-1): ").strip()
    
    if room not in parser.all_rooms:
        print(f"\n[ERROR] Room '{room}' not found!")
        print(f"Available rooms: {', '.join(sorted(parser.all_rooms)[:20])}...")
        return
    
    schedule = parser.get_room_schedule(room)
    
    if not schedule:
        print(f"\n[WARN] No schedule data found for room {room}")
        return
    
    print(f"\n{'='*60}")
    print(f"SCHEDULE FOR ROOM {room}")
    print(f"{'='*60}\n")
    
    for day in DAYS:
        day_schedule = [s for s in schedule if s.day == day]
        if day_schedule:
            print(f"\n{day} (Monday to Friday)[{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][DAYS.index(day)]}]:")
            for slot_num in range(1, 9):
                slot_entry = next((s for s in day_schedule if s.slot_number == slot_num), None)
                time_slot = TIME_SLOTS[slot_num]
                
                if slot_entry and not slot_entry.is_vacant:
                    status = f"OCCUPIED - {slot_entry.subject_code}"
                else:
                    status = "VACANT"
                
                print(f"  Slot {slot_num} ({time_slot.start_time}-{time_slot.end_time}): {status}")


def list_all_rooms(parser):
    """List all rooms found in the timetable"""
    print(f"\n{'='*60}")
    print(f"ALL ROOMS ({len(parser.all_rooms)} total)")
    print(f"{'='*60}\n")
    
    sorted_rooms = sorted(parser.all_rooms)
    for idx, room in enumerate(sorted_rooms, 1):
        print(f"{room:12}", end="")
        if idx % 5 == 0:
            print()  # New line every 5 rooms
    print("\n")


def main():
    """Main CLI loop"""
    parser = TimetableParser()
    pdf_path = r"D:\shivansh Programming\KISKIBREAKKAB\B3 3rd year roomwise_5th Jan.pdf"
    
    print("\n[INFO] Loading timetable data...")
    parser.parse_pdf(pdf_path)
    
    while True:
        display_menu()
        
        try:
            choice = input("\nEnter your choice (1-6): ").strip()
            
            if choice == "1":
                find_rooms_now(parser)
            elif choice == "2":
                find_rooms_by_schedule(parser)
            elif choice == "3":
                view_room_schedule(parser)
            elif choice == "4":
                list_all_rooms(parser)
            elif choice == "5":
                print("\n[INFO] Re-parsing PDF...")
                parser = TimetableParser()
                parser.parse_pdf(pdf_path)
            elif choice == "6":
                print("\n[INFO] Goodbye!")
                break
            else:
                print("\n[ERROR] Invalid choice! Please enter 1-6.")
        
        except KeyboardInterrupt:
            print("\n\n[INFO] Goodbye!")
            break
        except Exception as e:
            print(f"\n[ERROR] An error occurred: {str(e)}")


if __name__ == "__main__":
    main()
