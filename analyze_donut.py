#!/usr/bin/env python3
"""Analyze donut attack object with known parameters."""

from stgy_mini import decode_stgy
import struct

# Donut Attack with:
# x: 0, y: 0, size: 50, angle: 30, transparency: 60, arc angle: 320, donut radius: 80
sample = "[stgy:apPgx54fEg37r5kQyDuVVqtGWZ1MFf1VuX01MKt-OCzDrczJ4DIQeGp5GrIv7-q9IpgW9RlyL6xRTxcv05HHaOvwPAWQheukoATBDrTtl+LH8mTRu]"

data = decode_stgy(sample)

print("Donut Attack Object Analysis")
print("Expected values:")
print("  x=0, y=0, size=50, angle=30, transparency=60, arc_angle=320, donut_radius=80")
print("=" * 70)

# Full hex dump
print("\nFull hex dump:")
for i in range(0, len(data), 16):
    chunk = data[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    ascii_str = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
    print(f"{i:04x}: {hex_str:<48} {ascii_str}")

print(f"\nTotal length: {len(data)} bytes")

# Parse header
print("\n" + "=" * 70)
print("Header:")
print("=" * 70)
version = struct.unpack_from('<I', data, 0)[0]
grid_size = struct.unpack_from('<I', data, 4)[0]
obj_count = struct.unpack_from('<H', data, 0x18)[0]
name = data[0x1C:0x24].rstrip(b'\x00').decode('utf-8', errors='replace')
print(f"Version: {version}, Grid: {grid_size}, Objects: {obj_count}, Name: '{name}'")

# Object section
print("\n" + "=" * 70)
print("Object data (looking for our known values):")
print("=" * 70)

# Search for our known values in the data
known_values = [0, 0, 50, 30, 60, 320, 80]
print(f"\nSearching for values: {known_values}")

# Read all u16 values from object section onwards
print("\nAll u16 values from 0x24 onwards:")
pos = 0x24
vals = []
while pos + 2 <= len(data):
    val = struct.unpack_from('<H', data, pos)[0]
    vals.append((pos, val))
    pos += 2

for offset, val in vals:
    marker = ""
    if val == 50:
        marker = " <-- SIZE = 50!"
    elif val == 30:
        marker = " <-- ANGLE = 30!"
    elif val == 60:
        marker = " <-- TRANSPARENCY = 60!"
    elif val == 320:
        marker = " <-- ARC ANGLE = 320!"
    elif val == 80:
        marker = " <-- DONUT RADIUS = 80!"
    elif val == 0 and offset in [0x36, 0x38]:
        marker = " <-- X or Y = 0"
        
    if marker or val in [2, 3, 4, 5, 6, 7, 8, 10, 11, 12]:  # tags or interesting values
        print(f"  0x{offset:02X}: {val:5d} (0x{val:04X}){marker}")
