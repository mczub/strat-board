#!/usr/bin/env python3
"""Correctly parse the multi-icon format."""

from stgy_mini import decode_stgy
import struct

# Sample with every class/job icon
sample = "[stgy:aMr649woI0LSOuMMmfuj4TVEWpCUw2q6DLbeY2paX169t7i8DHN01kNraCx2m2EzeN-Wer8SndrycRuqilAdD3ciQHTzfKes086m4hLxf4juycL095He3w4Onejt3pIKG77e-Hf9MUX8fVPz2tTnSRPN+fbYyTBqvHXtA0g-DwcrK9e2Q6MXhje85OMcVbMgiMkgv03h872lvWzLhqkKZ4VAcfKo0eFcjoKz59lL5r8DFD8EfJUg3s5gvGc-qNHvaT+uDrWkxXA6r-Ne-m8LLNc2CcmAjhQkycIvEy+h6jiMtiO5+bFwOpLo3OFxzTuacEotvBrpEBOgNDIwoxf6AgGQ5mMmul6LtLRGMWoUy6R4WDM+cZKnLG6RVwjpzLxIAqp0UThV7idOfiPRiBRnZRvPBqV13uH+YR8Pgz5YqNvT3acSFojsOkQMyd6B6bvBw+aWoYW8EGA0ZvUN1O47D+DDohO0XOVVmeulnhfq1]"

data = decode_stgy(sample)

print(f"Total decoded size: {len(data)} bytes")

# Parse header
obj_count = struct.unpack_from('<H', data, 0x18)[0]
print(f"Object count in header: {obj_count}")

# The pattern at 0x24 seems to be a series of "02 00 XX 00" entries
# where XX is the icon ID. Let's extract all of them.

print("\n=== ICON ID LIST (pattern: 02 00 XX 00) ===")
icon_ids = []
pos = 0x24
while pos < len(data) - 4:
    marker = struct.unpack_from('<H', data, pos)[0]
    icon_id = struct.unpack_from('<H', data, pos+2)[0]
    
    # Check if this looks like the pattern
    if marker == 2 and icon_id < 200:  # Reasonable icon ID range
        icon_ids.append(icon_id)
        pos += 4
    else:
        break  # End of icon list

print(f"Found {len(icon_ids)} icon IDs:")
for i, icon_id in enumerate(icon_ids):
    print(f"  {i+1:2d}. ID={icon_id:3d} (0x{icon_id:02X})")

# Now find what comes after the icon list
print(f"\n=== DATA AFTER ICON LIST (at 0x{pos:04X}) ===")

# The next section might be the coordinate data
# Looking at the hex dump, after the icon IDs we see "04 00 01 00 30 00..."
# Let's check the structure

remaining = data[pos:]
print(f"Remaining data length: {len(remaining)} bytes")

# Show the next few u16 values
print("\nNext values (u16 LE):")
for i in range(0, min(40, len(remaining)), 2):
    val = struct.unpack_from('<H', remaining, i)[0]
    print(f"  0x{pos+i:04X}: {val:5d} (0x{val:04X})")

# Look for the coordinate section - might start with tag 0x05
# From hex: "05 00 03 00 30 00" at around 0x144
coord_start = data.find(b'\x05\x00\x03\x00')
if coord_start >= 0:
    print(f"\n=== COORDINATE SECTION (found at 0x{coord_start:04X}) ===")
    
    # After the header [05 00 03 00 count], we should have pairs of coordinates
    count = struct.unpack_from('<H', data, coord_start + 4)[0]
    print(f"Coordinate count: {count}")
    
    # Read coordinate pairs (each is u16 x, u16 y)
    coord_pos = coord_start + 6
    coords = []
    for i in range(min(count, len(icon_ids))):
        if coord_pos + 4 > len(data):
            break
        x = struct.unpack_from('<H', data, coord_pos)[0]
        y = struct.unpack_from('<H', data, coord_pos + 2)[0]
        coords.append((x, y))
        coord_pos += 4
    
    print(f"Read {len(coords)} coordinate pairs:")
    for i, (x, y) in enumerate(coords):
        real_x = x / 10.0
        real_y = y / 10.0
        icon_id = icon_ids[i] if i < len(icon_ids) else "?"
        print(f"  Icon {icon_id:3d}: x={real_x:6.1f}, y={real_y:6.1f} (raw: {x}, {y})")
