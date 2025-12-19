#!/usr/bin/env python3
"""Debug the encoding chain to find where things go wrong."""

import base64
import zlib
import struct
from stgy_mini import decode_stgy as decode_original

# Known working original
original_code = "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"

# Get the original binary
original_binary = decode_original(original_code)

# Now let me trace what the original encoding chain looks like
# Compressing the original binary should give us what we need

print("=== ORIGINAL BINARY ===")
print(f"Length: {len(original_binary)}")

# The decoder strips 6 bytes (checksum + length) before decompressing
# So the original compressed data had those 6 bytes prepended

# Let's recompress the original binary and see what we get
print("\n=== TESTING COMPRESSION ===")

# Try compressing
compressed = zlib.compress(original_binary)
print(f"zlib.compress result: {len(compressed)} bytes")
print(f"Compressed hex: {compressed.hex()}")

# Try with different compression levels
for level in range(-1, 10):
    try:
        comp = zlib.compress(original_binary, level)
        print(f"Level {level}: {len(comp)} bytes - {comp[:20].hex()}...")
    except:
        pass

# Now let's look at what's in the original encoded data
# We need to reverse engineer the full encoding chain
print("\n=== REVERSE ENGINEERING ORIGINAL ENCODING ===")

# Decode the cipher to get the base64
data = original_code[7:-1]  # Strip [stgy:a and ]
print(f"Cipher data length: {len(data)}")

# The first character is the key
key_char = data[0]
print(f"Key character: '{key_char}'")

# Apply the cipher decoding (from stgy_mini)
DAT_1420cf520 = (
    b"\x00" * 43
    + b"N\x00P\x00\x00xg0K8SJ2sZ\x00\x00\x00\x00\x00\x00\x00DFtT6EaVcpLMmej9XB4RY7_nOb\x00\x00\x00\x00\x00\x00i-vHCArWodIqhUlk3fy5Gw1uzQ"
)
INVERSE_DAT_1420cf4a0 = {
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

key_mapped = chr(DAT_1420cf520[ord(key_char)])
key = char_to_base64_value(key_mapped)
print(f"Key mapped: '{key_mapped}', key value: {key}")

# Decode the rest
decoded = []
for i, c in enumerate(data[1:]):
    standard_char = chr(INVERSE_DAT_1420cf4a0.get(ord(c), 65))
    val = char_to_base64_value(standard_char)
    decoded_val = (val - i - key) & 63
    decoded.append(base64_value_to_char(decoded_val))

b64_string = "".join(decoded).replace("-", "+").replace("_", "/")
print(f"\nDecoded base64 (before padding): {b64_string}")

# Add padding if needed
original_b64_data = base64.b64decode(b64_string + "==")
print(f"\nBase64 decoded length: {len(original_b64_data)}")
print(f"First 20 bytes: {original_b64_data[:20].hex()}")

# The first 6 bytes are checksum (4) + length (2)
checksum = struct.unpack_from('<I', original_b64_data, 0)[0]
length = struct.unpack_from('<H', original_b64_data, 4)[0]
print(f"\nHeader: checksum=0x{checksum:08x}, length={length}")

# The rest is compressed data
compressed_data = original_b64_data[6:]
print(f"Compressed data length: {len(compressed_data)}")
print(f"Compressed data: {compressed_data.hex()}")

# Verify we can decompress it
decompressed = zlib.decompress(compressed_data)
print(f"\nDecompressed length: {len(decompressed)}")
print(f"Matches original binary: {decompressed == original_binary}")
