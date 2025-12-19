#!/usr/bin/env python3
"""
Try to reverse engineer checksum by brute-forcing common variations.
"""

import struct
import zlib
from stgy_mini import decode_stgy

# Known samples with their checksums
samples = [
    ("[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]", 0x0751493b),
    ("[stgy:atQzQvwo-frK2Xj8kiZzzLYcnvwV9HwzZ4uwV1YpSeHifFobTi08QctXsn0GjMHHZF4k8Iszpfbh2FAwudkbLocYWd71CH6ekio3jjkxSI]", 0xe2346779),
]

# Cipher decode helper
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

import base64
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

print("Analyzing checksum patterns")
print("=" * 70)

for code, expected_checksum in samples:
    raw = decode_to_raw(code)
    binary = decode_stgy(code)
    compressed = raw[6:]
    
    print(f"\nSample: checksum=0x{expected_checksum:08x}")
    print(f"  Binary length: {len(binary)}")
    print(f"  Compressed length: {len(compressed)}")
    
    # Try CRC32 with XOR of length
    crc = zlib.crc32(compressed) & 0xFFFFFFFF
    print(f"  CRC32(compressed): 0x{crc:08x}")
    print(f"  CRC32 XOR len: 0x{crc ^ len(binary):08x}")
    print(f"  CRC32 XOR compressed_len: 0x{crc ^ len(compressed):08x}")
    
    # Maybe it's based on a different seed?
    for seed in [0, 1, -1, 0x12345678, 0xDEADBEEF]:
        crc_seed = zlib.crc32(compressed, seed) & 0xFFFFFFFF
        if crc_seed == expected_checksum:
            print(f"  MATCH with seed {seed}!")
    
    # Maybe byte-swapped?
    swapped = struct.unpack('>I', struct.pack('<I', crc))[0]
    print(f"  CRC32 byte-swapped: 0x{swapped:08x}")
    
    # XOR with known value?
    xor_val = crc ^ expected_checksum
    print(f"  XOR difference from CRC32: 0x{xor_val:08x}")

# Check if the XOR difference is consistent
print("\n" + "=" * 70)
print("Checking if XOR mask is consistent:")

xor_diffs = []
for code, expected_checksum in samples:
    raw = decode_to_raw(code)
    compressed = raw[6:]
    crc = zlib.crc32(compressed) & 0xFFFFFFFF
    xor_diff = crc ^ expected_checksum
    xor_diffs.append(xor_diff)
    print(f"  XOR diff: 0x{xor_diff:08x}")

if len(set(xor_diffs)) == 1:
    print(f"\nCONSISTENT XOR MASK: 0x{xor_diffs[0]:08x}")
else:
    print("\nXOR mask varies - not a simple XOR")
