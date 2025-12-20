# FF14 Strategy Board Format (Patch 7.4)

## Encoding Pipeline

```
[stgy:…] → Custom cipher → URL-safe Base64 → Binary blob → 6-byte header → zlib payload → Tag stream
```

### Binary Header (6 bytes, before zlib)

| Offset | Type | Description |
|--------|------|-------------|
| 0x00 | u32 | Checksum: `CRC32(length_bytes + compressed_data)` |
| 0x04 | u16 | Uncompressed payload length |

---

## Board Coordinates

- **X**: 0 to 512
- **Y**: 0 to 384
- **Center**: (256, 192)
- Stored as signed int16 × 10 (e.g., 256.5 → 2565)

---

## Tag Reference

All data encoded as tagged fields: `u16 tag`, `u16 value`, `[extra data]`

### Tag 2 — Icon ID
```
u16 tag = 2
u16 icon_id
```
Multiple Tag-2 entries = multiple objects.

### Tag 4 — Object Header with Flags
```
Single:  [4][1][1][flags]    (8 bytes)
Multi:   [4][1][n][1×n]      (6 + 2n bytes)
```
**Flags (single object):** 0x01=visible, 0x00=hidden, 0x09=locked

### Tag 5 — Positions
```
u16 tag = 5, u16 3, u16 count
repeat: i16 x×10, i16 y×10
```

### Tag 6 — Object Background
```
u16 tag = 6, u16 1, u16 count
repeat: u16 bg_enum
```

### Tag 7 — Size (consecutive u8)
```
u16 tag = 7, u16 0, u16 count
repeat: u8 size (50-200, default 100)
+ padding if odd count
```

### Tag 8 — Color (RGBA)
```
u16 tag = 8, u16 2, u16 count
repeat: u8 r, u8 g, u8 b, u8 alpha
```

### Tags 10-12 — Arc/Donut/Reserved
```
u16 tag, u16 1, u16 count
repeat: u16 value
```
- Tag 10: Arc angle (10-360)
- Tag 11: Donut radius (0-240)
- Tag 12: Reserved (always 0)

### Tag 3 — Footer with Board Background
```
u16 tag = 3, u16 1, u16 1, u16 board_bg
```
| Value | Background |
|-------|------------|
| 1 | None |
| 2 | Checkered |
| 3 | Checkered (Circular) |
| 4 | Checkered (Square) |
| 5 | Grey |
| 6 | Grey (Circular) |
| 7 | Grey (Square) |

---

## Icon Types (80+)

### Role Markers (Type 2)
| ID | Name |
|----|------|
| 47-49 | tank, tank_1, tank_2 |
| 50-52 | healer, healer_1, healer_2 |
| 53-57 | dps, dps_1 through dps_4 |
| 118-123 | melee_dps, ranged_dps, pure_healer, barrier_healer |

### Jobs (Type 2)
| ID | Name |
|----|------|
| 18-26 | Base classes (gladiator, pugilist, etc.) |
| 27-46 | Jobs (paladin through sage) |
| 101-102 | viper, pictomancer |

### AoE/Mechanics (Type 6)
| ID | Name |
|----|------|
| 9 | circle_aoe |
| 10 | fan_aoe |
| 13-17 | gaze, stack, line_stack, proximity, donut |
| 106-112 | stack_multi, proximity_player, tankbuster, knockbacks, tower |

### Waymarks (Type 3)
| ID | Name |
|----|------|
| 79-82 | waymark_a through waymark_d |
| 83-86 | waymark_1 through waymark_4 |

### Enemies (Type 3)
| ID | Name |
|----|------|
| 60, 62, 64 | small_enemy, medium_enemy, large_enemy |

---

## JSON Format

```json
{
  "name": "board_name",
  "board_background": "checkered",
  "objects": [
    {
      "type": "tank",
      "x": 256, "y": 192,
      "size": 100,
      "hidden": false,
      "locked": false
    }
  ]
}
```

---

## Tools

```bash
# Decode share code to JSON
python stgy_decoder.py "[stgy:...]"

# Encode JSON to share code
python stgy_encoder.py board.json
```
