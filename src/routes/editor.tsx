/**
 * Editor Page - In-browser strategy board editor
 * Route: /editor
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useEditorStore } from '@/stores/useEditorStore'
import { EditorCanvas } from '@/components/editor/EditorCanvas'
import { ObjectList } from '@/components/editor/ObjectList'
import { ObjectLayers } from '@/components/editor/ObjectLayers'
import { ObjectParameters } from '@/components/editor/ObjectParameters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
    ArrowLeft,
    Share2,
    Copy,
    Check,
    Trash2,
    Download,
    ExternalLink,
    Users,
    Split,
    Undo,
    Redo,
    Pencil,
    Upload,
    Clipboard,
    ClipboardPaste,
    CopyPlus
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

// Search params type for the editor route
type EditorSearchParams = {
    code?: string
}

export const Route = createFileRoute('/editor')({
    component: EditorPage,
    validateSearch: (search: Record<string, unknown>): EditorSearchParams => {
        return {
            code: typeof search.code === 'string' ? search.code : undefined,
        }
    },
    head: () => ({
        meta: [
            { title: 'Strategy Board Editor | board.wtfdig.info' },
            { name: 'description', content: 'Create and edit FF14 strategy boards in your browser' },
        ],
    }),
})

function EditorPage() {
    const { code } = Route.useSearch()
    const { board, setName, clearBoard, exportCode, loadFromCode, useSeparateDps, setUseSeparateDps, undo, redo, canUndo, canRedo, selectObject, deleteObject, gridSize, setGridSize, showGrid, setShowGrid, copyObject, pasteObject, canPaste, selectedObjectId, duplicateObject } = useEditorStore()
    const [exportedCode, setExportedCode] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [importCode, setImportCode] = useState('')
    const [importError, setImportError] = useState<string | null>(null)
    const [showExportModal, setShowExportModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [hasLoadedFromUrl, setHasLoadedFromUrl] = useState(false)
    // Track mouse position for paste-at-cursor
    const [mouseOnCanvas, setMouseOnCanvas] = useState(false)
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)

    // Load board from URL code param on mount
    useEffect(() => {
        if (code && !hasLoadedFromUrl) {
            const success = loadFromCode(code)
            if (success) {
                setHasLoadedFromUrl(true)
            }
        }
    }, [code, hasLoadedFromUrl, loadFromCode])

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input field
            const activeElement = document.activeElement as HTMLElement
            const tagName = activeElement?.tagName?.toUpperCase()
            if (tagName === 'INPUT' || tagName === 'TEXTAREA' || activeElement?.isContentEditable) {
                return
            }

            // Ctrl+Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                undo()
            }
            // Ctrl+Y or Ctrl+Shift+Z for redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                redo()
            }
            // Escape to deselect
            if (e.key === 'Escape') {
                selectObject(null)
            }
            // Delete or Backspace to delete selected object
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const currentSelectedId = useEditorStore.getState().selectedObjectId
                if (currentSelectedId) {
                    e.preventDefault()
                    deleteObject(currentSelectedId)
                }
            }
            // Ctrl+C to copy selected object
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                const currentSelectedId = useEditorStore.getState().selectedObjectId
                if (currentSelectedId) {
                    e.preventDefault()
                    copyObject()
                }
            }
            // Ctrl+V to paste
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                if (useEditorStore.getState().clipboard) {
                    e.preventDefault()
                    // Paste at mouse position if on canvas, otherwise with offset
                    if (mouseOnCanvas && mousePosition) {
                        pasteObject(mousePosition.x, mousePosition.y)
                    } else {
                        pasteObject()
                    }
                }
            }
            // Ctrl+D to duplicate selected object
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                const currentSelectedId = useEditorStore.getState().selectedObjectId
                if (currentSelectedId) {
                    e.preventDefault()
                    duplicateObject()
                }
            }
            // Arrow keys to move selected object
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                const state = useEditorStore.getState()
                const selectedId = state.selectedObjectId
                if (!selectedId) return

                const obj = state.board.objects.find(o => o.id === selectedId)
                if (!obj || obj.locked) return // Don't move locked objects

                e.preventDefault()

                // Move distance: grid size if snap enabled, otherwise 1 unit
                const moveDistance = (state.showGrid && state.gridSize > 0) ? state.gridSize : 1

                let newX = obj.x
                let newY = obj.y

                switch (e.key) {
                    case 'ArrowUp': newY = Math.max(0, obj.y - moveDistance); break
                    case 'ArrowDown': newY = Math.min(384, obj.y + moveDistance); break
                    case 'ArrowLeft': newX = Math.max(0, obj.x - moveDistance); break
                    case 'ArrowRight': newX = Math.min(384, obj.x + moveDistance); break
                }

                state.updateObject(selectedId, { x: newX, y: newY })
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [undo, redo, selectObject, deleteObject, copyObject, pasteObject, duplicateObject, mouseOnCanvas, mousePosition])

    // Handler to update mouse position when on canvas
    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        const canvas = e.currentTarget.querySelector('canvas')
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        // Calculate scale factor (canvas is 512x384 but may be scaled)
        const scaleX = 512 / rect.width
        const scaleY = 384 / rect.height
        const x = Math.round((e.clientX - rect.left) * scaleX)
        const y = Math.round((e.clientY - rect.top) * scaleY)
        // Only update if within bounds
        if (x >= 0 && x <= 512 && y >= 0 && y <= 384) {
            setMousePosition({ x, y })
            setMouseOnCanvas(true)
        } else {
            setMouseOnCanvas(false)
        }
    }

    const handleCanvasMouseLeave = () => {
        setMouseOnCanvas(false)
    }

    // Handle copy button click
    const handleCopyObject = () => {
        copyObject()
    }

    // Handle paste button click
    const handlePasteObject = () => {
        if (mouseOnCanvas && mousePosition) {
            pasteObject(mousePosition.x, mousePosition.y)
        } else {
            pasteObject()
        }
    }

    const handleExport = () => {
        const code = exportCode()
        if (code) {
            setExportedCode(code)
            setShowExportModal(true)
        }
    }

    const handleCopy = async () => {
        if (!exportedCode) return
        await navigator.clipboard.writeText(exportedCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleImport = () => {
        if (!importCode.trim()) return
        const success = loadFromCode(importCode)
        if (success) {
            setImportCode('')
            setImportError(null)
            setShowImportModal(false)
        } else {
            setImportError('Invalid share code')
        }
    }

    const handleClear = () => {
        if (board.objects.length > 0 && !confirm('Clear all objects from the board?')) {
            return
        }
        clearBoard()
        setExportedCode(null)
    }

    // Get the URL-safe code for viewing
    const viewCode = exportedCode?.replace(/^\[|]$/g, '').replace('stgy:', '')

    // Handle clicks on the editor layout to deselect when clicking outside canvas/parameters
    const handleEditorClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        // Check if clicked inside protected areas (canvas, object parameters, object layers)
        if (target.closest('[data-editor-interactive]')) {
            return
        }
        selectObject(null)
    }

    return (
        <div className="min-h-[calc(100vh-15rem)] flex flex-col">
            {/* Header - Two Rows */}
            <div className="border-b border-border bg-card/30">
                {/* Top Row: Navigation and Actions */}
                <div className="px-4 py-2 border-b border-border/50">
                    <div className="max-w-[96rem] mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link to="/">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Back</span>
                                </Button>
                            </Link>
                            <h1 className="flex flex-row items-center gap-2 text-xl font-semibold"><Pencil className="w-6 h-6 text-primary" />editor</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
                                <Upload className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Import</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExport}>
                                <Share2 className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClear}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Clear</span>
                            </Button>

                        </div>
                    </div>
                </div>

                {/* Bottom Row: Toggles and Controls */}
                <div className="px-4 py-2">
                    <div className="max-w-[96rem] mx-auto flex items-center justify-between gap-4 flex-wrap">
                        {/* Left side: Board name input */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Name:</span>
                            <Input
                                value={board.name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Board Name"
                                maxLength={20}
                                className="h-8 w-40 sm:w-56"
                            />
                            <span className="text-xs text-muted-foreground">{board.name.length}/20</span>
                        </div>

                        {/* Right side: Toggles */}
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Undo/Redo Buttons */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={undo}
                                    disabled={!canUndo()}
                                    title="Undo (Ctrl+Z)"
                                    className="transition-colors"
                                >
                                    <Undo className="w-3.5 h-3.5" />
                                    Undo
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={redo}
                                    disabled={!canRedo()}
                                    title="Redo (Ctrl+Y)"
                                >
                                    <Redo className="w-3.5 h-3.5" />
                                    Redo
                                </Button>
                            </div>
                            {/* Copy/Paste Buttons */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyObject}
                                    disabled={!selectedObjectId}
                                    title="Copy Object (Ctrl+C)"
                                >
                                    <Clipboard className="w-3.5 h-3.5" />
                                    Copy
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePasteObject}
                                    disabled={!canPaste()}
                                    title="Paste Object (Ctrl+V)"
                                >
                                    <ClipboardPaste className="w-3.5 h-3.5" />
                                    Paste
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={duplicateObject}
                                    disabled={!selectedObjectId}
                                    title="Duplicate Object (Ctrl+D)"
                                >
                                    <CopyPlus className="w-3.5 h-3.5" />
                                    Duplicate
                                </Button>
                            </div>
                            {/* Grid Controls */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Grid</span>
                                <div className="flex items-center rounded-md border border-border overflow-hidden">
                                    <button
                                        onClick={() => setGridSize(0)}
                                        className={`px-2 py-1.5 text-xs transition-colors ${gridSize === 0
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-transparent hover:bg-muted'
                                            }`}
                                    >
                                        Off
                                    </button>
                                    {[8, 16, 32].map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setGridSize(size as 8 | 16 | 32)}
                                            className={`px-2 py-1.5 text-xs transition-colors ${gridSize === size
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-transparent hover:bg-muted'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowGrid(!showGrid)}
                                    disabled={gridSize === 0}
                                    className={`px-2 py-1.5 text-xs rounded-md border transition-colors ${gridSize === 0
                                        ? 'opacity-50 cursor-not-allowed bg-transparent border-border'
                                        : showGrid
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-transparent border-border hover:bg-muted'
                                        }`}
                                >
                                    Snap
                                </button>
                            </div>
                            {/* DPS Mode Toggle */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">DPS</span>
                                <div className="flex items-center rounded-md border border-border overflow-hidden">
                                    <button
                                        onClick={() => setUseSeparateDps(false)}
                                        className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${!useSeparateDps
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-transparent hover:bg-muted'
                                            }`}
                                    >
                                        <Users className="w-3.5 h-3.5" />
                                        Unified
                                    </button>
                                    <button
                                        onClick={() => setUseSeparateDps(true)}
                                        className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${useSeparateDps
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-transparent hover:bg-muted'
                                            }`}
                                    >
                                        <Split className="w-3.5 h-3.5" />
                                        Separate
                                    </button>
                                </div>
                            </div>



                        </div>
                    </div>
                </div>
            </div>

            {/* Main Editor Layout */}
            <div className="flex-1 p-2 sm:p-4" onClick={handleEditorClick}>
                <div className="max-w-[96rem] mx-auto h-full">
                    {/* 
                      Responsive Layout:
                      - >96rem (1536px): Full 3-column layout
                      - 80-96rem (1280-1536px): 3-column layout with scaled canvas
                      - <80rem (1280px): Stacked vertical layout
                      
                      Using CSS-only approach with single canvas to avoid Konva render issues
                    */}

                    {/* 
                      Responsive grid layout:
                      - xl+: 3-column layout [ObjectList | Canvas+Params | ObjectLayers]
                      - <xl: Single column with Canvas+Params, then ObjectList/ObjectLayers side-by-side
                    */}
                    <div className="grid gap-3 h-full xl:grid-cols-[240px_1fr_240px] 2xl:grid-cols-[320px_1fr_320px]">
                        {/* Object List - Left column on xl+, hidden on small (shown below) */}
                        <div className="hidden xl:block xl:order-1" data-editor-interactive>
                            <ObjectList className="h-fit" />
                        </div>

                        {/* Center column - Canvas + Parameters */}
                        <div className="space-y-3 order-1 xl:order-2">
                            <Card className="bg-card/50 border-border overflow-hidden py-2" data-editor-interactive>
                                <CardContent
                                    className="p-2 flex justify-center xl:block"
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseLeave={handleCanvasMouseLeave}
                                >
                                    <div className="w-full max-w-[540px] xl:max-w-none">
                                        <EditorCanvas />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Object Parameters */}
                            <div data-editor-interactive>
                                <ObjectParameters />
                            </div>

                            {/* Small screen only: ObjectList and ObjectLayers side-by-side */}
                            <div className="grid grid-cols-2 gap-3 xl:hidden">
                                <div data-editor-interactive>
                                    <ObjectList className="h-fit" />
                                </div>
                                <div data-editor-interactive>
                                    <ObjectLayers className="max-h-[50vh]" />
                                </div>
                            </div>
                        </div>

                        {/* Object Layers - Right column on xl+, hidden on small (shown above) */}
                        <div className="hidden xl:block xl:order-3" data-editor-interactive>
                            <ObjectLayers className="max-h-[calc(100vh-18rem)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Modal */}
            <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
                <DialogContent onClose={() => setShowExportModal(false)} className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Export Share Code</DialogTitle>
                        <DialogDescription>
                            Copy the share code below to share your board or view it online.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 p-6 pt-0">
                        <code className="block text-xs bg-muted p-3 rounded font-mono break-all max-h-32 overflow-y-auto">
                            {exportedCode}
                        </code>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 mr-1" />
                                ) : (
                                    <Copy className="w-4 h-4 mr-1" />
                                )}
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                            {viewCode && (
                                <Link
                                    to="/$code"
                                    params={{ code: encodeURIComponent(`stgy:${viewCode}`) }}
                                    target="_blank"
                                >
                                    <Button variant="default" size="sm">
                                        <ExternalLink className="w-4 h-4 mr-1" />
                                        View
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Import Modal */}
            < Dialog open={showImportModal} onOpenChange={setShowImportModal} >
                <DialogContent onClose={() => setShowImportModal(false)} className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Import Share Code</DialogTitle>
                        <DialogDescription>
                            Paste a share code to load a strategy board.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 p-6 pt-0">
                        <Input
                            value={importCode}
                            onChange={(e) => {
                                setImportCode(e.target.value)
                                setImportError(null)
                            }}
                            placeholder="Paste share code here..."
                            className="font-mono text-sm"
                        />
                        {importError && (
                            <p className="text-sm text-destructive">{importError}</p>
                        )}
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowImportModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleImport}
                                disabled={!importCode.trim()}
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Import
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >
        </div >
    )
}
