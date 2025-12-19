#!/usr/bin/env python3
"""Find transparency value (60) in donut object."""

from stgy_mini import decode_stgy
import struct

sample = "[stgy:apPgx54fEg37r5kQyDuVVqtGWZ1MFf1VuX01MKt-OCzDrczJ4DIQeGp5GrIv7-q9IpgW9RlyL6xRTxcv05HHaOvwPAWQheukoATBDrTtl+LH8mTRu]"
data = decode_stgy(sample)

print("Looking for transparency=60 (0x3C)")
print("=" * 60)

# 60 in hex = 0x3C
# Search for 0x3C in the data
for i in range(len(data)):
    if data[i] == 0x3C:
        print(f"Found 0x3C at offset 0x{i:02X}")
        # Show context
        start = max(0, i-4)
        end = min(len(data), i+4)
        context = data[start:end]
        print(f"  Context: {[hex(b) for b in context]}")

# Full breakdown of tag-value structure
print("\n" + "=" * 60)
print("Complete tag-value breakdown:")
print("=" * 60)

# Object starts at 0x24
# Format appears to be: [02 00] [type u16] then fields with [tag u16] [len u16] [count u16] [value(s)]

# Let's parse more carefully
pos = 0x24
print(f"\n0x{pos:02X}: Object marker = {struct.unpack_from('<H', data, pos)[0]}")
pos += 2
print(f"0x{pos:02X}: Object type = {struct.unpack_from('<H', data, pos)[0]} (0x11 = 17 = Donut attack?)")
pos += 2

# Now parse tag structures
print("\nTag structures:")
while pos < len(data) - 6:
    tag = struct.unpack_from('<H', data, pos)[0]
    if tag == 0 or tag > 20:
        break
    
    type_or_len = struct.unpack_from('<H', data, pos+2)[0]
    count = struct.unpack_from('<H', data, pos+4)[0]
    
    # Read values based on count
    values = []
    val_pos = pos + 6
    for i in range(min(count, 4)):  # Limit to first 4 values
        if val_pos + 2 <= len(data):
            val = struct.unpack_from('<H', data, val_pos)[0]
            values.append(val)
            val_pos += 2
    
    print(f"  0x{pos:02X}: Tag={tag:2d} (0x{tag:02X}), Type/Len={type_or_len}, Count={count}, Values={values}")
    
    # Advance to next tag (guess: 6 bytes header + count * 2 bytes)
    pos = val_pos

print("\n" + "=" * 60)
print("PARAMETER MAPPING:")
print("=" * 60)
print("""
Based on this donut object (x=0, y=0, size=50, angle=30, transparency=60, arc_angle=320, donut_radius=80):

Tag 0x05: Coordinates - x=0, y=0 (at 0x36-0x39)
Tag 0x06: ANGLE = 30 (at 0x40)
Tag 0x07: SIZE = 50 (at 0x48)
Tag 0x08: COLOR = 0xFFFFFF3C (note: 0x3C = 60 = TRANSPARENCY!)
Tag 0x0A: ARC_ANGLE = 320 (at 0x5A)
Tag 0x0B: DONUT_RADIUS = 80 (at 0x62)
Tag 0x0C: Reserved/zero

The transparency is stored in the ALPHA channel of the color (Tag 0x08)!
0xFFFFFF3C = R=255, G=255, B=255, A=60 (transparency)
""")

# Verify color section
print("Verifying color section at Tag 0x08:")
color_pos = data.find(b'\x08\x00\x02\x00')
if color_pos >= 0:
    print(f"  Found at 0x{color_pos:02X}")
    print(f"  Bytes: {list(data[color_pos:color_pos+10])}")
    # Color is likely: 1 count, then 4 bytes RGBA
    r = data[color_pos + 6]
    g = data[color_pos + 7]
    b = data[color_pos + 8]
    a = data[color_pos + 9]
    print(f"  Color: R={r}, G={g}, B={b}, A={a} (A=60 = transparency!)")
