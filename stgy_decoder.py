#!/usr/bin/env python3
"""
FF14 Strategy Board Decoder
Converts share codes [stgy:a...] to JSON format.

Complete icon database from game data.
"""

import base64
import zlib
import struct
import json
import sys

# Lookup tables
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

# Complete icon types from stgy.csv
ICON_TYPES = {
    # Field backgrounds (type 1)
    4: "checkered_circle", 8: "checkered_square",
    124: "grey_circle", 125: "grey_square",
    
    # AoE/Mechanics (type 6)
    9: "circle_aoe", 10: "fan_aoe", 11: "line_aoe", 12: "line",
    13: "gaze", 14: "stack", 15: "line_stack", 16: "proximity",
    17: "donut", 106: "stack_multi", 107: "proximity_player",
    108: "tankbuster", 109: "radial_knockback", 110: "linear_knockback",
    111: "tower", 112: "targeting", 126: "moving_circle_aoe",
    127: "1person_aoe", 128: "2person_aoe", 129: "3person_aoe", 130: "4person_aoe",
    
    # Base classes (type 2)
    18: "gladiator", 19: "pugilist", 20: "marauder", 21: "lancer",
    22: "archer", 23: "conjurer", 24: "thaumaturge", 25: "arcanist", 26: "rogue",
    
    # Jobs (type 2)
    27: "paladin", 28: "monk", 29: "warrior", 30: "dragoon", 31: "bard",
    32: "white_mage", 33: "black_mage", 34: "summoner", 35: "scholar",
    36: "ninja", 37: "machinist", 38: "dark_knight", 39: "astrologian",
    40: "samurai", 41: "red_mage", 42: "blue_mage", 43: "gunbreaker",
    44: "dancer", 45: "reaper", 46: "sage", 101: "viper", 102: "pictomancer",
    
    # Role markers (type 2)
    47: "tank", 48: "tank_1", 49: "tank_2",
    50: "healer", 51: "healer_1", 52: "healer_2",
    53: "dps", 54: "dps_1", 55: "dps_2", 56: "dps_3", 57: "dps_4",
    118: "melee_dps", 119: "ranged_dps", 120: "physical_ranged_dps",
    121: "magical_ranged_dps", 122: "pure_healer", 123: "barrier_healer",
    
    # Enemies (type 3)
    60: "small_enemy", 62: "medium_enemy", 64: "large_enemy",
    
    # Target markers (type 3)
    65: "attack_1", 66: "attack_2", 67: "attack_3", 68: "attack_4",
    69: "attack_5", 115: "attack_6", 116: "attack_7", 117: "attack_8",
    70: "bind_1", 71: "bind_2", 72: "bind_3",
    73: "ignore_1", 74: "ignore_2",
    
    # Chain markers (type 3)
    75: "square_marker", 76: "circle_marker", 77: "plus_marker", 78: "triangle_marker",
    
    # Waymarks (type 3)
    79: "waymark_a", 80: "waymark_b", 81: "waymark_c", 82: "waymark_d",
    83: "waymark_1", 84: "waymark_2", 85: "waymark_3", 86: "waymark_4",
    
    # Shapes (type 4)
    87: "shape_circle", 88: "shape_x", 89: "shape_triangle", 90: "shape_square",
    94: "up_arrow", 100: "text", 103: "rotate",
    135: "highlighted_circle", 136: "highlighted_x",
    137: "highlighted_square", 138: "highlighted_triangle",
    139: "rotate_clockwise", 140: "rotate_counterclockwise",
    
    # Effects (type 3)
    113: "enhancement", 114: "enfeeblement",
    
    # Lock-on markers (type 3)
    131: "lockon_red", 132: "lockon_blue", 133: "lockon_purple", 134: "lockon_green",
    
    # Groups (type 5)
    105: "group",
}

# Reverse mapping for encoder
ICON_NAME_TO_ID = {v: k for k, v in ICON_TYPES.items()}

BACKGROUND_TYPES = {
    0: "none", 1: "checkered", 2: "checkered_circle",
    3: "checkered_square", 4: "grey", 5: "grey_circle", 6: "grey_square",
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


def decode_cipher(stgy_string):
    """Decode obfuscation and decompress."""
    data = stgy_string[7:-1]
    key_char = data[0]
    key_mapped = chr(DAT_1420cf520[ord(key_char)])
    key = char_to_base64_value(key_mapped)
    
    decoded = []
    for i, c in enumerate(data[1:]):
        standard_char = chr(INVERSE_DAT_1420cf4a0.get(ord(c), 65))
        val = char_to_base64_value(standard_char)
        decoded_val = (val - i - key) & 63
        decoded.append(base64_value_to_char(decoded_val))
    
    b64_string = "".join(decoded).replace("-", "+").replace("_", "/")
    binary_data = base64.b64decode(b64_string + "==")
    return zlib.decompress(binary_data[6:])


def parse_binary(data):
    """Parse decompressed binary."""
    result = {
        "version": struct.unpack_from('<I', data, 0)[0],
        "name": data[0x1C:0x24].rstrip(b'\x00').decode('utf-8', errors='replace').strip('\x00'),
        "objects": [],
    }
    
    # Parse icon list starting at 0x24
    pos = 0x24
    icons = []
    while pos < len(data) - 4:
        marker = struct.unpack_from('<H', data, pos)[0]
        if marker != 2:
            break
        icon_id = struct.unpack_from('<H', data, pos + 2)[0]
        icons.append(icon_id)
        pos += 4
    
    n = len(icons)
    # Continue parsing even if no icons - we need board_background from Tag 3
    
    # Storage for properties
    positions = []
    backgrounds = []
    sizes = []
    colors = []
    arc_angles = []
    donut_radii = []
    
    # Parse tags
    while pos < len(data) - 2:
        tag = struct.unpack_from('<H', data, pos)[0]
        
        if tag == 4:  # Object count header with flags
            count_val = struct.unpack_from('<H', data, pos + 4)[0]
            if count_val > 1:
                pos += 10
            else:
                flag_val = struct.unpack_from('<H', data, pos + 6)[0]
                result["_flags"] = flag_val
                pos += 8
                
        elif tag == 5:  # Positions
            if pos + 6 > len(data):
                break
            count = struct.unpack_from('<H', data, pos + 4)[0]
            pos += 6
            for _ in range(count):
                if pos + 4 > len(data):
                    break
                # Use signed int16 for negative coordinates
                x = struct.unpack_from('<h', data, pos)[0] / 10.0
                y = struct.unpack_from('<h', data, pos + 2)[0] / 10.0
                positions.append((x, y))
                pos += 4
                
        elif tag == 6:  # Background per object
            if pos + 6 > len(data):
                break
            count = struct.unpack_from('<H', data, pos + 4)[0]
            pos += 6
            for _ in range(count):
                if pos + 2 > len(data):
                    break
                bg = struct.unpack_from('<H', data, pos)[0]
                backgrounds.append(bg)
                pos += 2
                
        elif tag == 7:  # Size bytes only
            if pos + 6 > len(data):
                break
            count = struct.unpack_from('<H', data, pos + 4)[0]
            pos += 6
            for _ in range(count):
                if pos >= len(data):
                    break
                size = data[pos]
                sizes.append(size)
                pos += 1
            if count % 2 == 1:
                pos += 1
                
        elif tag == 8:  # Color (RGBA)
            if pos + 6 > len(data):
                break
            count = struct.unpack_from('<H', data, pos + 4)[0]
            pos += 6
            for _ in range(count):
                if pos + 4 > len(data):
                    break
                r, g, b, a = data[pos], data[pos+1], data[pos+2], data[pos+3]
                colors.append((r, g, b, a))
                pos += 4
                
        elif tag == 10:  # Arc angle
            if pos + 6 > len(data):
                break
            count = struct.unpack_from('<H', data, pos + 4)[0]
            pos += 6
            for _ in range(count):
                if pos + 2 > len(data):
                    break
                val = struct.unpack_from('<H', data, pos)[0]
                arc_angles.append(val)
                pos += 2
                
        elif tag == 11:  # Donut radius
            if pos + 6 > len(data):
                break
            count = struct.unpack_from('<H', data, pos + 4)[0]
            pos += 6
            for _ in range(count):
                if pos + 2 > len(data):
                    break
                val = struct.unpack_from('<H', data, pos)[0]
                donut_radii.append(val)
                pos += 2
                
        elif tag == 12:  # Reserved
            if pos + 6 > len(data):
                break
            count = struct.unpack_from('<H', data, pos + 4)[0]
            pos += 6 + count * 2
            
        elif tag == 3:  # Footer with board background
            if pos + 8 <= len(data):
                board_bg = struct.unpack_from('<H', data, pos + 6)[0]
                bg_names = {
                    1: "none", 2: "checkered", 3: "checkered_circle",
                    4: "checkered_square", 5: "grey", 6: "grey_circle",
                    7: "grey_square"
                }
                result["board_background"] = bg_names.get(board_bg, f"unknown_{board_bg}")
            break
            
        else:
            pos += 2
    
    # Build objects
    for i, icon_id in enumerate(icons):
        obj = {
            "type": ICON_TYPES.get(icon_id, f"unknown_{icon_id}"),
            "type_id": icon_id,
        }
        
        if i < len(positions):
            obj["x"] = positions[i][0]
            obj["y"] = positions[i][1]
        else:
            obj["x"] = 0.0
            obj["y"] = 0.0
        
        if i < len(sizes):
            obj["size"] = sizes[i] if sizes[i] > 0 else 100
        else:
            obj["size"] = 100
        
        if i < len(backgrounds):
            obj["background"] = BACKGROUND_TYPES.get(backgrounds[i], backgrounds[i])
        
        if i < len(colors):
            r, g, b, a = colors[i]
            obj["color"] = f"#{r:02x}{g:02x}{b:02x}"
            if a > 0:
                obj["transparency"] = a
        
        if i < len(arc_angles) and arc_angles[i] > 0:
            obj["arc_angle"] = arc_angles[i]
        
        if i < len(donut_radii) and donut_radii[i] > 0:
            obj["donut_radius"] = donut_radii[i]
        
        # Apply hidden/locked flags (single object)
        if n == 1 and "_flags" in result:
            flag_val = result["_flags"]
            if flag_val == 0:
                obj["hidden"] = True
            elif flag_val == 9 or (flag_val & 0x08):
                obj["locked"] = True
        
        result["objects"].append(obj)
    
    # Clean up internal flags
    if "_flags" in result:
        del result["_flags"]
    
    return result


def decode_stgy(stgy_string):
    """Decode share code to JSON."""
    data = decode_cipher(stgy_string)
    return parse_binary(data)


def main():
    if len(sys.argv) < 2:
        print("Usage: stgy_decoder.py <share_code>")
        sys.exit(1)
    
    result = decode_stgy(sys.argv[1])
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
