#!/usr/bin/env python3
"""
FF14 Strategy Board Encoder
Converts JSON format to share codes [stgy:a...].

Based on reverse-engineered format specification.
Refactored to match exact game binary format.
"""

import base64
import zlib
import struct
import json
import sys
import random

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

# Complete icon type name to ID mapping from stgy.csv
ICON_TYPE_IDS = {
    # Field backgrounds
    "checkered_circle": 4, "checkered_square": 8,
    "grey_circle": 124, "grey_square": 125,
    
    # AoE/Mechanics
    "circle_aoe": 9, "fan_aoe": 10, "line_aoe": 11, "line": 12,
    "gaze": 13, "stack": 14, "line_stack": 15, "proximity": 16,
    "donut": 17, "stack_multi": 106, "proximity_player": 107,
    "tankbuster": 108, "radial_knockback": 109, "linear_knockback": 110,
    "tower": 111, "targeting": 112, "moving_circle_aoe": 126,
    "1person_aoe": 127, "2person_aoe": 128, "3person_aoe": 129, "4person_aoe": 130,
    
    # Base classes
    "gladiator": 18, "pugilist": 19, "marauder": 20, "lancer": 21,
    "archer": 22, "conjurer": 23, "thaumaturge": 24, "arcanist": 25, "rogue": 26,
    
    # Jobs
    "paladin": 27, "monk": 28, "warrior": 29, "dragoon": 30, "bard": 31,
    "white_mage": 32, "black_mage": 33, "summoner": 34, "scholar": 35,
    "ninja": 36, "machinist": 37, "dark_knight": 38, "astrologian": 39,
    "samurai": 40, "red_mage": 41, "blue_mage": 42, "gunbreaker": 43,
    "dancer": 44, "reaper": 45, "sage": 46, "viper": 101, "pictomancer": 102,
    
    # Role markers
    "tank": 47, "tank_1": 48, "tank_2": 49,
    "healer": 50, "healer_1": 51, "healer_2": 52,
    "dps": 53, "dps_1": 54, "dps_2": 55, "dps_3": 56, "dps_4": 57,
    "melee_dps": 118, "ranged_dps": 119, "physical_ranged_dps": 120,
    "magical_ranged_dps": 121, "pure_healer": 122, "barrier_healer": 123,
    
    # Enemies
    "small_enemy": 60, "medium_enemy": 62, "large_enemy": 64,
    
    # Target markers
    "attack_1": 65, "attack_2": 66, "attack_3": 67, "attack_4": 68,
    "attack_5": 69, "attack_6": 115, "attack_7": 116, "attack_8": 117,
    "bind_1": 70, "bind_2": 71, "bind_3": 72,
    "ignore_1": 73, "ignore_2": 74,
    
    # Chain markers
    "square_marker": 75, "circle_marker": 76, "plus_marker": 77, "triangle_marker": 78,
    
    # Waymarks
    "waymark_a": 79, "waymark_b": 80, "waymark_c": 81, "waymark_d": 82,
    "waymark_1": 83, "waymark_2": 84, "waymark_3": 85, "waymark_4": 86,
    
    # Shapes
    "shape_circle": 87, "shape_x": 88, "shape_triangle": 89, "shape_square": 90,
    "up_arrow": 94, "text": 100, "rotate": 103,
    "highlighted_circle": 135, "highlighted_x": 136,
    "highlighted_square": 137, "highlighted_triangle": 138,
    "rotate_clockwise": 139, "rotate_counterclockwise": 140,
    
    # Effects
    "enhancement": 113, "enfeeblement": 114,
    
    # Lock-on markers
    "lockon_red": 131, "lockon_blue": 132, "lockon_purple": 133, "lockon_green": 134,
    
    # Groups
    "group": 105,
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


def encode_cipher(binary_data, key=None):
    """Encode binary data to share code string."""
    compressed = zlib.compress(binary_data, 6)
    
    length = len(binary_data)
    length_bytes = struct.pack('<H', length)
    checksum = zlib.crc32(length_bytes + compressed) & 0xFFFFFFFF
    header = struct.pack('<I', checksum) + length_bytes
    
    full_data = header + compressed
    
    b64 = base64.b64encode(full_data).decode('ascii')
    b64 = b64.rstrip('=').replace('+', '-').replace('/', '_')
    
    if key is None:
        key = random.randint(0, 63)
    
    key_char_standard = base64_value_to_char(key)
    key_source = KEY_REVERSE.get(ord(key_char_standard), ord('V'))
    key_source = chr(key_source)
    
    encoded = []
    for i, c in enumerate(b64):
        val = char_to_base64_value(c)
        encoded_val = (val + i + key) & 63
        standard_char = base64_value_to_char(encoded_val)
        subst_char = chr(FORWARD_DAT.get(ord(standard_char), ord('A')))
        encoded.append(subst_char)
    
    return f"[stgy:a{key_source}{''.join(encoded)}]"


def build_binary(data):
    """Build binary payload matching exact game format."""
    name = data.get("name", "board")[:7]
    objects = data.get("objects", [])
    n = len(objects)
    
    result = bytearray()
    
    # Header (0x00 - 0x23)
    result += struct.pack('<I', 2)  # Version
    result += struct.pack('<I', 0)  # Field at 0x04 - will update
    result += b'\x00' * 10  # Padding
    result += struct.pack('<I', 0)  # Payload size - will update
    result += struct.pack('<H', 0)  # Padding
    result += struct.pack('<H', 1)  # Object count header
    result += struct.pack('<H', 8)  # Name length
    name_bytes = name.encode('utf-8')[:8].ljust(8, b'\x00')
    result += name_bytes
    
    # Object list (Tag 2 entries)
    for obj in objects:
        result += struct.pack('<H', 2)
        type_name = obj.get("type", "tank")
        type_id = obj.get("type_id") or ICON_TYPE_IDS.get(type_name, 47)
        result += struct.pack('<H', type_id)
    
    # Skip object tags for empty boards
    if n == 0:
        # Empty board: just go to footer
        pass
    elif n == 1:
        # Tag 4 - Single object header
        result += struct.pack('<H', 4)
        result += struct.pack('<H', 1)
        obj = objects[0]
        flags = 1  # Default: visible, not locked
        if obj.get("hidden", False):
            flags = 0
        elif obj.get("locked", False):
            flags = 9
        result += struct.pack('<H', 1)
        result += struct.pack('<H', flags)
    else:
        # Tag 4 - Multi-object header
        result += struct.pack('<H', 4)
        result += struct.pack('<H', 1)
        result += struct.pack('<H', n)
        for _ in range(n):
            result += struct.pack('<H', 1)
    
    # Only write object property tags if there are objects
    if n > 0:
        # Tag 5 - Position block (coordinates as signed int16)
        result += struct.pack('<H', 5)
        result += struct.pack('<H', 3)
        result += struct.pack('<H', n)
        for obj in objects:
            x = int(obj.get("x", 0) * 10)
            y = int(obj.get("y", 0) * 10)
            # Use signed int16 for negative coordinates
            result += struct.pack('<h', x)
            result += struct.pack('<h', y)
        
        # Tag 6 - Object background
        result += struct.pack('<H', 6)
        result += struct.pack('<H', 1)
        result += struct.pack('<H', n)
        for obj in objects:
            bg = obj.get("background", 0)
            if isinstance(bg, str):
                bg_map = {"none": 0, "checkered": 1, "checkered_circle": 2, 
                          "checkered_square": 3, "grey": 4, "grey_circle": 5, "grey_square": 6}
                bg = bg_map.get(bg, 0)
            result += struct.pack('<H', bg)
        
        # Tag 7 - Size bytes
        result += struct.pack('<H', 7)
        result += struct.pack('<H', 0)
        result += struct.pack('<H', n)
        for obj in objects:
            size = obj.get("size", 100) & 0xFF
            result += struct.pack('<B', size)
        if n % 2 == 1:
            result += b'\x00'
        
        # Tag 8 - Color
        result += struct.pack('<H', 8)
        result += struct.pack('<H', 2)
        result += struct.pack('<H', n)
        for obj in objects:
            r = obj.get("color_r", 255)
            g = obj.get("color_g", 255)
            b = obj.get("color_b", 255)
            a = obj.get("transparency", 0)
            result += struct.pack('<BBBB', r, g, b, a)
        
        # Tag 10 - Arc angle
        result += struct.pack('<H', 10)
        result += struct.pack('<H', 1)
        result += struct.pack('<H', n)
        for obj in objects:
            arc = obj.get("arc_angle", 0)
            result += struct.pack('<H', arc)
        
        # Tag 11 - Donut radius
        result += struct.pack('<H', 11)
        result += struct.pack('<H', 1)
        result += struct.pack('<H', n)
        for obj in objects:
            radius = obj.get("donut_radius", obj.get("knockback_horizontal", 0))
            result += struct.pack('<H', radius)
        
        # Tag 12 - Reserved
        result += struct.pack('<H', 12)
        result += struct.pack('<H', 1)
        result += struct.pack('<H', n)
        for _ in objects:
            result += struct.pack('<H', 0)
    
    # Tag 3 - Footer with board background
    # Format: [3][1][1][board_bg] where bg: 1=None, 2=Checkered, etc.
    board_bg = data.get("board_background", 1)
    if isinstance(board_bg, str):
        bg_map = {
            "none": 1,
            "checkered": 2,
            "checkered_circle": 3,
            "checkered_square": 4,
            "grey": 5,
            "grey_circle": 6,
            "grey_square": 7,
        }
        board_bg = bg_map.get(board_bg.lower(), 1)
    result += struct.pack('<H', 3)
    result += struct.pack('<H', 1)
    result += struct.pack('<H', 1)
    result += struct.pack('<H', board_bg)
    
    # Update sizes
    payload_size = len(result) - 0x1C
    struct.pack_into('<I', result, 0x12, payload_size)
    field_04 = len(result) - 16
    struct.pack_into('<I', result, 0x04, field_04)
    
    return bytes(result)


def encode_stgy(data):
    """Encode JSON data to share code."""
    binary = build_binary(data)
    return encode_cipher(binary)


def main():
    if len(sys.argv) < 2:
        print("Usage: stgy_encoder.py <json_file>")
        print("  Encodes JSON to [stgy:...] share code")
        sys.exit(1)
    
    with open(sys.argv[1], 'r') as f:
        data = json.load(f)
    
    share_code = encode_stgy(data)
    print(share_code)


if __name__ == "__main__":
    main()
