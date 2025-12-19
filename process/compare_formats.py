#!/usr/bin/env python3
"""Compare original game binary vs refactored encoder binary."""

from stgy_mini import decode_stgy as decode_raw
from stgy_encoder import build_binary
import json

# Original working game code
game_code = "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"

# My JSON input
with open("test_party.json", "r") as f:
    my_json = json.load(f)

game_binary = decode_raw(game_code)
my_binary = build_binary(my_json)

print("=== GAME BINARY ===")
print(f"Length: {len(game_binary)}")
for i in range(0, len(game_binary), 16):
    chunk = game_binary[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    ascii_str = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
    print(f"{i:04x}: {hex_str:<48} {ascii_str}")

print("\n=== MY BINARY ===")
print(f"Length: {len(my_binary)}")
for i in range(0, len(my_binary), 16):
    chunk = my_binary[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    ascii_str = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
    print(f"{i:04x}: {hex_str:<48} {ascii_str}")

print("\n=== DIFFERENCES ===")
max_len = max(len(game_binary), len(my_binary))
for i in range(max_len):
    g = game_binary[i] if i < len(game_binary) else None
    m = my_binary[i] if i < len(my_binary) else None
    if g != m:
        g_str = f"0x{g:02x}" if g is not None else "None"
        m_str = f"0x{m:02x}" if m is not None else "None"
        print(f"  0x{i:02X}: game={g_str}, mine={m_str}")
