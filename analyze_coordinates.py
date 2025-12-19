#!/usr/bin/env python3
"""Analyze coordinate encoding in FF14 strategy boards."""

from stgy_mini import decode_stgy
import struct

# All test cases with known coordinates
samples = [
    ("x:0, y:0", "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"),
    ("x:1, y:0", "[stgy:atQzQvwo-frK2Xj8kiZzzLYcnvwV9HwzZ4uwV1YpSeHifFobTi08QctXsn0GjMHHZF4k8Iszpfbh2FAwudkbLocYWd71CH6ekio3jjkxSI]"),
    ("x:2, y:0", "[stgy:a9-q6mVHc1WgndPLikVvv8x-2zHZtwHvVIMHZfxFUawk1pBN0kTLq-9d-pTlPuwwVpIiL45vF1N7npOHMXiGIkRcnNVbXqN-j95GV4NWOuaa]"),
    ("x:3, y:0", "[stgy:adU4o32yjYC9ewgEh7JNNGIPabA6XOANJ3nA6xIsuzO7Y5yLr7WEoPdwW5WSg2OOJ53hElfNsYLpe5TAnHhk37cjeLJ8HoLPKdfkJlLnR2Dv]"),
    ("x:0, y:1", "[stgy:aY0quGEEpH216MPikxba1JOiAdfptdBqkcu-uQTxpHPyABB542FFAEq2UWsnDqy3OMIzwuLM6MWaU3KKHidJ-DgYY1HyXeYr3rXq8k5LUVHq]"),
]

print("Coordinate Analysis")
print("="*80)

# Decode all and find differing bytes
decoded_list = []
for name, stgy in samples:
    data = decode_stgy(stgy)
    decoded_list.append((name, data))
    
# Focus on bytes that differ between samples
# First, find all positions where any sample differs
base = decoded_list[0][1]
varying_positions = set()

for name, data in decoded_list[1:]:
    for i in range(min(len(base), len(data))):
        if base[i] != data[i]:
            varying_positions.add(i)

print(f"Positions that vary across samples: {sorted(varying_positions)}")
print()

# Show values at varying positions for each sample
print("Values at varying positions:")
print("-"*80)
header = f"{'Sample':<12}"
for pos in sorted(varying_positions):
    header += f" 0x{pos:02X}"
print(header)
print("-"*80)

for name, data in decoded_list:
    row = f"{name:<12}"
    for pos in sorted(varying_positions):
        val = data[pos] if pos < len(data) else 0
        # Show as signed byte for potential negative coords
        row += f" {val:4d}"
    print(row)

print()
print("="*80)
print("Hypothesis testing:")
print()

# The X coord changed at offset 54 (0x36) when going from x:0 to x:1
# Let's see the pattern
for name, data in decoded_list:
    # Extract values at key positions as u16 little-endian
    val_34 = struct.unpack_from('<H', data, 0x34)[0]
    val_36 = struct.unpack_from('<H', data, 0x36)[0]  # This was X
    val_38 = struct.unpack_from('<H', data, 0x38)[0]  # Maybe Y?
    
    print(f"{name}: offset 0x34={val_34:3d}, 0x36={val_36:3d}, 0x38={val_38:3d}")

print()
print("Analysis:")
print("  - offset 0x36 appears to be X * 10")
print("  - offset 0x38 appears to be Y * 10")
