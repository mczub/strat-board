/**
 * Object Metadata - Defines per-object parameters, limits, and defaults
 * 
 * This file contains metadata about what parameters each object type supports,
 * their default values, and valid ranges.
 */

export type ParameterType = 'size' | 'angle' | 'transparency' | 'color' | 'text' | 'width' | 'height' | 'arcAngle' | 'donutRadius' | 'displayCount' | 'horizontalCount' | 'verticalCount'

export interface ParameterConfig {
    /** Min value (for numeric params) */
    min?: number
    /** Max value (for numeric params) */
    max?: number
    /** Step increment (for sliders) */
    step?: number
    /** Default value */
    default?: number | string
    /** Custom label override */
    label?: string
}

export interface ObjectMetadata {
    /** Default size in board units (before scaling) */
    baseSize: number
    /** Name to use when displaying this object */
    displayName: string
    /** Parameters this object supports */
    parameters: Partial<Record<ParameterType, ParameterConfig>>
    /** Whether this object renders as SVG (vs image) */
    isSvg?: boolean
}

// Default parameter configs (can be overridden per object)
const SIZE_PARAM: ParameterConfig = { min: 10, max: 200, step: 1, default: 100 }
const SIZE_PARAM_50: ParameterConfig = { min: 50, max: 200, step: 1, default: 100 }
const ANGLE_PARAM: ParameterConfig = { min: -180, max: 180, step: 1, default: 0 }
const TRANSPARENCY_PARAM: ParameterConfig = { min: 0, max: 100, step: 1, default: 0 }
const COLOR_PARAM: ParameterConfig = {}

// Object type to metadata mapping
export const OBJECT_METADATA: Record<string, ObjectMetadata> = {
    // ============ ROLE/JOB ICONS ============
    // These use standard size + angle + transparency
    tank: { baseSize: 32, displayName: "Tank", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    tank_1: { baseSize: 32, displayName: "Tank 1", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    tank_2: { baseSize: 32, displayName: "Tank 2", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    healer: { baseSize: 32, displayName: "Healer", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    healer_1: { baseSize: 32, displayName: "Healer 1", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    healer_2: { baseSize: 32, displayName: "Healer 2", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    pure_healer: { baseSize: 32, displayName: "Pure Healer", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    barrier_healer: { baseSize: 32, displayName: "Barrier Healer", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dps: { baseSize: 32, displayName: "DPS", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dps_1: { baseSize: 32, displayName: "DPS 1", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dps_2: { baseSize: 32, displayName: "DPS 2", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dps_3: { baseSize: 32, displayName: "DPS 3", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dps_4: { baseSize: 32, displayName: "DPS 4", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    melee_dps: { baseSize: 32, displayName: "Melee DPS", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    melee_1: { baseSize: 32, displayName: "Melee 1", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    melee_2: { baseSize: 32, displayName: "Melee 2", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    ranged_dps: { baseSize: 32, displayName: "Ranged DPS", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    ranged_dps_1: { baseSize: 32, displayName: "Ranged DPS 1", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    ranged_dps_2: { baseSize: 32, displayName: "Ranged DPS 2", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    physical_ranged_dps: { baseSize: 32, displayName: "Physical Ranged DPS", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    magical_ranged_dps: { baseSize: 32, displayName: "Magical Ranged DPS", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Jobs
    paladin: { baseSize: 28, displayName: "Paladin", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    warrior: { baseSize: 28, displayName: "Warrior", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dark_knight: { baseSize: 28, displayName: "Dark Knight", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    gunbreaker: { baseSize: 28, displayName: "Gunbreaker", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    white_mage: { baseSize: 28, displayName: "White Mage", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    scholar: { baseSize: 28, displayName: "Scholar", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    astrologian: { baseSize: 28, displayName: "Astrologian", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    sage: { baseSize: 28, displayName: "Sage", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    monk: { baseSize: 28, displayName: "Monk", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dragoon: { baseSize: 28, displayName: "Dragoon", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    ninja: { baseSize: 28, displayName: "Ninja", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    samurai: { baseSize: 28, displayName: "Samurai", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    reaper: { baseSize: 28, displayName: "Reaper", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    viper: { baseSize: 28, displayName: "Viper", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    bard: { baseSize: 28, displayName: "Bard", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    machinist: { baseSize: 28, displayName: "Machinist", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dancer: { baseSize: 28, displayName: "Dancer", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    black_mage: { baseSize: 28, displayName: "Black Mage", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    summoner: { baseSize: 28, displayName: "Summoner", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    red_mage: { baseSize: 28, displayName: "Red Mage", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    pictomancer: { baseSize: 28, displayName: "Pictomancer", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    blue_mage: { baseSize: 28, displayName: "Blue Mage", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Base classes
    gladiator: { baseSize: 28, displayName: "Gladiator", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    marauder: { baseSize: 28, displayName: "Marauder", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    conjurer: { baseSize: 28, displayName: "Conjurer", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    arcanist: { baseSize: 28, displayName: "Arcanist", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    pugilist: { baseSize: 28, displayName: "Pugilist", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    lancer: { baseSize: 28, displayName: "Lancer", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    rogue: { baseSize: 28, displayName: "Rogue", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    archer: { baseSize: 28, displayName: "Archer", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    thaumaturge: { baseSize: 28, displayName: "Thaumaturge", parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // ============ ATTACK TYPES ============
    // Circle AoE - SIZE controls radius
    circle_aoe: {
        baseSize: 248,
        displayName: "Circle AoE",
        isSvg: true,
        parameters: {
            size: { min: 10, max: 200, step: 1, default: 100, label: 'Size' },
            angle: { ...ANGLE_PARAM, label: 'Angle' },
            transparency: TRANSPARENCY_PARAM,
        }
    },
    // Fan AoE - SIZE + arcAngle
    fan_aoe: {
        baseSize: 240,
        displayName: "Fan AoE",
        isSvg: true,
        parameters: {
            size: { min: 10, max: 200, step: 1, default: 100, label: 'Size' },
            arcAngle: { min: 10, max: 360, step: 10, default: 90, label: 'Arc Angle' },
            angle: { ...ANGLE_PARAM, label: 'Angle' },
            transparency: TRANSPARENCY_PARAM,
        }
    },
    // Donut AoE - SIZE + arcAngle + donutRadius
    donut: {
        baseSize: 248,
        displayName: "Donut AoE",
        isSvg: true,
        parameters: {
            size: { min: 10, max: 200, step: 1, default: 50, label: 'Size' },
            donutRadius: { min: 0, max: 240, step: 1, default: 50, label: 'Donut Radius' },
            arcAngle: { min: 10, max: 360, step: 10, default: 360, label: 'Arc Angle' },
            angle: { ...ANGLE_PARAM, label: 'Angle' },
            transparency: TRANSPARENCY_PARAM,
        }
    },
    // Line AoE - WIDTH + HEIGHT + angle
    line_aoe: {
        baseSize: 50,
        displayName: "Line AoE",
        isSvg: true,
        parameters: {
            width: { min: 16, max: 512, step: 1, default: 128, label: 'Width' },
            height: { min: 16, max: 384, step: 1, default: 128, label: 'Height' },
            angle: { ...ANGLE_PARAM, label: 'Angle' },
            transparency: TRANSPARENCY_PARAM,
            color: COLOR_PARAM,
        }
    },
    // Mechanics with standard size
    gaze: { baseSize: 124, displayName: "Gaze", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    stack: { baseSize: 126, displayName: "Stack", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    stack_multi: { baseSize: 124, displayName: "Stack (Multi-hit)", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    proximity: { baseSize: 256, displayName: "Proximity", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    proximity_player: { baseSize: 124, displayName: "Proximity (Player-targeted)", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    tankbuster: { baseSize: 72, displayName: "Tankbuster (Single Target)", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    tower: { baseSize: 64, displayName: "Tower", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    targeting: { baseSize: 72, displayName: "Targeting Indicator", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    moving_circle_aoe: { baseSize: 124, displayName: "Moving Circle AoE", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    '1person_aoe': { baseSize: 64, displayName: "1-Person AoE", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    '2person_aoe': { baseSize: 64, displayName: "2-Person AoE", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    '3person_aoe': { baseSize: 64, displayName: "3-Person AoE", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    '4person_aoe': { baseSize: 64, displayName: "4-Person AoE", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Line stack - has displayCount for repeating icons
    line_stack: {
        baseSize: 124,
        displayName: "Line Stack",
        parameters: {
            size: SIZE_PARAM,
            angle: ANGLE_PARAM,
            transparency: TRANSPARENCY_PARAM,
            displayCount: { min: 1, max: 5, step: 1, default: 1, label: 'Display Count' },
        }
    },
    // Knockbacks
    radial_knockback: { baseSize: 260, displayName: "Radial Knockback", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    linear_knockback: {
        baseSize: 270,
        displayName: "Linear Knockback",
        parameters: {
            size: SIZE_PARAM_50,
            angle: ANGLE_PARAM,
            transparency: TRANSPARENCY_PARAM,
            horizontalCount: { min: 1, max: 5, step: 1, default: 1, label: 'Horizontal Count' },
            verticalCount: { min: 1, max: 5, step: 1, default: 1, label: 'Vertical Count' },
        }
    },

    // ============ MARKERS ============
    // Waymarks
    waymark_a: { baseSize: 44, displayName: "Waymark A", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_b: { baseSize: 44, displayName: "Waymark B", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_c: { baseSize: 44, displayName: "Waymark C", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_d: { baseSize: 44, displayName: "Waymark D", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_1: { baseSize: 44, displayName: "Waymark 1", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_2: { baseSize: 44, displayName: "Waymark 2", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_3: { baseSize: 44, displayName: "Waymark 3", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_4: { baseSize: 44, displayName: "Waymark 4", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Attack/Bind/Ignore markers
    attack_1: { baseSize: 30, displayName: "Target to Attack 1", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_2: { baseSize: 30, displayName: "Target to Attack 2", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_3: { baseSize: 30, displayName: "Target to Attack 3", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_4: { baseSize: 30, displayName: "Target to Attack 4", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_5: { baseSize: 30, displayName: "Target to Attack 5", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_6: { baseSize: 30, displayName: "Target to Attack 6", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_7: { baseSize: 30, displayName: "Target to Attack 7", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_8: { baseSize: 30, displayName: "Target to Attack 8", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    bind_1: { baseSize: 30, displayName: "Target to Bind 1", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    bind_2: { baseSize: 30, displayName: "Target to Bind 2", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    bind_3: { baseSize: 30, displayName: "Target to Bind 3", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    ignore_1: { baseSize: 30, displayName: "Target to Ignore 1", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    ignore_2: { baseSize: 30, displayName: "Target to Ignore 2", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Sign markers
    circle_marker: { baseSize: 30, displayName: "Circle Marker", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    plus_marker: { baseSize: 30, displayName: "Plus Marker", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    square_marker: { baseSize: 30, displayName: "Square Marker", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    triangle_marker: { baseSize: 30, displayName: "Triangle Marker", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Lock-on markers
    lockon_red: { baseSize: 44, displayName: "Red Lock-on Marker", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    lockon_blue: { baseSize: 44, displayName: "Blue Lock-on Marker", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    lockon_purple: { baseSize: 44, displayName: "Purple Lock-on Marker", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    lockon_green: { baseSize: 44, displayName: "Green Lock-on Marker", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Enemies
    small_enemy: { baseSize: 64, displayName: "Small Enemy", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    medium_enemy: { baseSize: 64, displayName: "Medium Enemy", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    large_enemy: { baseSize: 64, displayName: "Large Enemy", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Buffs/Debuffs
    enhancement: { baseSize: 32, displayName: "Enhancement Effect", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    enfeeblement: { baseSize: 32, displayName: "Enfeeblement Effect", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // ============ SIGNS/SYMBOLS ============
    // Text - special handling
    text: {
        baseSize: 16,
        displayName: "Text",
        isSvg: true,
        parameters: {
            text: { default: 'Text' },
            color: COLOR_PARAM,
        }
    },
    // Line - uses x,y (start) and endX,endY (end), size is stroke width
    line: {
        baseSize: 3,
        displayName: "Line",
        isSvg: true,
        parameters: {
            size: { min: 2, max: 10, step: 1, default: 6, label: 'Height' },
            color: COLOR_PARAM,
            transparency: TRANSPARENCY_PARAM,
        }
    },
    // Shapes
    shape_circle: { baseSize: 48, displayName: "Circle", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    shape_x: { baseSize: 48, displayName: "X", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    shape_triangle: { baseSize: 48, displayName: "Triangle", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    shape_square: { baseSize: 48, displayName: "Square", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    up_arrow: { baseSize: 48, displayName: "Up Arrow", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    rotate: { baseSize: 48, displayName: "Rotate", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    rotate_clockwise: { baseSize: 48, displayName: "Rotate Clockwise", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    rotate_counterclockwise: { baseSize: 48, displayName: "Rotate Counterclockwise", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Highlighted shapes
    highlighted_circle: { baseSize: 48, displayName: "Highlighted Circle", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    highlighted_triangle: { baseSize: 48, displayName: "Highlighted Triangle", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    highlighted_square: { baseSize: 48, displayName: "Highlighted Square", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    highlighted_x: { baseSize: 48, displayName: "Highlighted X", parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // ============ FIELD OVERLAYS ============
    checkered_circle: { baseSize: 256, displayName: "Checkered Circle", parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    checkered_square: { baseSize: 256, displayName: "Checkered Square", parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    grey_circle: { baseSize: 256, displayName: "Grey Circle", parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    grey_square: { baseSize: 256, displayName: "Grey Square", parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
}

// Default metadata for unknown types
const DEFAULT_METADATA: ObjectMetadata = {
    baseSize: 32,
    displayName: "Unknown Object",
    parameters: {
        size: SIZE_PARAM,
        angle: ANGLE_PARAM,
        transparency: TRANSPARENCY_PARAM,
    }
}

/**
 * Get metadata for an object type
 */
export function getObjectMetadata(type: string): ObjectMetadata {
    return OBJECT_METADATA[type] ?? DEFAULT_METADATA
}

/**
 * Get default property values for a new object of given type
 */
export function getDefaultProperties(type: string): Record<string, number | string> {
    const metadata = getObjectMetadata(type)
    const defaults: Record<string, number | string> = {}

    for (const [param, config] of Object.entries(metadata.parameters)) {
        if (config?.default !== undefined) {
            defaults[param] = config.default
        }
    }

    return defaults
}

/**
 * Check if a parameter is available for object type
 */
export function hasParameter(type: string, param: ParameterType): boolean {
    const metadata = getObjectMetadata(type)
    return param in metadata.parameters
}
