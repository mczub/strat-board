#!/usr/bin/env python3
"""Compare encoder output vs known-working original."""

from stgy_mini import decode_stgy as decode_original
from stgy_encoder import build_binary
import json

# Known working original
original_code = "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"

# My encoder input
my_json = {
    "name": "test",
    "objects": [
        {"type": "tank", "x": 0, "y": 0, "size": 100, "angle": 0, "transparency": 0}
    ]
}

# Decode original
original_binary = decode_original(original_code)

# Build my binary
my_binary = build_binary(my_json)

print("COMPARISON: Original vs Encoder Output")
print("=" * 70)
print(f"Original length: {len(original_binary)} bytes")
print(f"Encoder length: {len(my_binary)} bytes")

print("\n--- ORIGINAL HEX ---")
for i in range(0, len(original_binary), 16):
    chunk = original_binary[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    print(f"{i:04x}: {hex_str}")

print("\n--- ENCODER OUTPUT HEX ---")
for i in range(0, len(my_binary), 16):
    chunk = my_binary[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    print(f"{i:04x}: {hex_str}")

print("\n--- BYTE-BY-BYTE DIFF ---")
max_len = max(len(original_binary), len(my_binary))
diffs = []
for i in range(max_len):
    orig = original_binary[i] if i < len(original_binary) else None
    mine = my_binary[i] if i < len(my_binary) else None
    if orig != mine:
        diffs.append((i, orig, mine))

print(f"Total differences: {len(diffs)}")
for offset, orig, mine in diffs[:30]:  # Show first 30
    orig_str = f"0x{orig:02x}" if orig is not None else "None"
    mine_str = f"0x{mine:02x}" if mine is not None else "None"
    print(f"  0x{offset:02X}: original={orig_str}, encoder={mine_str}")
