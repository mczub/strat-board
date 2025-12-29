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
    Pencil
} from 'lucide-react'

export const Route = createFileRoute('/editor')({
    component: EditorPage,
    head: () => ({
        meta: [
            { title: 'Strategy Board Editor | board.wtfdig.info' },
            { name: 'description', content: 'Create and edit FF14 strategy boards in your browser' },
        ],
    }),
})

function EditorPage() {
    const { board, setName, clearBoard, exportCode, loadFromCode, useSeparateDps, setUseSeparateDps, undo, redo, canUndo, canRedo, selectObject } = useEditorStore()
    const [exportedCode, setExportedCode] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [importCode, setImportCode] = useState('')
    const [importError, setImportError] = useState<string | null>(null)

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
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [undo, redo, selectObject])

    const handleExport = () => {
        const code = exportCode()
        if (code) {
            setExportedCode(code)
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
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClear}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Clear</span>
                            </Button>
                            <Button variant="default" size="sm" onClick={handleExport}>
                                <Share2 className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Export</span>
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
                                className="h-8 w-40 sm:w-56"
                            />
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
                    {/* Desktop: 3-column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-3 h-full">
                        {/* Left Panel - Object List */}
                        <div className="order-2 lg:order-1" data-editor-interactive>
                            <ObjectList className="h-fit" />
                        </div>

                        {/* Center - Canvas */}
                        <div className="order-1 lg:order-2 space-y-3">
                            <Card className="bg-card/50 border-border overflow-hidden py-2" data-editor-interactive>
                                <CardContent className="p-2">
                                    <EditorCanvas />
                                </CardContent>
                            </Card>

                            {/* Object Parameters */}
                            <div data-editor-interactive>
                                <ObjectParameters />
                            </div>

                            {/* Export Result */}
                            {exportedCode && (
                                <Card className="bg-card/50 border-border">
                                    <CardContent className="py-3 px-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Share Code</span>
                                            <div className="flex gap-2">
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
                                                    Copy
                                                </Button>
                                                {viewCode && (
                                                    <Link
                                                        to="/$code"
                                                        params={{ code: encodeURIComponent(`stgy:${viewCode}`) }}
                                                        target="_blank"
                                                    >
                                                        <Button variant="outline" size="sm">
                                                            <ExternalLink className="w-4 h-4 mr-1" />
                                                            View
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                        <code className="block text-xs bg-muted p-2 rounded font-mono break-all max-h-20 overflow-y-auto">
                                            {exportedCode}
                                        </code>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Import Section */}
                            <Card className="bg-card/50 border-border">
                                <CardContent className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={importCode}
                                            onChange={(e) => {
                                                setImportCode(e.target.value)
                                                setImportError(null)
                                            }}
                                            placeholder="Paste share code to import..."
                                            className="flex-1 h-8 font-mono text-xs"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleImport}
                                            disabled={!importCode.trim()}
                                        >
                                            <Download className="w-4 h-4 mr-1" />
                                            Import
                                        </Button>
                                    </div>
                                    {importError && (
                                        <p className="text-xs text-destructive mt-2">{importError}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Panel - Object Layers */}
                        <div className="order-3" data-editor-interactive>
                            <ObjectLayers className="max-h-[calc(100vh-18rem)]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
