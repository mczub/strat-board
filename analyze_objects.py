#!/usr/bin/env python3
"""Analyze FF14 strategy board object format by comparing payloads."""

from stgy_mini import decode_stgy

# Test cases provided by user
samples = [
    ("test at x:0,y:0", "[stgy:aV6va-fqTem+7Jrx3lj55Yz0hsqPZQq5jbkqPazMEFQleuXfDlyx90VJ07yd+MNvWVehCSfGO1BUiBuddJgItSWfdq0xH3OHJMZOGr1dJ]"),
    ("test at x:1,y:0", "[stgy:atQzQvwo-frK2Xj8kiZzzLYcnvwV9HwzZ4uwV1YpSeHifFobTi08QctXsn0GjMHHZF4k8Iszpfbh2FAwudkbLocYWd71CH6ekio3jjkxSI]"),
    ("test1 at x:1,y:0", "[stgy:a+1MY3P6OnyrkV0fI4cpp1aAiF6-CJ6pczG652wbnG+OSrTERujfWgRwTnbuT5ws5BzYe4JrXPoo8pJJuZIjI1qEAvsrEY6d7SR0VvHYqE1u]"),
]

def hex_dump(data, prefix=""):
    """Print hex dump of binary data."""
    for i in range(0, len(data), 16):
        chunk = data[i:i+16]
        hex_str = " ".join(f"{b:02x}" for b in chunk)
        ascii_str = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
        print(f"{prefix}{i:04x}: {hex_str:<48} {ascii_str}")

def compare_bytes(name1, data1, name2, data2):
    """Compare two byte sequences and show differences."""
    print(f"\n=== Comparing {name1} vs {name2} ===")
    max_len = max(len(data1), len(data2))
    diffs = []
    for i in range(max_len):
        b1 = data1[i] if i < len(data1) else None
        b2 = data2[i] if i < len(data2) else None
        if b1 != b2:
            diffs.append((i, b1, b2))
    
    print(f"Length difference: {len(data1)} vs {len(data2)}")
    print(f"Number of byte differences: {len(diffs)}")
    for offset, b1, b2 in diffs:
        b1_str = f"0x{b1:02x}" if b1 is not None else "None"
        b2_str = f"0x{b2:02x}" if b2 is not None else "None"
        print(f"  Offset {offset}: {b1_str} -> {b2_str}")

if __name__ == "__main__":
    decoded = []
    
    for name, stgy in samples:
        print(f"\n{'='*60}")
        print(f"Decoding: {name}")
        print(f"{'='*60}")
        
        result = decode_stgy(stgy)
        decoded.append((name, result))
        
        print(f"Decoded length: {len(result)} bytes")
        print(f"\nRaw bytes: {result}")
        print(f"\nHex dump:")
        hex_dump(result)
    
    # Compare the samples
    print("\n" + "="*60)
    print("COMPARISONS")
    print("="*60)
    
    # Compare test x:0,y:0 vs test x:1,y:0 (same name, different x)
    compare_bytes(decoded[0][0], decoded[0][1], decoded[1][0], decoded[1][1])
    
    # Compare test x:1,y:0 vs test1 x:1,y:0 (different name, same position)
    compare_bytes(decoded[1][0], decoded[1][1], decoded[2][0], decoded[2][1])
