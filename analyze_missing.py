#!/usr/bin/env python3
"""Analyze the exact structure difference at offset 0x30-0x40."""

from stgy_mini import decode_stgy
import struct

# 2-object game code
game_code = "[stgy:aTHOjrINWUqOLJfJKCRoOv7gOFSK0Icl1ySdZY69V9-gaA+rFXS1lC1KCkcBkGfeTsUQ0P113b47n7Jx4G6dltP9218j9-F8+L4sk6537Qfine-SYiks-y+j-n53]"
binary = decode_stgy(game_code)

print("Game structure around tag 0x04:")
print("=" * 70)

# Object list ends at 0x2C (after 2 objects)
# Then comes tag 0x04

pos = 0x2C
print(f"\n0x{pos:02X}: Tag 0x04 section")
for i in range(20):
    val = struct.unpack_from('<H', binary, pos + i*2)[0]
    print(f"  0x{pos + i*2:02X}: {val:5d} (0x{val:04X})")

# Look at the game structure more carefully
print("\n\nStructure interpretation:")
print(f"0x2C: tag=4")
print(f"0x2E: 1 (type?)")
print(f"0x30: 2 (object count)")
print(f"0x32: 1 (??)")
print(f"0x34: 1 (extra value!)")  # This is the extra byte
print(f"0x36: tag=5")
print(f"...")

# The game has: 04 00 01 00 02 00 01 00 01 00 05 00 ...
# My script:    04 00 01 00 02 00 01 00 05 00 ...
# Game has extra "01 00" between tag 0x04 data and tag 0x05

print("\n" + "=" * 70)
print("Tag 0x04 appears to have format: [tag=4] [1] [count] [1] [1]")
print("Not just: [tag=4] [1] [count] [1]")
print("The game adds an extra [1] at the end!")
