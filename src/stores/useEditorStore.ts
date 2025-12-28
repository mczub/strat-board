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
}

// Board dimensions
const BOARD_WIDTH = 512
const BOARD_HEIGHT = 384
const MAX_OBJECTS = 50

export const useEditorStore = create<EditorState>((set, get) => ({
    // Initial state
    board: {
        name: '',
        boardBackground: 'checkered_circle',
        objects: [],
    },
    selectedObjectId: null,
    activeTab: 0,

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
            board: {
                ...state.board,
                boardBackground: bg,
            },
        }))
    },

    // Set board name
    setName: (name) => {
        set((state) => ({
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

            // Convert to EditorObjects with IDs
            const objects: EditorObject[] = decoded.objects.map((obj) => ({
                ...obj,
                id: nanoid(8),
            }))

            set({
                board: {
                    name: decoded.name || '',
                    boardBackground: decoded.boardBackground || 'checkered_circle',
                    objects,
                },
                selectedObjectId: null,
            })
            return true
        } catch (e) {
            console.error('Failed to decode board:', e)
            return false
        }
    },

    // Clear board
    clearBoard: () => {
        set({
            board: {
                name: '',
                boardBackground: 'checkered_circle',
                objects: [],
            },
            selectedObjectId: null,
        })
    },

    // Get currently selected object
    getSelectedObject: () => {
        const state = get()
        if (!state.selectedObjectId) return null
        return state.board.objects.find((obj) => obj.id === state.selectedObjectId) || null
    },
}))
