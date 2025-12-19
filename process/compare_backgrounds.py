#!/usr/bin/env python3
"""Compare board background samples to find the location."""

from stgy_mini import decode_stgy

# All background samples - empty boards named 'abcdefg'
samples = [
    ("None", "[stgy:a-56XyRuBhwm3PyeNbAMMapFxuKTcgKN0rtAHQfugDQ61eVvRb6g0FRp]"),
    ("Checkered", "[stgy:aqnvGgVYCbj6soZluMgYY3L8hxytQDyu9dmgPWixDVW0klVG7uWkJlwQovC1]"),
    ("Checkered Circle", "[stgy:aH3MUdi8KIVXzAtkpF688il32LTQw0TpqoW6ZjuL09j-Mk9sHhBksk6tV]"),
    ("Checkered Square", "[stgy:agoMBWzsmsTPM9-NEGreebf13aXCKdXE+VHr0yIadcyo4NcYlEy8jNJLJpa2]"),
    ("Grey", "[stgy:av8V0+cdMqhegNnOWrpddABo-X8szL8W5fGp7SmXL2SlRO2DcWt0aOxT7JX6]"),
    ("Grey Circle", "[stgy:asbGxb29itUFC1hoRmM66BdXTJx25YxRneIMSEOJY7E8Ao7H0REDpovDfgJZ]"),
    ("Grey Square", "[stgy:aX1aYgqxjx+taHKG7hZbbE4IuNOJdAO76qTZCcUNAgcmSGg3M7vk9GokPmr1]"),
]

print("Decoding all samples...")
decoded = []
for name, code in samples:
    binary = decode_stgy(code)
    decoded.append((name, binary))
    print(f"\n=== {name} ({len(binary)} bytes) ===")
    for i in range(0, len(binary), 16):
        chunk = binary[i:i+16]
        hex_str = " ".join(f"{b:02x}" for b in chunk)
        print(f"{i:04x}: {hex_str}")

# Compare all samples to find differences
print("\n" + "=" * 70)
print("COMPARING ALL SAMPLES (showing differences)")
print("=" * 70)

base_name, base_binary = decoded[0]
for name, binary in decoded[1:]:
    diffs = []
    max_len = max(len(base_binary), len(binary))
    for i in range(max_len):
        b = base_binary[i] if i < len(base_binary) else None
        c = binary[i] if i < len(binary) else None
        if b != c:
            diffs.append((i, b, c))
    
    print(f"\n{base_name} vs {name}: {len(diffs)} differences")
    for offset, base_val, curr_val in diffs[:10]:
        b_str = f"0x{base_val:02x}" if base_val is not None else "None"
        c_str = f"0x{curr_val:02x}" if curr_val is not None else "None"
        print(f"  0x{offset:02X}: {b_str} -> {c_str}")
