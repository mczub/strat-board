/**
 * Shared Rendering Utilities
 * 
 * Common geometry calculations, color helpers, and constants used by both
 * StrategyBoardRenderer (SVG) and EditorCanvas (Konva).
 */

import { OBJECT_METADATA } from './objectMetadata'

// ============ BOARD CONSTANTS ============
export const BOARD_WIDTH = 512
export const BOARD_HEIGHT = 384

// ============ DPS REMAPPING ============
// Unified (dps_1-4) <-> Separate (melee_1-2, ranged_dps_1-2)
export const DPS_UNIFIED_TO_SEPARATE: Record<string, string> = {
    'dps_1': 'melee_1',
    'dps_2': 'melee_2',
    'dps_3': 'ranged_dps_1',
    'dps_4': 'ranged_dps_2',
}

export const DPS_SEPARATE_TO_UNIFIED: Record<string, string> = {
    'melee_1': 'dps_1',
    'melee_2': 'dps_2',
    'ranged_dps_1': 'dps_3',
    'ranged_dps_2': 'dps_4',
}

/**
 * Remap DPS icon type based on unified/separate mode
 */
export function remapDpsType(type: string, useSeparateDps: boolean): string {
    if (useSeparateDps) {
        return DPS_UNIFIED_TO_SEPARATE[type] || type
    } else {
        return DPS_SEPARATE_TO_UNIFIED[type] || type
    }
}

// ============ SIZE/OPACITY HELPERS ============

/**
 * Get base size for an object type from OBJECT_METADATA
 */
export function getBaseSize(type: string): number {
    return OBJECT_METADATA[type]?.baseSize ?? 32
}

/**
 * Get scaled size for an object
 */
export function getScaledSize(type: string, sizePercent: number = 100): number {
    const baseSize = getBaseSize(type)
    return baseSize * (sizePercent / 100)
}

/**
 * Get opacity from transparency value (0-100) and hidden state
 */
export function getObjectOpacity(transparency: number = 0, hidden: boolean = false): number {
    if (hidden) return 0
    return 1 - (transparency / 100)
}

// ============ COLOR HELPERS ============

// AOE gradient colors (used by circle_aoe, fan_aoe)
export const AOE_COLORS = {
    base: '#FFA131',       // Orange fill
    baseRgb: [255, 161, 49] as const,
    edge: '#FEE874',       // Yellow edge
    edgeRgb: [254, 232, 116] as const,
    stroke: '#FFDDD9',     // Light pink stroke
    default: '#FFA131',    // Default for donuts etc.
}

/**
 * Get color from object properties - handles RGB, hex, and defaults
 */
export function getObjectColor(obj: {
    color?: string
    colorR?: number
    colorG?: number
    colorB?: number
}, defaultColor: string = AOE_COLORS.default): string {
    // Check RGB components first (set by color picker)
    if (obj.colorR !== undefined || obj.colorG !== undefined || obj.colorB !== undefined) {
        return `rgb(${obj.colorR ?? 255}, ${obj.colorG ?? 255}, ${obj.colorB ?? 255})`
    }
    // Fall back to hex color string
    if (obj.color && typeof obj.color === 'string') {
        return obj.color
    }
    return defaultColor
}

// ============ GEOMETRY: BOUNDING BOX CALCULATIONS ============

export interface BboxResult {
    minX: number
    maxX: number
    minY: number
    maxY: number
    bboxCenterX: number
    bboxCenterY: number
    bboxWidth: number
    bboxHeight: number
    margins: {
        left: number
        top: number
        right: number
        bottom: number
    }
}

/**
 * Calculate bounding box for a fan/cone AOE
 * Arc starts at north (0° = -π/2 in SVG) and sweeps clockwise
 * 
 * @param radius - The radius of the fan
 * @param arcAngleDeg - Arc angle in degrees (e.g., 90 for quarter circle)
 * @returns Bounding box info relative to cone tip at origin
 */
export function calculateFanBbox(radius: number, arcAngleDeg: number): BboxResult {
    const arcAngleRad = (arcAngleDeg * Math.PI) / 180
    const startAngleRad = -Math.PI / 2
    const endAngleRad = startAngleRad + arcAngleRad

    // Bounding box includes cone tip (0,0) and the arc
    let minX = 0, maxX = 0, minY = -radius, maxY = 0
    let marginLeft = 2, marginTop = 8, marginRight = 8, marginBottom = 2

    // Arc end point
    const endX = radius * Math.cos(endAngleRad)
    const endY = radius * Math.sin(endAngleRad)

    minX = Math.min(0, endX)
    maxX = Math.max(0, endX)
    maxY = Math.max(0, endY)

    // Check cardinal directions if they fall within the arc sweep
    if (endAngleRad > 0) { maxX = radius; marginBottom = 8 }         // East
    if (endAngleRad > Math.PI / 2) { maxY = radius; marginLeft = 8 } // South
    if (endAngleRad > Math.PI) { minX = -radius }                    // West

    const bboxCenterX = (minX + maxX - marginLeft + marginRight) / 2
    const bboxCenterY = (minY + maxY - marginTop + marginBottom) / 2
    const bboxWidth = maxX - minX + marginLeft + marginRight
    const bboxHeight = maxY - minY + marginTop + marginBottom

    return {
        minX, maxX, minY, maxY,
        bboxCenterX, bboxCenterY,
        bboxWidth, bboxHeight,
        margins: { left: marginLeft, top: marginTop, right: marginRight, bottom: marginBottom }
    }
}

/**
 * Calculate bounding box for a donut (ring) AOE
 * Arc starts at north (0° = -π/2 in SVG) and sweeps clockwise
 * 
 * @param outerRadius - Outer radius of the donut
 * @param innerRadius - Inner radius of the donut
 * @param arcAngleDeg - Arc angle in degrees (360 for full ring)
 * @returns Bounding box info relative to donut center at origin
 */
export function calculateDonutBbox(outerRadius: number, innerRadius: number, arcAngleDeg: number): BboxResult {
    const arcAngleRad = (arcAngleDeg * Math.PI) / 180
    const startAngleRad = -Math.PI / 2
    const endAngleRad = startAngleRad + arcAngleRad

    // Calculate arc endpoints
    const outerStartY = -outerRadius
    const innerStartY = -innerRadius
    const outerEndX = outerRadius * Math.cos(endAngleRad)
    const outerEndY = outerRadius * Math.sin(endAngleRad)
    const innerEndX = innerRadius * Math.cos(endAngleRad)
    const innerEndY = innerRadius * Math.sin(endAngleRad)

    let marginLeft = 2, marginTop = 8, marginRight = 8, marginBottom = 2

    let minX = Math.min(0, 0, outerEndX, innerEndX)
    let maxX = Math.max(0, 0, outerEndX, innerEndX)
    let minY = Math.min(outerStartY, innerStartY, outerEndY, innerEndY)
    let maxY = Math.max(outerStartY, innerStartY, outerEndY, innerEndY)

    // Check cardinal directions
    if (endAngleRad > 0) { maxX = outerRadius; marginBottom = 8 }
    if (endAngleRad > Math.PI / 2) { maxY = outerRadius; marginLeft = 8 }
    if (endAngleRad > Math.PI) { minX = -outerRadius }

    const bboxCenterX = (minX + maxX - marginLeft + marginRight) / 2
    const bboxCenterY = (minY + maxY - marginTop + marginBottom) / 2
    const bboxWidth = maxX - minX + marginLeft + marginRight
    const bboxHeight = maxY - minY + marginTop + marginBottom

    return {
        minX, maxX, minY, maxY,
        bboxCenterX, bboxCenterY,
        bboxWidth, bboxHeight,
        margins: { left: marginLeft, top: marginTop, right: marginRight, bottom: marginBottom }
    }
}

// ============ ROLE HIGHLIGHT MAPPING ============

// Role to icon type mapping - Unified mode
export const UNIFIED_ROLE_TO_TYPES: Record<string, string[]> = {
    'MT': ['tank_1'],
    'ST': ['tank_2'],
    'H1': ['healer_1'],
    'H2': ['healer_2'],
    'D1': ['dps_1'],
    'D2': ['dps_2'],
    'D3': ['dps_3'],
    'D4': ['dps_4'],
}

// Role to icon type mapping - Separate mode
export const SEPARATE_ROLE_TO_TYPES: Record<string, string[]> = {
    'MT': ['tank_1'],
    'OT': ['tank_2'],
    'H1': ['healer_1'],
    'H2': ['healer_2'],
    'M1': ['melee_1'],
    'M2': ['melee_2'],
    'R1': ['ranged_dps_1'],
    'R2': ['ranged_dps_2'],
}

/**
 * Get the icon types to highlight for a given role
 */
export function getHighlightTypes(role: string, useSeparateDps: boolean): string[] {
    const mapping = useSeparateDps ? SEPARATE_ROLE_TO_TYPES : UNIFIED_ROLE_TO_TYPES
    return mapping[role] ?? []
}
