#!/usr/bin/env python3
"""Analyze all job icons from the comprehensive sample."""

from stgy_mini import decode_stgy
import struct

# Sample with every class/job icon
sample = "[stgy:aMr649woI0LSOuMMmfuj4TVEWpCUw2q6DLbeY2paX169t7i8DHN01kNraCx2m2EzeN-Wer8SndrycRuqilAdD3ciQHTzfKes086m4hLxf4juycL095He3w4Onejt3pIKG77e-Hf9MUX8fVPz2tTnSRPN+fbYyTBqvHXtA0g-DwcrK9e2Q6MXhje85OMcVbMgiMkgv03h872lvWzLhqkKZ4VAcfKo0eFcjoKz59lL5r8DFD8EfJUg3s5gvGc-qNHvaT+uDrWkxXA6r-Ne-m8LLNc2CcmAjhQkycIvEy+h6jiMtiO5+bFwOpLo3OFxzTuacEotvBrpEBOgNDIwoxf6AgGQ5mMmul6LtLRGMWoUy6R4WDM+cZKnLG6RVwjpzLxIAqp0UThV7idOfiPRiBRnZRvPBqV13uH+YR8Pgz5YqNvT3acSFojsOkQMyd6B6bvBw+aWoYW8EGA0ZvUN1O47D+DDohO0XOVVmeulnhfq1]"

data = decode_stgy(sample)

print(f"Total decoded size: {len(data)} bytes")
print()

# Parse header
print("=== HEADER ===")
version = struct.unpack_from('<I', data, 0)[0]
grid_size = struct.unpack_from('<I', data, 4)[0]
payload_size = struct.unpack_from('<I', data, 0x12)[0]
obj_count = struct.unpack_from('<H', data, 0x18)[0]
name_len = struct.unpack_from('<H', data, 0x1A)[0]
name = data[0x1C:0x1C+name_len].rstrip(b'\x00').decode('utf-8', errors='replace')

print(f"Version: {version}")
print(f"Grid size: {grid_size}")
print(f"Payload size: {payload_size}")
print(f"Object count: {obj_count}")
print(f"Name: '{name}'")

# Full hex dump
print("\n=== FULL HEX DUMP ===")
for i in range(0, len(data), 16):
    chunk = data[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    ascii_str = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
    print(f"{i:04x}: {hex_str:<48} {ascii_str}")

# Now let's try to parse the objects
print("\n=== PARSING OBJECTS ===")

# Objects start after header at 0x24
pos = 0x24

objects = []
obj_num = 0

while pos < len(data) - 4:
    obj_num += 1
    obj_type = struct.unpack_from('<H', data, pos)[0]
    icon_id = struct.unpack_from('<H', data, pos+2)[0]
    
    # Read ahead to find coordinates
    # From single-icon analysis, coords are at object+0x12 and object+0x14
    # But that's relative to 0x24, so for first object X was at 0x36 = 0x24 + 0x12
    
    # Let's try to find the pattern - scan for coordinate-like values
    # We know coords are scaled by 10
    
    print(f"\nObject {obj_num} at offset 0x{pos:04X}:")
    print(f"  Type marker: {obj_type}")
    print(f"  Icon ID?: {icon_id}")
    
    # Show next 20 bytes as u16 values
    print(f"  Raw u16 values from 0x{pos:04X}:")
    for i in range(0, 40, 2):
        if pos + i + 2 <= len(data):
            val = struct.unpack_from('<H', data, pos + i)[0]
            print(f"    +{i:02X}: {val:5d} (0x{val:04X})")
    
    # For now, assume each object is similar structure
    # Let's skip to next object marker (type=2)
    next_pos = pos + 4
    while next_pos < len(data) - 2:
        val = struct.unpack_from('<H', data, next_pos)[0]
        # Object type marker seems to be 2
        if val == 2 and next_pos > pos + 20:  # At least 20 bytes per object
            # Check if next value looks like a reasonable icon ID (30-100 range)
            next_val = struct.unpack_from('<H', data, next_pos+2)[0]
            if 20 <= next_val <= 200:
                break
        next_pos += 2
    
    obj_size = next_pos - pos
    print(f"  Estimated object size: {obj_size} bytes")
    
    objects.append({
        'offset': pos,
        'type': obj_type,
        'icon_id': icon_id,
        'size': obj_size
    })
    
    if obj_num >= 5:  # Limit output for readability
        print(f"\n... (stopping after 5 objects, total data has {obj_count} objects)")
        break
    
    pos = next_pos
