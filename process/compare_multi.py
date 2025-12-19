#!/usr/bin/env python3
"""Compare multi-object encoding between game and script."""

from stgy_mini import decode_stgy
from stgy_encoder import build_binary
import json

# Game-produced share code (2 objects)
game_code = "[stgy:aTHOjrINWUqOLJfJKCRoOv7gOFSK0Icl1ySdZY69V9-gaA+rFXS1lC1KCkcBkGfeTsUQ0P113b47n7Jx4G6dltP9218j9-F8+L4sk6537Qfine-SYiks-y+j-n53]"

# My encoder input
with open("test_party.json", "r") as f:
    my_json = json.load(f)

# Decode game version
game_binary = decode_stgy(game_code)

# Build my version
my_binary = build_binary(my_json)

print("COMPARISON: Game vs Script (2 objects)")
print("=" * 70)
print(f"Game binary length: {len(game_binary)} bytes")
print(f"Script binary length: {len(my_binary)} bytes")

print("\n--- GAME HEX ---")
for i in range(0, len(game_binary), 16):
    chunk = game_binary[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    print(f"{i:04x}: {hex_str}")

print("\n--- SCRIPT HEX ---")
for i in range(0, len(my_binary), 16):
    chunk = my_binary[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    print(f"{i:04x}: {hex_str}")

print("\n--- BYTE-BY-BYTE DIFF ---")
max_len = max(len(game_binary), len(my_binary))
diffs = []
for i in range(max_len):
    game_byte = game_binary[i] if i < len(game_binary) else None
    my_byte = my_binary[i] if i < len(my_binary) else None
    if game_byte != my_byte:
        diffs.append((i, game_byte, my_byte))

print(f"Total differences: {len(diffs)}")
for offset, game_val, my_val in diffs[:30]:
    game_str = f"0x{game_val:02x}" if game_val is not None else "None"
    my_str = f"0x{my_val:02x}" if my_val is not None else "None"
    print(f"  0x{offset:02X}: game={game_str}, script={my_str}")
