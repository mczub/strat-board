/**
 * Editor Store - State management for the strategy board editor
 * 
 * Manages board state, object selection, and all editor actions.
 */

import { create } from 'zustand'
import { encode, decode } from 'xiv-strat-board'
import type { StrategyBoard, StrategyObject } from 'xiv-strat-board'
import { nanoid } from 'nanoid'
import { getDefaultProperties } from '@/lib/objectMetadata'

// Extended object type with unique ID for editor
export interface EditorObject extends StrategyObject {
    id: string
}

// Board snapshot for history
interface BoardSnapshot {
    name: string
    boardBackground: string
    objects: EditorObject[]
}

// History limit
const MAX_HISTORY = 50

interface EditorState {
    // Board state
    board: {
        name: string
        boardBackground: string
        objects: EditorObject[]
    }

    // Selection state
    selectedObjectId: string | null
    activeTab: number // 0-4 for the 5 object tabs

    // Display settings
    useSeparateDps: boolean

    // Undo/Redo history
    past: BoardSnapshot[]
    future: BoardSnapshot[]

    // Actions
    addObject: (type: string, props?: Partial<StrategyObject>) => void
    updateObject: (id: string, updates: Partial<StrategyObject>) => void
    deleteObject: (id: string) => void
    selectObject: (id: string | null) => void
    moveObject: (id: string, x: number, y: number) => void
    reorderObject: (fromIndex: number, toIndex: number) => void
    setBackground: (bg: string) => void
    setName: (name: string) => void
    setActiveTab: (tab: number) => void
    exportCode: () => string
    loadFromCode: (code: string) => boolean
    clearBoard: () => void
    getSelectedObject: () => EditorObject | null
    setUseSeparateDps: (val: boolean) => void

    // Undo/Redo actions
    undo: () => void
    redo: () => void
    canUndo: () => boolean
    canRedo: () => boolean
}

// Board dimensions
const BOARD_WIDTH = 512
const BOARD_HEIGHT = 384
const MAX_OBJECTS = 50

// Helper to deep clone board for snapshot
const cloneBoard = (board: BoardSnapshot): BoardSnapshot => ({
    name: board.name,
    boardBackground: board.boardBackground,
    objects: board.objects.map(obj => ({ ...obj })),
})

export const useEditorStore = create<EditorState>((set, get) => ({
    // Initial state
    board: {
        name: '',
        boardBackground: 'checkered_circle',
        objects: [],
    },
    selectedObjectId: null,
    activeTab: 0,
    useSeparateDps: false,
    past: [],
    future: [],

    // Add a new object at canvas center
    addObject: (type, props = {}) => {
        const state = get()
        if (state.board.objects.length >= MAX_OBJECTS) {
            console.warn('Maximum object limit reached (50)')
            return
        }

        const defaultProps = getDefaultProperties(type)
        const centerX = BOARD_WIDTH / 2
        const centerY = BOARD_HEIGHT / 2

        // Special handling for lines - they need endX, endY
        const lineDefaults = type === 'line' ? {
            endX: centerX + 50,
            endY: centerY - 50
        } : {}

        const newObject: EditorObject = {
            id: nanoid(8),
            type,
            x: centerX,
            y: centerY,
            ...defaultProps,
            ...lineDefaults,
            ...props,
        }

        set((state) => ({
            past: [...state.past, cloneBoard(state.board)].slice(-MAX_HISTORY),
            future: [],
            board: {
                ...state.board,
                objects: [...state.board.objects, newObject],
            },
            selectedObjectId: newObject.id, // Auto-select new object
        }))
    },

    // Update object properties
    updateObject: (id, updates) => {
        set((state) => ({
            past: [...state.past, cloneBoard(state.board)].slice(-MAX_HISTORY),
            future: [],
            board: {
                ...state.board,
                objects: state.board.objects.map((obj) =>
                    obj.id === id ? { ...obj, ...updates } : obj
                ),
            },
        }))
    },

    // Delete an object
    deleteObject: (id) => {
        set((state) => ({
            past: [...state.past, cloneBoard(state.board)].slice(-MAX_HISTORY),
            future: [],
            board: {
                ...state.board,
                objects: state.board.objects.filter((obj) => obj.id !== id),
            },
            selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
        }))
    },

    // Select/deselect object
    selectObject: (id) => {
        set({ selectedObjectId: id })
    },

    // Move object to new position
    moveObject: (id, x, y) => {
        set((state) => ({
            past: [...state.past, cloneBoard(state.board)].slice(-MAX_HISTORY),
            future: [],
            board: {
                ...state.board,
                objects: state.board.objects.map((obj) =>
                    obj.id === id ? { ...obj, x: Math.round(x), y: Math.round(y) } : obj
                ),
            },
        }))
    },

    // Reorder object in layers (drag and drop)
    reorderObject: (fromIndex, toIndex) => {
        set((state) => {
            const objects = [...state.board.objects]
            const [moved] = objects.splice(fromIndex, 1)
            objects.splice(toIndex, 0, moved)
            return {
                past: [...state.past, cloneBoard(state.board)].slice(-MAX_HISTORY),
                future: [],
                board: {
                    ...state.board,
                    objects,
                },
            }
        })
    },

    // Set background
    setBackground: (bg) => {
        set((state) => ({
            past: [...state.past, cloneBoard(state.board)].slice(-MAX_HISTORY),
            future: [],
            board: {
                ...state.board,
                boardBackground: bg,
            },
        }))
    },

    // Set board name
    setName: (name) => {
        set((state) => ({
            past: [...state.past, cloneBoard(state.board)].slice(-MAX_HISTORY),
            future: [],
            board: {
                ...state.board,
                name,
            },
        }))
    },

    // Set active tab
    setActiveTab: (tab) => {
        set({ activeTab: tab })
    },

    // Export to share code
    exportCode: () => {
        const state = get()
        // Convert EditorObjects to StrategyObjects (strip id)
        const board: StrategyBoard = {
            name: state.board.name || 'Board',
            boardBackground: state.board.boardBackground,
            objects: state.board.objects.map(({ id, ...obj }) => obj),
        }
        try {
            return encode(board)
        } catch (e) {
            console.error('Failed to encode board:', e)
            return ''
        }
    },

    // Load from share code
    loadFromCode: (code) => {
        try {
            // Handle various code formats
            let fullCode = code.trim()
            if (fullCode.startsWith('stgy:')) {
                fullCode = `[${fullCode}]`
            } else if (fullCode.startsWith('[stgy:') && !fullCode.endsWith(']')) {
                fullCode = `${fullCode}]`
            }

            const decoded = decode(fullCode)
            console.log(decoded)

            // Helper to parse hex color to RGB
            const parseHexColor = (hex: string): { r: number, g: number, b: number } | null => {
                const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
                if (!match) return null
                return {
                    r: parseInt(match[1], 16),
                    g: parseInt(match[2], 16),
                    b: parseInt(match[3], 16)
                }
            }

            // Convert to EditorObjects with IDs, and convert hex color to RGB
            const objects: EditorObject[] = decoded.objects.map((obj) => {
                const editorObj: EditorObject = {
                    ...obj,
                    id: nanoid(8),
                }

                // If object has hex color string but no RGB components, convert it
                if (obj.color && typeof obj.color === 'string' &&
                    obj.colorR === undefined && obj.colorG === undefined && obj.colorB === undefined) {
                    const rgb = parseHexColor(obj.color)
                    if (rgb) {
                        editorObj.colorR = rgb.r
                        editorObj.colorG = rgb.g
                        editorObj.colorB = rgb.b
                    }
                }

                return editorObj
            })

            set((state) => ({
                past: [...state.past, cloneBoard(state.board)].slice(-MAX_HISTORY),
                future: [],
                board: {
                    name: decoded.name || '',
                    boardBackground: decoded.boardBackground || 'checkered_circle',
                    objects,
                },
                selectedObjectId: null,
            }))
            return true
        } catch (e) {
            console.error('Failed to decode board:', e)
            return false
        }
    },

    // Clear board
    clearBoard: () => {
        set((state) => ({
            past: [...state.past, cloneBoard(state.board)].slice(-MAX_HISTORY),
            future: [],
            board: {
                name: '',
                boardBackground: 'checkered_circle',
                objects: [],
            },
            selectedObjectId: null,
        }))
    },

    // Get currently selected object
    getSelectedObject: () => {
        const state = get()
        if (!state.selectedObjectId) return null
        return state.board.objects.find((obj) => obj.id === state.selectedObjectId) || null
    },

    // Toggle between unified and separate DPS display
    setUseSeparateDps: (val) => {
        set({ useSeparateDps: val })
    },

    // Undo - restore previous state
    undo: () => {
        const state = get()
        if (state.past.length === 0) return

        const previous = state.past[state.past.length - 1]
        const newPast = state.past.slice(0, -1)

        set({
            past: newPast,
            future: [cloneBoard(state.board), ...state.future],
            board: cloneBoard(previous),
            selectedObjectId: null, // Clear selection on undo
        })
    },

    // Redo - restore next state
    redo: () => {
        const state = get()
        if (state.future.length === 0) return

        const next = state.future[0]
        const newFuture = state.future.slice(1)

        set({
            past: [...state.past, cloneBoard(state.board)].slice(-MAX_HISTORY),
            future: newFuture,
            board: cloneBoard(next),
            selectedObjectId: null, // Clear selection on redo
        })
    },

    // Check if undo is available
    canUndo: () => get().past.length > 0,

    // Check if redo is available
    canRedo: () => get().future.length > 0,
}))
