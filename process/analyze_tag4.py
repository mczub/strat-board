#!/usr/bin/env python3
"""Analyze the tag 0x04 structure difference."""

from stgy_mini import decode_stgy
import struct

# 2-object game code
game_code = "[stgy:aTHOjrINWUqOLJfJKCRoOv7gOFSK0Icl1ySdZY69V9-gaA+rFXS1lC1KCkcBkGfeTsUQ0P113b47n7Jx4G6dltP9218j9-F8+L4sk6537Qfine-SYiks-y+j-n53]"

binary = decode_stgy(game_code)

print("Analyzing 2-object game structure")
print("=" * 70)

# Header
print(f"0x00: Version = {struct.unpack_from('<I', binary, 0)[0]}")
print(f"0x04: Field2 = {struct.unpack_from('<I', binary, 4)[0]} (was 100 for single, now {struct.unpack_from('<I', binary, 4)[0]} for 2)")
print(f"0x12: Payload Size = {struct.unpack_from('<I', binary, 0x12)[0]}")
print(f"0x18: Object Count = {struct.unpack_from('<H', binary, 0x18)[0]}")
name = binary[0x1C:0x24].rstrip(b'\x00').decode('utf-8')
print(f"0x1C: Name = '{name}'")

# Objects
print("\n--- Objects ---")
pos = 0x24
obj_count = 0
while pos < len(binary) - 4:
    marker = struct.unpack_from('<H', binary, pos)[0]
    if marker != 2:
        break
    type_id = struct.unpack_from('<H', binary, pos + 2)[0]
    print(f"  Object at 0x{pos:02X}: type={type_id}")
    pos += 4
    obj_count += 1

print(f"\nObject list ends at 0x{pos:02X}, found {obj_count} objects")

# Tag 0x04
print("\n--- Tag 0x04 ---")
tag = struct.unpack_from('<H', binary, pos)[0]
print(f"0x{pos:02X}: Tag = {tag}")
val1 = struct.unpack_from('<H', binary, pos + 2)[0]
val2 = struct.unpack_from('<H', binary, pos + 4)[0]
val3 = struct.unpack_from('<H', binary, pos + 6)[0]
print(f"0x{pos+2:02X}: val1 = {val1}")
print(f"0x{pos+4:02X}: val2 = {val2}")  
print(f"0x{pos+6:02X}: val3 = {val3}")

# For 2 objects, val2 should be 2?
print(f"\nHypothesis: Tag 0x04 format is [tag=4] [1] [object_count] [1]")
print(f"  Game has: [4] [{val1}] [{val2}] [{val3}]")
print(f"  Expected: [4] [1] [2] [1]")

# Continue parsing
pos += 8
print(f"\n--- Rest of structure from 0x{pos:02X} ---")
while pos < len(binary) - 2:
    tag = struct.unpack_from('<H', binary, pos)[0]
    if tag == 0 or tag > 20:
        break
    print(f"0x{pos:02X}: Tag={tag}")
    pos += 2
    # Read values until next tag
    vals = []
    while pos < len(binary) - 2:
        val = struct.unpack_from('<H', binary, pos)[0]
        if 1 <= val <= 12 and (pos + 4 > len(binary) or struct.unpack_from('<H', binary, pos + 2)[0] in [0, 1, 2, 3]):
            break
        vals.append(val)
        pos += 2
        if len(vals) > 10:
            break
    print(f"       Values: {vals[:8]}...")
