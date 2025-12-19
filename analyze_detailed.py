#!/usr/bin/env python3
"""Detailed analysis of FF14 strategy board object format."""

from stgy_mini import decode_stgy
import struct

# Test case
sample = "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"
data = decode_stgy(sample)

print("Full structure analysis:")
print("="*60)

# Parse header
version = struct.unpack_from('<I', data, 0)[0]
grid_size = struct.unpack_from('<I', data, 4)[0]
payload_size = struct.unpack_from('<I', data, 0x12)[0]

print(f"Offset 0x00: Version/Format = {version}")
print(f"Offset 0x04: Grid Size? = {grid_size}")
print(f"Offset 0x12: Payload Size? = {payload_size}")

# Parse name section
obj_count = struct.unpack_from('<H', data, 0x18)[0]
name_len = struct.unpack_from('<H', data, 0x1A)[0]
name = data[0x1C:0x1C+8].rstrip(b'\x00').decode('utf-8')

print(f"Offset 0x18: Object Count = {obj_count}")
print(f"Offset 0x1A: Name Field Length = {name_len}")
print(f"Offset 0x1C: Name = '{name}'")

# Now parse the object data section starting after the name
# Name is 8 bytes, so object data starts at 0x24
obj_start = 0x24
print(f"\n--- Object Data (starting at 0x{obj_start:02X}) ---")

# Let's interpret this as a series of tag-length-value or similar
pos = obj_start
while pos < len(data) - 2:
    tag = struct.unpack_from('<H', data, pos)[0]
    # Try to interpret the next bytes
    if pos + 4 <= len(data):
        val16 = struct.unpack_from('<H', data, pos+2)[0]
        print(f"  0x{pos:02X}: Tag={tag:04X} (dec:{tag:3d}), Next u16 = {val16}")
    pos += 2

print("\n--- Annotated Object Fields (hypothesis) ---")
# Based on offsets 54 being X, let's work backwards
# Offset 54 = 0x36, from object start (0x24) = offset 0x12 into object

# Let me show the object bytes with annotations
print("\nRaw object bytes from 0x24:")
obj_data = data[0x24:]
for i in range(0, len(obj_data), 2):
    if i + 2 <= len(obj_data):
        val = struct.unpack_from('<H', obj_data, i)[0]
        abs_offset = 0x24 + i
        note = ""
        if abs_offset == 0x36:
            note = " <-- X coordinate (0 * 10 = 0)"
        print(f"  0x{abs_offset:02X} (obj+{i:02X}): {val:5d} (0x{val:04X}){note}")
