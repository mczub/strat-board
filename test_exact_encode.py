#!/usr/bin/env python3
"""
Test encoding the EXACT original binary to see if encoding chain works.
"""

import base64
import zlib
import struct
import random

from stgy_mini import decode_stgy as decode_original

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
FORWARD_DAT = {v: k for k, v in INVERSE_DAT.items()}

DAT_1420cf520 = (
    b"\x00" * 43
    + b"N\x00P\x00\x00xg0K8SJ2sZ\x00\x00\x00\x00\x00\x00\x00DFtT6EaVcpLMmej9XB4RY7_nOb\x00\x00\x00\x00\x00\x00i-vHCArWodIqhUlk3fy5Gw1uzQ"
)
KEY_REVERSE = {}
for i in range(len(DAT_1420cf520)):
    if DAT_1420cf520[i] != 0:
        KEY_REVERSE[DAT_1420cf520[i]] = i

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

def encode_to_share_code(binary_data):
    """Encode exact binary to share code."""
    # Compress
    compressed = zlib.compress(binary_data, 6)
    
    # Header: checksum + length
    # Let's try different checksums
    checksum = zlib.crc32(compressed) & 0xFFFFFFFF
    length = len(binary_data)
    header = struct.pack('<I', checksum) + struct.pack('<H', length)
    
    full_data = header + compressed
    
    # Base64
    b64 = base64.b64encode(full_data).decode('ascii').rstrip('=')
    b64 = b64.replace('+', '-').replace('/', '_')
    
    # Use key = 59 (same as original 'V')
    key = 59
    key_source = 'V'
    
    # Encode
    encoded = []
    for i, c in enumerate(b64):
        val = char_to_base64_value(c)
        encoded_val = (val + i + key) & 63
        standard_char = base64_value_to_char(encoded_val)
        subst = chr(FORWARD_DAT.get(ord(standard_char), ord('A')))
        encoded.append(subst)
    
    return f"[stgy:a{key_source}{''.join(encoded)}]"

# Original code and binary
original_code = "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"
original_binary = decode_original(original_code)

print("Testing encoding chain with EXACT original binary")
print("=" * 70)

# Encode the exact original binary
my_code = encode_to_share_code(original_binary)

print(f"Original code:\n{original_code}")
print(f"\nMy encoded code:\n{my_code}")
print(f"\nCodes match: {original_code == my_code}")

# Verify my code decodes correctly
try:
    my_decoded = decode_original(my_code)
    print(f"\nMy code decodes: True")
    print(f"Decoded matches original binary: {my_decoded == original_binary}")
except Exception as e:
    print(f"\nMy code decodes: False - {e}")
