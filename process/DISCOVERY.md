# FF14 Strategy Board Format Discovery Process

This document chronicles the reverse engineering of the FF14 Strategy Board share code format.

## Overview

The in-game Strategy Board feature in FFXIV Patch 7.4 uses a custom encoded format for sharing boards. This project reverse-engineered the format to create Python encoder/decoder tools.

---

## Phase 1: Initial Analysis

### Decoding the Obfuscation Layer

The format uses a custom cipher on top of Base64:

1. **Custom character substitution** - Two lookup tables transform characters
2. **Position-based shift** - Each character is shifted by `(value - index - key) mod 64`
3. **URL-safe Base64** - After deciphering, standard Base64 decoding
4. **Zlib compression** - Final decompression reveals binary payload

**Key scripts:**
- `stgy_mini.py` - Original reference decoder (provided)
- `analyze_objects.py` - Initial hex dump comparisons

### Binary Header Discovery

Comparing multiple samples revealed a 6-byte header before zlib data:

```
Offset 0x00: u32 checksum
Offset 0x04: u16 uncompressed_length
```

**Scripts:** `analyze_detailed.py`, `compare_headers.py`

---

## Phase 2: Tag Structure Analysis

### TLV-like Format

The decompressed payload uses tagged fields:

```
[u16 tag] [u16 value/length] [optional data...]
```

**Discovery scripts:**
- `analyze_tlv.py` - Identified tag boundaries
- `analyze_format_v2.py` - Parsed tag structure
- `find_sections.py` - Mapped per-object properties

### Tag Meanings

| Tag | Purpose | Discovery Method |
|-----|---------|------------------|
| 2 | Icon ID | Compared single-icon samples |
| 4 | Object count | Multi-object analysis |
| 5 | Positions | Coordinate matching |
| 6 | Background | Compared background variants |
| 7 | Size | Size slider experiments |
| 8 | Color (RGBA) | Color picker comparisons |
| 10 | Arc angle | Fan AoE samples |
| 11 | Donut radius | Donut AoE samples |
| 3 | Footer | Present in all samples |

---

## Phase 3: Checksum Discovery

### The Challenge

Generated codes failed in-game despite correct structure. Extensive testing needed.

### Attempts

1. **CRC32 variants** - Different data subsets
2. **FNV, Fletcher, DJB2, MurmurHash** - All failed
3. **XOR mask analysis** - Looking for patterns

**Scripts:** `test_hashes.py`, `reverse_checksum.py`, `try_crc_combos.py`

### Solution

The checksum is `CRC32(length_bytes + compressed_data)`:

```python
length_bytes = struct.pack('<H', len(uncompressed))
compressed = zlib.compress(uncompressed)
checksum = zlib.crc32(length_bytes + compressed)
```

---

## Phase 4: Multi-Object Encoding

### Single Object Works, Multiple Fails

Initial encoder worked for single objects but failed for multi-object boards.

### Discoveries

1. **Tag 4 format varies:**
   - Single: `[4][1][1][flags]` (8 bytes)
   - Multi: `[4][1][n][1 × n]` (6 + 2n bytes)

2. **Tag 7 packing:**
   - Single: 2 bytes per object (size + pad)
   - Multi: 1 byte per object (consecutive, then pad)

**Scripts:** `compare_multi.py`, `compare_multi2.py`, `analyze_tag4.py`, `analyze_missing.py`

---

## Phase 5: Property Flags

### Hidden and Locked

Comparing identical boards with hidden/locked flags revealed:

- **Location:** Tag 4's last u16 value
- **Values:** 0x00=hidden, 0x01=visible, 0x09=locked

**Script:** `compare_flags.py`

### Board Background

Empty boards with different backgrounds differed only in Tag 3's last value:

| Value | Background |
|-------|------------|
| 1 | None |
| 2 | Checkered |
| 3-7 | Variants |

**Script:** `compare_backgrounds.py`

---

## Phase 6: Icon Database

### Official Data

Game data CSVs provided complete mappings:

- `stgy.csv` - 140+ placeable objects with IDs
- `stgy param.csv` - Parameter definitions

### Categories

- **Role markers:** Tank, Healer, DPS variants (IDs 47-57, 118-123)
- **Jobs:** All 21 jobs + base classes (IDs 18-46, 101-102)
- **Mechanics:** AoE types, stack, gaze, tower, etc. (IDs 9-17, 106-112)
- **Waymarks:** A-D, 1-4 (IDs 79-86)

---

## Final Implementation

### Encoder (`stgy_encoder.py`)

1. Parse JSON input
2. Build binary payload with correct tag order
3. Compress with zlib
4. Calculate CRC32 checksum
5. Apply Base64 + custom cipher

### Decoder (`stgy_decoder.py`)

1. Reverse cipher + Base64
2. Skip 6-byte header, decompress
3. Parse tags sequentially
4. Build JSON output

---

## Key Learnings

1. **Test incrementally** - Single object first, then multi
2. **Byte-level comparison** - Essential for finding subtle differences
3. **Checksum is critical** - Wrong algorithm = silent failure
4. **Order matters** - Tags must be in specific order
5. **Alignment matters** - Odd-count arrays need padding

---

## Files in This Directory

| Script | Purpose |
|--------|---------|
| `analyze_*.py` | Structure analysis scripts |
| `compare_*.py` | Sample comparison scripts |
| `test_*.py` | Hash/encoding test scripts |
| `find_*.py` | Property location scripts |
| `reverse_checksum.py` | Checksum brute-force |
| `map_icons.py` | Icon ID mapping |
