#!/usr/bin/env python3
"""Full byte comparison between Tank and Tank1."""

from stgy_mini import decode_stgy
import struct

samples = [
    ("Tank", "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"),
    ("Tank1", "[stgy:akEnB7aFN-xGA78VQqlrrZjbOWF3ipFrlKHF3cjydT4qyD2+1qfVMbk7bAfnGygPLk-OEB+XvC5ow5Dnn7SJuBL+nFbVaQva7yiviECnE]"),
]

print("Full byte-by-byte comparison")
print("="*80)

decoded = [decode_stgy(s[1]) for s in samples]

for i, (name, _) in enumerate(samples):
    print(f"\n{name}: {len(decoded[i])} bytes")
    print("Hex dump:")
    data = decoded[i]
    for j in range(0, len(data), 16):
        chunk = data[j:j+16]
        hex_str = " ".join(f"{b:02x}" for b in chunk)
        ascii_str = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
        print(f"  {j:04x}: {hex_str:<48} {ascii_str}")

# Hmm, they only differ by 1 byte. Let me search for ASCII text in each
print("\n" + "="*80)
print("Looking for text strings in each:")
for name, stgy in samples:
    data = decode_stgy(stgy)
    # Find printable ASCII runs
    current = []
    strings = []
    for i, b in enumerate(data):
        if 32 <= b < 127:
            current.append((i, chr(b)))
        else:
            if len(current) >= 2:
                start = current[0][0]
                text = ''.join(c for _, c in current)
                strings.append((start, text))
            current = []
    if len(current) >= 2:
        start = current[0][0]
        text = ''.join(c for _, c in current)
        strings.append((start, text))
    
    print(f"\n{name}:")
    for offset, text in strings:
        print(f"  0x{offset:02X}: '{text}'")
