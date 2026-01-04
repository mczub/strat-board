/**
 * ObjectParameters - Bottom panel for editing object properties
 * 
 * Dynamically renders parameter controls based on object metadata.
 */

import React from 'react'
import { useEditorStore } from '@/stores/useEditorStore'
import { getObjectMetadata, OBJECT_METADATA, type ParameterType } from '@/lib/objectMetadata'
import { VALID_COLORS } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface ObjectParametersProps {
    className?: string
}

// Slider component for numeric parameters with editable input
// Uses RAF throttling to limit store updates while maintaining smooth visual feedback
function ParameterSlider({
    label,
    value,
    min,
    max,
    step = 1,
    onChange
}: {
    label: string
    value: number
    min: number
    max: number
    step?: number
    onChange: (value: number) => void
}) {
    // Local state for immediate visual feedback
    const [localValue, setLocalValue] = React.useState(value)
    const rafRef = React.useRef<number | null>(null)
    const pendingValueRef = React.useRef<number | null>(null)

    // Sync local value when external value changes (e.g., undo/redo or initial load)
    React.useEffect(() => {
        setLocalValue(value)
    }, [value])

    // Cleanup RAF on unmount
    React.useEffect(() => {
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [])

    // Throttled onChange that batches updates to next animation frame
    const throttledOnChange = React.useCallback((newValue: number) => {
        setLocalValue(newValue) // Immediate visual update
        pendingValueRef.current = newValue

        if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null
                if (pendingValueRef.current !== null) {
                    onChange(pendingValueRef.current)
                    pendingValueRef.current = null
                }
            })
        }
    }, [onChange])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value)
        if (!isNaN(newValue)) {
            // Clamp value to min/max
            throttledOnChange(Math.max(min, Math.min(max, newValue)))
        }
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
                <label className="text-sm text-muted-foreground">{label}</label>
                <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={localValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        // Stop Delete/Backspace from propagating to global handler
                        if (e.key === 'Delete' || e.key === 'Backspace') {
                            e.stopPropagation()
                        }
                    }}
                    className="w-16 h-7 px-2 text-sm text-right bg-muted border border-border rounded tabular-nums"
                />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={localValue}
                onChange={(e) => throttledOnChange(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
        </div>
    )
}

// Color picker component - shows all valid colors in 8x7 grid
function ColorPicker({
    value,
    onChange
}: {
    value: { r: number, g: number, b: number }
    onChange: (r: number, g: number, b: number) => void
}) {
    // Find current color index in palette
    const currentIdx = VALID_COLORS.findIndex(c => {
        const match = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (!match) return false
        return parseInt(match[1]) === value.r && parseInt(match[2]) === value.g && parseInt(match[3]) === value.b
    })

    return (
        <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Color</label>
            <div className="grid grid-cols-8 gap-0.5 mt-2 w-fit">
                {VALID_COLORS.map((color, idx) => {
                    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
                    if (!match) return null
                    const r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3])
                    return (
                        <button
                            key={idx}
                            onClick={() => onChange(r, g, b)}
                            className={`w-5 h-5 rounded-sm border ${currentIdx === idx ? 'border-white ring-1 ring-white' : 'border-border/50'}`}
                            style={{ backgroundColor: color }}
                            title={`Color ${idx + 1}`}
                        />
                    )
                })}
            </div>
        </div>
    )
}

export function ObjectParameters({ className = '' }: ObjectParametersProps) {
    const { board, selectedObjectId, updateObject } = useEditorStore()

    // Find selected object
    const selectedObject = selectedObjectId
        ? board.objects.find(obj => obj.id === selectedObjectId)
        : null

    if (!selectedObject) {
        return (
            <Card className={`bg-card/50 border-border ${className}`}>
                <CardContent className="py-3 px-4">
                    <p className="text-sm text-muted-foreground text-center">
                        Select an object to edit its parameters
                    </p>
                </CardContent>
            </Card>
        )
    }

    const metadata = getObjectMetadata(selectedObject.type)
    const params = metadata.parameters

    // Calculate bounding box center for fan_aoe or donut arc
    // Returns the offset from arc start point (0, -radius) to bounding box center
    const calcBboxCenter = (arcAngle: number, radius: number, innerRadius?: number) => {
        const arcAngleRad = (arcAngle * Math.PI) / 180
        const startAngleRad = -Math.PI / 2
        const endAngleRad = startAngleRad + arcAngleRad

        // Calculate bounding box extremes
        let minX = 0, maxX = 0, minY = -radius, maxY = 0
        const endX = radius * Math.cos(endAngleRad)
        const endY = radius * Math.sin(endAngleRad)
        minX = Math.min(0, endX)
        maxX = Math.max(0, endX)
        maxY = Math.max(0, endY)

        if (endAngleRad > 0) { maxX = radius }
        if (endAngleRad > Math.PI / 2) { maxY = radius }
        if (endAngleRad > Math.PI) { minX = -radius }

        // For donut, adjust minY if inner radius is smaller
        if (innerRadius !== undefined) {
            minY = Math.min(-radius, -innerRadius)
        }

        return {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2
        }
    }

    // Handler helpers
    const handleNumericChange = (param: string, value: number, config: { min?: number, max?: number }) => {
        const clamped = Math.max(config.min ?? 0, Math.min(config.max ?? 9999, value))
        updateObject(selectedObject.id, { [param]: clamped })
    }

    // Special handler for arcAngle changes that also updates x,y position
    // This keeps the arc start point (top of circle) fixed while bounding box center moves
    const handleArcAngleChange = (newArcAngle: number, config: { min?: number, max?: number }) => {
        const clamped = Math.max(config.min ?? 0, Math.min(config.max ?? 360, newArcAngle))
        const oldArcAngle = selectedObject.arcAngle ?? 90

        // Get radius based on object type
        const scale = (selectedObject.size ?? 100) / 100
        const baseSize = metadata.baseSize
        const radius = baseSize * scale
        const innerRadius = selectedObject.type === 'donut'
            ? (selectedObject.donutRadius ?? 50) * scale
            : undefined

        // Calculate old and new bounding box centers
        const oldCenter = calcBboxCenter(oldArcAngle, radius, innerRadius)
        const newCenter = calcBboxCenter(clamped, radius, innerRadius)

        // The arc start point should stay fixed, so we need to adjust x,y
        // Old position: arcStart = (x - oldCenter.x, y - oldCenter.y + radius) -> fixed point
        // New position: arcStart = (newX - newCenter.x, newY - newCenter.y + radius)
        // To keep arcStart fixed: newX = x + (newCenter.x - oldCenter.x), newY = y + (newCenter.y - oldCenter.y)
        const deltaX = newCenter.x - oldCenter.x
        const deltaY = newCenter.y - oldCenter.y

        updateObject(selectedObject.id, {
            arcAngle: clamped,
            x: selectedObject.x + deltaX,
            y: selectedObject.y + deltaY
        })
    }

    const handleTextChange = (text: string) => {
        updateObject(selectedObject.id, { text: text.slice(0, 30) })
    }

    const handleColorChange = (r: number, g: number, b: number) => {
        updateObject(selectedObject.id, { colorR: r, colorG: g, colorB: b })
    }

    // Render parameter controls based on metadata
    const renderParameter = (paramType: ParameterType) => {
        const config = params[paramType]
        if (!config) return null

        const label = config.label ?? paramType.charAt(0).toUpperCase() + paramType.slice(1)

        switch (paramType) {
            case 'text':
                return (
                    <div key={paramType} className="col-span-2 space-y-1">
                        <label className="text-sm text-muted-foreground">Text (max 30)</label>
                        <Input
                            type="text"
                            value={selectedObject.text || ''}
                            onChange={(e) => handleTextChange(e.target.value)}
                            onKeyDown={(e) => {
                                // Stop Delete/Backspace from propagating to global handler
                                if (e.key === 'Delete' || e.key === 'Backspace') {
                                    e.stopPropagation()
                                }
                            }}
                            maxLength={30}
                            className="h-8"
                        />
                    </div>
                )

            case 'color':
                return (
                    <div key={paramType} className="col-span-2">
                        <ColorPicker
                            value={{
                                r: selectedObject.colorR ?? 255,
                                g: selectedObject.colorG ?? 255,
                                b: selectedObject.colorB ?? 255
                            }}
                            onChange={handleColorChange}
                        />
                    </div>
                )

            case 'size':
            case 'angle':
            case 'transparency':
            case 'width':
            case 'height':
            case 'donutRadius':
            case 'displayCount':
            case 'horizontalCount':
            case 'verticalCount':
                return (
                    <ParameterSlider
                        key={paramType}
                        label={label}
                        value={(selectedObject as any)[paramType] ?? 0}
                        min={config.min ?? 0}
                        max={config.max ?? 100}
                        step={config.step ?? 1}
                        onChange={(v) => handleNumericChange(paramType, v, config)}
                    />
                )

            case 'arcAngle':
                // Use special handler for fan_aoe and donut to adjust position
                if (selectedObject.type === 'fan_aoe' || selectedObject.type === 'donut') {
                    return (
                        <ParameterSlider
                            key={paramType}
                            label={label}
                            value={(selectedObject as any)[paramType] ?? config.default ?? 90}
                            min={config.min ?? 10}
                            max={config.max ?? 360}
                            step={config.step ?? 10}
                            onChange={(v) => handleArcAngleChange(v, config)}
                        />
                    )
                }
                // Fallback for other types
                return (
                    <ParameterSlider
                        key={paramType}
                        label={label}
                        value={(selectedObject as any)[paramType] ?? config.default ?? 0}
                        min={config.min ?? 0}
                        max={config.max ?? 100}
                        step={config.step ?? 1}
                        onChange={(v) => handleNumericChange(paramType, v, config)}
                    />
                )

            case 'verticalFlip':
            case 'horizontalFlip':
                const isHorizontal = paramType === 'horizontalFlip'
                const flipValue = (selectedObject as any)[paramType] ?? 0
                return (
                    <div key={paramType} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            {isHorizontal ? 'Flip Horizontal' : 'Flip Vertical'}
                        </span>
                        <button
                            onClick={() => updateObject(selectedObject.id, { [paramType]: flipValue ? 0 : 1 })}
                            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${flipValue
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-transparent border-border hover:bg-muted'
                                }`}
                        >
                            {flipValue ? 'Flipped' : 'Normal'}
                        </button>
                    </div>
                )

            default:
                return null
        }
    }

    // Ordered list of parameters to show
    const paramOrder: ParameterType[] = [
        'text', 'size', 'width', 'height', 'arcAngle', 'donutRadius',
        'angle', 'transparency', 'color',
        'displayCount', 'horizontalCount', 'verticalCount'
    ]

    const activeParams = paramOrder.filter(p => p in params)

    return (
        <Card className={`bg-card/50 border-border ${className}`}>
            <CardContent className="py-3 px-4">
                <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img
                                src={`/icons/${selectedObject.type}.png`}
                                alt={OBJECT_METADATA[selectedObject.type]?.displayName}
                                className="w-6 h-6 object-contain"
                            />
                            <span className="text-sm font-medium capitalize">
                                {OBJECT_METADATA[selectedObject.type]?.displayName}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">X:</label>
                            <Input
                                type="number"
                                value={Math.round(selectedObject.x)}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value)
                                    if (!isNaN(val)) {
                                        updateObject(selectedObject.id, { x: Math.max(0, Math.min(512, val)) })
                                    }
                                }}
                                className="h-6 w-16 text-xs px-1"
                                min={0}
                                max={512}
                            />
                            <label className="text-xs text-muted-foreground">Y:</label>
                            <Input
                                type="number"
                                value={Math.round(selectedObject.y)}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value)
                                    if (!isNaN(val)) {
                                        updateObject(selectedObject.id, { y: Math.max(0, Math.min(384, val)) })
                                    }
                                }}
                                className="h-6 w-16 text-xs px-1"
                                min={0}
                                max={384}
                            />
                            {/* Flip buttons - show if object supports them */}
                            {'verticalFlip' in params && (
                                <button
                                    onClick={() => updateObject(selectedObject.id, { verticalFlip: selectedObject.verticalFlip ? 0 : 1 })}
                                    title="Flip Vertical"
                                    className={`h-6 px-2 text-xs rounded border transition-colors ${selectedObject.verticalFlip
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-transparent border-border hover:bg-muted'
                                        }`}
                                >
                                    ↕
                                </button>
                            )}
                            {'horizontalFlip' in params && (
                                <button
                                    onClick={() => updateObject(selectedObject.id, { horizontalFlip: selectedObject.horizontalFlip ? 0 : 1 })}
                                    title="Flip Horizontal"
                                    className={`h-6 px-2 text-xs rounded border transition-colors ${selectedObject.horizontalFlip
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-transparent border-border hover:bg-muted'
                                        }`}
                                >
                                    ↔
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Parameter controls */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {activeParams.map(renderParameter)}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
