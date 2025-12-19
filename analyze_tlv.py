#!/usr/bin/env python3
"""Deep dive into object structure to understand TLV format."""

from stgy_mini import decode_stgy
import struct

# Tank at 0,0 - our reference
sample = "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"
data = decode_stgy(sample)

print("Deep Structure Analysis")
print("="*80)

# Header
print("\n--- HEADER (0x00 - 0x23) ---")
print(f"0x00: Version = {struct.unpack_from('<I', data, 0)[0]}")
print(f"0x04: Grid size? = {struct.unpack_from('<I', data, 4)[0]}")
print(f"0x08-0x11: Reserved/padding = {data[0x08:0x12].hex()}")
print(f"0x12: Payload size? = {struct.unpack_from('<I', data, 0x12)[0]}")
print(f"0x16: padding = {struct.unpack_from('<H', data, 0x16)[0]}")
print(f"0x18: Object count = {struct.unpack_from('<H', data, 0x18)[0]}")
print(f"0x1A: Name length = {struct.unpack_from('<H', data, 0x1A)[0]}")
print(f"0x1C: Name = '{data[0x1C:0x24].rstrip(b'\\x00').decode()}'")

# Object section - let's try to parse as TLV
print("\n--- OBJECT (0x24 onwards) ---")
print("Trying TLV parsing...")

pos = 0x24
obj_type = struct.unpack_from('<H', data, pos)[0]
obj_len = struct.unpack_from('<H', data, pos+2)[0]
print(f"0x24: Object type = {obj_type}")
print(f"0x26: Object length = {obj_len} bytes")

# Parse the fields within the object
pos = 0x28
print("\n--- OBJECT FIELDS (TLV format: tag u16, then value u16) ---")

# It looks like they might be using a different pattern
# Let's try: each field is (tag: u16, count: u16, value: u16)
# Or maybe: each field is (tag: u16, value: varies)

# Looking at the pattern, it seems like:
# tag=4, followed by three u16 values
# tag=5, followed by some values
# etc.

# Let's try a simpler hypothesis: pairs of (tag, value)
print("\nParsing as simple (tag, value) pairs:")
pos = 0x28
entries = []
while pos + 4 <= len(data):
    tag = struct.unpack_from('<H', data, pos)[0]
    val = struct.unpack_from('<H', data, pos+2)[0]
    entries.append((pos, tag, val))
    pos += 4

for offset, tag, val in entries:
    notes = []
    if offset == 0x34:
        notes.append("before X?")
    if offset == 0x36-2:
        notes.append("X position")
    if offset == 0x38-2:
        notes.append("Y position")  
    note_str = f" ({', '.join(notes)})" if notes else ""
    print(f"  0x{offset:02X}: tag={tag:3d}, val={val:5d}{note_str}")

# Actually looking at differing bytes, let me check value at 0x30-0x32 area
print("\n--- Likely Icon Type Area ---")
print(f"0x30: {struct.unpack_from('<H', data, 0x30)[0]} (might be icon category)")
print(f"0x32: {struct.unpack_from('<H', data, 0x32)[0]} (might be icon sub-type)")
