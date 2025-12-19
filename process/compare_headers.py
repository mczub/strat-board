#!/usr/bin/env python3
"""Compare header bytes to understand checksum format."""

import base64
import zlib
import struct

# Original and my encoded share codes
original_code = "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"
my_code = "[stgy:aVeg9AHqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"

# Cipher tables for decoding
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

def decode_to_header(stgy_string):
    """Decode share code to get the 6-byte header + compressed data."""
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

print("Comparing header bytes")
print("=" * 70)

orig_data = decode_to_header(original_code)
my_data = decode_to_header(my_code)

print(f"Original header+compressed ({len(orig_data)} bytes):")
print(f"  First 20 bytes: {orig_data[:20].hex()}")
print(f"  Checksum: 0x{struct.unpack_from('<I', orig_data, 0)[0]:08x}")
print(f"  Length: {struct.unpack_from('<H', orig_data, 4)[0]}")
print(f"  Compressed: {orig_data[6:].hex()}")

print(f"\nMy header+compressed ({len(my_data)} bytes):")
print(f"  First 20 bytes: {my_data[:20].hex()}")
print(f"  Checksum: 0x{struct.unpack_from('<I', my_data, 0)[0]:08x}")
print(f"  Length: {struct.unpack_from('<H', my_data, 4)[0]}")
print(f"  Compressed: {my_data[6:].hex()}")

print("\nCompressed data matches:", orig_data[6:] == my_data[6:])
print("Only checksum differs!")

# What if the checksum is just garbage/random and the game doesn't care?
# Let's check if the original checksum relates to anything
orig_checksum = struct.unpack_from('<I', orig_data, 0)[0]
orig_compressed = orig_data[6:]

print(f"\n=== Testing checksum algorithms on original ===")
print(f"Original checksum: 0x{orig_checksum:08x}")
print(f"CRC32 of compressed: 0x{zlib.crc32(orig_compressed) & 0xFFFFFFFF:08x}")

# Maybe it's in little/big endian differently
import binascii
print(f"CRC32 (binascii): 0x{binascii.crc32(orig_compressed) & 0xFFFFFFFF:08x}")

# Maybe checksum of uncompressed?
from stgy_mini import decode_stgy
orig_binary = decode_stgy(original_code)
print(f"CRC32 of uncompressed: 0x{zlib.crc32(orig_binary) & 0xFFFFFFFF:08x}")
