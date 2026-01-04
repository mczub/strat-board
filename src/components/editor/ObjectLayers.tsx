/**
 * ObjectLayers - Right panel showing layer list and background selector
 * 
 * Displays ordered list of all objects on board with drag-to-reorder capability.
 */

import { useState } from 'react'
import { useEditorStore, type EditorObject } from '@/stores/useEditorStore'
import { BACKGROUND_OPTIONS } from '@/lib/editorObjects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, GripVertical, Eye, EyeOff, Lock, Unlock } from 'lucide-react'
import { OBJECT_METADATA } from '@/lib/objectMetadata'

// DPS marker remapping: Unified (dps_1-4) <-> Separate (melee_1-2, ranged_dps_1-2)
const DPS_UNIFIED_TO_SEPARATE: Record<string, string> = {
    'dps_1': 'melee_1',
    'dps_2': 'melee_2',
    'dps_3': 'ranged_dps_1',
    'dps_4': 'ranged_dps_2',
}

const DPS_SEPARATE_TO_UNIFIED: Record<string, string> = {
    'melee_1': 'dps_1',
    'melee_2': 'dps_2',
    'ranged_dps_1': 'dps_3',
    'ranged_dps_2': 'dps_4',
}

// Get display type based on useSeparateDps setting
const getDisplayType = (type: string, useSeparateDps: boolean): string => {
    if (useSeparateDps) {
        return DPS_UNIFIED_TO_SEPARATE[type] || type
    } else {
        return DPS_SEPARATE_TO_UNIFIED[type] || type
    }
}

interface ObjectLayersProps {
    className?: string
}

interface LayerItemProps {
    obj: EditorObject
    index: number
    total: number
    onDragStart: (index: number) => void
    onDragOver: (e: React.DragEvent, index: number) => void
    onDragEnd: () => void
    isDragging: boolean
    dragOverIndex: number | null
    useSeparateDps: boolean
}

function LayerItem({ obj, index, total, onDragStart, onDragOver, onDragEnd, isDragging, dragOverIndex, useSeparateDps }: LayerItemProps) {
    const { selectedObjectId, selectObject, deleteObject, reorderObject, updateObject } = useEditorStore()
    const isSelected = selectedObjectId === obj.id

    // Get display type - remaps DPS icons based on Unified/Separate setting
    const displayType = getDisplayType(obj.type, useSeparateDps)
    const iconSrc = `/icons/${displayType}.png`

    // Display index: first object = 1, last object = highest number
    const displayIndex = index + 1

    const handleMoveUp = () => {
        if (index > 0) {
            reorderObject(index, index - 1)
        }
    }

    const handleMoveDown = () => {
        if (index < total - 1) {
            reorderObject(index, index + 1)
        }
    }

    // Show drop indicator
    const showDropBefore = dragOverIndex === index && !isDragging
    const showDropAfter = dragOverIndex === index + 1 && index === total - 1 && !isDragging

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                onDragStart(index)
            }}
            onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                onDragOver(e, index)
            }}
            onDragEnd={onDragEnd}
            onClick={() => selectObject(obj.id)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${isSelected
                ? 'bg-primary/20 border border-primary/50'
                : 'hover:bg-muted/50 border border-transparent'
                } ${isDragging ? 'opacity-50' : ''}`}
            style={{
                borderTopColor: showDropBefore ? 'var(--primary)' : undefined,
                borderTopWidth: showDropBefore ? '2px' : undefined,
                borderBottomColor: showDropAfter ? 'var(--primary)' : undefined,
                borderBottomWidth: showDropAfter ? '2px' : undefined,
            }}
        >
            <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab flex-shrink-0" />
            <span className="text-xs text-muted-foreground w-4">{displayIndex}</span>
            <img
                src={iconSrc}
                alt={obj.type}
                className="w-5 h-5 object-contain flex-shrink-0"
                onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                }}
            />
            <span className="flex-1 text-sm truncate">
                {obj.text ? obj.text : OBJECT_METADATA[displayType]?.displayName}
            </span>
            <div className="flex items-center gap-0.5">
                <button
                    onClick={(e) => { e.stopPropagation(); updateObject(obj.id, { hidden: obj.hidden ? 0 : 1 }) }}
                    className={`p-0.5 hover:bg-muted rounded ${obj.hidden ? 'text-muted-foreground' : ''}`}
                    title={obj.hidden ? 'Show' : 'Hide'}
                >
                    {obj.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); updateObject(obj.id, { locked: obj.locked ? 0 : 1 }) }}
                    className={`p-0.5 hover:bg-muted rounded ${obj.locked ? 'text-primary' : ''}`}
                    title={obj.locked ? 'Unlock' : 'Lock'}
                >
                    {obj.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleMoveUp() }}
                    disabled={index === 0}
                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                    title="Move up"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M6 3L2 7h8L6 3z" />
                    </svg>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleMoveDown() }}
                    disabled={index === total - 1}
                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                    title="Move down"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M6 9L10 5H2l4 4z" />
                    </svg>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); deleteObject(obj.id) }}
                    className="p-0.5 hover:bg-destructive/20 hover:text-destructive rounded"
                    title="Delete"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        </div>
    )
}

export function ObjectLayers({ className = '' }: ObjectLayersProps) {
    const { board, setBackground, reorderObject, useSeparateDps } = useEditorStore()
    const objectCount = board.objects.length

    // Drag state
    const [dragIndex, setDragIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

    const handleDragStart = (index: number) => {
        setDragIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        if (dragIndex === null) return

        // Calculate if we're in the top or bottom half of the item
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const isAboveMid = e.clientY < midY

        setDragOverIndex(isAboveMid ? index : index + 1)
    }

    const handleDragEnd = () => {
        if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex && dragIndex !== dragOverIndex - 1) {
            // Adjust target index since we're inserting at a position, not swapping
            const targetIndex = dragOverIndex > dragIndex ? dragOverIndex - 1 : dragOverIndex
            reorderObject(dragIndex, targetIndex)
        }
        setDragIndex(null)
        setDragOverIndex(null)
    }

    return (
        <Card className={`bg-card/50 border-border ${className}`}>
            <CardHeader className="px-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Object Layers</span>
                    <span className="text-xs font-normal text-muted-foreground">
                        {objectCount}/50
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 space-y-3">
                {/* Background Selector */}
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Background</label>
                    <select
                        value={board.boardBackground}
                        onChange={(e) => setBackground(e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-border bg-background text-sm"
                    >
                        {BACKGROUND_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Object List */}
                <div
                    className="space-y-0.5 max-h-[calc(100vh-27rem)] overflow-y-auto"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDragEnd}
                >
                    {board.objects.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            No objects added yet
                        </p>
                    ) : (
                        board.objects.map((obj, idx) => (
                            <LayerItem
                                key={obj.id}
                                obj={obj}
                                index={idx}
                                total={board.objects.length}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragEnd={handleDragEnd}
                                isDragging={dragIndex === idx}
                                dragOverIndex={dragOverIndex}
                                useSeparateDps={useSeparateDps}
                            />
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
