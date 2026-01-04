/**
 * Editor Object Definitions
 * 
 * Defines all available objects organized by category for the editor UI.
 * Categories match the in-game order: Class/Job, Attack Types, Icon/Marker, Signs/Symbols, Field
 * Icons are loaded from /icons/{type}.png
 */

export interface ObjectDefinition {
    type: string
    label: string
    category: 'class_job' | 'attack' | 'marker' | 'signs' | 'field'
    defaultSize?: number
}

export const OBJECT_CATEGORIES = [
    { id: 'class_job', label: 'Class/Job', icon: 'tank' },
    { id: 'attack', label: 'Attack Types', icon: 'stack' },
    { id: 'marker', label: 'Icon/Marker', icon: 'waymark_a' },
    { id: 'signs', label: 'Signs/Symbols', icon: 'shape_circle' },
    { id: 'field', label: 'Field', icon: 'checkered_circle' },
] as const

export const OBJECT_DEFINITIONS: ObjectDefinition[] = [
    // ============ CLASS/JOB (Tab 0) ============
    // Row 1: Role markers
    { type: 'tank', label: 'Tank', category: 'class_job' },
    { type: 'tank_1', label: 'Tank 1', category: 'class_job' },
    { type: 'tank_2', label: 'Tank 2', category: 'class_job' },
    { type: 'healer', label: 'Healer', category: 'class_job' },
    { type: 'healer_1', label: 'Healer 1', category: 'class_job' },
    // Row 2
    { type: 'healer_2', label: 'Healer 2', category: 'class_job' },
    { type: 'pure_healer', label: 'Pure Healer', category: 'class_job' },
    { type: 'barrier_healer', label: 'Barrier Healer', category: 'class_job' },
    { type: 'dps', label: 'DPS', category: 'class_job' },
    { type: 'dps_1', label: 'DPS 1', category: 'class_job' },
    { type: 'dps_2', label: 'DPS 2', category: 'class_job' },
    { type: 'dps_3', label: 'DPS 3', category: 'class_job' },
    { type: 'dps_4', label: 'DPS 4', category: 'class_job' },
    { type: 'melee_1', label: 'Melee 1', category: 'class_job' },
    { type: 'melee_2', label: 'Melee 2', category: 'class_job' },
    { type: 'ranged_dps_1', label: 'Ranged 1', category: 'class_job' },
    { type: 'ranged_dps_2', label: 'Ranged 2', category: 'class_job' },
    { type: 'melee_dps', label: 'Melee DPS', category: 'class_job' },
    { type: 'ranged_dps', label: 'Ranged DPS', category: 'class_job' },
    { type: 'physical_ranged_dps', label: 'Phys Ranged', category: 'class_job' },
    { type: 'magical_ranged_dps', label: 'Mag Ranged', category: 'class_job' },

    // Row 5: Tank Jobs
    { type: 'paladin', label: 'PLD', category: 'class_job' },
    { type: 'warrior', label: 'WAR', category: 'class_job' },
    { type: 'dark_knight', label: 'DRK', category: 'class_job' },
    { type: 'gunbreaker', label: 'GNB', category: 'class_job' },
    // Row 6: Healer Jobs
    { type: 'white_mage', label: 'WHM', category: 'class_job' },
    { type: 'scholar', label: 'SCH', category: 'class_job' },
    { type: 'astrologian', label: 'AST', category: 'class_job' },
    { type: 'sage', label: 'SGE', category: 'class_job' },


    // Row 7: Melee Jobs
    { type: 'monk', label: 'MNK', category: 'class_job' },
    { type: 'dragoon', label: 'DRG', category: 'class_job' },
    { type: 'ninja', label: 'NIN', category: 'class_job' },
    { type: 'samurai', label: 'SAM', category: 'class_job' },
    { type: 'reaper', label: 'RPR', category: 'class_job' },
    { type: 'viper', label: 'VPR', category: 'class_job' },
    // Row 8: Ranged Jobs
    { type: 'bard', label: 'BRD', category: 'class_job' },
    { type: 'machinist', label: 'MCH', category: 'class_job' },
    { type: 'dancer', label: 'DNC', category: 'class_job' },
    // Row 9: Caster Jobs
    { type: 'black_mage', label: 'BLM', category: 'class_job' },
    { type: 'summoner', label: 'SMN', category: 'class_job' },
    { type: 'red_mage', label: 'RDM', category: 'class_job' },
    { type: 'pictomancer', label: 'PCT', category: 'class_job' },
    { type: 'blue_mage', label: 'BLU', category: 'class_job' },
    // Row 10: Base Classes
    { type: 'gladiator', label: 'GLA', category: 'class_job' },
    { type: 'marauder', label: 'MRD', category: 'class_job' },
    { type: 'conjurer', label: 'CNJ', category: 'class_job' },
    { type: 'arcanist', label: 'ACN', category: 'class_job' },
    { type: 'pugilist', label: 'PGL', category: 'class_job' },
    { type: 'lancer', label: 'LNC', category: 'class_job' },
    { type: 'rogue', label: 'ROG', category: 'class_job' },
    { type: 'archer', label: 'ARC', category: 'class_job' },
    { type: 'thaumaturge', label: 'THM', category: 'class_job' },

    // ============ ATTACK TYPES (Tab 1) ============
    { type: 'circle_aoe', label: 'Circle AoE', category: 'attack' },
    { type: 'fan_aoe', label: 'Fan AoE', category: 'attack' },
    { type: 'line_aoe', label: 'Line AoE', category: 'attack' },
    { type: 'gaze', label: 'Gaze', category: 'attack' },
    { type: 'stack', label: 'Stack', category: 'attack' },
    { type: 'line_stack', label: 'Line Stack', category: 'attack' },
    { type: 'proximity', label: 'Proximity', category: 'attack' },
    { type: 'donut', label: 'Donut AoE', category: 'attack' },
    { type: 'stack_multi', label: 'Stack Multi', category: 'attack' },
    { type: 'proximity_player', label: 'Spread', category: 'attack' },
    { type: 'tankbuster', label: 'Tankbuster', category: 'attack' },
    { type: 'radial_knockback', label: 'Radial KB', category: 'attack' },
    { type: 'linear_knockback', label: 'Linear KB', category: 'attack' },
    { type: 'tower', label: 'Tower', category: 'attack' },
    { type: 'targeting', label: 'Targeting Indicator', category: 'attack' },
    { type: 'moving_circle_aoe', label: 'Moving AoE', category: 'attack' },
    { type: '1person_aoe', label: '1P AoE', category: 'attack' },
    { type: '2person_aoe', label: '2P AoE', category: 'attack' },
    { type: '3person_aoe', label: '3P AoE', category: 'attack' },
    { type: '4person_aoe', label: '4P AoE', category: 'attack' },

    // ============ ICON/MARKER (Tab 2) ============
    // Enemies
    { type: 'small_enemy', label: 'Small Enemy', category: 'marker' },
    { type: 'medium_enemy', label: 'Medium Enemy', category: 'marker' },
    { type: 'large_enemy', label: 'Large Enemy', category: 'marker' },

    { type: 'enhancement', label: 'Enhancement Effect', category: 'marker' },
    { type: 'enfeeblement', label: 'Enfeeblement Effect', category: 'marker' },
    // Attack markers
    { type: 'attack_1', label: 'Target to Attack 1', category: 'marker' },
    { type: 'attack_2', label: 'Target to Attack 2', category: 'marker' },
    { type: 'attack_3', label: 'Target to Attack 3', category: 'marker' },
    { type: 'attack_4', label: 'Target to Attack 4', category: 'marker' },
    { type: 'attack_5', label: 'Target to Attack 5', category: 'marker' },
    { type: 'attack_6', label: 'Target to Attack 6', category: 'marker' },
    { type: 'attack_7', label: 'Target to Attack 7', category: 'marker' },
    { type: 'attack_8', label: 'Target to Attack 8', category: 'marker' },
    // Bind markers
    { type: 'bind_1', label: 'Bind 1', category: 'marker' },
    { type: 'bind_2', label: 'Bind 2', category: 'marker' },
    { type: 'bind_3', label: 'Bind 3', category: 'marker' },
    // Ignore markers
    { type: 'ignore_1', label: 'Ignore 1', category: 'marker' },
    { type: 'ignore_2', label: 'Ignore 2', category: 'marker' },
    // Sign markers
    { type: 'square_marker', label: 'Square Sign', category: 'marker' },
    { type: 'circle_marker', label: 'Circle Sign', category: 'marker' },
    { type: 'plus_marker', label: 'Plus Sign', category: 'marker' },
    { type: 'triangle_marker', label: 'Triangle Sign', category: 'marker' },
    // Waymarks
    { type: 'waymark_a', label: 'Waymark A', category: 'marker' },
    { type: 'waymark_b', label: 'Waymark B', category: 'marker' },
    { type: 'waymark_c', label: 'Waymark C', category: 'marker' },
    { type: 'waymark_d', label: 'Waymark D', category: 'marker' },
    { type: 'waymark_1', label: 'Waymark 1', category: 'marker' },
    { type: 'waymark_2', label: 'Waymark 2', category: 'marker' },
    { type: 'waymark_3', label: 'Waymark 3', category: 'marker' },
    { type: 'waymark_4', label: 'Waymark 4', category: 'marker' },
    { type: 'lockon_red', label: 'Red Lock-on Marker', category: 'marker' },
    { type: 'lockon_blue', label: 'Blue Lock-on Marker', category: 'marker' },
    { type: 'lockon_purple', label: 'Purple Lock-on Marker', category: 'marker' },
    { type: 'lockon_green', label: 'Green Lock-on Marker', category: 'marker' },


    // ============ SIGNS/SYMBOLS (Tab 3) ============
    // Text (special)
    { type: 'text', label: 'Text', category: 'signs' },
    { type: 'shape_circle', label: 'Circle', category: 'signs' },
    { type: 'shape_x', label: 'X Shape', category: 'signs' },
    { type: 'shape_triangle', label: 'Triangle', category: 'signs' },
    { type: 'shape_square', label: 'Square', category: 'signs' },
    { type: 'up_arrow', label: 'Up Arrow', category: 'signs' },
    { type: 'rotate', label: 'Rotate', category: 'signs' },

    { type: 'highlighted_circle', label: 'HL Circle', category: 'signs' },
    { type: 'highlighted_triangle', label: 'HL Triangle', category: 'signs' },
    { type: 'highlighted_square', label: 'HL Square', category: 'signs' },
    { type: 'highlighted_x', label: 'HL X', category: 'signs' },
    { type: 'rotate_clockwise', label: 'Rotate Clockwise', category: 'signs' },
    { type: 'rotate_counterclockwise', label: 'Rotate Counterclockwise', category: 'signs' },
    { type: 'line', label: 'Line', category: 'signs' },

    // ============ FIELD (Tab 4) ============
    { type: 'checkered_circle', label: 'Check Circle', category: 'field' },
    { type: 'checkered_square', label: 'Check Square', category: 'field' },
    { type: 'grey_circle', label: 'Grey Circle', category: 'field' },
    { type: 'grey_square', label: 'Grey Square', category: 'field' },
]

// DPS types for unified mode (dps_1, dps_2, dps_3, dps_4)
const UNIFIED_DPS_TYPES = new Set(['dps_1', 'dps_2', 'dps_3', 'dps_4'])

// DPS types for separate mode (melee_1, melee_2, ranged_dps_1, ranged_dps_2)
const SEPARATE_DPS_TYPES = new Set(['melee_1', 'melee_2', 'ranged_dps_1', 'ranged_dps_2'])

// Helper to get objects by category, with optional DPS mode filtering
export function getObjectsByCategory(category: string, useSeparateDps?: boolean): ObjectDefinition[] {
    return OBJECT_DEFINITIONS.filter((obj) => {
        // First filter by category
        if (obj.category !== category) return false

        // If not class_job category or useSeparateDps not specified, include all
        if (category !== 'class_job' || useSeparateDps === undefined) return true

        // Filter DPS icons based on mode
        if (useSeparateDps) {
            // Separate mode: hide unified DPS types (dps_1-4)
            return !UNIFIED_DPS_TYPES.has(obj.type)
        } else {
            // Unified mode: hide separate DPS types (melee_1-2, ranged_dps_1-2)
            return !SEPARATE_DPS_TYPES.has(obj.type)
        }
    })
}

// Background options
export const BACKGROUND_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'checkered', label: 'Checkered' },
    { value: 'checkered_circle', label: 'Checkered (Circular Field)' },
    { value: 'checkered_square', label: 'Checkered (Square Field)' },
    { value: 'grey', label: 'Grey' },
    { value: 'grey_circle', label: 'Grey (Circular Field)' },
    { value: 'grey_square', label: 'Grey (Square Field)' },
] as const
