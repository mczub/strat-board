#!/usr/bin/env python3
"""Analyze per-icon properties: size, angle, transparency."""

from stgy_mini import decode_stgy
import struct

# Multi-icon sample
sample = "[stgy:aMr649woI0LSOuMMmfuj4TVEWpCUw2q6DLbeY2paX169t7i8DHN01kNraCx2m2EzeN-Wer8SndrycRuqilAdD3ciQHTzfKes086m4hLxf4juycL095He3w4Onejt3pIKG77e-Hf9MUX8fVPz2tTnSRPN+fbYyTBqvHXtA0g-DwcrK9e2Q6MXhje85OMcVbMgiMkgv03h872lvWzLhqkKZ4VAcfKo0eFcjoKz59lL5r8DFD8EfJUg3s5gvGc-qNHvaT+uDrWkxXA6r-Ne-m8LLNc2CcmAjhQkycIvEy+h6jiMtiO5+bFwOpLo3OFxzTuacEotvBrpEBOgNDIwoxf6AgGQ5mMmul6LtLRGMWoUy6R4WDM+cZKnLG6RVwjpzLxIAqp0UThV7idOfiPRiBRnZRvPBqV13uH+YR8Pgz5YqNvT3acSFojsOkQMyd6B6bvBw+aWoYW8EGA0ZvUN1O47D+DDohO0XOVVmeulnhfq1]"

data = decode_stgy(sample)
icon_count = 48  # We know this from earlier analysis

print("Analyzing per-icon properties (size, angle, transparency)")
print("=" * 60)

# From earlier analysis, data sections start after icon list at ~0xE4
# Let's look for patterns

# Section tags we identified:
# 0x05 = coordinates (count, then x,y pairs)
# 0x06 = ?
# 0x07 = ? (had 0x64 = 100, likely SIZE)
# 0x08 = colors (RGBA)
# 0x0A = ?
# 0x0B = ?
# 0x0C = ?

def find_section(data, tag):
    """Find a section by its tag and return offset."""
    tag_bytes = struct.pack('<H', tag)
    pos = 0
    while pos < len(data) - 2:
        if data[pos:pos+2] == tag_bytes:
            return pos
        pos += 1
    return -1

# Find each section
sections = {}
for tag in [0x04, 0x05, 0x06, 0x07, 0x08, 0x0A, 0x0B, 0x0C, 0x03]:
    pos = find_section(data, tag)
    if pos >= 0:
        sections[tag] = pos

print("\nSection offsets found:")
for tag, pos in sorted(sections.items()):
    print(f"  Tag 0x{tag:02X} at offset 0x{pos:04X}")

# Analyze each section
print("\n" + "=" * 60)
print("Section Analysis:")
print("=" * 60)

for tag in sorted(sections.keys()):
    pos = sections[tag]
    print(f"\n### Tag 0x{tag:02X} at 0x{pos:04X}:")
    
    # Read header: tag(u16), maybe type/count(u16), then data
    tag_val = struct.unpack_from('<H', data, pos)[0]
    next_val = struct.unpack_from('<H', data, pos+2)[0]
    
    if tag == 0x07:
        # Suspected SIZE section
        print(f"  Header: tag={tag_val}, next={next_val}")
        # Show values - should be 100 for each icon
        start = pos + 4  # After header
        values = []
        for i in range(min(icon_count, 10)):
            if start + i < len(data):
                val = data[start + i]
                values.append(val)
        print(f"  First 10 byte values: {values}")
        print(f"  If these are all 100, this is SIZE!")
        
    elif tag == 0x06:
        # Unknown - check for zeros (could be angle or transparency)
        print(f"  Header: tag={tag_val}, next={next_val}")
        start = pos + 6
        values = []
        for i in range(min(icon_count * 2, 20)):
            if start + i * 2 + 2 <= len(data):
                val = struct.unpack_from('<H', data, start + i * 2)[0]
                values.append(val)
        print(f"  First values (u16): {values[:10]}")
        
    elif tag == 0x0A or tag == 0x0B or tag == 0x0C:
        # These might be angle/transparency
        print(f"  Header: tag={tag_val}, next={next_val}")
        start = pos + 6
        byte_vals = list(data[start:start+20])
        print(f"  First 20 bytes: {byte_vals}")
        
    else:
        print(f"  Header: tag={tag_val}, next={next_val}")

# Look at the section around 0x270 where we saw "0x64 0x64 0x64..." pattern
print("\n" + "=" * 60)
print("Detailed look at 0x270-0x2B0 (size section?):")
print("=" * 60)
chunk = data[0x270:0x2B0]
print("Hex:", chunk.hex())
print("As bytes:", list(chunk))
# Count 100s (0x64)
count_100 = chunk.count(0x64)
print(f"Count of 0x64 (100): {count_100}")
print(f"Expected for {icon_count} icons: {icon_count}")
