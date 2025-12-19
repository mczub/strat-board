#!/usr/bin/env python3
"""Compare multi-object encodings to find the pattern."""

from stgy_mini import decode_stgy
from stgy_encoder import build_binary
import json
import struct

# Working 2-tank code
two_tank = "[stgy:ahKeg9+yFj4iTFE6oBzC0Jg5T+5U7s5CS9O5UPgRHrsWjpdCFC3Sk4h7LWG-jlNrnZZq2GqurdA1vclcKJa7Xi6NcDYZjpaiU05Sz8vW+AWreGKy8b]"

# Working 3-tank code
three_tank = "[stgy:aklLqnNdh-xGA78VQqbo8Zrl6rJOxMo9yvezx2YtoyU00EWt7zTZERL5hrasXk-7yr+JHO8MviUOMSBChGeai2n4jNrUocBWSwxmTSLJfwMREySHMBBt]"

# Working 4-tank code
four_tank = "[stgy:a0PkzO4TQSQA8rHpf1QY6FknmkZNO5z7Jau1ZM9rBmJgQm6Y1B0yAMVq+f6PI1jxku0ae1BelEjEAfFeWDQAMeFBBQJwvIaHjy+92pyakic3mLqWMg]"

# My JSON
with open("test_party.json", "r") as f:
    my_json = json.load(f)

game_binary = decode_stgy(two_tank)
my_binary = build_binary(my_json)

print("=== 2-TANK GAME BINARY ===")
print(f"Length: {len(game_binary)}")
for i in range(0, len(game_binary), 16):
    chunk = game_binary[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    print(f"{i:04x}: {hex_str}")

print("\n=== MY BINARY (2 tanks) ===")
print(f"Length: {len(my_binary)}")
for i in range(0, len(my_binary), 16):
    chunk = my_binary[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    print(f"{i:04x}: {hex_str}")

print("\n=== DIFFERENCES ===")
max_len = max(len(game_binary), len(my_binary))
for i in range(max_len):
    g = game_binary[i] if i < len(game_binary) else None
    m = my_binary[i] if i < len(my_binary) else None
    if g != m:
        g_str = f"0x{g:02x}" if g is not None else "None"
        m_str = f"0x{m:02x}" if m is not None else "None"
        print(f"  0x{i:02X}: game={g_str}, mine={m_str}")

# Also analyze 3 and 4 tank versions
print("\n=== 3-TANK GAME BINARY ===")
three = decode_stgy(three_tank)
print(f"Length: {len(three)}")
for i in range(0, len(three), 16):
    chunk = three[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    print(f"{i:04x}: {hex_str}")

print("\n=== 4-TANK GAME BINARY ===")
four = decode_stgy(four_tank)
print(f"Length: {len(four)}")
for i in range(0, len(four), 16):
    chunk = four[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    print(f"{i:04x}: {hex_str}")
