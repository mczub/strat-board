#!/usr/bin/env python3
"""Map icon IDs to FF14 jobs based on visual layout and coordinates."""

# From coordinate analysis - icons sorted by visual position (high Y = top of screen)
# Matching to the screenshot rows

# Coordinate data sorted by visual top-to-bottom, left-to-right
# (Y descending, X ascending)

rows_by_y = {
    # Row 1 (y ~ 1959) - TOP of screen, only 2 icons
    1959: [(24, 116), (25, 589)],
    
    # Row 2 (y ~ 1400-1560) - Party role markers row  
    # Looking at image: T, T1, T2, H, H1, H2, D, D1, D2, D1, D2, D1
    1500: [(34, 55), (41, 583), (102, 970), (42, 1449), (18, 2067), 
           (20, 2546), (23, 3055), (19, 3437), (21, 3867), (26, 4279), (22, 4795)],
    
    # Row 3 (y ~ 1000-1100)
    1050: [(46, 5), (28, 485), (30, 963), (36, 1449), (40, 1886),
           (45, 2323), (101, 2801), (31, 3324), (37, 3780), (44, 4204), (33, 4761)],
    
    # Row 4 (y ~ 466-536)
    500: [(57, 0), (118, 423), (119, 847), (120, 1289), (121, 1724),
          (27, 2187), (29, 2679), (38, 3124), (43, 3543), (32, 3945), (35, 4390), (39, 4869)],
    
    # Row 5 (y = 0) - BOTTOM of screen
    0: [(47, 0), (48, 407), (49, 809), (50, 1219), (51, 1699),
        (52, 2172), (122, 2678), (123, 3101), (53, 3567), (54, 3996), (55, 4449), (56, 4919)],
}

# Looking at the screenshot from top to bottom, left to right:
# 
# ROW 1 (topmost): T, T1, T2, H, H1, H2, D, D1, D2, D1, D2, D1 (12 icons - party markers)
#   Blue borders = Tanks, Green borders = Healers/DPS
#
# ROW 2: Reaper, Dragoon, Monk, Samurai, Ninja, Viper + other melee DPS 
#   (brown/gold borders)
#
# ROW 3: Bard, MCH, DNC, BLM, SMN, RDM with symbols + casters
#   (mix of borders)
#
# ROW 4: PLD, WAR, DRK, GNB (tanks) + WHM, SCH, AST, SGE (healers)
#   (blue and green borders respectively)
#
# ROW 5: DOL/DOH classes or additional icons
#   (red/brown borders)
#
# ROW 6 (bottom): 2 icons

# Based on FF14 job abbreviations and the visual layout:
icon_mapping = {
    # Row 5 (y=0, BOTTOM) - appears to be melee DPS jobs
    47: "Tank",        # Confirmed from earlier test
    48: "Tank1",       # Confirmed from earlier test  
    49: "Tank2",
    50: "Healer",
    51: "Healer1", 
    52: "Healer2",
    122: "DPS (green)",
    123: "DPS (blue?)",
    53: "DPS1",
    54: "DPS2",
    55: "DPS3",
    56: "DPS4",
    
    # Row 4 (y~500) - mix of roles
    57: "DPS (extra)?",
    118: "Job icon",
    119: "Job icon",
    120: "Job icon",
    121: "Job icon",
    27: "Job icon",
    29: "Job icon",
    38: "Job icon",
    43: "Job icon",
    32: "Job icon",
    35: "Job icon",
    39: "Job icon",
    
    # Row 3 (y~1050)
    46: "Job icon",
    28: "Job icon",
    30: "Job icon",
    36: "Job icon",
    40: "Job icon",
    45: "Job icon",
    101: "Special icon",
    31: "Job icon",
    37: "Job icon",
    44: "Job icon",
    33: "Job icon",
    
    # Row 2 (y~1500)
    34: "Job icon",
    41: "Job icon",
    102: "Special icon",
    42: "Job icon",
    18: "Job icon",
    20: "Job icon",
    23: "Job icon",
    19: "Job icon",
    21: "Job icon",
    26: "Job icon",
    22: "Job icon",
    
    # Row 1 (y~1959, TOP)
    24: "Icon at top",
    25: "Icon at top",
}

print("=" * 60)
print("FF14 Strategy Board - Icon ID Summary")
print("=" * 60)

print("\nConfirmed mappings:")
print("  47 = Tank (role marker)")
print("  48 = Tank1 (party slot)")

print("\nID ranges by role (hypothesis):")
print("  47-57: Party role slots (T, T1, T2, H, H1, H2, D, D1-D4)")
print("  18-46: Battle job icons (22 jobs)")
print("  101-102: Special/extra icons")
print("  118-123: Additional slots or DoL/DoH")

print("\nTotal unique IDs: 48")
print("FF14 has: 21 battle jobs + party slots + misc = matches!")

print("\nTo complete mapping, need single-job test cases like:")
print("  - Paladin only at (0,0)")
print("  - White Mage only at (0,0)")
print("  - etc.")
