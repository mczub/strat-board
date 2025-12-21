/**
 * Bundle Editor Route
 * Route: /b
 * 
 * Allows users to create bundles of up to 10 strat board codes with live previews
 * Also serves as parent for /b/$shareCode which renders via Outlet
 */

import { createFileRoute, Link, Outlet, useMatch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { decode } from 'xiv-strat-board'
import type { StrategyBoard } from 'xiv-strat-board'
import { StrategyBoardRenderer } from '@/components/StrategyBoardRenderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Link as LinkIcon, Trash2, Loader2, Check, Copy } from 'lucide-react'
import { makeFullCode, extractCode } from '@/lib/bundleUtils'
import { createBundle } from './api.bundles'

export const Route = createFileRoute('/b')({
    component: BundleLayout,
    head: () => ({
        meta: [
            { title: 'Bundle Editor | FF14 Strategy Board' },
            { name: 'description', content: 'Create a bundle of FF14 strategy boards to share' },
        ],
    }),
})

// Layout component that renders either the editor or the child route
function BundleLayout() {
    // Check if we're on a child route by looking for shareCode param in any child
    const childMatch = useMatch({ from: '/b/$shareCode', shouldThrow: false })

    // If there's a child route match, render the Outlet (child route)
    if (childMatch) {
        return <Outlet />
    }

    // Otherwise render the editor
    return <BundleEditorPage />
}

const MAX_CODES = 10

interface BoardSlot {
    id: number
    code: string
    board: StrategyBoard | null
    error: string | null
}

function BundleEditorPage() {
    const [slots, setSlots] = useState<BoardSlot[]>([
        { id: 1, code: '', board: null, error: null }
    ])
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
    const [urlCopied, setUrlCopied] = useState(false)

    // Load codes from sessionStorage (for copy-to-new-bundle feature)
    useEffect(() => {
        const savedCodes = sessionStorage.getItem('bundle_codes')
        if (savedCodes) {
            sessionStorage.removeItem('bundle_codes')
            try {
                const codes = JSON.parse(savedCodes) as string[]
                const loadedSlots: BoardSlot[] = codes.map((code, i) => {
                    try {
                        const fullCode = makeFullCode(code.trim())
                        const board = decode(fullCode)
                        return { id: i + 1, code, board, error: null }
                    } catch (e) {
                        return {
                            id: i + 1,
                            code,
                            board: null,
                            error: e instanceof Error ? e.message : 'Invalid code'
                        }
                    }
                })
                if (loadedSlots.length > 0) {
                    setSlots(loadedSlots)
                }
            } catch {
                // Invalid JSON, ignore
            }
        }
    }, [])

    // Decode a code and update the slot
    const handleCodeChange = (id: number, value: string) => {
        setSlots(prev => prev.map(slot => {
            if (slot.id !== id) return slot

            const trimmed = value.trim()
            if (!trimmed) {
                return { ...slot, code: value, board: null, error: null }
            }

            try {
                const fullCode = makeFullCode(trimmed)
                const board = decode(fullCode)
                return { ...slot, code: value, board, error: null }
            } catch (e) {
                return {
                    ...slot,
                    code: value,
                    board: null,
                    error: e instanceof Error ? e.message : 'Invalid code'
                }
            }
        }))
        // Clear generated URL when codes change
        setGeneratedUrl(null)
    }

    // Add a new slot
    const addSlot = () => {
        if (slots.length >= MAX_CODES) return
        const maxId = Math.max(...slots.map(s => s.id))
        setSlots(prev => [...prev, { id: maxId + 1, code: '', board: null, error: null }])
    }

    // Remove a slot
    const removeSlot = (id: number) => {
        if (slots.length <= 1) return
        setSlots(prev => prev.filter(s => s.id !== id))
        setGeneratedUrl(null)
    }

    // Generate shareable URL
    const handleGenerate = async () => {
        const validCodes = slots
            .filter(s => s.board !== null)
            .map(s => extractCode(s.code.trim()))

        if (validCodes.length === 0) return

        setIsGenerating(true)
        try {
            const result = await createBundle({ data: { codes: validCodes } })
            const url = `${window.location.origin}/b/${result.shareCode}`
            setGeneratedUrl(url)
            // Don't navigate - let user copy URL first
        } catch (e) {
            console.error('Failed to create bundle:', e)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCopyUrl = async () => {
        if (!generatedUrl) return
        await navigator.clipboard.writeText(generatedUrl)
        setUrlCopied(true)
        setTimeout(() => setUrlCopied(false), 2000)
    }

    const validCount = slots.filter(s => s.board !== null).length
    // Check if any slot has content but is invalid
    const hasInvalidCodes = slots.some(s => s.code.trim() && s.error !== null)

    return (
        <div className="min-h-[calc(100vh-3.5rem)] py-8 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold">Bundle Editor</h1>
                            <p className="text-sm text-muted-foreground">
                                Add up to {MAX_CODES} strategy boards • {validCount} valid
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {generatedUrl ? (
                            <>
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono max-w-[300px] truncate">
                                    {generatedUrl}
                                </code>
                                <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                                    {urlCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                    Copy URL
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={handleGenerate}
                                disabled={validCount === 0 || hasInvalidCodes || isGenerating}
                                size="sm"
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                )}
                                Generate Link
                            </Button>
                        )}
                    </div>
                </div>

                {/* Board Slots Grid */}
                <div className="space-y-4">
                    {slots.map((slot, index) => (
                        <Card key={slot.id} className="bg-card/50 border-border">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">
                                        Board {index + 1}
                                        {slot.board?.name && (
                                            <span className="ml-2 text-muted-foreground font-normal">
                                                — {slot.board.name}
                                            </span>
                                        )}
                                    </CardTitle>
                                    {slots.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSlot(slot.id)}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Code Input */}
                                    <div className="space-y-2">
                                        <Textarea
                                            placeholder="[stgy:a...]"
                                            value={slot.code}
                                            onChange={(e) => handleCodeChange(slot.id, e.target.value)}
                                            className="font-mono text-sm min-h-[100px] resize-none"
                                        />
                                        {slot.error && (
                                            <p className="text-xs text-destructive">{slot.error}</p>
                                        )}
                                        {slot.board && (
                                            <p className="text-xs text-muted-foreground">
                                                {slot.board.objects.length} objects
                                            </p>
                                        )}
                                    </div>

                                    {/* Preview */}
                                    <div className="aspect-[4/3] bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center">
                                        {slot.board ? (
                                            <StrategyBoardRenderer
                                                board={slot.board}
                                                className="w-full h-full"
                                            />
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                {slot.code.trim() ? 'Invalid code' : 'Paste a code to preview'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Add Button */}
                {slots.length < MAX_CODES && (
                    <Button
                        variant="outline"
                        onClick={addSlot}
                        className="w-full mt-4 border-dashed"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Code ({slots.length}/{MAX_CODES})
                    </Button>
                )}
            </div>
        </div>
    )
}
