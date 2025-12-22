/**
 * Bundle View Route
 * Route: /b/$shareCode
 * 
 * Displays a bundle of strategy boards in read-only mode
 */

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { decode } from 'xiv-strat-board'
import type { StrategyBoard } from 'xiv-strat-board'
import { StrategyBoardRenderer } from '@/components/StrategyBoardRenderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, ExternalLink, AlertTriangle, Loader2, PenLine, Package, Copy, Users, Split } from 'lucide-react'
import { makeFullCode } from '@/lib/bundleUtils'
import { getBundle } from './api.bundles'

export const Route = createFileRoute('/b/$shareCode')({
    component: BundleViewPage,
    head: () => ({
        meta: [
            { title: `Strategy Board Bundle | board.wtfdig.info` },
            { name: 'description', content: 'View this collection of FF14 strategy boards' },
            // OpenGraph tags
            { property: 'og:title', content: 'Strategy Board Bundle' },
            { property: 'og:description', content: 'View this collection of FF14 strategy boards' },
            { property: 'og:type', content: 'website' },
            // Twitter Card
            { name: 'twitter:card', content: 'summary' },
            { name: 'twitter:title', content: 'Strategy Board Bundle' },
            { name: 'twitter:description', content: 'View this collection of FF14 strategy boards' },
        ],
    }),
})

interface DecodedBoard {
    code: string
    board: StrategyBoard | null
    error: string | null
}

function BundleViewPage() {
    const { shareCode } = Route.useParams()
    const navigate = useNavigate()
    const [boards, setBoards] = useState<DecodedBoard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [urlCopied, setUrlCopied] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [useSeparateDps, setUseSeparateDps] = useState(false)
    const [highlightIndex, setHighlightIndex] = useState(0) // 0 = None, 1-8 = roles

    // Highlight options depend on DPS mode (index 0 = None)
    const unifiedRoles = ['None', 'MT', 'ST', 'H1', 'H2', 'D1', 'D2', 'D3', 'D4']
    const separateRoles = ['None', 'MT', 'OT', 'H1', 'H2', 'M1', 'M2', 'R1', 'R2']
    const highlightOptions = useSeparateDps ? separateRoles : unifiedRoles

    // Get the actual role to pass to renderer (empty string for None)
    const highlightRole = highlightIndex === 0 ? '' : highlightOptions[highlightIndex]

    useEffect(() => {
        async function loadBundle() {
            try {
                const result = await getBundle({ data: { shareCode } })

                // Decode each code
                const decoded = result.codes.map((code: string) => {
                    try {
                        const fullCode = makeFullCode(code)
                        const board = decode(fullCode)
                        return { code, board, error: null }
                    } catch (e) {
                        return {
                            code,
                            board: null,
                            error: e instanceof Error ? e.message : 'Invalid code'
                        }
                    }
                })

                setBoards(decoded)
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load bundle')
            } finally {
                setLoading(false)
            }
        }

        loadBundle()
    }, [shareCode])

    const handleCopyUrl = async () => {
        await navigator.clipboard.writeText(window.location.href)
        setUrlCopied(true)
        setTimeout(() => setUrlCopied(false), 2000)
    }

    const handleCopyToNew = () => {
        // Store codes in session storage and navigate to editor
        sessionStorage.setItem('bundle_codes', JSON.stringify(boards.map(b => b.code)))
        navigate({ to: '/b' })
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
                <Card className="max-w-md w-full bg-card border-destructive/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Bundle Not Found
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <Link to="/">
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const validBoards = boards.filter(b => b.board !== null)

    return (
        <div className="md:min-h-[calc(100vh-9rem)] py-4 px-4 overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-col md:flex-row gap-4">
                    <div className="flex items-center gap-4 justify-between w-full">
                        <Link to="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                <span className="hidden md:inline">Back</span>
                            </Button>
                        </Link>
                        <div className="grow">
                            <h1 className="flex flex-row items-center gap-2 text-xl font-semibold"><Package className="w-6 h-6 text-primary" />bundle</h1>
                            <p className="text-sm text-muted-foreground">
                                {validBoards.length} board{validBoards.length === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopyToNew}>
                            <PenLine className="w-4 h-4 mr-2" />
                            <span className="hidden md:inline">Copy to New</span>
                            <span className="md:hidden">Copy</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                            {urlCopied ? <Check className="w-4 h-4 mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                            Share
                        </Button>
                    </div>
                </div>

                {/* Toggle Controls */}
                <div className="flex items-center justify-end mb-4">
                    <div className="flex items-center gap-4 flex-wrap justify-end">
                        {/* Highlight Select */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Highlight</span>
                            <select
                                value={highlightIndex}
                                onChange={(e) => setHighlightIndex(Number(e.target.value))}
                                className="h-8 px-2 rounded-md border border-border bg-background text-sm"
                            >
                                {highlightOptions.map((opt, idx) => (
                                    <option key={idx} value={idx}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {/* DPS Marker Toggle */}
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

                {/* Boards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-full overflow-hidden">
                    {boards.map((item, index) => (
                        <Card key={index} className="bg-card/50 border-border overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">
                                        Board {index + 1}
                                        {item.board?.name && (
                                            <span className="ml-2 text-muted-foreground font-normal">
                                                — {item.board.name}
                                            </span>
                                        )}
                                    </CardTitle>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2"
                                            onClick={async () => {
                                                await navigator.clipboard.writeText(`[${item.code}]`)
                                                setCopiedIndex(index)
                                                setTimeout(() => setCopiedIndex(null), 2000)
                                            }}
                                        >
                                            {copiedIndex === index ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                                            Copy
                                        </Button>
                                        <Link to="/$code" params={{ code: encodeURIComponent(item.code) }}>
                                            <Button variant="ghost" size="sm" className="h-7 px-2">
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="aspect-[4/3]">
                                    {item.board ? (
                                        <StrategyBoardRenderer
                                            board={item.board}
                                            className="w-full h-full"
                                            useInGameBackground={true}
                                            useSeparateDps={useSeparateDps}
                                            highlightRole={highlightRole || undefined}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted/30">
                                            <p className="text-sm text-destructive">{item.error}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
