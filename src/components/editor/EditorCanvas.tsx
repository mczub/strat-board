/**
 * EditorCanvas - Main canvas component using React Konva
 * 
 * Renders objects on a 512x384 canvas with drag, selection, and rendering.
 */

import { Stage, Layer, Image as KonvaImage, Rect, Circle, Text, Line, Group, Shape, Ring } from 'react-konva'
import { useEditorStore, type EditorObject } from '@/stores/useEditorStore'
import React, { useEffect, useRef, useState, memo, useCallback } from 'react'
import Konva from 'konva'
import { OBJECT_METADATA } from '@/lib/objectMetadata'
import {
    BOARD_WIDTH,
    BOARD_HEIGHT,
    remapDpsType,
    getObjectColor as getObjectColorFromUtils,
    getBaseSize,
} from '@/lib/renderingUtils'

// Clamp coordinates to canvas bounds
const clampX = (x: number) => Math.max(0, Math.min(BOARD_WIDTH, x))
const clampY = (y: number) => Math.max(0, Math.min(BOARD_HEIGHT, y))

// Get color for an object - wrapper for EditorObject type
const getObjectColor = (obj: EditorObject, defaultColor = '#ffffff'): string => {
    return getObjectColorFromUtils(obj, defaultColor)
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

// Check if object type supports resize (has size parameter)
// Excludes: line, line_aoe (special cases), text (no resize)
const supportsResize = (type: string): boolean => {
    if (type === 'line' || type === 'line_aoe' || type === 'text') return false
    const metadata = OBJECT_METADATA[type]
    return metadata?.parameters?.size !== undefined
}

const minSize = (type: string): number => {
    const metadata = OBJECT_METADATA[type]
    return metadata?.parameters?.size?.min ?? 10
}

// Check if object type supports rotation (has angle parameter)
// Excludes: line (has own handles), text (no rotation)
const supportsRotation = (type: string): boolean => {
    if (type === 'line' || type === 'text') return false
    const metadata = OBJECT_METADATA[type]
    return metadata?.parameters?.angle !== undefined
}

// Get display type based on useSeparateDps setting
const getDisplayType = (type: string, useSeparateDps: boolean): string => {
    return remapDpsType(type, useSeparateDps)
}

interface EditorCanvasProps {
    className?: string
}

// Global image cache to prevent flashing when components re-render
const imageCache = new Map<string, HTMLImageElement>()

// Hook to load image with caching
function useImage(src: string): HTMLImageElement | null {
    // Check cache first - if already loaded, use immediately
    const cachedImage = imageCache.get(src)
    const [image, setImage] = useState<HTMLImageElement | null>(cachedImage || null)

    useEffect(() => {
        // If already in cache and matches current state, we're done
        if (cachedImage && image === cachedImage) return

        // If in cache but state is stale, update it
        if (cachedImage) {
            setImage(cachedImage)
            return
        }

        // Load the image
        const img = new window.Image()
        img.src = src
        img.onload = () => {
            imageCache.set(src, img)
            setImage(img)
        }
        img.onerror = () => setImage(null)
    }, [src, cachedImage, image])

    return image
}

// Component to render a single object
const EditorObjectNode = memo(function EditorObjectNode({ obj, isSelected, onSelect, useSeparateDps }: {
    obj: EditorObject
    isSelected: boolean
    onSelect: () => void
    useSeparateDps: boolean
}) {
    // Check if object is hidden (show outline only, no content)
    const isHidden = !!obj.hidden

    // Check if object is locked (non-draggable, no handles)
    const isLocked = !!obj.locked

    // Use getState() to avoid subscribing to store changes
    const moveObject = useCallback((id: string, x: number, y: number) => {
        useEditorStore.getState().moveObject(id, x, y)
    }, [])

    const updateObject = useCallback((id: string, updates: Partial<EditorObject>, skipHistory = false) => {
        useEditorStore.getState().updateObject(id, updates, skipHistory)
    }, [])

    // Get display type - remaps DPS icons based on Unified/Separate setting
    const displayType = getDisplayType(obj.type, useSeparateDps)
    const iconSrc = `/icons/${displayType}.png`
    const image = useImage(iconSrc)

    // Calculate size
    const baseSize = getBaseSize(obj.type)
    const scale = (obj.size ?? 100) / 100
    const size = baseSize * scale

    // Handle drag end (no onDragMove to avoid lag from per-frame re-renders)
    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        // Clamp to canvas bounds
        let x = clampX(e.target.x())
        let y = clampY(e.target.y())

        // Apply grid snap if enabled (Snap button is on AND gridSize is set)
        const { gridSize, showGrid } = useEditorStore.getState()
        if (showGrid && gridSize > 0) {
            x = clampX(Math.round(x / gridSize) * gridSize)
            y = clampY(Math.round(y / gridSize) * gridSize)
        }

        e.target.x(x)
        e.target.y(y)
        moveObject(obj.id, x, y)
    }

    // Constrain drag to canvas bounds in real-time
    // dragBoundFunc receives pos in screen pixels, but we need to clamp in canvas coords
    // Note: dragBoundFunc uses 'this' to refer to the node, so we need a regular function
    function dragBoundFunc(this: Konva.Node, pos: { x: number; y: number }) {
        const stage = this.getStage()
        const scale = stage?.scaleX() || 1
        // Convert from screen pixels to canvas coords, clamp, then convert back
        return {
            x: clampX(pos.x / scale) * scale,
            y: clampY(pos.y / scale) * scale
        }
    }

    // Helper to render selection box + resize/rotation handles
    // boundingWidth, boundingHeight: the size of the bounding box around object center
    const renderSelectionHandles = (boundingWidth: number, boundingHeight?: number) => {
        const halfWidth = boundingWidth / 2 + 2 // Add 2px margin
        const halfHeight = (boundingHeight ?? boundingWidth) / 2 + 2

        return (
            <>
                {/* Selection box - dotted when hidden */}
                <Rect
                    x={-halfWidth}
                    y={-halfHeight}
                    width={halfWidth * 2}
                    height={halfHeight * 2}
                    stroke={isHidden ? '#888' : '#3b82f6'}
                    strokeWidth={2}
                    dash={isHidden ? [4, 4] : undefined}
                    fill="transparent"
                    listening={false}
                />

                {/* Center crosshair to show anchor point */}
                <Line
                    points={[-3, 0, 3, 0]}
                    stroke="#fff"
                    strokeWidth={1}
                    listening={false}
                />
                <Line
                    points={[0, -3, 0, 3]}
                    stroke="#fff"
                    strokeWidth={1}
                    listening={false}
                />

                {/* Resize handles - corner circles */}
                {!isLocked && supportsResize(obj.type) && (() => {
                    const handleRadius = 4
                    const corners = [
                        { x: -halfWidth, y: -halfHeight }, // top-left
                        { x: halfWidth, y: -halfHeight },  // top-right
                        { x: halfWidth, y: halfHeight },   // bottom-right
                        { x: -halfWidth, y: halfHeight },  // bottom-left
                    ]

                    const handleResizeDrag = (e: Konva.KonvaEventObject<DragEvent>, cornerIndex: number) => {
                        // The handle's x/y are already in the Group's local coordinate system
                        const handleX = e.target.x()
                        const handleY = e.target.y()

                        // Current object's size percent
                        const currentSizePercent = obj.size ?? 100

                        // The original bounding box dimensions (without margin) at current size
                        const originalHalfWidth = halfWidth - 2
                        const originalHalfHeight = halfHeight - 2
                        const originalMaxHalf = Math.max(originalHalfWidth, originalHalfHeight)

                        // The handle was dragged to (handleX, handleY)
                        // New max dimension = max(|handleX|, |handleY|) - 2 (margin)
                        const newMaxHalf = Math.max(Math.abs(handleX), Math.abs(handleY)) - 2

                        // Scale factor: how much bigger/smaller is the new size compared to current?
                        // newMaxHalf / originalMaxHalf = newScale / currentScale
                        // newScale = currentScale * (newMaxHalf / originalMaxHalf)
                        const scaleFactor = newMaxHalf / originalMaxHalf
                        const newSizePercent = Math.max(minSize(obj.type), Math.min(200, Math.round(currentSizePercent * scaleFactor)))

                        updateObject(obj.id, { size: newSizePercent }, true) // skipHistory=true for intermediate updates

                        // Calculate new corner positions by scaling from current position
                        const actualScaleFactor = newSizePercent / currentSizePercent
                        const newHalfWidth = originalHalfWidth * actualScaleFactor + 2
                        const newHalfHeight = originalHalfHeight * actualScaleFactor + 2

                        const signs = [
                            { x: -1, y: -1 }, // top-left
                            { x: 1, y: -1 },  // top-right
                            { x: 1, y: 1 },   // bottom-right
                            { x: -1, y: 1 },  // bottom-left
                        ]

                        e.target.x(signs[cornerIndex].x * newHalfWidth)
                        e.target.y(signs[cornerIndex].y * newHalfHeight)
                    }

                    return corners.map((corner, idx) => (
                        <Circle
                            key={`resize-${idx}`}
                            x={corner.x}
                            y={corner.y}
                            radius={handleRadius}
                            fill="#fff"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            draggable
                            onDragStart={(e) => {
                                e.cancelBubble = true
                                // Save snapshot before drag starts for undo
                                const { saveHistorySnapshot } = useEditorStore.getState()
                                saveHistorySnapshot()
                            }}
                            onDragMove={(e) => handleResizeDrag(e, idx)}
                            onDragEnd={(e) => { e.cancelBubble = true }}
                            onMouseEnter={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                            onMouseLeave={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'default'
                            }}
                            onMouseDown={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grabbing'
                            }}
                            onMouseUp={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                        />
                    ))
                })()}

                {/* Rotation handle - circle above object with connecting line */}
                {!isLocked && supportsRotation(obj.type) && (() => {
                    const rotateDistance = halfHeight + 23
                    const handleRadius = 4

                    const handleRotateDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
                        const stage = e.target.getStage()
                        if (!stage) return

                        const pointer = stage.getPointerPosition()
                        if (!pointer) return

                        const group = e.target.getParent()
                        if (!group) return
                        const groupPos = group.getAbsolutePosition()

                        const dx = pointer.x - groupPos.x
                        const dy = pointer.y - groupPos.y
                        let angle = Math.atan2(dx, -dy) * (180 / Math.PI)

                        angle = Math.round(angle)
                        if (angle > 180) angle -= 360
                        if (angle < -180) angle += 360

                        updateObject(obj.id, { angle }, true) // skipHistory=true for intermediate updates

                        e.target.x(0)
                        e.target.y(-rotateDistance)
                    }

                    return (
                        <>
                            <Line
                                points={[0, -halfHeight, 0, -rotateDistance + handleRadius]}
                                stroke="#3b82f6"
                                strokeWidth={1}
                                listening={false}
                            />
                            <Circle
                                x={0}
                                y={-rotateDistance}
                                radius={handleRadius}
                                fill="#fff"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                draggable
                                onDragStart={(e) => {
                                    e.cancelBubble = true
                                    // Save snapshot before drag starts for undo
                                    const { saveHistorySnapshot } = useEditorStore.getState()
                                    saveHistorySnapshot()
                                }}
                                onDragMove={handleRotateDrag}
                                onDragEnd={(e) => { e.cancelBubble = true }}
                                onMouseEnter={(e) => {
                                    const stage = e.target.getStage()
                                    if (stage) stage.container().style.cursor = 'grab'
                                }}
                                onMouseLeave={(e) => {
                                    const stage = e.target.getStage()
                                    if (stage) stage.container().style.cursor = 'default'
                                }}
                                onMouseDown={(e) => {
                                    const stage = e.target.getStage()
                                    if (stage) stage.container().style.cursor = 'grabbing'
                                }}
                                onMouseUp={(e) => {
                                    const stage = e.target.getStage()
                                    if (stage) stage.container().style.cursor = 'grab'
                                }}
                            />
                        </>
                    )
                })()}
            </>
        )
    }

    // Render based on type
    if (obj.type === 'text') {
        const fontSize = 16 * scale
        const textContent = obj.text || 'Text'
        const textHeight = fontSize
        const verticalPadding = 4 // Few pixels top/bottom to match in-game

        // Use a temporary Konva Text node to measure exact width
        const tempText = new Konva.Text({
            text: textContent,
            fontSize: fontSize
        })
        const textWidth = tempText.width()
        tempText.destroy()

        return (
            <Group
                x={obj.x}
                y={obj.y}
                draggable={!isLocked}
                dragBoundFunc={dragBoundFunc}
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
            >
                {/* Only render content if not hidden */}
                {!isHidden && (
                    <Text
                        text={textContent}
                        fontSize={fontSize}
                        fill={getObjectColor(obj)}
                        stroke="#000"
                        strokeWidth={1}
                        fillAfterStrokeEnabled={true}
                        align="center"
                        offsetX={textWidth / 2}
                        offsetY={textHeight / 2}
                        opacity={(100 - (obj.transparency ?? 0)) / 100}
                    />
                )}
                {isSelected && (
                    <Rect
                        x={-textWidth / 2}
                        y={-textHeight / 2 - verticalPadding}
                        width={textWidth}
                        height={textHeight + verticalPadding * 2}
                        stroke={isHidden ? "#888" : "#3b82f6"}
                        strokeWidth={2}
                        dash={isHidden ? [4, 4] : undefined}
                        fill="transparent"
                        listening={false}
                    />
                )}
            </Group>
        )
    }

    if (obj.type === 'circle_aoe') {
        const radius = size
        const opacity = (100 - (obj.transparency ?? 0)) / 100
        // AoE gradient colors matching StrategyBoardRenderer
        const aoeColor = [255, 161, 49] // #FFA131
        const edgeColor = [254, 232, 116] // #FEE874
        const strokeColor = '#FFDDD9'

        return (
            <Group
                x={obj.x}
                y={obj.y}
                draggable={!isLocked}
                dragBoundFunc={dragBoundFunc}
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
            >
                {/* Only render content if not hidden */}
                {!isHidden && (
                    <>
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
                    </>
                )}
                {isSelected && renderSelectionHandles(radius * 2)}
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
                scaleX={obj.horizontalFlip ? -1 : 1}
                scaleY={obj.verticalFlip ? -1 : 1}
                draggable={!isLocked}
                dragBoundFunc={dragBoundFunc}
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
            >
                {/* Only render content if not hidden */}
                {!isHidden && (
                    <>
                        {/* Invisible hit area for click detection (custom sceneFunc shapes don't auto-detect hits) */}
                        <Rect
                            x={-bboxWidth / 2}
                            y={-bboxHeight / 2}
                            width={bboxWidth}
                            height={bboxHeight}
                            fill="transparent"
                        />
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
                    </>
                )}
                {isSelected && renderSelectionHandles(bboxWidth, bboxHeight)}
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
                    scaleX={obj.horizontalFlip ? -1 : 1}
                    scaleY={obj.verticalFlip ? -1 : 1}
                    draggable={!isLocked}
                    dragBoundFunc={dragBoundFunc}
                    onDragEnd={handleDragEnd}
                    onClick={onSelect}
                    onTap={onSelect}
                >
                    {/* Only render content if not hidden */}
                    {!isHidden && (
                        <Ring
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            fill="#FFA131"
                            stroke="#FFA131"
                            strokeWidth={2}
                            opacity={opacity}
                        />
                    )}
                    {isSelected && renderSelectionHandles(outerRadius * 2)}
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

        let bboxMarginLeft = 2, bboxMarginTop = 8, bboxMarginRight = 8, bboxMarginBottom = 2

        let minX = Math.min(0, 0, outerEndX, innerEndX)
        let maxX = Math.max(0, 0, outerEndX, innerEndX)
        let minY = Math.min(outerStartY, innerStartY, outerEndY, innerEndY)
        let maxY = Math.max(outerStartY, innerStartY, outerEndY, innerEndY)

        if (endAngleRad > 0) { maxX = outerRadius; bboxMarginBottom = 8 }
        if (endAngleRad > Math.PI / 2) { maxY = outerRadius; bboxMarginLeft = 8 }
        if (endAngleRad > Math.PI) { minX = -outerRadius }

        const bboxCenterX = (minX + maxX - bboxMarginLeft + bboxMarginRight) / 2
        const bboxCenterY = (minY + maxY - bboxMarginTop + bboxMarginBottom) / 2
        const centerOffsetX = -bboxCenterX
        const centerOffsetY = -bboxCenterY

        // Bounding box size for selection
        const bboxWidth = maxX - minX + bboxMarginLeft + bboxMarginRight
        const bboxHeight = maxY - minY + bboxMarginTop + bboxMarginBottom

        return (
            <Group
                x={obj.x}
                y={obj.y}
                rotation={rotation}
                scaleX={obj.horizontalFlip ? -1 : 1}
                scaleY={obj.verticalFlip ? -1 : 1}
                draggable={!isLocked}
                dragBoundFunc={dragBoundFunc}
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
            >
                {/* Only render content if not hidden */}
                {!isHidden && (
                    <>
                        {/* Invisible hit area for click detection (custom sceneFunc shapes don't auto-detect hits) */}
                        <Rect
                            x={-bboxWidth / 2}
                            y={-bboxHeight / 2}
                            width={bboxWidth}
                            height={bboxHeight}
                            fill="transparent"
                        />
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
                            fill="#FFA131"
                            stroke="#FFA131"
                            strokeWidth={2}
                            opacity={opacity}
                        />
                    </>
                )}
                {isSelected && renderSelectionHandles(bboxWidth, bboxHeight)}
            </Group>
        )
    }

    if (obj.type === 'line_aoe') {
        const width = obj.width ?? 50
        const height = obj.height ?? 100
        const rotation = obj.angle ?? 0
        const handleRadius = 4
        const handleOffset = 2

        // Handle width resize (left/right edges)
        const handleWidthDrag = (e: Konva.KonvaEventObject<DragEvent>, side: 'left' | 'right') => {
            const stage = e.target.getStage()
            if (!stage) return

            // Get distance from center, subtracting handleOffset
            const handlePos = Math.abs(side === 'right' ? e.target.x() : -e.target.x())
            const newHalfWidth = handlePos - handleOffset
            const newWidth = Math.max(10, Math.min(512, Math.round(newHalfWidth * 2)))

            updateObject(obj.id, { width: newWidth }, true) // skipHistory for intermediate updates

            // Reset handle position based on new width (adding handleOffset back)
            e.target.x(side === 'right' ? newWidth / 2 + handleOffset : -newWidth / 2 - handleOffset)
            e.target.y(0)
        }

        // Handle height resize (top/bottom edges)  
        const handleHeightDrag = (e: Konva.KonvaEventObject<DragEvent>, side: 'top' | 'bottom') => {
            const stage = e.target.getStage()
            if (!stage) return

            // Get distance from center, subtracting handleOffset
            const handlePos = Math.abs(side === 'bottom' ? e.target.y() : -e.target.y())
            const newHalfHeight = handlePos - handleOffset
            const newHeight = Math.max(10, Math.min(384, Math.round(newHalfHeight * 2)))

            updateObject(obj.id, { height: newHeight }, true) // skipHistory for intermediate updates

            // Reset handle position based on new height (adding handleOffset back)
            e.target.x(0)
            e.target.y(side === 'bottom' ? newHeight / 2 + handleOffset : -newHeight / 2 - handleOffset)
        }

        // Handle corner resize (both width and height)
        type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
        const handleCornerDrag = (e: Konva.KonvaEventObject<DragEvent>, corner: Corner) => {
            const stage = e.target.getStage()
            if (!stage) return

            // Get distance from center, subtracting handleOffset
            const newHalfWidth = Math.abs(e.target.x()) - handleOffset
            const newHalfHeight = Math.abs(e.target.y()) - handleOffset
            const newWidth = Math.max(10, Math.min(512, Math.round(newHalfWidth * 2)))
            const newHeight = Math.max(10, Math.min(384, Math.round(newHalfHeight * 2)))

            updateObject(obj.id, { width: newWidth, height: newHeight }, true) // skipHistory for intermediate updates

            // Reset handle position based on new dimensions (adding handleOffset back)
            const xSign = corner.includes('Right') ? 1 : -1
            const ySign = corner.includes('bottom') ? 1 : -1
            e.target.x(xSign * (newWidth / 2 + handleOffset))
            e.target.y(ySign * (newHeight / 2 + handleOffset))
        }

        // Rotation handle drag
        const rotateDistance = height / 2 + 23
        const handleRotateDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
            const stage = e.target.getStage()
            if (!stage) return

            const pointer = stage.getPointerPosition()
            if (!pointer) return

            const group = e.target.getParent()
            if (!group) return
            const groupPos = group.getAbsolutePosition()

            const dx = pointer.x - groupPos.x
            const dy = pointer.y - groupPos.y
            let angle = Math.atan2(dx, -dy) * (180 / Math.PI)

            angle = Math.round(angle)
            if (angle > 180) angle -= 360
            if (angle < -180) angle += 360

            updateObject(obj.id, { angle }, true) // skipHistory for intermediate updates

            e.target.x(0)
            e.target.y(-rotateDistance)
        }

        return (
            <Group
                x={obj.x}
                y={obj.y}
                rotation={rotation}
                draggable={!isLocked}
                dragBoundFunc={dragBoundFunc}
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
            >
                {/* Only render content if not hidden */}
                {!isHidden && (
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
                )}
                {isSelected && (
                    <>
                        {/* Selection box */}
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

                        {/* Center crosshair */}
                        <Line points={[-3, 0, 3, 0]} stroke="#fff" strokeWidth={1} listening={false} />
                        <Line points={[0, -3, 0, 3]} stroke="#fff" strokeWidth={1} listening={false} />

                        {/* Width handles (left/right edges) */}
                        <Circle
                            x={-width / 2 - handleOffset}
                            y={0}
                            radius={handleRadius}
                            fill="#fff"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            draggable={!isLocked}
                            onDragStart={(e) => { e.cancelBubble = true }}
                            onDragMove={(e) => handleWidthDrag(e, 'left')}
                            onDragEnd={(e) => { e.cancelBubble = true }}
                            onMouseEnter={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                            onMouseLeave={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'default'
                            }}
                            onMouseDown={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grabbing'
                            }}
                            onMouseUp={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                        />
                        <Circle
                            x={width / 2 + handleOffset}
                            y={0}
                            radius={handleRadius}
                            fill="#fff"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            draggable={!isLocked}
                            onDragStart={(e) => { e.cancelBubble = true }}
                            onDragMove={(e) => handleWidthDrag(e, 'right')}
                            onDragEnd={(e) => { e.cancelBubble = true }}
                            onMouseEnter={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                            onMouseLeave={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'default'
                            }}
                            onMouseDown={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grabbing'
                            }}
                            onMouseUp={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                        />

                        {/* Height handles (top/bottom edges) */}
                        <Circle
                            x={0}
                            y={-height / 2 - handleOffset}
                            radius={handleRadius}
                            fill="#fff"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            draggable={!isLocked}
                            onDragStart={(e) => { e.cancelBubble = true }}
                            onDragMove={(e) => handleHeightDrag(e, 'top')}
                            onDragEnd={(e) => { e.cancelBubble = true }}
                            onMouseEnter={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                            onMouseLeave={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'default'
                            }}
                            onMouseDown={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grabbing'
                            }}
                            onMouseUp={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                        />
                        <Circle
                            x={0}
                            y={height / 2 + handleOffset}
                            radius={handleRadius}
                            fill="#fff"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            draggable={!isLocked}
                            onDragStart={(e) => { e.cancelBubble = true }}
                            onDragMove={(e) => handleHeightDrag(e, 'bottom')}
                            onDragEnd={(e) => { e.cancelBubble = true }}
                            onMouseEnter={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                            onMouseLeave={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'default'
                            }}
                            onMouseDown={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grabbing'
                            }}
                            onMouseUp={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                        />

                        {/* Corner handles (resize both width and height) */}
                        {[
                            { x: -width / 2 - handleOffset, y: -height / 2 - handleOffset, corner: 'topLeft' as const },
                            { x: width / 2 + handleOffset, y: -height / 2 - handleOffset, corner: 'topRight' as const },
                            { x: width / 2 + handleOffset, y: height / 2 + handleOffset, corner: 'bottomRight' as const },
                            { x: -width / 2 - handleOffset, y: height / 2 + handleOffset, corner: 'bottomLeft' as const },
                        ].map((c, idx) => (
                            <Circle
                                key={`corner-${idx}`}
                                x={c.x}
                                y={c.y}
                                radius={handleRadius}
                                fill="#fff"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                draggable={!isLocked}
                                onDragStart={(e) => { e.cancelBubble = true }}
                                onDragMove={(e) => handleCornerDrag(e, c.corner)}
                                onDragEnd={(e) => { e.cancelBubble = true }}
                                onMouseEnter={(e) => {
                                    const stage = e.target.getStage()
                                    if (stage) stage.container().style.cursor = 'grab'
                                }}
                                onMouseLeave={(e) => {
                                    const stage = e.target.getStage()
                                    if (stage) stage.container().style.cursor = 'default'
                                }}
                                onMouseDown={(e) => {
                                    const stage = e.target.getStage()
                                    if (stage) stage.container().style.cursor = 'grabbing'
                                }}
                                onMouseUp={(e) => {
                                    const stage = e.target.getStage()
                                    if (stage) stage.container().style.cursor = 'grab'
                                }}
                            />
                        ))}

                        {/* Rotation handle */}
                        <Line
                            points={[0, -height / 2 - handleOffset - handleRadius, 0, -rotateDistance + handleRadius]}
                            stroke="#3b82f6"
                            strokeWidth={1}
                            listening={false}
                        />
                        <Circle
                            x={0}
                            y={-rotateDistance}
                            radius={handleRadius}
                            fill="#fff"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            draggable={!isLocked}
                            onDragStart={(e) => { e.cancelBubble = true }}
                            onDragMove={handleRotateDrag}
                            onDragEnd={(e) => { e.cancelBubble = true }}
                            onMouseEnter={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                            onMouseLeave={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'default'
                            }}
                            onMouseDown={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grabbing'
                            }}
                            onMouseUp={(e) => {
                                const stage = e.target.getStage()
                                if (stage) stage.container().style.cursor = 'grab'
                            }}
                        />
                    </>
                )}
            </Group>
        )
    }

    if (obj.type === 'line') {
        // Lines: x,y is start endpoint, endX,endY is end endpoint
        // UI displays the MIDPOINT as X,Y (calculated, not stored)
        // height = stroke width, angle = rotation (0° = horizontal/right)
        const startX = obj.x
        const startY = obj.y
        const endX = obj.endX ?? (obj.x + 50)
        const endY = obj.endY ?? obj.y  // Default horizontal line
        const strokeWidth = obj.height ?? 6
        const opacity = (100 - (obj.transparency ?? 0)) / 100

        // Helper: Calculate angle from endpoints (0° = horizontal/right, positive = clockwise)
        const calculateAngleFromEndpoints = (sx: number, sy: number, ex: number, ey: number): number => {
            const dx = ex - sx
            const dy = ey - sy
            // atan2(dy, dx) gives angle from positive X axis (horizontal right)
            // Positive Y goes down in screen coords, so positive dy = clockwise rotation
            let angle = Math.atan2(dy, dx) * (180 / Math.PI)  // No negation: positive = clockwise
            return Math.round(angle)
        }

        // Refs for the Lines so we can update them during drag
        const lineRef = useRef<Konva.Line>(null)
        const outlineRef = useRef<Konva.Line>(null)

        // Special drag handler for lines - we need to move both start and end points
        // Only update on drag end to avoid exponential drift
        const handleLineDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
            const { updateObject, gridSize, showGrid } = useEditorStore.getState() // Get grid settings
            let deltaX = e.target.x()
            let deltaY = e.target.y()

            // Reset drag position and update both points, clamped to bounds
            e.target.x(0)
            e.target.y(0)

            // Calculate new positions
            let newStartX = clampX(startX + deltaX)
            let newStartY = clampY(startY + deltaY)
            let newEndX = clampX(endX + deltaX)
            let newEndY = clampY(endY + deltaY)

            // Apply grid snapping if enabled
            if (showGrid && gridSize > 0) {
                // Snap the start point, and maintain relative distance for end point
                // Or snap both? Snapping both ensures alignment.
                // Let's snap both points individually to the grid
                newStartX = clampX(Math.round(newStartX / gridSize) * gridSize)
                newStartY = clampY(Math.round(newStartY / gridSize) * gridSize)
                newEndX = clampX(Math.round(newEndX / gridSize) * gridSize)
                newEndY = clampY(Math.round(newEndY / gridSize) * gridSize)
            }

            // Calculate angle from new endpoints
            const newAngle = calculateAngleFromEndpoints(newStartX, newStartY, newEndX, newEndY)

            updateObject(obj.id, {
                x: newStartX,
                y: newStartY,
                endX: newEndX,
                endY: newEndY,
                angle: newAngle
            })
        }

        // Handler for dragging the start point handle
        const handleStartPointDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true // Stop propagation to parent Group
            const { updateObject, gridSize, showGrid } = useEditorStore.getState()

            let newX = clampX(e.target.x())
            let newY = clampY(e.target.y())

            if (showGrid && gridSize > 0) {
                newX = clampX(Math.round(newX / gridSize) * gridSize)
                newY = clampY(Math.round(newY / gridSize) * gridSize)
            }

            e.target.x(newX)
            e.target.y(newY)

            // Calculate new angle from updated start point
            const newAngle = calculateAngleFromEndpoints(newX, newY, endX, endY)

            updateObject(obj.id, { x: newX, y: newY, angle: newAngle })
        }

        // Update Line and selection outline visually during start point drag
        const handleStartPointDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true

            // Clamp to bounds (no grid snap during drag)
            const newStartX = clampX(e.target.x())
            const newStartY = clampY(e.target.y())

            // Update visual position of handle
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
            const { updateObject, gridSize, showGrid } = useEditorStore.getState()

            let newX = clampX(e.target.x())
            let newY = clampY(e.target.y())

            if (showGrid && gridSize > 0) {
                newX = clampX(Math.round(newX / gridSize) * gridSize)
                newY = clampY(Math.round(newY / gridSize) * gridSize)
            }

            e.target.x(newX)
            e.target.y(newY)

            // Calculate new angle from updated end point
            const newAngle = calculateAngleFromEndpoints(startX, startY, newX, newY)

            updateObject(obj.id, { endX: newX, endY: newY, angle: newAngle })
        }

        // Update Line and selection outline visually during end point drag
        const handleEndPointDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true

            // Clamp to bounds (no grid snap during drag)
            const newEndX = clampX(e.target.x())
            const newEndY = clampY(e.target.y())

            // Update visual position of handle
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
                draggable={!isLocked}
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
                            draggable={!isLocked}
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
                            draggable={!isLocked}
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

    // Special handling for linear_knockback - grid of icons
    if (obj.type === 'linear_knockback' && image) {
        const hCount = obj.horizontalCount ?? 1
        const vCount = obj.verticalCount ?? 1
        const spacing = size * 0.91 // Overlap slightly

        // Calculate total bounding box dimensions
        const totalWidth = size + spacing * (hCount - 1)
        const totalHeight = size + spacing * (vCount - 1)

        const images: React.ReactNode[] = []
        for (let row = 0; row < vCount; row++) {
            for (let col = 0; col < hCount; col++) {
                const offsetX = (col - (hCount - 1) / 2) * spacing
                const offsetY = (row - (vCount - 1) / 2) * spacing
                images.push(
                    <KonvaImage
                        key={`${row}-${col}`}
                        image={image}
                        x={offsetX}
                        y={offsetY}
                        width={size}
                        height={size}
                        offsetX={size / 2}
                        offsetY={size / 2}
                        opacity={(100 - (obj.transparency ?? 0)) / 100}
                    />
                )
            }
        }

        return (
            <Group
                x={obj.x}
                y={obj.y}
                draggable={!isLocked}
                dragBoundFunc={dragBoundFunc}
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
                rotation={obj.angle ?? 0}
            >
                {images}
                {isSelected && renderSelectionHandles(totalWidth, totalHeight)}
            </Group>
        )
    }

    // Special handling for line_stack - vertical repeat
    if (obj.type === 'line_stack' && image) {
        const displayCount = obj.displayCount ?? 1
        const spacing = size * 1.04 // Space slightly

        // Calculate total bounding box height
        const totalHeight = size + spacing * (displayCount - 1)

        const images: React.ReactNode[] = []
        for (let i = 0; i < displayCount; i++) {
            const offsetY = (i - (displayCount - 1) / 2) * spacing
            images.push(
                <KonvaImage
                    key={i}
                    image={image}
                    x={0}
                    y={offsetY}
                    width={size}
                    height={size}
                    offsetX={size / 2}
                    offsetY={size / 2}
                    opacity={(100 - (obj.transparency ?? 0)) / 100}
                />
            )
        }

        return (
            <Group
                x={obj.x}
                y={obj.y}
                draggable={!isLocked}
                dragBoundFunc={dragBoundFunc}
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
                rotation={obj.angle ?? 0}
            >
                {images}
                {isSelected && renderSelectionHandles(size, totalHeight)}
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
                draggable={!isLocked}
                dragBoundFunc={(pos) => ({ x: clampX(pos.x + size / 2) - size / 2, y: clampY(pos.y + size / 2) - size / 2 })}
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
            draggable={!isLocked}
            dragBoundFunc={dragBoundFunc}
            onDragEnd={handleDragEnd}
            onClick={onSelect}
            onTap={onSelect}
            rotation={obj.angle ?? 0}
        >
            {/* Only render content if not hidden */}
            {!isHidden && (
                <KonvaImage
                    image={image}
                    width={size}
                    height={size}
                    offsetX={size / 2}
                    offsetY={size / 2}
                    opacity={(100 - (obj.transparency ?? 0)) / 100}
                    scaleX={obj.horizontalFlip ? -1 : 1}
                    scaleY={obj.verticalFlip ? -1 : 1}
                />
            )}
            {isSelected && renderSelectionHandles(size)}
        </Group>
    )
}, (prevProps, nextProps) => {
    // Custom comparison for memo - only re-render if props actually changed
    if (prevProps.isSelected !== nextProps.isSelected) return false
    if (prevProps.onSelect !== nextProps.onSelect) return false
    if (prevProps.useSeparateDps !== nextProps.useSeparateDps) return false

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
        prevObj.endY === nextObj.endY &&
        prevObj.displayCount === nextObj.displayCount &&
        prevObj.horizontalCount === nextObj.horizontalCount &&
        prevObj.verticalCount === nextObj.verticalCount &&
        prevObj.verticalFlip === nextObj.verticalFlip &&
        prevObj.horizontalFlip === nextObj.horizontalFlip &&
        prevObj.hidden === nextObj.hidden &&
        prevObj.locked === nextObj.locked
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

// Grid layer component - draws grid lines (shows when gridSize > 0)
function GridLayer({ gridSize }: { gridSize: number }) {
    if (gridSize === 0) return null

    const lines: React.ReactNode[] = []
    const gridColor = 'rgba(255, 255, 255, 0.15)'

    // Vertical lines
    for (let x = gridSize; x < BOARD_WIDTH; x += gridSize) {
        lines.push(
            <Line
                key={`v-${x}`}
                points={[x, 0, x, BOARD_HEIGHT]}
                stroke={gridColor}
                strokeWidth={1}
                listening={false}
            />
        )
    }

    // Horizontal lines
    for (let y = gridSize; y < BOARD_HEIGHT; y += gridSize) {
        lines.push(
            <Line
                key={`h-${y}`}
                points={[0, y, BOARD_WIDTH, y]}
                stroke={gridColor}
                strokeWidth={1}
                listening={false}
            />
        )
    }

    return <>{lines}</>
}

export function EditorCanvas({ className = '' }: EditorCanvasProps) {
    const { board, selectedObjectId, selectObject, useSeparateDps, gridSize } = useEditorStore()
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

    // Handle drag over (needed to allow drop)
    const handleDragOver = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes('application/x-strat-board-object')) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
        }
    }

    // Handle drop - add object at drop position
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const objectType = e.dataTransfer.getData('application/x-strat-board-object')
        if (!objectType) return

        // Get drop position relative to container
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const dropX = e.clientX - rect.left
        const dropY = e.clientY - rect.top

        // Convert from screen pixels to canvas coordinates
        let canvasX = clampX(Math.round(dropX / scale))
        let canvasY = clampY(Math.round(dropY / scale))

        // Apply grid snap if enabled (Snap button is on AND gridSize is set)
        const { showGrid } = useEditorStore.getState()
        if (showGrid && gridSize > 0) {
            canvasX = clampX(Math.round(canvasX / gridSize) * gridSize)
            canvasY = clampY(Math.round(canvasY / gridSize) * gridSize)
        }

        // Add object at the drop position (pass x,y via props)
        const { addObject } = useEditorStore.getState()
        addObject(objectType, { x: canvasX, y: canvasY })
    }

    return (
        <div
            ref={containerRef}
            className={`relative ${className}`}
            style={{ aspectRatio: '4/3', width: '100%', overflow: 'hidden' }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Container that scales the fixed-size canvas */}
            <div style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: BOARD_WIDTH,
                height: BOARD_HEIGHT
            }}>
                <Stage
                    ref={stageRef}
                    width={BOARD_WIDTH}
                    height={BOARD_HEIGHT}
                    onClick={handleStageClick}
                    onTap={handleStageClick}
                    style={{
                        background: '#1a1a2e',
                        overflow: 'hidden'
                    }}
                >
                    {/* Background layer */}
                    <Layer>
                        <BackgroundLayer background={board.boardBackground} />
                        <GridLayer gridSize={gridSize} />
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
                                    useSeparateDps={useSeparateDps}
                                />
                            ))}
                        {/* Then render selected object on top for click priority */}
                        {selectedObjectId && board.objects.find(obj => obj.id === selectedObjectId) && (
                            <EditorObjectNode
                                key={selectedObjectId}
                                obj={board.objects.find(obj => obj.id === selectedObjectId)!}
                                isSelected={true}
                                onSelect={() => selectObject(selectedObjectId)}
                                useSeparateDps={useSeparateDps}
                            />
                        )}
                    </Layer>
                </Stage>
            </div>
        </div>
    )
}
