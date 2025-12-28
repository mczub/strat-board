/**
 * EditorCanvas - Main canvas component using React Konva
 * 
 * Renders objects on a 512x384 canvas with drag, selection, and rendering.
 */

import { Stage, Layer, Image as KonvaImage, Rect, Circle, Text, Line, Group, Shape, Ring } from 'react-konva'
import { useEditorStore, type EditorObject } from '@/stores/useEditorStore'
import { useEffect, useRef, useState, memo, useCallback } from 'react'
import Konva from 'konva'
import { OBJECT_METADATA } from '@/lib/objectMetadata'

// Board dimensions
const BOARD_WIDTH = 512
const BOARD_HEIGHT = 384

// Clamp coordinates to canvas bounds
const clampX = (x: number) => Math.max(0, Math.min(BOARD_WIDTH, x))
const clampY = (y: number) => Math.max(0, Math.min(BOARD_HEIGHT, y))

// Get color for an object - prioritizes RGB properties (set by color picker) over hex string
const getObjectColor = (obj: EditorObject, defaultColor = '#ffffff'): string => {
    // Check RGB components first (these are set by the color picker)
    if (obj.colorR !== undefined || obj.colorG !== undefined || obj.colorB !== undefined) {
        return `rgb(${obj.colorR ?? 255}, ${obj.colorG ?? 255}, ${obj.colorB ?? 255})`
    }
    // Fall back to hex color string (from imported boards)
    if (obj.color && typeof obj.color === 'string') {
        return obj.color
    }
    return defaultColor
}

// Background image paths
const BG_PATHS: Record<string, string> = {
    checkered_circle: '/bg/checkered-circle-bg.webp',
    checkered_square: '/bg/checkered-square-bg.webp',
    checkered: '/bg/checkered-bg.webp',
    grey_circle: '/bg/grey-circle-bg.webp',
    grey_square: '/bg/grey-square-bg.webp',
    grey: '/bg/grey-bg.webp',
    none: '/bg/none-bg.webp',
}

// Default icon sizes for rendering
const ICON_SIZE_DEFAULTS: Record<string, number> = {
    waymark_a: 44, waymark_b: 44, waymark_c: 44, waymark_d: 44,
    waymark_1: 44, waymark_2: 44, waymark_3: 44, waymark_4: 44,
    attack_1: 30, attack_2: 30, attack_3: 30, attack_4: 30,
    tank_1: 32, tank_2: 32, healer_1: 32, healer_2: 32,
    dps_1: 32, dps_2: 32, dps_3: 32, dps_4: 32,
    stack: 124, stack_multi: 124, line_stack: 124,
    gaze: 124, proximity: 248, proximity_player: 124,
    tankbuster: 72, tower: 64, targeting: 72,
    radial_knockback: 260, linear_knockback: 270,
    small_enemy: 64, medium_enemy: 64, large_enemy: 64,
}

const getBaseSize = (type: string): number => OBJECT_METADATA[type].baseSize || 48

interface EditorCanvasProps {
    className?: string
}

// Hook to load image
function useImage(src: string): HTMLImageElement | null {
    const [image, setImage] = useState<HTMLImageElement | null>(null)

    useEffect(() => {
        const img = new window.Image()
        img.src = src
        img.onload = () => setImage(img)
        img.onerror = () => setImage(null)
    }, [src])

    return image
}

// Component to render a single object
const EditorObjectNode = memo(function EditorObjectNode({ obj, isSelected, onSelect }: {
    obj: EditorObject
    isSelected: boolean
    onSelect: () => void
}) {
    // Use getState() to avoid subscribing to store changes
    const moveObject = useCallback((id: string, x: number, y: number) => {
        useEditorStore.getState().moveObject(id, x, y)
    }, [])
    const iconSrc = `/icons/${obj.type}.png`
    const image = useImage(iconSrc)

    // Calculate size
    const baseSize = getBaseSize(obj.type)
    const scale = (obj.size ?? 100) / 100
    const size = baseSize * scale

    // Handle drag end (no onDragMove to avoid lag from per-frame re-renders)
    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        // Clamp to canvas bounds
        const x = clampX(e.target.x())
        const y = clampY(e.target.y())
        e.target.x(x)
        e.target.y(y)
        moveObject(obj.id, x, y)
    }

    // Render based on type
    if (obj.type === 'text') {
        const fontSize = 16.5 * scale
        const textContent = obj.text || 'Text'
        const textHeight = fontSize
        const verticalPadding = 4 // Few pixels top/bottom to match in-game

        // Use a temporary Konva Text node to measure exact width
        const tempText = new Konva.Text({
            text: textContent,
            fontSize: fontSize,
            fontStyle: "bold"
        })
        const textWidth = tempText.width()
        tempText.destroy()

        return (
            <Group
                x={obj.x}
                y={obj.y}
                draggable
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
            >
                <Text
                    text={textContent}
                    fontSize={fontSize}
                    fill={getObjectColor(obj)}
                    stroke="#000"
                    strokeWidth={0.4}
                    align="center"
                    offsetX={textWidth / 2}
                    offsetY={textHeight / 2}
                    opacity={(100 - (obj.transparency ?? 0)) / 100}
                    fontStyle="bold"
                />
                {isSelected && (
                    <Rect
                        x={-textWidth / 2}
                        y={-textHeight / 2 - verticalPadding}
                        width={textWidth}
                        height={textHeight + verticalPadding * 2}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="transparent"
                        listening={false}
                    />
                )}
            </Group>
        )
    }

    if (obj.type === 'circle_aoe') {
        const radius = size / 2
        const opacity = (100 - (obj.transparency ?? 0)) / 100
        // AoE gradient colors matching StrategyBoardRenderer
        const aoeColor = [255, 161, 49] // #FFA131
        const edgeColor = [254, 232, 116] // #FEE874
        const strokeColor = '#FFDDD9'

        return (
            <Group
                x={obj.x}
                y={obj.y}
                draggable
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
            >
                <Circle
                    radius={radius}
                    fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                    fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                    fillRadialGradientStartRadius={0}
                    fillRadialGradientEndRadius={radius}
                    fillRadialGradientColorStops={[
                        0, `rgba(${aoeColor[0]}, ${aoeColor[1]}, ${aoeColor[2]}, 0.1)`,
                        0.7, `rgba(${aoeColor[0]}, ${aoeColor[1]}, ${aoeColor[2]}, 0.3)`,
                        0.95, `rgba(${aoeColor[0]}, ${aoeColor[1]}, ${aoeColor[2]}, 0.7)`,
                        1, `rgba(${edgeColor[0]}, ${edgeColor[1]}, ${edgeColor[2]}, 1)`,
                    ]}
                    opacity={opacity}
                />
                <Circle
                    radius={radius}
                    stroke={strokeColor}
                    strokeWidth={2}
                    opacity={opacity}
                />
                {isSelected && (
                    <Rect
                        x={-radius - 2}
                        y={-radius - 2}
                        width={radius * 2 + 4}
                        height={radius * 2 + 4}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="transparent"
                        listening={false}
                    />
                )}
            </Group>
        )
    }

    // Fan AoE - cone shape with bounding box offset
    // The arc starts at 0° (north/top) and this starting point stays FIXED
    // x,y represents the bounding box center, which shifts as arc angle changes
    if (obj.type === 'fan_aoe') {
        const radius = baseSize * scale
        const arcAngle = obj.arcAngle ?? 90
        const rotation = obj.angle ?? 0
        const arcAngleRad = (arcAngle * Math.PI) / 180
        const opacity = (100 - (obj.transparency ?? 0)) / 100

        // Arc starts at north (top) = -90° in SVG
        const startAngleRad = -Math.PI / 2
        const endAngleRad = startAngleRad + arcAngleRad

        // Calculate bounding box with cone tip at origin (0,0)
        // Arc start point is at (0, -radius) - this is what stays FIXED
        let minX = 0, maxX = 0, minY = -radius, maxY = 0
        let bboxMarginLeft = 2, bboxMarginTop = 8, bboxMarginRight = 8, bboxMarginBottom = 2
        const endX = radius * Math.cos(endAngleRad)
        const endY = radius * Math.sin(endAngleRad)
        minX = Math.min(0, endX)
        maxX = Math.max(0, endX)
        maxY = Math.max(0, endY)

        if (endAngleRad > 0) { maxX = radius; bboxMarginBottom = 8 }
        if (endAngleRad > Math.PI / 2) { maxY = radius; bboxMarginLeft = 8 }
        if (endAngleRad > Math.PI) { minX = -radius }

        const bboxCenterX = (minX + maxX - bboxMarginLeft + bboxMarginRight) / 2
        const bboxCenterY = (minY + maxY - bboxMarginTop + bboxMarginBottom) / 2
        const bboxWidth = maxX - minX + bboxMarginLeft + bboxMarginRight
        const bboxHeight = maxY - minY + bboxMarginTop + bboxMarginBottom

        // The arc START point (0, -radius) should stay at a fixed screen position
        // x,y is bounding box center, so we offset from there to the cone tip
        const tipOffsetX = -bboxCenterX
        const tipOffsetY = -bboxCenterY

        // AoE gradient colors matching StrategyBoardRenderer
        const aoeColor = 'rgba(255, 161, 49' // #FFA131
        const edgeColor = 'rgba(254, 232, 116, 1)' // #FEE874
        const strokeColor = '#FFDDD9'

        return (
            <Group
                x={obj.x}
                y={obj.y}
                rotation={rotation}
                draggable
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
            >
                {/* Gradient fill shape */}
                <Shape
                    sceneFunc={(context) => {
                        const ctx = context._context as CanvasRenderingContext2D
                        const startAngle = -Math.PI / 2
                        const endAngle = startAngle + arcAngleRad

                        // Create radial gradient from tip
                        const gradient = ctx.createRadialGradient(
                            tipOffsetX, tipOffsetY, 0,
                            tipOffsetX, tipOffsetY, radius
                        )
                        gradient.addColorStop(0, `${aoeColor}, 0.1)`)
                        gradient.addColorStop(0.7, `${aoeColor}, 0.3)`)
                        gradient.addColorStop(0.95, `${aoeColor}, 0.7)`)
                        gradient.addColorStop(1, edgeColor)

                        context.beginPath()
                        context.moveTo(tipOffsetX, tipOffsetY)
                        context.arc(tipOffsetX, tipOffsetY, radius, startAngle, endAngle, false)
                        context.closePath()

                        ctx.fillStyle = gradient
                        ctx.fill()
                    }}
                    opacity={opacity}
                />
                {/* Stroke outline - separate shape for cleaner rendering */}
                <Shape
                    sceneFunc={(context, shape) => {
                        const startAngle = -Math.PI / 2
                        const endAngle = startAngle + arcAngleRad

                        // Draw just the arc stroke (outer edge)
                        context.beginPath()
                        context.arc(tipOffsetX, tipOffsetY, radius, startAngle, endAngle, false)
                        context.strokeShape(shape)
                    }}
                    stroke={strokeColor}
                    strokeWidth={2}
                    opacity={opacity}
                />
                {isSelected && (
                    <Rect
                        x={-bboxWidth / 2 - 2}
                        y={-bboxHeight / 2 - 2}
                        width={bboxWidth + 4}
                        height={bboxHeight + 4}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="transparent"
                        listening={false}
                    />
                )}
            </Group>
        )
    }

    // Donut AoE - ring shape with bounding box offset for partial arcs
    if (obj.type === 'donut') {
        const outerRadius = baseSize * scale
        const innerRadius = (obj.donutRadius ?? 50) * scale
        const arcAngle = obj.arcAngle ?? 360
        const rotation = obj.angle ?? 0
        const opacity = (100 - (obj.transparency ?? 0)) / 100
        const arcAngleRad = (arcAngle * Math.PI) / 180

        // Full 360° donut - simple Ring
        if (arcAngle >= 360) {
            return (
                <Group
                    x={obj.x}
                    y={obj.y}
                    rotation={rotation}
                    draggable
                    onDragEnd={handleDragEnd}
                    onClick={onSelect}
                    onTap={onSelect}
                >
                    <Ring
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        fill={`rgba(255, 161, 49, 0.5)`}
                        stroke="#FEE874"
                        strokeWidth={2}
                        opacity={opacity}
                    />
                    {isSelected && (
                        <Rect
                            x={-outerRadius - 2}
                            y={-outerRadius - 2}
                            width={outerRadius * 2 + 4}
                            height={outerRadius * 2 + 4}
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="transparent"
                            listening={false}
                        />
                    )}
                </Group>
            )
        }

        // Partial donut arc - needs bounding box offset
        const startAngleRad = -Math.PI / 2
        const endAngleRad = startAngleRad + arcAngleRad

        // Calculate bounding box
        const outerStartY = -outerRadius
        const innerStartY = -innerRadius
        const outerEndX = outerRadius * Math.cos(endAngleRad)
        const outerEndY = outerRadius * Math.sin(endAngleRad)
        const innerEndX = innerRadius * Math.cos(endAngleRad)
        const innerEndY = innerRadius * Math.sin(endAngleRad)

        let minX = Math.min(0, 0, outerEndX, innerEndX)
        let maxX = Math.max(0, 0, outerEndX, innerEndX)
        let minY = Math.min(outerStartY, innerStartY, outerEndY, innerEndY)
        let maxY = Math.max(outerStartY, innerStartY, outerEndY, innerEndY)

        if (endAngleRad > 0) { maxX = outerRadius }
        if (endAngleRad > Math.PI / 2) { maxY = outerRadius }
        if (endAngleRad > Math.PI) { minX = -outerRadius }

        const bboxCenterX = (minX + maxX) / 2
        const bboxCenterY = (minY + maxY) / 2
        const centerOffsetX = -bboxCenterX
        const centerOffsetY = -bboxCenterY

        // Bounding box size for selection
        const bboxWidth = maxX - minX
        const bboxHeight = maxY - minY

        return (
            <Group
                x={obj.x}
                y={obj.y}
                rotation={rotation}
                draggable
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
            >
                <Shape
                    sceneFunc={(context, shape) => {
                        const startAngle = -Math.PI / 2
                        const endAngle = startAngle + arcAngleRad

                        context.beginPath()
                        // Outer arc
                        context.arc(centerOffsetX, centerOffsetY, outerRadius, startAngle, endAngle, false)
                        // Line to inner arc end
                        context.lineTo(
                            centerOffsetX + innerRadius * Math.cos(endAngle),
                            centerOffsetY + innerRadius * Math.sin(endAngle)
                        )
                        // Inner arc (reverse direction)
                        context.arc(centerOffsetX, centerOffsetY, innerRadius, endAngle, startAngle, true)
                        context.closePath()
                        context.fillStrokeShape(shape)
                    }}
                    fill={`rgba(255, 161, 49, 0.5)`}
                    stroke="#FEE874"
                    strokeWidth={2}
                    opacity={opacity}
                />
                {isSelected && (
                    <Rect
                        x={-bboxWidth / 2 - 2}
                        y={-bboxHeight / 2 - 2}
                        width={bboxWidth + 4}
                        height={bboxHeight + 4}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="transparent"
                        listening={false}
                    />
                )}
            </Group>
        )
    }

    if (obj.type === 'line_aoe') {
        const width = obj.width ?? 50
        const height = obj.height ?? 100
        const rotation = obj.angle ?? 0
        return (
            <Group
                x={obj.x}
                y={obj.y}
                rotation={rotation}
                draggable
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
            >
                <Rect
                    width={width}
                    height={height}
                    offsetX={width / 2}
                    offsetY={height / 2}
                    fill={getObjectColor(obj, '#ff8000')}
                    stroke={getObjectColor(obj, '#ff8000')}
                    strokeWidth={2}
                    opacity={(100 - (obj.transparency ?? 0)) / 100}
                />
                {isSelected && (
                    <Rect
                        x={-width / 2 - 2}
                        y={-height / 2 - 2}
                        width={width + 4}
                        height={height + 4}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="transparent"
                        listening={false}
                    />
                )}
            </Group>
        )
    }

    if (obj.type === 'line') {
        // Lines use x,y as start point, endX,endY as end point
        const startX = obj.x
        const startY = obj.y
        const endX = obj.endX ?? (obj.x + 50)
        const endY = obj.endY ?? (obj.y - 50)
        const strokeWidth = obj.height ?? 3
        const opacity = (100 - (obj.transparency ?? 0)) / 100

        // Refs for the Lines so we can update them during drag
        const lineRef = useRef<Konva.Line>(null)
        const outlineRef = useRef<Konva.Line>(null)

        // Special drag handler for lines - we need to move both start and end points
        // Only update on drag end to avoid exponential drift
        const handleLineDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
            const deltaX = e.target.x()
            const deltaY = e.target.y()
            // Reset drag position and update both points, clamped to bounds
            e.target.x(0)
            e.target.y(0)
            const { updateObject } = useEditorStore.getState()
            updateObject(obj.id, {
                x: clampX(startX + deltaX),
                y: clampY(startY + deltaY),
                endX: clampX(endX + deltaX),
                endY: clampY(endY + deltaY)
            })
        }

        // Handler for dragging the start point handle
        const handleStartPointDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true // Stop propagation to parent Group
            const newX = clampX(e.target.x())
            const newY = clampY(e.target.y())
            e.target.x(newX)
            e.target.y(newY)
            const { updateObject } = useEditorStore.getState()
            updateObject(obj.id, { x: newX, y: newY })
        }

        // Update Line and selection outline visually during start point drag
        const handleStartPointDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true
            // Clamp to bounds
            const newStartX = clampX(e.target.x())
            const newStartY = clampY(e.target.y())
            e.target.x(newStartX)
            e.target.y(newStartY)
            // Update line points
            if (lineRef.current) {
                lineRef.current.points([newStartX, newStartY, endX, endY])
            }
            // Update selection outline
            if (outlineRef.current) {
                outlineRef.current.points([newStartX, newStartY, endX, endY])
            }
        }

        // Handler for dragging the end point handle
        const handleEndPointDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true // Stop propagation to parent Group
            const newX = clampX(e.target.x())
            const newY = clampY(e.target.y())
            e.target.x(newX)
            e.target.y(newY)
            const { updateObject } = useEditorStore.getState()
            updateObject(obj.id, { endX: newX, endY: newY })
        }

        // Update Line and selection outline visually during end point drag
        const handleEndPointDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true
            // Clamp to bounds
            const newEndX = clampX(e.target.x())
            const newEndY = clampY(e.target.y())
            e.target.x(newEndX)
            e.target.y(newEndY)
            // Update line points
            if (lineRef.current) {
                lineRef.current.points([startX, startY, newEndX, newEndY])
            }
            // Update selection outline
            if (outlineRef.current) {
                outlineRef.current.points([startX, startY, newEndX, newEndY])
            }
        }

        // Stop the parent Group from dragging when we start dragging a handle
        const handlePointDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true // Stop propagation to parent Group
        }

        return (
            <Group
                draggable
                onDragEnd={handleLineDragEnd}
                onClick={onSelect}
                onTap={onSelect}
            >
                {/* Selection outline - rendered first so it's behind main line */}
                {isSelected && (
                    <Line
                        ref={outlineRef}
                        points={[startX, startY, endX, endY]}
                        stroke="#3b82f6"
                        strokeWidth={strokeWidth + 4}
                        lineCap="round"
                        listening={false}
                    />
                )}
                <Line
                    ref={lineRef}
                    points={[startX, startY, endX, endY]}
                    stroke={getObjectColor(obj)}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    hitStrokeWidth={Math.max(strokeWidth, 10)} // Easier to click
                />
                {isSelected && (
                    <>
                        {/* Start point handle - draggable */}
                        <Circle
                            x={startX}
                            y={startY}
                            radius={4}
                            fill="#fff"
                            stroke="#fff"
                            strokeWidth={2}
                            draggable
                            onDragStart={handlePointDragStart}
                            onDragMove={handleStartPointDragMove}
                            onDragEnd={handleStartPointDragEnd}
                            onMouseEnter={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                            onMouseLeave={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'default'
                            }}
                        />
                        {/* End point handle - draggable */}
                        <Circle
                            x={endX}
                            y={endY}
                            radius={4}
                            fill="#fff"
                            stroke="#fff"
                            strokeWidth={2}
                            draggable
                            onDragStart={handlePointDragStart}
                            onDragMove={handleEndPointDragMove}
                            onDragEnd={handleEndPointDragEnd}
                            onMouseEnter={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                            onMouseLeave={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'default'
                            }}
                        />
                    </>
                )}
            </Group>
        )
    }

    // Default: render as image
    if (!image) {
        // Placeholder while loading
        return (
            <Rect
                x={obj.x - size / 2}
                y={obj.y - size / 2}
                width={size}
                height={size}
                fill="#333"
                stroke={isSelected ? '#3b82f6' : '#666'}
                strokeWidth={isSelected ? 2 : 1}
                draggable
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
            />
        )
    }

    return (
        <Group
            x={obj.x}
            y={obj.y}
            draggable
            onDragEnd={handleDragEnd}
            onClick={onSelect}
            onTap={onSelect}
            rotation={obj.angle ?? 0}
        >
            <KonvaImage
                image={image}
                width={size}
                height={size}
                offsetX={size / 2}
                offsetY={size / 2}
                opacity={(100 - (obj.transparency ?? 0)) / 100}
            />
            {isSelected && (
                <Rect
                    x={-size / 2 - 2}
                    y={-size / 2 - 2}
                    width={size + 4}
                    height={size + 4}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="transparent"
                    listening={false}
                />
            )}
        </Group>
    )
}, (prevProps, nextProps) => {
    // Custom comparison for memo - only re-render if props actually changed
    if (prevProps.isSelected !== nextProps.isSelected) return false
    if (prevProps.onSelect !== nextProps.onSelect) return false

    const prevObj = prevProps.obj
    const nextObj = nextProps.obj

    // Compare all object properties that affect rendering
    return (
        prevObj.id === nextObj.id &&
        prevObj.type === nextObj.type &&
        prevObj.x === nextObj.x &&
        prevObj.y === nextObj.y &&
        prevObj.size === nextObj.size &&
        prevObj.angle === nextObj.angle &&
        prevObj.transparency === nextObj.transparency &&
        prevObj.text === nextObj.text &&
        prevObj.color === nextObj.color &&
        prevObj.colorR === nextObj.colorR &&
        prevObj.colorG === nextObj.colorG &&
        prevObj.colorB === nextObj.colorB &&
        prevObj.width === nextObj.width &&
        prevObj.height === nextObj.height &&
        prevObj.arcAngle === nextObj.arcAngle &&
        prevObj.donutRadius === nextObj.donutRadius &&
        prevObj.endX === nextObj.endX &&
        prevObj.endY === nextObj.endY
    )
})

// Background layer component
function BackgroundLayer({ background }: { background: string }) {
    const bgPath = BG_PATHS[background] || BG_PATHS.none
    const image = useImage(bgPath)

    if (!image) {
        return (
            <Rect
                x={0}
                y={0}
                width={BOARD_WIDTH}
                height={BOARD_HEIGHT}
                fill="#1a1a2e"
                listening={false}
            />
        )
    }

    return (
        <KonvaImage
            image={image}
            x={0}
            y={0}
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
            listening={false}
        />
    )
}

export function EditorCanvas({ className = '' }: EditorCanvasProps) {
    const { board, selectedObjectId, selectObject } = useEditorStore()
    const stageRef = useRef<Konva.Stage>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    // Calculate scale to fit container
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                const scaleX = width / BOARD_WIDTH
                const scaleY = height / BOARD_HEIGHT
                setScale(Math.min(scaleX, scaleY, 2)) // Cap at 2x
            }
        })

        resizeObserver.observe(container)
        return () => resizeObserver.disconnect()
    }, [])

    // Handle click on empty canvas area
    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Only deselect if clicking on the stage itself
        if (e.target === e.target.getStage()) {
            selectObject(null)
        }
    }

    // Handle keyboard delete
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Don't delete if user is typing in an input field
                const activeElement = document.activeElement as HTMLElement
                const tagName = activeElement?.tagName?.toUpperCase()
                if (tagName === 'INPUT' || tagName === 'TEXTAREA' || activeElement?.isContentEditable) {
                    return
                }

                const state = useEditorStore.getState()
                if (state.selectedObjectId) {
                    e.preventDefault() // Prevent browser back navigation on backspace
                    state.deleteObject(state.selectedObjectId)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <div
            ref={containerRef}
            className={`relative ${className}`}
            style={{ aspectRatio: '4/3', width: '100%' }}
        >
            <Stage
                ref={stageRef}
                width={BOARD_WIDTH * scale}
                height={BOARD_HEIGHT * scale}
                scaleX={scale}
                scaleY={scale}
                onClick={handleStageClick}
                onTap={handleStageClick}
                style={{
                    background: '#1a1a2e',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}
            >
                {/* Background layer */}
                <Layer>
                    <BackgroundLayer background={board.boardBackground} />
                </Layer>

                {/* Objects layer - render in reverse so first object is on top, selected object renders last for click priority */}
                <Layer>
                    {/* First render all non-selected objects */}
                    {[...board.objects].reverse()
                        .filter(obj => obj.id !== selectedObjectId)
                        .map((obj) => (
                            <EditorObjectNode
                                key={obj.id}
                                obj={obj}
                                isSelected={false}
                                onSelect={() => selectObject(obj.id)}
                            />
                        ))}
                    {/* Then render selected object on top for click priority */}
                    {selectedObjectId && board.objects.find(obj => obj.id === selectedObjectId) && (
                        <EditorObjectNode
                            key={selectedObjectId}
                            obj={board.objects.find(obj => obj.id === selectedObjectId)!}
                            isSelected={true}
                            onSelect={() => selectObject(selectedObjectId)}
                        />
                    )}
                </Layer>
            </Stage>
        </div>
    )
}
