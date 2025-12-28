/**
 * Strategy Board Renderer Component
 * 
 * Renders a decoded FF14 Strategy Board as an SVG element.
 * Uses PNG images from /icons/ for most objects, SVG for geometric primitives.
 */

import { JSX } from 'react'
import type { StrategyBoard, StrategyObject } from 'xiv-strat-board'

interface StrategyBoardRendererProps {
    board: StrategyBoard
    width?: number
    height?: number
    className?: string
    useInGameBackground?: boolean
    useSeparateDps?: boolean
    highlightRole?: string // Role to highlight: 'MT', 'OT', 'H1', 'H2', 'D1'/'M1', etc.
}

// DPS marker remapping: Unified (dps_1-4) vs Separate (melee_1-2, ranged_dps_1-2)
const DPS_UNIFIED_TO_SEPARATE: Record<string, string> = {
    'dps_1': 'melee_1',
    'dps_2': 'melee_2',
    'dps_3': 'ranged_dps_1',
    'dps_4': 'ranged_dps_2',
}

// Role to icon type mapping - Unified mode
const UNIFIED_ROLE_TO_TYPES: Record<string, string[]> = {
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
const SEPARATE_ROLE_TO_TYPES: Record<string, string[]> = {
    'MT': ['tank_1'],
    'OT': ['tank_2'],
    'H1': ['healer_1'],
    'H2': ['healer_2'],
    'M1': ['melee_1'],
    'M2': ['melee_2'],
    'R1': ['ranged_dps_1'],
    'R2': ['ranged_dps_2'],
}

// Board dimensions (from FORMAT.md)
const BOARD_WIDTH = 512
const BOARD_HEIGHT = 384

// Types that should use SVG instead of images
const SVG_ONLY_TYPES = new Set([
    'text',
    'line',
    'line_aoe',
    'circle_aoe',
    'fan_aoe',
    'donut',
])

// Default icon sizes (in board units)
const ICON_SIZE_DEFAULTS: Record<string, number> = {
    // Small icons (waymarks, markers)
    waymark_a: 44, waymark_b: 44, waymark_c: 44, waymark_d: 44,
    waymark_1: 44, waymark_2: 44, waymark_3: 44, waymark_4: 44,
    attack_1: 30, attack_2: 30, attack_3: 30, attack_4: 30,
    attack_5: 30, attack_6: 30, attack_7: 30, attack_8: 30,
    bind_1: 30, bind_2: 30, bind_3: 30,
    ignore_1: 30, ignore_2: 30,
    square_marker: 30, circle_marker: 30, plus_marker: 30, triangle_marker: 30,
    lockon_red: 30, lockon_blue: 30, lockon_purple: 30, lockon_green: 30,

    // Role/job icons
    tank: 28, tank_1: 28, tank_2: 28,
    healer: 28, healer_1: 32, healer_2: 32,
    dps: 28, dps_1: 32, dps_2: 32, dps_3: 32, dps_4: 32,
    melee_dps: 28, ranged_dps: 28, physical_ranged_dps: 28, magical_ranged_dps: 28,
    pure_healer: 28, barrier_healer: 28,

    // Jobs
    paladin: 28, monk: 28, warrior: 28, dragoon: 28, bard: 28,
    white_mage: 28, black_mage: 28, summoner: 28, scholar: 28,
    ninja: 28, machinist: 28, dark_knight: 28, astrologian: 28,
    samurai: 28, red_mage: 28, blue_mage: 28, gunbreaker: 28,
    dancer: 28, reaper: 28, sage: 28, viper: 28, pictomancer: 28,
    gladiator: 28, pugilist: 28, marauder: 28, lancer: 28,
    archer: 28, conjurer: 28, thaumaturge: 28, arcanist: 28, rogue: 28,

    // Mechanics - larger
    stack: 124, stack_multi: 124, line_stack: 124,
    gaze: 124, proximity: 248, proximity_player: 124,
    tankbuster: 72, tower: 64, targeting: 72,
    radial_knockback: 260, linear_knockback: 270,
    moving_circle_aoe: 126,
    '1person_aoe': 64, '2person_aoe': 64, '3person_aoe': 64, '4person_aoe': 64,

    // Shapes
    shape_circle: 48, shape_x: 48, shape_triangle: 48, shape_square: 48,
    up_arrow: 48, rotate: 48, rotate_clockwise: 48, rotate_counterclockwise: 48,
    highlighted_circle: 48, highlighted_x: 48, highlighted_square: 48, highlighted_triangle: 48,

    // Buffs/Debuffs
    enhancement: 30, enfeeblement: 30,

    small_enemy: 64, medium_enemy: 64, large_enemy: 64,

    // Backgrounds (field overlays)
    checkered_circle: 256, checkered_square: 256,
    grey_circle: 256, grey_square: 256,
}

// Get base size for an object type
function getBaseSize(type: string): number {
    return ICON_SIZE_DEFAULTS[type] ?? 32
}

// Get scaled size for an object
function getScaledSize(obj: StrategyObject): number {
    const baseSize = getBaseSize(obj.type)
    const scale = (obj.size ?? 100) / 100
    return baseSize * scale
}

// Get opacity for an object
function getObjectOpacity(obj: StrategyObject): number {
    if (obj.hidden) return 0
    if (obj.transparency !== undefined) return 1 - (obj.transparency / 100)
    return 1
}

// Get color for an object (used for SVG primitives)
function getObjectColor(obj: StrategyObject): string {
    if (obj.color) return obj.color
    if (obj.colorR !== undefined && obj.colorG !== undefined && obj.colorB !== undefined) {
        return `rgb(${obj.colorR}, ${obj.colorG}, ${obj.colorB})`
    }
    return '#FFA131' // Default orange for AoEs
}

// Render image-based object
function renderImageObject(obj: StrategyObject, index: number): JSX.Element | null {
    const { type, x, y } = obj
    const size = getScaledSize(obj)
    const opacity = getObjectOpacity(obj)

    if (opacity === 0) return null

    // Center the image on the coordinates
    const halfSize = size / 2

    // Build transform for rotation and flip
    const transforms: string[] = []

    // Rotation (angle property) - rotate around the object center
    if (obj.angle) {
        transforms.push(`rotate(${obj.angle} ${x} ${y})`)
    }

    // Flip transforms - scale around the object center
    if (obj.horizontalFlip || obj.verticalFlip) {
        const scaleX = obj.horizontalFlip ? -1 : 1
        const scaleY = obj.verticalFlip ? -1 : 1
        // Translate to origin, scale, translate back
        transforms.push(`translate(${x} ${y}) scale(${scaleX} ${scaleY}) translate(${-x} ${-y})`)
    }

    const transform = transforms.length > 0 ? transforms.join(' ') : undefined

    // Special handling for linear_knockback (grid of icons)
    if (type === 'linear_knockback') {
        const hCount = obj.horizontalCount ?? 1
        const vCount = obj.verticalCount ?? 1
        const images: JSX.Element[] = []
        const spacing = size * 0.91 // Overlap slightly

        for (let row = 0; row < vCount; row++) {
            for (let col = 0; col < hCount; col++) {
                const offsetX = (col - (hCount - 1) / 2) * spacing
                const offsetY = (row - (vCount - 1) / 2) * spacing
                images.push(
                    <image
                        key={`${index}-${row}-${col}`}
                        href={`/icons/${type}.png`}
                        x={x - halfSize + offsetX}
                        y={y - halfSize + offsetY}
                        width={size}
                        height={size}
                        opacity={opacity}
                        preserveAspectRatio="xMidYMid meet"
                        transform={transform}
                    />
                )
            }
        }
        return <>{images}</>
    }

    // Special handling for line_stack (vertical repeat)
    if (type === 'line_stack') {
        const displayCount = obj.displayCount ?? 1
        const images: JSX.Element[] = []
        const spacing = size * 1.04 // Space slightly

        for (let i = 0; i < displayCount; i++) {
            const offsetY = (i - (displayCount - 1) / 2) * spacing
            images.push(
                <image
                    key={`${index}-${i}`}
                    href={`/icons/${type}.png`}
                    x={x - halfSize}
                    y={y - halfSize + offsetY}
                    width={size}
                    height={size}
                    opacity={opacity}
                    preserveAspectRatio="xMidYMid meet"
                    transform={transform}
                />
            )
        }
        return <>{images}</>
    }

    return (
        <image
            key={index}
            href={`/icons/${type}.png`}
            x={x - halfSize}
            y={y - halfSize}
            width={size}
            height={size}
            opacity={opacity}
            preserveAspectRatio="xMidYMid meet"
            transform={transform}
        />
    )
}

// Render SVG-based geometric objects
function renderSvgObject(obj: StrategyObject, index: number): JSX.Element | null {
    const { type, x, y } = obj
    const color = getObjectColor(obj)
    const opacity = getObjectOpacity(obj)
    const scale = (obj.size ?? 100) / 100

    if (opacity === 0) return null

    // Circle AoE - uses radial gradient for soft center fading to defined edge
    if (type === 'circle_aoe') {
        const radius = 248 * scale
        const uniqueId = `${x}-${y}-${index}`
        const gradientId = `circle-aoe-gradient-${uniqueId}`
        // Use the object's color or default orange
        const aoeColor = '#FFA131'
        const aoeOutsideColor = "#FEE874"
        const edgeColor = '#FFDDD9'
        return (
            <g key={index} opacity={opacity}>
                <defs>
                    <radialGradient id={gradientId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor={aoeColor} stopOpacity="0.1" />
                        <stop offset="70%" stopColor={aoeColor} stopOpacity="0.3" />
                        <stop offset="95%" stopColor={aoeColor} stopOpacity="0.7" />
                        <stop offset="100%" stopColor={aoeOutsideColor} stopOpacity="1" />
                    </radialGradient>
                    <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={`url(#${gradientId})`}
                    filter={`url(#${gradientId}-glow)`}
                />
                <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill="none"
                    stroke={edgeColor}
                    strokeWidth={2}
                />
            </g>
        )
    }

    // Donut AoE
    // Like fan AoE, coordinates represent bounding box center for partial arcs
    // arcAngle = the angle of the donut arc (how much of the ring is visible)
    // angle = the rotation of the entire donut (where it points)
    if (type === 'donut') {
        const outerRadius = 248 * scale
        const innerRadius = obj.donutRadius !== undefined
            ? obj.donutRadius * scale
            : outerRadius * 0.4
        const arcAngle = obj.arcAngle ?? 360
        const rotation = obj.angle ?? 0 // Rotation of the donut
        const arcAngleRad = (arcAngle * Math.PI) / 180

        // Build transform for rotation and flips
        const buildTransform = (centerX: number, centerY: number): string | undefined => {
            const transforms: string[] = []
            if (rotation) {
                transforms.push(`rotate(${rotation} ${centerX} ${centerY})`)
            }
            if (obj.horizontalFlip) {
                transforms.push(`translate(${2 * centerX} 0) scale(-1 1)`)
            }
            if (obj.verticalFlip) {
                transforms.push(`translate(0 ${2 * centerY}) scale(1 -1)`)
            }
            return transforms.length > 0 ? transforms.join(' ') : undefined
        }

        // Full circle donut - use mask for transparent center
        if (arcAngle >= 360) {
            const transform = buildTransform(x, y)
            const uniqueId = `${x}-${y}-${index}`
            const maskId = `donut-mask-${uniqueId}`
            return (
                <g key={index} opacity={opacity} transform={transform}>
                    <defs>
                        <mask id={maskId}>
                            <circle cx={x} cy={y} r={outerRadius} fill="white" />
                            <circle cx={x} cy={y} r={innerRadius} fill="black" />
                        </mask>
                    </defs>
                    <circle cx={x} cy={y} r={outerRadius} fill={color} mask={`url(#${maskId})`} />
                    <circle cx={x} cy={y} r={outerRadius} fill="none" stroke={color} strokeWidth={2} />
                    <circle cx={x} cy={y} r={innerRadius} fill="none" stroke={color} strokeWidth={2} />
                </g>
            )
        }

        // Partial donut arc - need bounding box compensation
        // Arc starts at north (0°) and sweeps clockwise
        // Need to compute bounding box of this asymmetric arc

        // Calculate bounding box extremes
        // Start angle is -90° (north), end angle is -90° + arcAngle
        const startAngleRad = -Math.PI / 2
        const endAngleRad = startAngleRad + arcAngleRad

        // Find min/max X and Y of the arc (must include BOTH inner and outer edges)
        // Start points
        const outerStartX = 0  // outerRadius * cos(-90°) = 0
        const outerStartY = -outerRadius  // outerRadius * sin(-90°) = -outerRadius
        const innerStartX = 0
        const innerStartY = -innerRadius

        // End points
        const outerEndX = outerRadius * Math.cos(endAngleRad)
        const outerEndY = outerRadius * Math.sin(endAngleRad)
        const innerEndX = innerRadius * Math.cos(endAngleRad)
        const innerEndY = innerRadius * Math.sin(endAngleRad)

        // Initialize with all 4 corner points of the arc
        let minX = Math.min(outerStartX, innerStartX, outerEndX, innerEndX)
        let maxX = Math.max(outerStartX, innerStartX, outerEndX, innerEndX)
        let minY = Math.min(outerStartY, innerStartY, outerEndY, innerEndY)
        let maxY = Math.max(outerStartY, innerStartY, outerEndY, innerEndY)

        // Check cardinal directions if they fall within the arc sweep
        // East (0°): arc extends to outerRadius
        if (endAngleRad > 0) { maxX = outerRadius }
        // South (90°/π/2): arc extends to outerRadius
        if (endAngleRad > Math.PI / 2) { maxY = outerRadius }
        // West (180°/π): arc extends to -outerRadius
        if (endAngleRad > Math.PI) { minX = -outerRadius }

        // Bounding box center offset from the arc's geometric center (0,0)
        const bboxCenterX = (minX + maxX) / 2
        const bboxCenterY = (minY + maxY) / 2

        // Input x,y is the bounding box center, so offset to get actual arc center
        const centerX = x - bboxCenterX
        const centerY = y - bboxCenterY

        // Arc angles for SVG path
        // 0° = north, arc sweeps clockwise
        const startAngle = -90 // North in SVG coordinates
        const endAngle = -90 + arcAngle
        const startRad = (startAngle * Math.PI) / 180
        const endRad = (endAngle * Math.PI) / 180

        // Outer arc points
        const ox1 = centerX + outerRadius * Math.cos(startRad)
        const oy1 = centerY + outerRadius * Math.sin(startRad)
        const ox2 = centerX + outerRadius * Math.cos(endRad)
        const oy2 = centerY + outerRadius * Math.sin(endRad)

        // Inner arc points
        const ix1 = centerX + innerRadius * Math.cos(startRad)
        const iy1 = centerY + innerRadius * Math.sin(startRad)
        const ix2 = centerX + innerRadius * Math.cos(endRad)
        const iy2 = centerY + innerRadius * Math.sin(endRad)

        const largeArc = arcAngle > 180 ? 1 : 0

        // Path: outer arc, line to inner, inner arc (reversed), line back
        const d = `
            M ${ox1} ${oy1}
            A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${ox2} ${oy2}
            L ${ix2} ${iy2}
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}
            Z
        `

        const transform = buildTransform(x, y)

        return (
            <path
                key={index}
                d={d}
                fill={color}
                fillOpacity={opacity}
                stroke={color}
                strokeWidth={2}
                strokeOpacity={opacity}
                transform={transform}
            />
        )
    }

    // Fan AoE (cone)
    // Note: Game coordinates represent the bounding box center, not the cone tip.
    // For arcs < 360°, we need to offset to find the actual cone tip position.
    // arcAngle = the angle of the fan arc (how wide the cone is)
    // angle = the rotation of the entire fan (where it points)
    if (type === 'fan_aoe') {
        const radius = 240 * scale
        const arcAngle = obj.arcAngle ?? 90
        const rotation = obj.angle ?? 0 // Rotation of the fan
        const arcAngleRad = (arcAngle * Math.PI) / 180

        // Calculate bounding box for asymmetric arc starting at north
        // Arc starts at north (0° = -90° in SVG) and sweeps clockwise
        const startAngleRad = -Math.PI / 2
        const endAngleRad = startAngleRad + arcAngleRad

        // Bounding box includes the cone tip (0,0) and the arc
        // For a cone, the tip is always at (0,0) relative to itself
        let minX = 0, maxX = 0, minY = -radius, maxY = 0

        // Check the end point of the arc
        const endX = radius * Math.cos(endAngleRad)
        const endY = radius * Math.sin(endAngleRad)

        minX = Math.min(0, endX)
        maxX = Math.max(0, endX + 16)
        maxY = Math.max(0, endY + 16)

        // Check cardinal directions if they fall within the arc sweep
        if (endAngleRad > 0) { maxX = radius + 16 }  // East
        if (endAngleRad > Math.PI / 2) { maxY = radius + 16 }  // South
        if (endAngleRad > Math.PI) { minX = -radius - 16 }  // West

        // Bounding box center offset from the cone tip (which is at 0,0)
        const bboxCenterX = (minX + maxX) / 2
        const bboxCenterY = (minY + maxY) / 2

        // Input x,y is the bounding box center, so offset to get actual cone tip
        const tipX = x - bboxCenterX
        const tipY = y - bboxCenterY

        // 0° = north, arc sweeps clockwise
        const startAngle = -90 // North in SVG coordinates
        const endAngle = -90 + arcAngle

        const startRad = (startAngle * Math.PI) / 180
        const endRad = (endAngle * Math.PI) / 180

        const x1 = tipX + radius * Math.cos(startRad)
        const y1 = tipY + radius * Math.sin(startRad)
        const x2 = tipX + radius * Math.cos(endRad)
        const y2 = tipY + radius * Math.sin(endRad)

        const largeArc = arcAngle > 180 ? 1 : 0

        // Full cone path for fill
        const fillPath = `M ${tipX} ${tipY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
        // Arc-only path for stroke (outer edge only)
        const strokePath = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`

        // Gradient and effect IDs
        const uniqueId = `${x}-${y}-${index}`
        const gradientId = `fan-aoe-gradient-${uniqueId}`
        // Same colors as circle_aoe
        const aoeColor = '#FFA131'
        const aoeOutsideColor = '#FEE874'
        const edgeColor = '#FFDDD9'

        // Build transform for rotation and flips
        // All transforms are applied around the input x,y point (bounding box center)
        const transforms: string[] = []
        if (rotation) {
            transforms.push(`rotate(${rotation} ${x} ${y})`)
        }
        // For flips, we need to translate to origin, scale, then translate back
        if (obj.horizontalFlip) {
            transforms.push(`translate(${2 * x} 0) scale(-1 1)`)
        }
        if (obj.verticalFlip) {
            transforms.push(`translate(0 ${2 * y}) scale(1 -1)`)
        }
        const transform = transforms.length > 0 ? transforms.join(' ') : undefined

        return (
            <g key={index} opacity={opacity} transform={transform}>
                <defs>
                    <radialGradient id={gradientId} cx={tipX} cy={tipY} r={radius} gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={aoeColor} stopOpacity="0.1" />
                        <stop offset="70%" stopColor={aoeColor} stopOpacity="0.3" />
                        <stop offset="95%" stopColor={aoeColor} stopOpacity="0.7" />
                        <stop offset="100%" stopColor={aoeOutsideColor} stopOpacity="1" />
                    </radialGradient>
                    <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <path
                    d={fillPath}
                    fill={`url(#${gradientId})`}
                    filter={`url(#${gradientId}-glow)`}
                />
                <path
                    d={strokePath}
                    fill="none"
                    stroke={edgeColor}
                    strokeWidth={2}
                />
            </g>
        )
    }

    // Line AoE (rectangle centered at x,y)
    if (type === 'line_aoe') {
        const width = (obj.width ?? 20)
        const height = (obj.height ?? 80)
        return (
            <rect
                key={index}
                x={x - width / 2}
                y={y - height / 2}
                width={width}
                height={height}
                fill={color}
                fillOpacity={opacity}
                stroke={color}
                strokeWidth={2}
                strokeOpacity={opacity}
                transform={obj.angle ? `rotate(${obj.angle} ${x} ${y})` : undefined}
            />
        )
    }

    // Line (from start point to end point)
    if (type === 'line') {
        const endX = obj.endX ?? x
        const endY = obj.endY ?? y
        const strokeWidth = (obj.height ?? 20)
        return (
            <line
                key={index}
                x1={x}
                y1={y}
                x2={endX}
                y2={endY}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                strokeLinecap="square"
            />
        )
    }

    // Text
    if (type === 'text') {
        const size = 16 * scale
        return (
            <text
                key={index}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                stroke="black"
                strokeWidth={1}
                paintOrder="stroke fill"
                fontSize={size}
                opacity={opacity}
            >
                {obj.text}
            </text>
        )
    }

    // Fallback - simple circle
    const radius = 16 * scale
    return (
        <circle
            key={index}
            cx={x}
            cy={y}
            r={radius}
            fill={color}
            opacity={opacity}
        />
    )
}

// Render a single object - dispatches to image or SVG renderer
function renderObject(obj: StrategyObject, index: number): JSX.Element | null {
    if (SVG_ONLY_TYPES.has(obj.type)) {
        return renderSvgObject(obj, index)
    }
    return renderImageObject(obj, index)
}

// Map board background type to in-game background image filename
function getInGameBackgroundPath(background?: string): string {
    if (!background || background === 'none') {
        return '/bg/none-bg.webp'
    }
    // Map the background types to the webp filenames
    const bgMap: Record<string, string> = {
        'checkered': '/bg/checkered-bg.webp',
        'checkered_circle': '/bg/checkered-circle-bg.webp',
        'checkered_square': '/bg/checkered-square-bg.webp',
        'grey': '/bg/grey-bg.webp',
        'grey_circle': '/bg/grey-circle-bg.webp',
        'grey_square': '/bg/grey-square-bg.webp',
    }
    return bgMap[background] || '/bg/none-bg.webp'
}

// Render board background
function renderBackground(background?: string, useInGameBackground?: boolean): JSX.Element {
    const bgColor = 'var(--card)'

    // In-game background mode - use webp images
    if (useInGameBackground) {
        const bgPath = getInGameBackgroundPath(background)
        return (
            <image
                href={bgPath}
                x={0}
                y={0}
                width={BOARD_WIDTH}
                height={BOARD_HEIGHT}
                preserveAspectRatio="xMidYMid slice"
            />
        )
    }

    // Simple mode - original rendering
    if (!background) {
        return <rect width={BOARD_WIDTH} height={BOARD_HEIGHT} fill={bgColor} />
    }

    // Default checkered/grey backgrounds - draw grid
    const isCheckered = background.includes('checkered')
    const gridColor = isCheckered ? 'rgba(255,255,255,0.1)' : 'rgba(128,128,128,0.2)'

    const elements: JSX.Element[] = [
        <rect key="bg" width={BOARD_WIDTH} height={BOARD_HEIGHT} fill={bgColor} />
    ]

    // Grid pattern
    const gridSize = 32
    for (let gx = 0; gx <= BOARD_WIDTH; gx += gridSize) {
        elements.push(
            <line key={`v${gx}`} x1={gx} y1={0} x2={gx} y2={BOARD_HEIGHT} stroke={gridColor} strokeWidth={1} />
        )
    }
    for (let gy = 0; gy <= BOARD_HEIGHT; gy += gridSize) {
        elements.push(
            <line key={`h${gy}`} x1={0} y1={gy} x2={BOARD_WIDTH} y2={gy} stroke={gridColor} strokeWidth={1} />
        )
    }

    return <g>{elements}</g>
}

export function StrategyBoardRenderer({
    board,
    width = 512,
    height = 384,
    className = '',
    useInGameBackground = false,
    useSeparateDps = false,
    highlightRole,
}: StrategyBoardRendererProps) {
    const viewBox = `0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`

    // Remap object types if using separate DPS markers
    const remapType = (type: string): string => {
        if (useSeparateDps && DPS_UNIFIED_TO_SEPARATE[type]) {
            return DPS_UNIFIED_TO_SEPARATE[type]
        }
        return type
    }

    // Create remapped objects
    const remappedObjects = board.objects.map(obj => ({
        ...obj,
        type: remapType(obj.type)
    }))

    // Get highlight types based on role and DPS mode
    const getHighlightTypes = (): string[] => {
        if (!highlightRole) return []
        const mapping = useSeparateDps ? SEPARATE_ROLE_TO_TYPES : UNIFIED_ROLE_TO_TYPES
        return mapping[highlightRole] || []
    }

    const highlightTypes = getHighlightTypes()

    // Render highlight circle for an object
    const renderHighlight = (obj: { type: string; x: number; y: number }, index: number): JSX.Element | null => {
        if (!highlightTypes.includes(obj.type)) return null
        const size = getScaledSize(obj as StrategyObject)
        const radius = size / 2 + 4 // Slightly larger than the icon

        return (
            <circle
                key={`highlight-${index}`}
                cx={obj.x}
                cy={obj.y}
                r={radius}
                fill="none"
                stroke="white"
                strokeWidth={3}
                strokeOpacity={0.9}
            />
        )
    }

    return (
        <svg
            viewBox={viewBox}
            width={width}
            height={height}
            className={className}
            style={{ maxWidth: '100%', height: 'auto' }}
        >
            {renderBackground(board.boardBackground, useInGameBackground)}
            {remappedObjects.map((obj, i) => renderObject(obj, i)).reverse()}
            {/* Render highlights on top */}
            {remappedObjects.map((obj, i) => renderHighlight(obj, i))}
        </svg>
    )
}
