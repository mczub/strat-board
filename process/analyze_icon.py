#!/usr/bin/env python3
"""Compare Tank vs Tank1 icons to find icon type encoding."""

from stgy_mini import decode_stgy
import struct

# Tank vs Tank1 at same position (x:0, y:0)
samples = [
    ("Tank at 0,0", "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"),
    ("Tank1 at 0,0", "[stgy:akEnB7aFN-xGA78VQqlrrZjbOWF3ipFrlKHF3cjydT4qyD2+1qfVMbk7bAfnGygPLk-OEB+XvC5ow5Dnn7SJuBL+nFbVaQva7yiviECnE]"),
]

print("Icon Type Analysis: Tank vs Tank1")
print("="*80)

decoded_list = []
for name, stgy in samples:
    data = decode_stgy(stgy)
    decoded_list.append((name, data))
    print(f"\n{name}: {len(data)} bytes")

# Find differing bytes
base = decoded_list[0][1]
other = decoded_list[1][1]

print(f"\nLength: {len(base)} vs {len(other)}")

varying = []
for i in range(max(len(base), len(other))):
    b1 = base[i] if i < len(base) else None
    b2 = other[i] if i < len(other) else None
    if b1 != b2:
        varying.append((i, b1, b2))

print(f"\nDiffering bytes ({len(varying)} total):")
print("-"*60)
for pos, v1, v2 in varying:
    v1_str = f"{v1:3d} (0x{v1:02x})" if v1 is not None else "None"
    v2_str = f"{v2:3d} (0x{v2:02x})" if v2 is not None else "None"
    print(f"  Offset 0x{pos:02X}: Tank={v1_str} -> Tank1={v2_str}")

# Show context around differing areas
print("\n" + "="*80)
print("Full comparison of object bytes (0x24 onwards):")
print("-"*80)
print(f"{'Offset':<8} {'Tank':<12} {'Tank1':<12} {'Diff?'}")
print("-"*80)

for i in range(0x24, max(len(base), len(other)), 2):
    if i+2 <= len(base):
        v1 = struct.unpack_from('<H', base, i)[0]
    else:
        v1 = None
    if i+2 <= len(other):
        v2 = struct.unpack_from('<H', other, i)[0]
    else:
        v2 = None
    
    diff = "  <--" if v1 != v2 else ""
    v1_str = f"{v1:5d}" if v1 is not None else "None"
    v2_str = f"{v2:5d}" if v2 is not None else "None"
    print(f"0x{i:02X}     {v1_str:<12} {v2_str:<12} {diff}")
