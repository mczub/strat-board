#!/usr/bin/env python3
"""Compare base, hidden, and locked samples to find flag locations."""

from stgy_mini import decode_stgy
import struct

# Base: tank at 0,0 (not hidden, not locked)
base_code = "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"

# Hidden: tank at 0,0 (hidden=true)
hidden_code = "[stgy:aIyp54tUsOexQ23HY4LvxVvxYRBoTr9z5OFdpWP-bZX7BcvMrD1qTfBeNRJ9ch65Sve9sEI4DwFzXLnokMle8L6jLFMxIyIZYO-FtERiu]"

# Locked: tank at 0,0 (locked=true)
locked_code = "[stgy:alF-ldf7f0z4oeUOI3Gb46b4I--eHdnSG9r--dZdKUH5XovtiexlAk1v4Qf3D1UyD7OyajEpb+eX1JaA52S1EGQgG524lRlJI0JDTb-7S]"

base = decode_stgy(base_code)
hidden = decode_stgy(hidden_code)
locked = decode_stgy(locked_code)

print("=== LENGTH COMPARISON ===")
print(f"Base:   {len(base)} bytes")
print(f"Hidden: {len(hidden)} bytes")
print(f"Locked: {len(locked)} bytes")

print("\n=== BASE vs HIDDEN (finding hidden flag) ===")
for i in range(min(len(base), len(hidden))):
    if base[i] != hidden[i]:
        print(f"  0x{i:02X}: base=0x{base[i]:02x} ({base[i]:3d}), hidden=0x{hidden[i]:02x} ({hidden[i]:3d})")

print("\n=== BASE vs LOCKED (finding locked flag) ===")
for i in range(min(len(base), len(locked))):
    if base[i] != locked[i]:
        print(f"  0x{i:02X}: base=0x{locked[i]:02x} ({base[i]:3d}), locked=0x{locked[i]:02x} ({locked[i]:3d})")

# Print hex dumps for detailed comparison
print("\n=== BASE HEX ===")
for i in range(0, len(base), 16):
    chunk = base[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    print(f"{i:04x}: {hex_str}")

print("\n=== HIDDEN HEX ===")
for i in range(0, len(hidden), 16):
    chunk = hidden[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    print(f"{i:04x}: {hex_str}")

print("\n=== LOCKED HEX ===")
for i in range(0, len(locked), 16):
    chunk = locked[i:i+16]
    hex_str = " ".join(f"{b:02x}" for b in chunk)
    print(f"{i:04x}: {hex_str}")
