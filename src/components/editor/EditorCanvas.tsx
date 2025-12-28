/**
 * EditorCanvas - Main canvas component using React Konva
 * 
 * Renders objects on a 512x384 canvas with drag, selection, and rendering.
 */

import { Stage, Layer, Image as KonvaImage, Rect, Circle, Text, Line, Group, Shape, Ring } from 'react-konva'
import { useEditorStore, type EditorObject } from '@/stores/useEditorStore'
import { useEffect, useRef, useState } from 'react'
import Konva from 'konva'
import { OBJECT_METADATA } from '@/lib/objectMetadata'

// Board dimensions
const BOARD_WIDTH = 512
const BOARD_HEIGHT = 384

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
function EditorObjectNode({ obj, isSelected, onSelect }: {
    obj: EditorObject
    isSelected: boolean
    onSelect: () => void
}) {
    const { moveObject } = useEditorStore()
    const iconSrc = `/icons/${obj.type}.png`
    const image = useImage(iconSrc)

    // Calculate size
    const baseSize = getBaseSize(obj.type)
    const scale = (obj.size ?? 100) / 100
    const size = baseSize * scale

    // Handle drag end
    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        moveObject(obj.id, e.target.x(), e.target.y())
    }

    // Render based on type
    if (obj.type === 'text') {
        const textWidth = (obj.text?.length || 4) * 10 * scale
        const textHeight = 16 * scale
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
                    text={obj.text || 'Text'}
                    fontSize={16 * scale}
                    fill={`rgb(${obj.colorR ?? 255}, ${obj.colorG ?? 255}, ${obj.colorB ?? 255})`}
                    align="center"
                    offsetX={textWidth / 2}
                    offsetY={textHeight / 2}
                    opacity={(100 - (obj.transparency ?? 0)) / 100}
                />
                {isSelected && (
                    <Rect
                        x={-textWidth / 2 - 4}
                        y={-textHeight / 2 - 4}
                        width={textWidth + 8}
                        height={textHeight + 8}
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
                    fill={`rgba(${obj.colorR ?? 255}, ${obj.colorG ?? 128}, ${obj.colorB ?? 0}, 0.5)`}
                    stroke={`rgb(${obj.colorR ?? 255}, ${obj.colorG ?? 128}, ${obj.colorB ?? 0})`}
                    strokeWidth={2}
                    opacity={(100 - (obj.transparency ?? 0)) / 100}
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
        const endX = radius * Math.cos(endAngleRad)
        const endY = radius * Math.sin(endAngleRad)
        minX = Math.min(0, endX)
        maxX = Math.max(0, endX)
        maxY = Math.max(0, endY)

        if (endAngleRad > 0) { maxX = radius }
        if (endAngleRad > Math.PI / 2) { maxY = radius }
        if (endAngleRad > Math.PI) { minX = -radius }

        const bboxCenterX = (minX + maxX) / 2
        const bboxCenterY = (minY + maxY) / 2
        const bboxWidth = maxX - minX
        const bboxHeight = maxY - minY

        // The arc START point (0, -radius) should stay at a fixed screen position
        // x,y is bounding box center, so we offset from there to the cone tip
        const tipOffsetX = -bboxCenterX
        const tipOffsetY = -bboxCenterY

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
                        context.moveTo(tipOffsetX, tipOffsetY)
                        context.arc(tipOffsetX, tipOffsetY, radius, startAngle, endAngle, false)
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
                    fill={`rgba(${obj.colorR ?? 255}, ${obj.colorG ?? 128}, ${obj.colorB ?? 0}, 0.5)`}
                    stroke={`rgb(${obj.colorR ?? 255}, ${obj.colorG ?? 128}, ${obj.colorB ?? 0})`}
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
        const length = obj.height ?? 100
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
                <Line
                    points={[0, 0, 0, -length]}
                    stroke={`rgb(${obj.colorR ?? 255}, ${obj.colorG ?? 255}, ${obj.colorB ?? 255})`}
                    strokeWidth={3}
                    opacity={(100 - (obj.transparency ?? 0)) / 100}
                />
                {isSelected && (
                    <Rect
                        x={-4}
                        y={-length - 2}
                        width={8}
                        height={length + 4}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="transparent"
                        listening={false}
                    />
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
}

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
                const state = useEditorStore.getState()
                if (state.selectedObjectId) {
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

                {/* Objects layer - render in reverse so first object is on top */}
                <Layer>
                    {[...board.objects].reverse().map((obj) => (
                        <EditorObjectNode
                            key={obj.id}
                            obj={obj}
                            isSelected={selectedObjectId === obj.id}
                            onSelect={() => selectObject(obj.id)}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    )
}
