#!/usr/bin/env python3
"""
Try CRC32 on different combinations of the data.
"""

import struct
import zlib
import base64
from stgy_mini import decode_stgy

# Cipher tables
INVERSE_DAT = {
    98: 45, 50: 48, 119: 49, 55: 50, 113: 51, 83: 52, 116: 53, 69: 54,
    86: 55, 52: 56, 80: 57, 102: 65, 82: 66, 101: 67, 65: 68, 70: 69,
    66: 70, 117: 71, 100: 72, 107: 73, 54: 74, 51: 75, 75: 76, 76: 77,
    43: 78, 89: 79, 45: 80, 122: 81, 84: 82, 53: 83, 68: 84, 110: 85,
    72: 86, 104: 87, 81: 88, 85: 89, 57: 90, 87: 95, 71: 97, 90: 98,
    73: 99, 106: 100, 78: 101, 114: 102, 49: 103, 109: 104, 97: 105,
    79: 106, 112: 107, 111: 108, 77: 109, 88: 110, 105: 111, 74: 112,
    108: 113, 103: 114, 56: 115, 67: 116, 120: 117, 99: 118, 118: 119,
    48: 120, 115: 121, 121: 122,
}
DAT_1420cf520 = (
    b"\x00" * 43
    + b"N\x00P\x00\x00xg0K8SJ2sZ\x00\x00\x00\x00\x00\x00\x00DFtT6EaVcpLMmej9XB4RY7_nOb\x00\x00\x00\x00\x00\x00i-vHCArWodIqhUlk3fy5Gw1uzQ"
)

def char_to_base64_value(c):
    o = ord(c)
    if 65 <= o <= 90: return o - 65
    if 97 <= o <= 122: return o - 71
    if 48 <= o <= 57: return o + 4
    if c == "-": return 62
    if c == "_": return 63
    return 0

def base64_value_to_char(val):
    val &= 63
    if val < 26: return chr(val + 65)
    if val < 52: return chr(val + 71)
    if val < 62: return chr(val - 4)
    if val == 62: return "-"
    if val == 63: return "_"
    return "A"

def decode_to_raw(stgy_string):
    data = stgy_string[7:-1]
    key_char = data[0]
    key_mapped = chr(DAT_1420cf520[ord(key_char)])
    key = char_to_base64_value(key_mapped)
    decoded = []
    for i, c in enumerate(data[1:]):
        standard_char = chr(INVERSE_DAT.get(ord(c), 65))
        val = char_to_base64_value(standard_char)
        decoded_val = (val - i - key) & 63
        decoded.append(base64_value_to_char(decoded_val))
    b64_string = "".join(decoded).replace("-", "+").replace("_", "/")
    return base64.b64decode(b64_string + "==")

# One sample
code = "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"
expected = 0x0751493b

raw = decode_to_raw(code)
binary = decode_stgy(code)
compressed = raw[6:]
length_bytes = raw[4:6]

print(f"Expected checksum: 0x{expected:08x}")
print(f"Raw data: {raw.hex()}")
print(f"Length bytes: {length_bytes.hex()}")
print()

# Try CRC32 on many different combinations
tests = [
    ("compressed", compressed),
    ("length + compressed", length_bytes + compressed),
    ("binary", binary),
    ("compressed without zlib header (2 bytes)", compressed[2:]),
    ("compressed without zlib footer (4 bytes)", compressed[:-4]),
    ("compressed without zlib header+footer", compressed[2:-4]),
]

for name, data in tests:
    crc = zlib.crc32(data) & 0xFFFFFFFF
    # Also try inverted (bitwise NOT)
    crc_inv = (~crc) & 0xFFFFFFFF
    match = "MATCH!" if crc == expected else ""
    match_inv = "MATCH!" if crc_inv == expected else ""
    print(f"CRC32({name}): 0x{crc:08x} {match}")
    if crc_inv == expected:
        print(f"  ~CRC32: 0x{crc_inv:08x} {match_inv}")

# Try with different initial CRC values
print("\nTrying different CRC32 seeds on compressed:")
for seed in range(-10, 10):
    crc = zlib.crc32(compressed, seed) & 0xFFFFFFFF
    if crc == expected:
        print(f"  Seed {seed}: MATCH!")

# What about CRC32 on the raw deflate (without zlib wrapper)?
print("\nRaw deflate analysis:")
# Zlib format: [CMF][FLG] ... [ADLER32]
# CMF = 0x78, FLG = 0x9c means level 6 compression
print(f"Zlib header: {compressed[:2].hex()}")
print(f"Zlib footer (adler32): {compressed[-4:].hex()}")
raw_deflate = compressed[2:-4]
print(f"Raw deflate: {raw_deflate.hex()}")
print(f"CRC32(raw_deflate): 0x{zlib.crc32(raw_deflate) & 0xFFFFFFFF:08x}")

# Maybe it's related to the decoded base64 BEFORE the first 6 bytes?
print("\nMaybe checksum is placeholder or computed differently?")
# What if we just try zeroes or the binary CRC?
print(f"If we use CRC32(binary) = 0x{zlib.crc32(binary) & 0xFFFFFFFF:08x}, does game accept it?")
