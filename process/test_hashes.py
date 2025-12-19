#!/usr/bin/env python3
"""Test if checksum might be xxHash, FNV, or other non-CRC algorithm."""

import struct
from stgy_mini import decode_stgy

# Known working sample
code = "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"
binary = decode_stgy(code)

expected_checksum = 0x0751493b

print(f"Expected checksum: 0x{expected_checksum:08x}")
print(f"Binary length: {len(binary)}")

# FNV-1a hash
def fnv1a_32(data):
    h = 0x811c9dc5
    for b in data:
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h

# Fletcher-32
def fletcher32(data):
    if len(data) % 2:
        data = data + b'\x00'
    words = struct.unpack('<' + 'H' * (len(data) // 2), data)
    sum1 = 0
    sum2 = 0
    for word in words:
        sum1 = (sum1 + word) % 65535
        sum2 = (sum2 + sum1) % 65535
    return (sum2 << 16) | sum1

# DJB2 hash
def djb2(data):
    h = 5381
    for b in data:
        h = ((h << 5) + h + b) & 0xFFFFFFFF
    return h

# SDBM hash
def sdbm(data):
    h = 0
    for b in data:
        h = b + (h << 6) + (h << 16) - h
        h &= 0xFFFFFFFF
    return h

# Jenkins one-at-a-time
def joaat(data):
    h = 0
    for b in data:
        h = (h + b) & 0xFFFFFFFF
        h = (h + (h << 10)) & 0xFFFFFFFF
        h ^= (h >> 6)
    h = (h + (h << 3)) & 0xFFFFFFFF
    h ^= (h >> 11)
    h = (h + (h << 15)) & 0xFFFFFFFF
    return h

# MurmurHash3 32-bit
def murmur3_32(data, seed=0):
    def fmix(h):
        h ^= h >> 16
        h = (h * 0x85ebca6b) & 0xFFFFFFFF
        h ^= h >> 13
        h = (h * 0xc2b2ae35) & 0xFFFFFFFF
        h ^= h >> 16
        return h
    
    length = len(data)
    h = seed
    c1 = 0xcc9e2d51
    c2 = 0x1b873593
    
    nblocks = length // 4
    for i in range(nblocks):
        k = struct.unpack_from('<I', data, i * 4)[0]
        k = (k * c1) & 0xFFFFFFFF
        k = ((k << 15) | (k >> 17)) & 0xFFFFFFFF
        k = (k * c2) & 0xFFFFFFFF
        h ^= k
        h = ((h << 13) | (h >> 19)) & 0xFFFFFFFF
        h = ((h * 5) + 0xe6546b64) & 0xFFFFFFFF
    
    tail = data[nblocks * 4:]
    k = 0
    if len(tail) >= 3:
        k ^= tail[2] << 16
    if len(tail) >= 2:
        k ^= tail[1] << 8
    if len(tail) >= 1:
        k ^= tail[0]
        k = (k * c1) & 0xFFFFFFFF
        k = ((k << 15) | (k >> 17)) & 0xFFFFFFFF
        k = (k * c2) & 0xFFFFFFFF
        h ^= k
    
    h ^= length
    return fmix(h)

tests = [
    ("FNV-1a", fnv1a_32),
    ("Fletcher-32", fletcher32),
    ("DJB2", djb2),
    ("SDBM", sdbm),
    ("Jenkins OAAT", joaat),
    ("MurmurHash3", murmur3_32),
]

print("\nTesting hash algorithms on uncompressed binary:")
for name, func in tests:
    result = func(binary)
    match = "MATCH!" if result == expected_checksum else ""
    print(f"  {name}: 0x{result:08x} {match}")

# Maybe it's not the raw binary but some transformation?
# Or maybe it's random/timestamp and the game doesn't validate it?
print("\nMaybe the checksum field is NOT validated by the game...")
print("The game might reject codes for a different reason.")
