#!/usr/bin/env python3
"""Find all per-icon property sections in strategy board data."""

from stgy_mini import decode_stgy
import struct

sample = "[stgy:aMr649woI0LSOuMMmfuj4TVEWpCUw2q6DLbeY2paX169t7i8DHN01kNraCx2m2EzeN-Wer8SndrycRuqilAdD3ciQHTzfKes086m4hLxf4juycL095He3w4Onejt3pIKG77e-Hf9MUX8fVPz2tTnSRPN+fbYyTBqvHXtA0g-DwcrK9e2Q6MXhje85OMcVbMgiMkgv03h872lvWzLhqkKZ4VAcfKo0eFcjoKz59lL5r8DFD8EfJUg3s5gvGc-qNHvaT+uDrWkxXA6r-Ne-m8LLNc2CcmAjhQkycIvEy+h6jiMtiO5+bFwOpLo3OFxzTuacEotvBrpEBOgNDIwoxf6AgGQ5mMmul6LtLRGMWoUy6R4WDM+cZKnLG6RVwjpzLxIAqp0UThV7idOfiPRiBRnZRvPBqV13uH+YR8Pgz5YqNvT3acSFojsOkQMyd6B6bvBw+aWoYW8EGA0ZvUN1O47D+DDohO0XOVVmeulnhfq1]"

data = decode_stgy(sample)
icon_count = 48

print("Looking for per-icon property sections")
print("=" * 60)

# From hex dump and previous analysis, sections have format:
# [tag u16] [type/len u16] [count u16] [data...]

# Search for sections with exactly 48 items of data
# SIZE = 48 bytes of 100 (found at 0x276)
# ANGLE = likely 48 values of 0 (u16 each = 96 bytes?)
# TRANSPARENCY = likely 48 values of 0 

# Look at section 0x0A, 0x0B, 0x0C which had zeros
sections = {
    '0x06': 0x210,  # After coordinates
    '0x0A': 0x370,  # All zeros section
    '0x0B': 0x3D8,  # All zeros section
    '0x0C': 0x440,  # All zeros section
}

# Let me look at the data more systematically
# Find runs of 48+ zeros or 48+ identical values

print("\nSearching for 48-value arrays in data...")
print("-" * 60)

# Sizes of different value types for 48 items:
# 48 u8 = 48 bytes
# 48 u16 = 96 bytes  
# 48 u32 = 192 bytes

# Check for 48-byte runs of zeros (u8 zeros)
for i in range(len(data) - 48):
    chunk = data[i:i+48]
    if all(b == 0 for b in chunk):
        # Check if it's exactly 48 (not more)
        before_ok = i == 0 or data[i-1] != 0
        if before_ok:
            print(f"48 zero bytes starting at 0x{i:04X}")
            # Show context before
            if i >= 6:
                print(f"  Header before: {list(data[i-6:i])}")

# Check for 48-byte runs of 100 (u8)
for i in range(len(data) - 48):
    chunk = data[i:i+48]
    if all(b == 100 for b in chunk):
        print(f"\n48 bytes of 100 starting at 0x{i:04X} - SIZE SECTION!")

# Look at the 0x0B section which had all zeros
print("\n" + "=" * 60)
print("Tag 0x0B section (potential angle/transparency):")
print("=" * 60)

# Find 0x0B tag
pos = data.find(b'\x0b\x00')
if pos >= 0:
    print(f"Tag 0x0B at 0x{pos:04X}")
    header = data[pos:pos+10]
    print(f"Header bytes: {list(header)}")
    # Check data after header
    data_start = pos + 6
    chunk = data[data_start:data_start+100]
    print(f"First 100 bytes of data: {list(chunk)[:50]}...")
    zero_count = chunk.count(0)
    print(f"Zeros in first 100: {zero_count}")

# Look at 0x0C section
print("\n" + "=" * 60)
print("Tag 0x0C section (potential angle/transparency):")
print("=" * 60)

pos = data.find(b'\x0c\x00')
if pos >= 0:
    print(f"Tag 0x0C at 0x{pos:04X}")
    header = data[pos:pos+10]
    print(f"Header bytes: {list(header)}")
    data_start = pos + 6
    chunk = data[data_start:data_start+100]
    print(f"First 100 bytes of data: {list(chunk)[:50]}...")

# Summary
print("\n" + "=" * 60)
print("CONFIRMED SECTIONS:")
print("=" * 60)
print("Tag 0x05: Coordinates (x, y pairs as u16, scaled by 10)")
print("Tag 0x07: Size (48 bytes of u8, default 100)")
print("Tag 0x08: Color (RGBA as 4 bytes per icon)")
print("Tag 0x0A, 0x0B, 0x0C: Likely angle/transparency (zeros)")
