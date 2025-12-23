/**
 * Raidplan to xiv-strat-board Converter
 * 
 * Converts raidplan.io API responses into StrategyBoard objects.
 * Each raidplan "step" becomes a separate board.
 */

import type { StrategyBoard, StrategyObject } from 'xiv-strat-board'

// ============================================================================
// Raidplan Type Definitions
// ============================================================================

interface RaidplanPosition {
    x: number
    y: number
}

interface RaidplanMeta {
    pos: RaidplanPosition
    step: number
    angle: number
    scale: { x: number; y: number }
    size: { h: number; w: number }
    flip: { x: boolean; y: boolean }
    origin: { x: string; y: string }
    lock: number
}

interface RaidplanNode {
    type: 'arena' | 'rect' | 'ability' | 'itext' | 'arrow' | 'path' | 'marker' | 'circle' | 'ellipse'
    attr: {
        // Text
        text?: string
        fill?: string
        stroke?: string
        font?: string
        fontSize?: number
        textAlign?: string
        strokeWidth?: number

        // Ability (AoE indicators)
        abilityId?: string
        colorA?: string
        colorB?: string
        opacity?: number

        // Marker (FFXIV icons)
        asset?: string
        color?: string
        border?: string | null
        bgColor?: string | null

        // Arena
        imageUrl?: string
        gridX?: number
        gridY?: number
        shape?: string
    }
    meta: RaidplanMeta
}

export interface RaidplanData {
    nodes: RaidplanNode[]
    steps: number
    name?: string
    code?: string
}

export interface AssetMapping {
    name: string
    scale?: number
}

// ============================================================================
// Constants
// ============================================================================

// Raidplan canvas size (based on arena node with 1200x675 size)
const RAIDPLAN_WIDTH = 1200
const RAIDPLAN_HEIGHT = 675

// xiv-strat-board canvas size
const BOARD_WIDTH = 512
const BOARD_HEIGHT = 384

// Maximum objects per board (game limit)
const MAX_OBJECTS = 50

// Priority for object types (lower = higher priority)
const TYPE_PRIORITY: Record<string, number> = {
    text: 1,
    // FF mechanics
    circle_aoe: 2,
    fan_aoe: 2,
    donut: 2,
    stack: 2,
    gaze: 2,
    tankbuster: 2,
    proximity: 2,
    line_stack: 2,
    // Role/job markers
    tank: 3,
    tank_1: 3,
    tank_2: 3,
    healer: 3,
    healer_1: 3,
    healer_2: 3,
    dps: 3,
    dps_1: 3,
    dps_2: 3,
    dps_3: 3,
    dps_4: 3,
    melee_dps: 3,
    ranged_dps: 3,
    // Waymarks
    waymark_a: 4,
    waymark_b: 4,
    waymark_c: 4,
    waymark_d: 4,
    waymark_1: 4,
    waymark_2: 4,
    waymark_3: 4,
    waymark_4: 4,
    // Shapes/rectangles
    line_aoe: 5,
}

// Map raidplan ability IDs to xiv-strat-board types
const ABILITY_ID_MAP: Record<string, AssetMapping> = {
    'ff-circle': { name: 'donut_circle', scale: 0.14 },
    'ff-wedge': { name: 'fan_aoe_wedge', scale: 0.42 },
    'ff-pie': { name: 'fan_aoe_pie', scale: 0.38 },
    'ff-donut': { name: 'donut' },
    'ff-stack': { name: 'stack' },
    'ff-gaze': { name: 'gaze' },
    'ff-tankbuster': { name: 'tankbuster' },
    'ff-proximity': { name: 'proximity' },
    'ff-area-prox': { name: 'tower', scale: 1.2 },
    'ff-line-stack': { name: 'line_stack' },
    'ff-boss': { name: 'large_enemy' },
}

// Map raidplan FFXIV asset filenames to xiv-strat-board types
const FFXIV_ASSET_MAP: Record<string, AssetMapping> = {
    // Role markers
    'role_tank.png': { name: 'tank' },
    'role_healer.png': { name: 'healer' },
    'role_melee.png': { name: 'melee_dps' },
    'role_ranged.png': { name: 'ranged_dps' },
    'role_magic.png': { name: 'magical_ranged_dps' },
    'role_dps.png': { name: 'dps' },

    // Jobs
    'pld.png': { name: 'paladin' },
    'war.png': { name: 'warrior' },
    'bard.png': { name: 'bard' },
    'whm.png': { name: 'white_mage' },
    'sch.png': { name: 'scholar' },
    'smn.png': { name: 'summoner' },
    'rpr.png': { name: 'reaper' },
    'mnk.png': { name: 'monk' },

    // Numbered role markers
    'tank_1.png': { name: 'tank_1' },
    'tank_2.png': { name: 'tank_2' },
    'healer_1.png': { name: 'healer_1' },
    'healer_2.png': { name: 'healer_2' },
    'dps_1.png': { name: 'dps_1' },
    'dps_2.png': { name: 'dps_2' },
    'dps_3.png': { name: 'dps_3' },
    'dps_4.png': { name: 'dps_4' },

    // Waymarks
    'waymark_a.png': { name: 'waymark_a' },
    'waymark_b.png': { name: 'waymark_b' },
    'waymark_c.png': { name: 'waymark_c' },
    'waymark_d.png': { name: 'waymark_d' },
    'waymark_1.png': { name: 'waymark_1' },
    'waymark_2.png': { name: 'waymark_2' },
    'waymark_3.png': { name: 'waymark_3' },
    'waymark_4.png': { name: 'waymark_4' },

    // Attack markers
    'mark_tar1.png': { name: 'attack_1', scale: 0.8 },
    'mark_tar2.png': { name: 'attack_2', scale: 0.8 },
    'mark_tar3.png': { name: 'attack_3', scale: 0.8 },
    'mark_tar4.png': { name: 'attack_4', scale: 0.8 },
    'mark_tar5.png': { name: 'attack_5', scale: 0.8 },
    'mark_tar6.png': { name: 'attack_6', scale: 0.8 },
    'mark_tar7.png': { name: 'attack_7', scale: 0.8 },
    'mark_tar8.png': { name: 'attack_8', scale: 0.8 },
    'mark_link1.png': { name: 'bind_1', scale: 0.8 },
    'mark_link2.png': { name: 'bind_2', scale: 0.8 },
    'mark_link3.png': { name: 'bind_3', scale: 0.8 },
    'mark_stop1.png': { name: 'ignore_1', scale: 0.8 },
    'mark_stop2.png': { name: 'ignore_2', scale: 0.8 },

    // Mechanics
    'stack.png': { name: 'stack' },
    'spread.png': { name: 'proximity_player' },
    'gaze.png': { name: 'gaze' },
    'tower.png': { name: 'tower' },
    'tankbuster.png': { name: 'tankbuster' },
    'tar2.png': { name: 'tower' },
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Parse arena node to get coordinate transformation info
 */
function getArenaTransform(nodes: RaidplanNode[]): {
    offsetX: number
    offsetY: number
    scaleX: number
    scaleY: number
} {
    const arena = nodes.find(n => n.type === 'arena')

    if (arena) {
        // Arena is typically centered at (600, 337.5) with size 1200x675
        const arenaWidth = 900 //arena.meta.size.w
        const arenaHeight = 675 //arena.meta.size.h
        const arenaX = arena.meta.pos.x - arenaWidth / 2
        const arenaY = arena.meta.pos.y - arenaHeight / 2

        return {
            offsetX: arenaX,
            offsetY: arenaY,
            scaleX: BOARD_WIDTH / arenaWidth,
            scaleY: BOARD_HEIGHT / arenaHeight,
        }
    }

    // Fallback: assume standard raidplan canvas
    return {
        offsetX: 0,
        offsetY: 0,
        scaleX: BOARD_WIDTH / RAIDPLAN_WIDTH,
        scaleY: BOARD_HEIGHT / RAIDPLAN_HEIGHT,
    }
}

/**
 * Transform raidplan coordinates to board coordinates
 */
function transformCoordinates(
    x: number,
    y: number,
    transform: ReturnType<typeof getArenaTransform>
): { x: number; y: number } {
    return {
        x: Math.round((x - transform.offsetX) * transform.scaleX),
        y: Math.round((y - transform.offsetY) * transform.scaleY),
    }
}

/**
 * Convert hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : null
}

/**
 * Normalize angle from 0-360 range to -180 to 180 range (game format)
 */
function normalizeAngle(angle: number): number {
    // First normalize to 0-360
    let normalized = angle % 360
    if (normalized < 0) normalized += 360
    // Then convert to -180 to 180
    if (normalized > 180) normalized -= 360
    return Math.round(normalized)
}

/**
 * Extract filename from raidplan asset path
 * e.g., "game/ffxiv/job/role_tank.png" -> "role_tank.png"
 */
function extractAssetFilename(assetPath: string): string {
    const parts = assetPath.split('/')
    return parts[parts.length - 1]
}

/**
 * Convert a single raidplan node to one or more StrategyObjects
 * Returns an array because text with newlines becomes multiple objects
 */
function convertNode(
    node: RaidplanNode,
    transform: ReturnType<typeof getArenaTransform>
): StrategyObject[] {
    console.log('node', node)
    const { x, y } = transformCoordinates(node.meta.pos.x, node.meta.pos.y, transform)
    const angle = normalizeAngle(node.meta.angle)

    // Skip arena nodes
    if (node.type === 'arena') {
        return []
    }

    // Text (itext) - split on newlines
    if (node.type === 'itext') {
        if (!node.attr.text?.trim()) return []

        console.log(node.attr.text)

        const rgb = node.attr.fill ? hexToRgb(node.attr.fill) : null
        const fontSize = node.attr.fontSize ?? 32

        // Split text on newlines and create separate objects for each line
        const lines = node.attr.text.split('\n')
        const lineHeight = fontSize * (node.meta.scale.y ?? node.meta.scale.x) * transform.scaleY * 1.1

        return lines.map((line, i) => {
            const lineY = y + (i * lineHeight)
            return {
                type: 'text' as const,
                x,
                y: Math.round(lineY),
                text: line,
                colorR: 255,
                colorG: 255,
                colorB: 255,
            }
        }).filter(obj => obj.text.trim()) // Filter out empty lines
    }

    // FFXIV markers (icons)
    if (node.type === 'marker' && node.attr.asset?.startsWith('game/ffxiv/')) {
        const filename = extractAssetFilename(node.attr.asset)
        const mappedType = FFXIV_ASSET_MAP[filename]

        if (mappedType) {
            const scale = node.meta.scale.x * 240
            return [{
                type: mappedType.name,
                x,
                y,
                size: Math.round(scale * (mappedType.scale ?? 1)),
                angle,
            }]
        }

        // Unknown FFXIV asset - skip for now
        return []
    }

    // Ability (AoE indicators)
    if (node.type === 'ability' && node.attr.abilityId) {
        const mappedType = ABILITY_ID_MAP[node.attr.abilityId]

        if (mappedType) {
            const scale = node.meta.scale.x * 80
            const rgb = node.attr.colorA ? hexToRgb(node.attr.colorA) : null

            const obj: StrategyObject = {
                type: mappedType.name,
                x,
                y,
                size: Math.round(scale * (mappedType.scale ?? 1)),
                angle,
            }

            if (rgb) {
                obj.colorR = rgb.r
                obj.colorG = rgb.g
                obj.colorB = rgb.b
            }

            if (mappedType.name === 'donut_circle') {
                obj.type = 'donut'
                obj.arcAngle = 360
                obj.donutRadius = 0
                obj.size = Math.round(scale / 7)
                obj.colorR = undefined
                obj.colorG = undefined
                obj.colorB = undefined
            }

            if (mappedType.name === 'fan_aoe_wedge') {
                obj.type = 'donut'
                obj.donutRadius = 0
                obj.arcAngle = Math.round(2 * Math.atan(node.meta.scale.x / (2 * node.meta.scale.y)) * 180 / Math.PI)
                obj.angle = normalizeAngle(180 + node.meta.angle - (obj.arcAngle / 2))
                obj.colorR = undefined
                obj.colorG = undefined
                obj.colorB = undefined

                // Offset calculation derived from empirical data:
                // Raidplan uses clockwise = positive angle
                const raidplanAngleRad = node.meta.angle * Math.PI / 180
                const sinAngle = Math.sin(raidplanAngleRad)
                // 33.32° needs offsetX=-90, offsetY=+18
                const offsetX = -60 * (1 + sinAngle)
                const offsetY = 45 * (1 - sinAngle)

                obj.x = Math.round(x + offsetX)
                obj.y = Math.round(y + offsetY)
            }

            if (mappedType.name === 'fan_aoe_pie') {
                obj.type = 'donut'
                obj.donutRadius = 0
                obj.arcAngle = Math.round(2 * Math.asin(node.meta.scale.x / (2 * node.meta.scale.y)) * 180 / Math.PI)
                obj.angle = normalizeAngle(180 + node.meta.angle - (obj.arcAngle / 2))
                obj.colorR = undefined
                obj.colorG = undefined
                obj.colorB = undefined

                // Same offset formula as wedge (derived from empirical data)
                const raidplanAngleRad = node.meta.angle * Math.PI / 180
                const sinAngle = Math.sin(raidplanAngleRad)
                const offsetX = -45 * (1 + sinAngle)
                const offsetY = 45 * (1 - sinAngle)
                obj.x = Math.round(x + offsetX)
                obj.y = Math.round(y + offsetY)
            }



            if (node.attr.opacity !== undefined) {
                obj.transparency = Math.round((1 - node.attr.opacity) * 100)
            }

            return [obj]
        }

        return []
    }

    // Rectangle -> line_aoe
    if (node.type === 'rect') {
        const width = node.meta.size.w * node.meta.scale.x * transform.scaleX
        const height = node.meta.size.h * node.meta.scale.y * transform.scaleY
        const rgb = node.attr.fill ? hexToRgb(node.attr.fill) : null

        const obj: StrategyObject = {
            type: 'line_aoe',
            x,
            y,
            width: Math.round(width),
            height: Math.round(height),
            angle,
        }

        if (rgb) {
            obj.colorR = rgb.r
            obj.colorG = rgb.g
            obj.colorB = rgb.b
        }

        if (node.attr.opacity !== undefined) {
            obj.transparency = Math.round((1 - node.attr.opacity) * 100)
        }

        return [obj]
    }

    // Circle/Ellipse (basic shapes)
    if (node.type === 'circle' || node.type === 'ellipse') {
        const scale = node.meta.scale.x * 8
        const rgb = node.attr.fill ? hexToRgb(node.attr.fill) : null

        const obj: StrategyObject = {
            type: 'circle_aoe',
            x,
            y,
            size: Math.round(scale),
            angle,
        }

        if (rgb) {
            obj.colorR = rgb.r
            obj.colorG = rgb.g
            obj.colorB = rgb.b
        }

        return [obj]
    }

    // Skip other types (arrow, path) for now
    return []
}

/**
 * Get priority for sorting objects
 */
function getObjectPriority(obj: StrategyObject): number {
    return TYPE_PRIORITY[obj.type] ?? 10
}

function getArenaType(node: RaidplanNode) {
    if (node?.attr?.shape === "circle") {
        return "checkered_circle"
    }
    if (node?.attr?.shape === "square") {
        return "checkered_square"
    }
    return "none"
}

/**
 * Convert a raidplan response to an array of StrategyBoards
 * Each step becomes a separate board
 */
export function convertRaidplanToBoards(data: RaidplanData): StrategyBoard[] {
    const transform = getArenaTransform(data.nodes)
    const boards: StrategyBoard[] = []

    const arenaType = getArenaType(data.nodes.filter(n => n.type === "arena")?.[0]) ?? 'none'

    // Steps are 1-indexed in raidplan
    for (let step = 0; step < data.steps; step++) {
        const stepNodes = data.nodes.filter(n => n.meta.step === step)



        // Convert nodes to objects (convertNode returns arrays to handle multiline text)
        // Track original index for render order
        const objectsWithIndex: { obj: StrategyObject; originalIndex: number }[] = []
        let idx = 0
        for (const node of stepNodes) {
            const objs = convertNode(node, transform)
            for (const obj of objs) {
                objectsWithIndex.push({ obj, originalIndex: idx++ })
            }
        }

        // Sort by priority and limit to max objects (for trimming)
        objectsWithIndex.sort((a, b) => getObjectPriority(a.obj) - getObjectPriority(b.obj))
        const priorityLimited = objectsWithIndex.slice(0, MAX_OBJECTS)

        // Limit text objects to 8 (game hard limit)
        const MAX_TEXT_OBJECTS = 8
        let textCount = 0
        const textLimited = priorityLimited.filter(item => {
            if (item.obj.type === 'text') {
                if (textCount >= MAX_TEXT_OBJECTS) return false
                textCount++
            }
            return true
        })

        // Re-sort by original index to maintain render order
        textLimited.sort((a, b) => a.originalIndex - b.originalIndex)
        const limitedObjects = textLimited.map(item => item.obj)

        boards.push({
            name: data.name ? `${data.name} - Step ${step}` : `Step ${step}`,
            boardBackground: arenaType,
            objects: limitedObjects.reverse(),
        })
    }
    console.log(boards);
    return boards

}

/**
 * Get summary statistics for a conversion
 */
export function getConversionStats(data: RaidplanData, boards: StrategyBoard[]): {
    totalSteps: number
    totalNodes: number
    convertedObjects: number
    skippedNodes: number
    objectsByType: Record<string, number>
} {
    const objectsByType: Record<string, number> = {}
    let convertedObjects = 0

    for (const board of boards) {
        for (const obj of board.objects) {
            objectsByType[obj.type] = (objectsByType[obj.type] ?? 0) + 1
            convertedObjects++
        }
    }

    return {
        totalSteps: data.steps,
        totalNodes: data.nodes.length,
        convertedObjects,
        skippedNodes: data.nodes.filter(n => n.type !== 'arena').length - convertedObjects,
        objectsByType,
    }
}
