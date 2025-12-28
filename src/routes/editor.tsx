/**
 * Editor Page - In-browser strategy board editor
 * Route: /editor
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
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
    ExternalLink
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
    const { board, setName, clearBoard, exportCode, loadFromCode } = useEditorStore()
    const [exportedCode, setExportedCode] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [importCode, setImportCode] = useState('')
    const [importError, setImportError] = useState<string | null>(null)

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

    return (
        <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
            {/* Header */}
            <div className="border-b border-border bg-card/30 px-4 py-2">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Back</span>
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <Input
                                value={board.name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Board Name"
                                className="h-8 w-40 sm:w-56"
                            />
                        </div>
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

            {/* Main Editor Layout */}
            <div className="flex-1 p-2 sm:p-4">
                <div className="max-w-7xl mx-auto h-full">
                    {/* Desktop: 3-column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-3 h-full">
                        {/* Left Panel - Object List */}
                        <div className="order-2 lg:order-1">
                            <ObjectList className="h-full" />
                        </div>

                        {/* Center - Canvas */}
                        <div className="order-1 lg:order-2 space-y-3">
                            <Card className="bg-card/50 border-border overflow-hidden">
                                <CardContent className="p-2">
                                    <EditorCanvas />
                                </CardContent>
                            </Card>

                            {/* Object Parameters */}
                            <ObjectParameters />

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
                        <div className="order-3">
                            <ObjectLayers className="h-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
