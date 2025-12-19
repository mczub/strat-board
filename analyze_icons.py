#!/usr/bin/env python3
"""Map FF14 icon IDs to job names based on the pattern."""

# All icon IDs found in the comprehensive sample (sorted)
icon_ids = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 101, 102, 118, 119, 120, 121, 122, 123]

# FF14 jobs by role - there are 22 battle jobs + 8 gathererer/crafter classes
# But strategy boards mainly use battle jobs

# Based on coordinates in the sample, icons are arranged in rows by y-position:
# Row 1 (y=0): IDs 47-57, 122-123 - likely tanks/misc at bottom
# Row 2 (y~50): IDs 27-43, 118-121 - mix of jobs
# Row 3 (y~100): IDs 28-46, 101 - another row
# Row 4 (y~140-150): IDs 18-26, 41-42, 102 - top area

# We know:
# 47 = Tank
# 48 = Tank1

# Looking at the range of IDs, these likely correspond to FF14's internal job IDs
# or to the strategy board's own icon enum

# Common FF14 strategy board icons include:
# - Role icons: Tank, Healer, DPS, Support (T, H, D)  
# - Numbered party icons: T1, T2, H1, H2, D1, D2, D3, D4
# - Waymarks: A, B, C, D, 1, 2, 3, 4
# - Job icons for each of the 22+ jobs

# Let's assume the layout based on the sample position groups
print("Icon IDs grouped by Y position (rough groupings):")
print()

# From the coordinate data:
groups = {
    "Row 0 (y=0)": [(47, 0, 0), (48, 407, 0), (49, 809, 0), (50, 1219, 0), (51, 1699, 0), 
                   (52, 2172, 0), (122, 2678, 0), (123, 3101, 0), (53, 3567, 0), 
                   (54, 3996, 0), (55, 4449, 0), (56, 4919, 0)],
    "Row ~46-48": [(57, 0, 466), (118, 423, 478), (119, 847, 498), (120, 1289, 518), (121, 1724, 501)],
    "Row ~50-54": [(27, 2187, 529), (29, 2679, 532), (38, 3124, 518), (43, 3543, 536), 
                  (32, 3945, 529), (35, 4390, 504), (39, 4869, 519)],
    "Row ~100-107": [(46, 5, 1069), (28, 485, 1063), (30, 963, 1056), (36, 1449, 1039),
                    (40, 1886, 1013), (45, 2323, 1006), (101, 2801, 1008), (31, 3324, 1073),
                    (37, 3780, 1063), (44, 4204, 1095), (33, 4761, 1099)],
    "Row ~140-157": [(34, 55, 1529), (41, 583, 1469), (102, 970, 1463), (42, 1449, 1402),
                    (18, 2067, 1517), (20, 2546, 1372), (23, 3055, 1414), (19, 3437, 1566),
                    (21, 3867, 1493), (26, 4279, 1420), (22, 4795, 1559)],
    "Row ~195": [(24, 116, 1959), (25, 589, 1959)],
}

# Known mappings
known = {
    47: "Tank",
    48: "Tank1",
}

print("All unique icon IDs from sample (48 total):")
print("-" * 50)

sorted_ids = sorted(icon_ids)
# Group into ranges
ranges = {
    "18-26 (9)": list(range(18, 27)),  # 9 icons
    "27-46 (20)": list(range(27, 47)), # 20 icons
    "47-57 (11)": list(range(47, 58)), # 11 icons
    "101-102 (2)": [101, 102],         # 2 icons  
    "118-123 (6)": list(range(118, 124)), # 6 icons
}

print("\nBy ID ranges:")
for range_name, ids in ranges.items():
    present = [i for i in ids if i in icon_ids]
    missing = [i for i in ids if i not in icon_ids]
    print(f"\n{range_name}:")
    print(f"  Present: {present}")
    if missing:
        print(f"  Missing: {missing}")

print("\n" + "="*60)
print("HYPOTHESIS - Icon Type Mapping")
print("="*60)
print("""
Based on 48 icons matching FF14's 22 battle jobs + role markers + party slots:

Role Markers (generic):
  47 = Tank (T role marker)
  48 = Tank1 (could be T1 slot)
  ...
  
Job Icons (likely):
  18-26 = Some job category (9 IDs = possibly Healers + Tanks)
  27-46 = DPS jobs? (20 IDs) 
  47-57 = Party role slots (T, H, D variants)
  101-102 = Special icons (maybe Limit Break related?)
  118-123 = Additional icons (6 IDs)

Total: 48 unique icons in this sample

To confirm: need test with single known job icon (e.g., "White Mage" specifically)
""")
