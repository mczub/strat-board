/**
 * Import Page - Convert raidplan.io plans to xiv-strat-board codes
 * Route: /import
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { encode, decode } from 'xiv-strat-board'
import type { StrategyBoard } from 'xiv-strat-board'
import { StrategyBoardRenderer } from '@/components/StrategyBoardRenderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Download, Loader2, Copy, Check, AlertCircle, ExternalLink, Info, Pencil } from 'lucide-react'
import { convertRaidplanToBoards, getConversionStats, type RaidplanData } from '@/lib/raidplanConverter'
import { fetchRaidplan } from './api.raidplan'

export const Route = createFileRoute('/import')({
    component: ImportPage,
    head: () => ({
        meta: [
            { title: 'import raidplan | board.wtfdig.info' },
            { name: 'description', content: 'Convert raidplan.io plans to FF14 strategy board share codes' },
        ],
    }),
})

interface ConversionResult {
    boards: StrategyBoard[]
    codes: string[]
    stats: {
        totalSteps: number
        totalNodes: number
        convertedObjects: number
        skippedNodes: number
    }
}

function ImportPage() {
    const [raidplanCode, setRaidplanCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<ConversionResult | null>(null)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

    // Extract raidplan code from URL or direct input
    const extractRaidplanCode = (input: string): string => {
        const trimmed = input.trim()

        // Handle full URLs like https://raidplan.io/plan/neaavy0C3cCT49zy
        const urlMatch = trimmed.match(/raidplan\.io\/plan\/([a-zA-Z0-9_-]+)/)
        if (urlMatch) {
            return urlMatch[1]
        }

        // Handle direct codes
        return trimmed
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setResult(null)

        const code = extractRaidplanCode(raidplanCode)
        if (!code) {
            setError('Please enter a raidplan code or URL')
            return
        }

        // Validate code format (alphanumeric, typically 16 chars)
        if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
            setError('Invalid raidplan code format')
            return
        }

        setIsLoading(true)

        try {
            // Fetch from raidplan API via server proxy (avoids CORS)
            const data = await fetchRaidplan({ data: { code } }) as unknown as RaidplanData

            // Convert to strategy boards
            const boards = convertRaidplanToBoards(data)
            const stats = getConversionStats(data, boards)

            // Encode each board to share code, then decode back to get the actual rendered version
            const codes: string[] = []
            const decodedBoards: StrategyBoard[] = []
            for (const board of boards) {
                try {
                    const shareCode = encode(board)
                    codes.push(shareCode)
                    // Decode the share code to get the board as it will actually render
                    const decodedBoard = decode(shareCode)
                    decodedBoards.push(decodedBoard)
                } catch (e) {
                    console.error('Failed to encode/decode board:', e)
                    codes.push('') // Empty string for failed encodes
                    decodedBoards.push(board) // Fall back to original board
                }
            }

            setResult({ boards: decodedBoards, codes, stats })
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to import raidplan')
        } finally {
            setIsLoading(false)
        }
    }

    const makeFullCode = (index: number) => {
        const code = result?.codes[index]
        if (!code) return
        if (code.startsWith('stgy:')) {
            return `[${code}]`
        } else if (code.startsWith('[stgy:')) {
            if (code.endsWith(']')) {
                return code
            } else {
                return `${code}]`
            }
        } else {
            return code
        }
    }

    const handleCopyCode = async (index: number) => {
        const code = result?.codes[index]
        if (!code) return

        await navigator.clipboard.writeText(code)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    const handleCopyAllCodes = async () => {
        if (!result) return
        const validCodes = result.codes.filter(c => c.length > 0)
        await navigator.clipboard.writeText(validCodes.join('\n\n'))
        setCopiedIndex(-1) // Use -1 to indicate "all"
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    return (
        <div className="md:min-h-[calc(100vh-9rem)] py-4 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                <span className="hidden md:inline">Back</span>
                            </Button>
                        </Link>
                        <div>
                            <h1 className="flex flex-row items-center gap-2 text-xl font-semibold">
                                <Download className="w-6 h-6 text-primary" />
                                import raidplan
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                convert raidplan.io plans to share codes
                            </p>
                        </div>
                    </div>
                </div>

                {/* Input Form */}
                <Card className="bg-card/50 border-border mb-6">
                    <CardHeader>
                        <CardTitle className="text-base">Raidplan Code or URL</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="neaavy0C3cCT49zy or https://raidplan.io/plan/..."
                                value={raidplanCode}
                                onChange={(e) => {
                                    setRaidplanCode(e.target.value)
                                    setError(null)
                                }}
                                className="flex-1 font-mono"
                                disabled={isLoading}
                            />
                            <Button type="submit" disabled={isLoading || !raidplanCode.trim()}>
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                Import
                            </Button>
                        </form>
                        {error && (
                            <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-3">
                            Paste a raidplan code or full URL. Each step will be converted to a separate board.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border-border mb-6">
                    <CardContent>
                        <div className="flex flex-col text-base gap-2">
                            <p className="flex flex-row items-center "><Info className="w-4 h-4 mr-2" /><span>Strategy boards are limited, so some Raidplan features will be lost or placed incorrectly in the conversion.</span></p>
                            <p className="flex flex-row items-center "><span>Make sure to double-check the generated boards in-game for accuracy.</span></p>
                            <ol className="text-muted-foreground list-disc list-inside text-sm">
                                <li>Objects outside the strategy board's aspect ratio will be cropped.</li>
                                <li>All text will be center-aligned and each line of text will be a separate object.</li>
                                <li>Text cannot be resized and is limited to 30 characters and 8 objects per board.</li>
                                <li>The only objects that can have non-default colors are lines and line AOEs.</li>
                                <li>Images, emoji, hand-drawn lines, and other status effects are not supported.</li>
                                <li>Objects may be placed incorrectly or render in an incorrect order.</li>
                                <li>Generated codes may not be able to be rendered in-game.</li>
                            </ol>

                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                {result && (
                    <>
                        {/* Stats Summary */}
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <div className="text-sm text-muted-foreground">
                                Converted {result.stats.convertedObjects} objects across {result.boards.length} steps
                                {result.stats.skippedNodes > 0 && (
                                    <span className="text-muted-foreground/60">
                                        {' '}({result.stats.skippedNodes} unsupported objects skipped)
                                    </span>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyAllCodes}
                            >
                                {copiedIndex === -1 ? (
                                    <Check className="w-4 h-4 mr-2" />
                                ) : (
                                    <Copy className="w-4 h-4 mr-2" />
                                )}
                                Copy All Codes
                            </Button>
                        </div>

                        {/* Board Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {result.boards.map((board, index) => (
                                <Card key={index} className="bg-card/50 border-border overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium">
                                                Step {index + 1}
                                                <span className="ml-2 text-muted-foreground font-normal text-xs">
                                                    {board.objects.length} objects
                                                </span>
                                            </CardTitle>
                                            {result.codes[index] && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopyCode(index)}
                                                        className="h-7 px-2"
                                                    >
                                                        {copiedIndex === index ? (
                                                            <Check className="w-3 h-3" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </Button>
                                                    <Link to="/editor" search={{ code: makeFullCode(index) }} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="ghost" size="sm" className="h-7 px-2">
                                                            <Pencil className="w-3 h-3" />
                                                        </Button>
                                                    </Link>
                                                    <Link
                                                        to="/$code"
                                                        params={{ code: encodeURIComponent(result.codes[index].replace(/^\[|\]$/g, '')) }}
                                                        target="_blank"
                                                    >
                                                        <Button variant="ghost" size="sm" className="h-7 px-2">
                                                            <ExternalLink className="w-3 h-3" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-2">
                                        <div className="aspect-[4/3] bg-muted/30 rounded overflow-hidden">
                                            <StrategyBoardRenderer
                                                board={board}
                                                className="w-full h-full"
                                                useInGameBackground={true}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
