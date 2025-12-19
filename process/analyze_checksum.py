#!/usr/bin/env python3
"""Deeply analyze checksum across multiple samples to find the pattern."""

import base64
import zlib
import struct
from stgy_mini import decode_stgy

# Multiple known-working samples
samples = [
    ("[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]", "tank at 0,0"),
    ("[stgy:atQzQvwo-frK2Xj8kiZzzLYcnvwV9HwzZ4uwV1YpSeHifFobTi08QctXsn0GjMHHZF4k8Iszpfbh2FAwudkbLocYWd71CH6ekio3jjkxSI]", "tank at 1,0"),
    ("[stgy:apPgx54fEg37r5kQyDuVVqtGWZ1MFf1VuX01MKt-OCzDrczJ4DIQeGp5GrIv7-q9IpgW9RlyL6xRTxcv05HHaOvwPAWQheukoATBDrTtl+LH8mTRu]", "donut"),
]

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
    """Decode share code to get raw header+compressed data."""
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

print("Analyzing checksums across multiple samples")
print("=" * 70)

for code, desc in samples:
    print(f"\n{desc}:")
    raw = decode_to_raw(code)
    binary = decode_stgy(code)
    
    checksum = struct.unpack_from('<I', raw, 0)[0]
    length = struct.unpack_from('<H', raw, 4)[0]
    compressed = raw[6:]
    
    print(f"  Checksum in header: 0x{checksum:08x}")
    print(f"  Decompressed length: {length}")
    print(f"  Compressed length: {len(compressed)}")
    
    # Try various checksum algorithms
    print(f"  CRC32(compressed): 0x{zlib.crc32(compressed) & 0xFFFFFFFF:08x}")
    print(f"  CRC32(binary): 0x{zlib.crc32(binary) & 0xFFFFFFFF:08x}")
    print(f"  Adler32(binary): 0x{zlib.adler32(binary) & 0xFFFFFFFF:08x}")
    
    # The last 4 bytes of zlib compressed data is the adler32
    zlib_adler = struct.unpack('>I', compressed[-4:])[0]
    print(f"  Zlib trailer (Adler32): 0x{zlib_adler:08x}")

# Let's check if the checksum might be ignored entirely
# by seeing if there's a pattern
print("\n" + "=" * 70)
print("Pattern analysis:")
print("=" * 70)

# The checksums are: 0x0751493b, different for each sample
# They don't match any standard algorithm
# Maybe the game generates a random/timestamp-based value
# Or maybe the game doesn't validate it at all, and the issue is elsewhere

# Let's check if decoding with wrong checksum still works
print("\nThe game VALIDATES the checksum - my generated codes with wrong checksum fail to load.")
print("\nNeed to determine the checksum algorithm from the original game code or more samples.")
