#!/usr/bin/env python3
import base64
import zlib
import sys

DAT_1420cf520 = (
    b"\x00" * 43
    + b"N\x00P\x00\x00xg0K8SJ2sZ\x00" * 0
    + b"N\x00P\x00\x00xg0K8SJ2sZ\x00\x00\x00\x00\x00\x00\x00DFtT6EaVcpLMmej9XB4RY7_nOb\x00\x00\x00\x00\x00\x00i-vHCArWodIqhUlk3fy5Gw1uzQ"
)
INVERSE_DAT_1420cf4a0 = {
    98: 45,
    50: 48,
    119: 49,
    55: 50,
    113: 51,
    83: 52,
    116: 53,
    69: 54,
    86: 55,
    52: 56,
    80: 57,
    102: 65,
    82: 66,
    101: 67,
    65: 68,
    70: 69,
    66: 70,
    117: 71,
    100: 72,
    107: 73,
    54: 74,
    51: 75,
    75: 76,
    76: 77,
    43: 78,
    89: 79,
    45: 80,
    122: 81,
    84: 82,
    53: 83,
    68: 84,
    110: 85,
    72: 86,
    104: 87,
    81: 88,
    85: 89,
    57: 90,
    87: 95,
    71: 97,
    90: 98,
    73: 99,
    106: 100,
    78: 101,
    114: 102,
    49: 103,
    109: 104,
    97: 105,
    79: 106,
    112: 107,
    111: 108,
    77: 109,
    88: 110,
    105: 111,
    74: 112,
    108: 113,
    103: 114,
    56: 115,
    67: 116,
    120: 117,
    99: 118,
    118: 119,
    48: 120,
    115: 121,
    121: 122,
}


def char_to_base64_value(c):
    """(FUN_140af0540)"""
    o = ord(c)
    if 65 <= o <= 90:
        return o - 65  # A-Z → 0-25
    if 97 <= o <= 122:
        return o - 71  # a-z → 26-51
    if 48 <= o <= 57:
        return o + 4  # 0-9 → 52-61
    if c == "-":
        return 62
    if c == "_":
        return 63
    return 0


def base64_value_to_char(val):
    val &= 63
    if val < 26:
        return chr(val + 65)  # 0-25 → A-Z
    if val < 52:
        return chr(val + 71)  # 26-51 → a-z
    if val < 62:
        return chr(val - 4)  # 52-61 → 0-9
    if val == 62:
        return "-"
    if val == 63:
        return "_"
    return "A"


def decode_stgy(stgy_string):
    data = stgy_string[7:-1]  # Strip [stgy:a and ]
    # Map key character through DAT_1420cf520
    key_char = data[0]
    key_mapped = chr(DAT_1420cf520[ord(key_char)])
    key = char_to_base64_value(key_mapped)
    # substitution cipher
    decoded = []
    for i, c in enumerate(data[1:]):
        # Map from custom alphabet to standard
        standard_char = chr(INVERSE_DAT_1420cf4a0.get(ord(c), 65))
        # Apply rotating substitution: (val - position - key) & 0x3f
        val = char_to_base64_value(standard_char)
        decoded_val = (val - i - key) & 63
        decoded.append(base64_value_to_char(decoded_val))
    # Standard base64 decode (replace custom - and _ with + and /)
    b64_string = "".join(decoded).replace("-", "+").replace("_", "/")
    binary_data = base64.b64decode(b64_string + "==")
    # Decompress zlib (skip 6-byte header: 4-byte checksum + 2-byte length)
    return zlib.decompress(binary_data[6:])


# Sample from m12
sample = "[stgy:atQ3jJZaQerK2Xj8kiHzUxjYUlJDKqHunZFFmCCFU34F+8UaEilMVHvE1vCTbfsB6nKaT14eXugKOzHPzuONBhj2J9mqjbo48hAxpY02itKu85xEqQVsr2Pon76GUxm3f0+T2Ggakt1a4kiXo5Xa+p-ucC0rynqh+9-ZPpv7aSplu0BAdlK8aCdDTv4DA7+aRkbzjyRuKUPsQlzNfKpYWitifXrIp8PW4-BmrLv2rZn878f5wj6irduNGyWNKdBVlb7ehmAAKTt2alB2rY5l3srbfAXQy86-EZcryLI28Amr-coGUidSTgsYVMmsxSBhXm6f41adkNo5K68QSkUNDUL+Y-e3KcZjGO071SX8QmRwhscvGhmuF4-bN164nUovP3WKxbzbcf4X8v17]"

if __name__ == "__main__":
    stgy = sys.argv[1] if len(sys.argv) > 1 else sample
    result = decode_stgy(stgy)
    print(result)
