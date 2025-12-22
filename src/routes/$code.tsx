/**
 * View route - displays a decoded strategy board
 * Route: /[code]
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { decode } from 'xiv-strat-board'
import type { StrategyBoard } from 'xiv-strat-board'
import { StrategyBoardRenderer } from '@/components/StrategyBoardRenderer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, Copy, Check, ExternalLink, Image, Grid, Users, Split } from 'lucide-react'
import { useState } from 'react'

// Base URL for OG images (absolute URLs required by social platforms)
const OG_BASE_URL = 'https://board.wtfdig.info'

const makeFullCode = (code: string) => {
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

export const Route = createFileRoute('/$code')({
    component: ViewBoardPage,
    head: ({ params }) => {
        // Try to decode for meta tags
        const code = decodeURIComponent(params.code)
        let title = 'Strategy Board'
        let description = 'View this FF14 Strategy Board'

        try {
            const result = decode(makeFullCode(code))
            if (result.name) {
                title = result.name
            }
            description = `FF14 strat board with ${result.objects.length} objects`
        } catch {
            // Use defaults
        }

        const ogImageUrl = `${OG_BASE_URL}/api/og?code=${encodeURIComponent(code)}`

        return {
            meta: [
                { title: `${title} | FF14 Strategy Board` },
                { name: 'description', content: description },
                // OpenGraph tags
                { property: 'og:title', content: title },
                { property: 'og:description', content: description },
                { property: 'og:type', content: 'website' },
                { property: 'og:image', content: ogImageUrl },
                { property: 'og:image:width', content: '1200' },
                { property: 'og:image:height', content: '630' },
                // Twitter Card
                { name: 'twitter:card', content: 'summary_large_image' },
                { name: 'twitter:title', content: title },
                { name: 'twitter:description', content: description },
                { name: 'twitter:image', content: ogImageUrl },
            ],
        }
    },
})

function ViewBoardPage() {
    const { code } = Route.useParams()
    const [copied, setCopied] = useState(false)
    const [urlCopied, setUrlCopied] = useState(false)
    const [useInGameBackground, setUseInGameBackground] = useState(true)
    const [useSeparateDps, setUseSeparateDps] = useState(false)
    const [highlightIndex, setHighlightIndex] = useState(0) // 0 = None, 1-8 = roles

    // Highlight options depend on DPS mode (index 0 = None)
    const unifiedRoles = ['None', 'MT', 'ST', 'H1', 'H2', 'D1', 'D2', 'D3', 'D4']
    const separateRoles = ['None', 'MT', 'OT', 'H1', 'H2', 'M1', 'M2', 'R1', 'R2']
    const highlightOptions = useSeparateDps ? separateRoles : unifiedRoles

    // Get the actual role to pass to renderer (empty string for None)
    const highlightRole = highlightIndex === 0 ? '' : highlightOptions[highlightIndex]

    // Decode the URL-encoded code
    const decodedCode = decodeURIComponent(code)

    // Try to decode the board
    let board: StrategyBoard | null = null
    let error: string | null = null

    try {
        // Handle both with and without brackets
        const fullCode = makeFullCode(decodedCode)
        const result = decode(fullCode)
        board = result
        console.log("board", board)
    } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to decode strategy board'
    }

    const handleCopy = async () => {
        const fullCode = makeFullCode(decodedCode)
        await navigator.clipboard.writeText(fullCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleCopyUrl = async () => {
        await navigator.clipboard.writeText(window.location.href)
        setUrlCopied(true)
        setTimeout(() => setUrlCopied(false), 2000)
    }

    if (error) {
        return (
            <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
                <Card className="max-w-md w-full bg-card border-destructive/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Invalid Code
                        </CardTitle>
                        <CardDescription>Failed to decode the strategy board</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <code className="block text-xs bg-muted p-2 rounded font-mono break-all">
                            {decodedCode.substring(0, 100)}...
                        </code>
                        <Link to="/">
                            <Button variant="outline" className="mt-4">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!board) {
        return null
    }

    return (
        <div className="md:min-h-[calc(100vh-9rem)] py-4 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 flex-col md:flex-row gap-4">
                    <div className="flex items-center gap-4 justify-between w-full">
                        <Link to="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                <span className="hidden md:inline">Back</span>
                            </Button>
                        </Link>
                        <div className="grow">
                            <h1 className="text-xl font-semibold">
                                {board.name || 'Strategy Board'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {board.objects.length} objects
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex flex-row items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleCopy}>
                                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                Copy Code
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                                {urlCopied ? <Check className="w-4 h-4 mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                                Share URL
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end mb-4 flex-col md:flex-row gap-4">
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

                        {/* Background Toggle */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">BG</span>
                            <div className="flex items-center rounded-md border border-border overflow-hidden">
                                <button
                                    onClick={() => setUseInGameBackground(true)}
                                    className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${useInGameBackground
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-transparent hover:bg-muted'
                                        }`}
                                >
                                    <Image className="w-3.5 h-3.5" />
                                    In-Game
                                </button>
                                <button
                                    onClick={() => setUseInGameBackground(false)}
                                    className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${!useInGameBackground
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-transparent hover:bg-muted'
                                        }`}
                                >
                                    <Grid className="w-3.5 h-3.5" />
                                    Simple
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Board Renderer */}
                <Card className="bg-card/50 border-border overflow-hidden">
                    <CardContent className="p-0">
                        <div className="aspect-[4/3] w-full">
                            <StrategyBoardRenderer
                                board={board}
                                className="w-full h-full"
                                useInGameBackground={useInGameBackground}
                                useSeparateDps={useSeparateDps}
                                highlightRole={highlightRole || undefined}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Object List */}
                <Card className="mt-6 bg-card/30 border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Objects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            {board.objects.map((obj, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                                    <span className="text-muted-foreground">#{i + 1}</span>
                                    <span className="font-medium">{obj.type}</span>
                                    <span className="text-muted-foreground">
                                        ({Math.round(obj.x)}, {Math.round(obj.y)})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}