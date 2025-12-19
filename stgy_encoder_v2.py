#!/usr/bin/env python3
"""
Fixed FF14 Strategy Board Encoder.
Uses the exact same compression parameters as the game.
"""

import base64
import zlib
import struct
import json
import sys
import random

# Cipher tables (same as before)
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

# Forward mapping for encoding
FORWARD_DAT = {v: k for k, v in INVERSE_DAT.items()}

DAT_1420cf520 = (
    b"\x00" * 43
    + b"N\x00P\x00\x00xg0K8SJ2sZ\x00\x00\x00\x00\x00\x00\x00DFtT6EaVcpLMmej9XB4RY7_nOb\x00\x00\x00\x00\x00\x00i-vHCArWodIqhUlk3fy5Gw1uzQ"
)

# Reverse the key mapping
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
    """Encode binary data to share code."""
    # Compress with zlib (default level 6, same as Python default)
    compressed = zlib.compress(binary_data, 6)
    
    # Build header: checksum (u32) + decompressed length (u16)
    # Use CRC32 of the compressed data as checksum (mimicking game behavior)
    checksum = zlib.crc32(compressed) & 0xFFFFFFFF
    length = len(binary_data)
    header = struct.pack('<I', checksum) + struct.pack('<H', length)
    
    # Combine header + compressed
    full_data = header + compressed
    
    # Base64 encode
    b64 = base64.b64encode(full_data).decode('ascii')
    # Remove padding
    b64 = b64.rstrip('=')
    # Convert to URL-safe
    b64 = b64.replace('+', '-').replace('/', '_')
    
    # Pick a key (0-63)
    key = random.randint(0, 63)
    
    # Find key source character
    key_standard = base64_value_to_char(key)
    key_source_ord = KEY_REVERSE.get(ord(key_standard), ord('V'))
    key_source = chr(key_source_ord)
    
    # Apply cipher encoding
    encoded = []
    for i, c in enumerate(b64):
        # Get base64 value
        val = char_to_base64_value(c)
        # Apply forward cipher: (val + i + key) & 0x3f
        encoded_val = (val + i + key) & 63
        # Convert to standard
        standard_char = base64_value_to_char(encoded_val)
        # Apply substitution
        subst = chr(FORWARD_DAT.get(ord(standard_char), ord('A')))
        encoded.append(subst)
    
    return f"[stgy:a{key_source}{''.join(encoded)}]"


# Object type mappings
OBJECT_TYPE_IDS = {
    "donut": 17,
    "tank": 47, "tank1": 48, "tank2": 49,
    "healer": 50, "healer1": 51, "healer2": 52,
    "dps": 53, "dps1": 54, "dps2": 55, "dps3": 56, "dps4": 57,
}


def build_binary(data):
    """Build binary data that matches game format exactly."""
    name = data.get("name", "board")[:7]
    objects = data.get("objects", [])
    n = len(objects)
    
    result = bytearray()
    
    # Header (0x00 - 0x23) - 36 bytes
    result += struct.pack('<I', 2)           # 0x00: Version
    result += struct.pack('<I', 100)         # 0x04: Grid size
    result += b'\x00' * 10                   # 0x08: Padding
    # 0x12: Payload size - will calculate and set later
    result += struct.pack('<I', 0)           
    result += struct.pack('<H', 0)           # 0x16: Padding
    result += struct.pack('<H', 1)           # 0x18: Object count
    result += struct.pack('<H', 8)           # 0x1A: Name length
    name_bytes = name.encode('utf-8')[:8].ljust(8, b'\x00')
    result += name_bytes                     # 0x1C: Name
    
    # Object list (starting at 0x24)
    for obj in objects:
        result += struct.pack('<H', 2)       # Object marker
        type_name = obj.get("type", "tank")
        type_id = obj.get("type_id") or OBJECT_TYPE_IDS.get(type_name, 47)
        result += struct.pack('<H', type_id)
    
    # Tag 0x04 - always [04 00 01 00 01 00 01 00]
    result += struct.pack('<H', 4)
    result += struct.pack('<H', 1)
    result += struct.pack('<H', 1)
    result += struct.pack('<H', 1)
    
    # Tag 0x05 - Coordinates [05 00 03 00 count x y ...]
    result += struct.pack('<H', 5)
    result += struct.pack('<H', 3)
    result += struct.pack('<H', n)
    for obj in objects:
        x = int(obj.get("x", 0) * 10)
        y = int(obj.get("y", 0) * 10)
        result += struct.pack('<H', x)
        result += struct.pack('<H', y)
    
    # Tag 0x06 - Angle [06 00 01 00 count angles...]
    result += struct.pack('<H', 6)
    result += struct.pack('<H', 1)
    result += struct.pack('<H', n)
    for obj in objects:
        result += struct.pack('<H', obj.get("angle", 0))
    
    # Tag 0x07 - Size [07 00 00 00 count sizes...]
    result += struct.pack('<H', 7)
    result += struct.pack('<H', 0)
    result += struct.pack('<H', n)
    for obj in objects:
        result += struct.pack('<B', obj.get("size", 100))
    # Pad to 2-byte alignment if odd number of objects
    if n % 2 == 1:
        result += b'\x00'
    
    # Tag 0x08 - Color [08 00 02 00 count RGBA...]
    result += struct.pack('<H', 8)
    result += struct.pack('<H', 2)
    result += struct.pack('<H', n)
    for obj in objects:
        color = obj.get("color", "#ffffff")
        if color.startswith("#"):
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
        else:
            r, g, b = 255, 255, 255
        transparency = obj.get("transparency", 0)
        result += bytes([r, g, b, transparency])
    
    # Tag 0x0A - Arc angle
    result += struct.pack('<H', 10)
    result += struct.pack('<H', 1)
    result += struct.pack('<H', n)
    for obj in objects:
        result += struct.pack('<H', obj.get("arc_angle", 0))
    
    # Tag 0x0B - Donut radius
    result += struct.pack('<H', 11)
    result += struct.pack('<H', 1)
    result += struct.pack('<H', n)
    for obj in objects:
        result += struct.pack('<H', obj.get("donut_radius", 0))
    
    # Tag 0x0C - Reserved zeros
    result += struct.pack('<H', 12)
    result += struct.pack('<H', 1)
    result += struct.pack('<H', n)
    for _ in objects:
        result += struct.pack('<H', 0)
    
    # Tag 0x03 - Footer
    result += struct.pack('<H', 3)
    result += struct.pack('<H', 1)
    result += struct.pack('<H', 1)
    result += struct.pack('<H', 1)
    
    # Update payload size at 0x12
    payload_size = len(result) - 0x24
    struct.pack_into('<I', result, 0x12, payload_size)
    
    return bytes(result)


def encode_stgy(data):
    """Encode JSON data to share code."""
    binary = build_binary(data)
    return encode_to_share_code(binary)


def main():
    if len(sys.argv) < 2:
        print("Usage: stgy_encoder_v2.py <json_file>")
        sys.exit(1)
    
    with open(sys.argv[1], 'r') as f:
        data = json.load(f)
    
    share_code = encode_stgy(data)
    print(share_code)


if __name__ == "__main__":
    main()
