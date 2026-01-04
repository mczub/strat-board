/**
 * Strategy Board Renderer Component
 * 
 * Renders a decoded FF14 Strategy Board as an SVG element.
 * Uses PNG images from /icons/ for most objects, SVG for geometric primitives.
 */

import { JSX } from 'react'
import type { StrategyBoard, StrategyObject } from 'xiv-strat-board'
import {
    BOARD_WIDTH,
    BOARD_HEIGHT,
    DPS_UNIFIED_TO_SEPARATE,
    UNIFIED_ROLE_TO_TYPES,
    SEPARATE_ROLE_TO_TYPES,
    getScaledSize,
    getObjectOpacity,
    getObjectColor,
    AOE_COLORS,
} from '@/lib/renderingUtils'

interface StrategyBoardRendererProps {
    board: StrategyBoard
    width?: number
    height?: number
    className?: string
    useInGameBackground?: boolean
    useSeparateDps?: boolean
    highlightRole?: string // Role to highlight: 'MT', 'OT', 'H1', 'H2', 'D1'/'M1', etc.
}

// Types that should use SVG instead of images
const SVG_ONLY_TYPES = new Set([
    'text',
    'line',
    'line_aoe',
    'circle_aoe',
    'fan_aoe',
    'donut',
])

// Wrapper to get scaled size from StrategyObject
function getScaledSizeFromObj(obj: StrategyObject): number {
    return getScaledSize(obj.type, obj.size ?? 100)
}

// Wrapper to get opacity from StrategyObject
function getOpacityFromObj(obj: StrategyObject): number {
    return getObjectOpacity(obj.transparency, obj.hidden)
}

// Wrapper to get color from StrategyObject
function getColorFromObj(obj: StrategyObject): string {
    return getObjectColor(obj, AOE_COLORS.default)
}

// Render image-based object
function renderImageObject(obj: StrategyObject, index: number): JSX.Element | null {
    const { type, x, y } = obj
    const size = getScaledSizeFromObj(obj)
    const opacity = getOpacityFromObj(obj)

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
    const color = getColorFromObj(obj)
    const opacity = getOpacityFromObj(obj)
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

        let bboxMarginLeft = 2, bboxMarginTop = 8, bboxMarginRight = 8, bboxMarginBottom = 2

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
        if (endAngleRad > 0) { maxX = outerRadius; bboxMarginBottom = 8 }
        // South (90°/π/2): arc extends to outerRadius
        if (endAngleRad > Math.PI / 2) { maxY = outerRadius; bboxMarginLeft = 8 }
        // West (180°/π): arc extends to -outerRadius
        if (endAngleRad > Math.PI) { minX = -outerRadius }

        // Bounding box center offset from the arc's geometric center (0,0)
        const bboxCenterX = (minX + maxX - bboxMarginLeft + bboxMarginRight) / 2
        const bboxCenterY = (minY + maxY - bboxMarginTop + bboxMarginBottom) / 2

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
        let bboxMarginLeft = 2, bboxMarginTop = 8, bboxMarginRight = 8, bboxMarginBottom = 2

        // Check the end point of the arc
        const endX = radius * Math.cos(endAngleRad)
        const endY = radius * Math.sin(endAngleRad)

        minX = Math.min(0, endX)
        maxX = Math.max(0, endX)
        maxY = Math.max(0, endY)

        // Check cardinal directions if they fall within the arc sweep
        if (endAngleRad > 0) { maxX = radius; bboxMarginBottom = 8 }  // East
        if (endAngleRad > Math.PI / 2) { maxY = radius; bboxMarginLeft = 8 }  // South
        if (endAngleRad > Math.PI) { minX = -radius }  // West

        // Bounding box center offset from the cone tip (which is at 0,0)
        const bboxCenterX = (minX + maxX - bboxMarginLeft + bboxMarginRight) / 2
        const bboxCenterY = (minY + maxY - bboxMarginTop + bboxMarginBottom) / 2

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
        const strokeWidth = (obj.height ?? 6)  // Default matches objectMetadata
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
        const size = getScaledSizeFromObj(obj as StrategyObject)
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
