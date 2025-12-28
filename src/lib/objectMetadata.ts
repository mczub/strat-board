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
const TEXT_PARAM: ParameterConfig = { default: 'Text' }

// Object type to metadata mapping
export const OBJECT_METADATA: Record<string, ObjectMetadata> = {
    // ============ ROLE/JOB ICONS ============
    // These use standard size + angle + transparency
    tank: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    tank_1: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    tank_2: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    healer: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    healer_1: { baseSize: 32, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    healer_2: { baseSize: 32, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    pure_healer: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    barrier_healer: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dps: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dps_1: { baseSize: 32, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dps_2: { baseSize: 32, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dps_3: { baseSize: 32, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dps_4: { baseSize: 32, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    melee_dps: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    melee_1: { baseSize: 32, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    melee_2: { baseSize: 32, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    ranged_dps: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    ranged_dps_1: { baseSize: 32, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    ranged_dps_2: { baseSize: 32, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    physical_ranged_dps: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    magical_ranged_dps: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Jobs
    paladin: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    warrior: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dark_knight: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    gunbreaker: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    white_mage: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    scholar: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    astrologian: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    sage: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    monk: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dragoon: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    ninja: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    samurai: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    reaper: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    viper: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    bard: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    machinist: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    dancer: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    black_mage: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    summoner: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    red_mage: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    pictomancer: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    blue_mage: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Base classes
    gladiator: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    marauder: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    conjurer: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    arcanist: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    pugilist: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    lancer: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    rogue: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    archer: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    thaumaturge: { baseSize: 28, parameters: { size: SIZE_PARAM_50, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // ============ ATTACK TYPES ============
    // Circle AoE - SIZE controls radius
    circle_aoe: {
        baseSize: 248,
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
        isSvg: true,
        parameters: {
            size: { min: 10, max: 200, step: 1, default: 100, label: 'Outer Radius' },
            donutRadius: { min: 0, max: 200, step: 1, default: 50, label: 'Inner Radius' },
            arcAngle: { min: 10, max: 360, step: 10, default: 360, label: 'Arc Angle' },
            angle: { ...ANGLE_PARAM, label: 'Rotation' },
            transparency: TRANSPARENCY_PARAM,
            color: COLOR_PARAM,
        }
    },
    // Line AoE - WIDTH + HEIGHT + angle
    line_aoe: {
        baseSize: 50,
        isSvg: true,
        parameters: {
            width: { min: 10, max: 200, step: 1, default: 50, label: 'Width' },
            height: { min: 10, max: 500, step: 1, default: 100, label: 'Length' },
            angle: { ...ANGLE_PARAM, label: 'Angle' },
            transparency: TRANSPARENCY_PARAM,
            color: COLOR_PARAM,
        }
    },
    // Mechanics with standard size
    gaze: { baseSize: 124, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    stack: { baseSize: 124, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    stack_multi: { baseSize: 124, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    proximity: { baseSize: 248, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    proximity_player: { baseSize: 124, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    tankbuster: { baseSize: 72, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    tower: { baseSize: 64, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    targeting: { baseSize: 72, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    moving_circle_aoe: { baseSize: 124, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    '1person_aoe': { baseSize: 64, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    '2person_aoe': { baseSize: 64, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    '3person_aoe': { baseSize: 64, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    '4person_aoe': { baseSize: 64, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Line stack - has displayCount for repeating icons
    line_stack: {
        baseSize: 124,
        parameters: {
            size: SIZE_PARAM,
            angle: ANGLE_PARAM,
            transparency: TRANSPARENCY_PARAM,
            displayCount: { min: 1, max: 8, step: 1, default: 1, label: 'Stack Count' },
        }
    },
    // Knockbacks
    radial_knockback: { baseSize: 260, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    linear_knockback: {
        baseSize: 270,
        parameters: {
            size: SIZE_PARAM,
            angle: ANGLE_PARAM,
            transparency: TRANSPARENCY_PARAM,
            horizontalCount: { min: 1, max: 8, step: 1, default: 1, label: 'Columns' },
            verticalCount: { min: 1, max: 8, step: 1, default: 1, label: 'Rows' },
        }
    },

    // ============ MARKERS ============
    // Waymarks - fixed size, no angle
    waymark_a: { baseSize: 44, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_b: { baseSize: 44, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_c: { baseSize: 44, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_d: { baseSize: 44, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_1: { baseSize: 44, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_2: { baseSize: 44, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_3: { baseSize: 44, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    waymark_4: { baseSize: 44, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Attack/Bind/Ignore markers
    attack_1: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_2: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_3: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_4: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_5: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_6: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_7: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    attack_8: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    bind_1: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    bind_2: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    bind_3: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    ignore_1: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    ignore_2: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Sign markers
    circle_marker: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    plus_marker: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    square_marker: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    triangle_marker: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Lock-on markers
    lockon_red: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    lockon_blue: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    lockon_purple: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    lockon_green: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Enemies
    small_enemy: { baseSize: 64, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    medium_enemy: { baseSize: 64, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    large_enemy: { baseSize: 64, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Buffs/Debuffs
    enhancement: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    enfeeblement: { baseSize: 30, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // ============ SIGNS/SYMBOLS ============
    // Text - special handling
    text: {
        baseSize: 16,
        isSvg: true,
        parameters: {
            text: { default: 'Text' },
            color: COLOR_PARAM,
        }
    },
    // Line - uses x,y (start) and endX,endY (end), size is stroke width
    line: {
        baseSize: 3,
        isSvg: true,
        parameters: {
            size: { min: 2, max: 10, step: 1, default: 6, label: 'Height' },
            color: COLOR_PARAM,
            transparency: TRANSPARENCY_PARAM,
        }
    },
    // Shapes
    shape_circle: { baseSize: 48, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    shape_x: { baseSize: 48, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    shape_triangle: { baseSize: 48, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    shape_square: { baseSize: 48, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    up_arrow: { baseSize: 48, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    rotate: { baseSize: 48, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    rotate_clockwise: { baseSize: 48, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    rotate_counterclockwise: { baseSize: 48, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // Highlighted shapes
    highlighted_circle: { baseSize: 48, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    highlighted_triangle: { baseSize: 48, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    highlighted_square: { baseSize: 48, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },
    highlighted_x: { baseSize: 48, parameters: { size: SIZE_PARAM, angle: ANGLE_PARAM, transparency: TRANSPARENCY_PARAM } },

    // ============ FIELD OVERLAYS ============
    checkered_circle: { baseSize: 256, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    checkered_square: { baseSize: 256, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    grey_circle: { baseSize: 256, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
    grey_square: { baseSize: 256, parameters: { size: SIZE_PARAM, transparency: TRANSPARENCY_PARAM } },
}

// Default metadata for unknown types
const DEFAULT_METADATA: ObjectMetadata = {
    baseSize: 32,
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
