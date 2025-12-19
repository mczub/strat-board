#!/usr/bin/env python3
"""Test what the checksum is calculated from."""

import zlib
from stgy_mini import decode_stgy as decode_original

# Known working original
original_code = "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"
original_binary = decode_original(original_code)

# The original checksum was 0x0751493b (from the header)
expected_checksum = 0x0751493b

print("Testing what the checksum is calculated from:")
print(f"Expected checksum: 0x{expected_checksum:08x}")

# Test CRC32 of various things
tests = [
    ("raw binary", original_binary),
    ("compressed data", zlib.compress(original_binary)),
]

for name, data in tests:
    crc = zlib.crc32(data) & 0xFFFFFFFF
    match = "MATCH!" if crc == expected_checksum else ""
    print(f"  CRC32 of {name}: 0x{crc:08x} {match}")

# Maybe it's compressed with a specific level?
for level in range(10):
    comp = zlib.compress(original_binary, level)
    crc = zlib.crc32(comp) & 0xFFFFFFFF
    match = "MATCH!" if crc == expected_checksum else ""
    print(f"  CRC32 of compressed(level={level}): 0x{crc:08x} {match}")

# Maybe it's something else entirely - let's check if it's the adler32
adler = zlib.adler32(original_binary) & 0xFFFFFFFF
print(f"  Adler32 of binary: 0x{adler:08x}")

# Let's also check raw compressed data without header
for level in range(10):
    comp = zlib.compress(original_binary, level)
    # Remove zlib header (first 2 bytes) and footer (last 4 bytes which is adler32)
    raw_deflate = comp[2:-4]
    crc = zlib.crc32(raw_deflate) & 0xFFFFFFFF
    print(f"  CRC32 of raw deflate(level={level}): 0x{crc:08x}")
