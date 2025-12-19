#!/usr/bin/env python3
"""Figure out correct payload size calculation."""

from stgy_mini import decode_stgy
import struct

# Original code
original_code = "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"
original_binary = decode_stgy(original_code)

print("Analyzing payload size in original")
print("=" * 60)

total_len = len(original_binary)
print(f"Total binary length: {total_len} bytes")

# Header ends at 0x24
header_len = 0x24
print(f"Header length: {header_len} bytes")

# What's at offset 0x12?
payload_size_field = struct.unpack_from('<I', original_binary, 0x12)[0]
print(f"Payload size field (at 0x12): {payload_size_field} (0x{payload_size_field:02x})")

# Is it total - header?
calc1 = total_len - header_len
print(f"\nTotal - Header = {calc1}")

# Is it something else?
# 0x58 = 88, total = 116, header = 36
# 116 - 36 = 80 (0x50), but field says 88 (0x58)
# Difference: 88 - 80 = 8

# Maybe it includes the name length field?
# Header is 0x24 = 36 bytes, but maybe payload starts earlier?

# Let's check: maybe payload starts at 0x18 instead of 0x24
payload_start_18 = 0x18
calc2 = total_len - payload_start_18
print(f"Total - 0x18 = {calc2}")  # 116 - 24 = 92, not 88

# Maybe it's total - 0x1C (after name length, before name)
calc3 = total_len - 0x1C
print(f"Total - 0x1C = {calc3}")  # 116 - 28 = 88 = 0x58 !!!

print(f"\n*** Payload size = Total length - 0x1C (28) ***")
print(f"    {total_len} - 28 = {total_len - 28} = 0x{total_len - 28:02x}")
