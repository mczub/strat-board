/**
 * Home page - View Strategy Board codes
 */

import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, Grid3X3, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/')({ component: HomePage })

// Example codes for demo purposes (from test files)
const EXAMPLE_CODES = [
  {
    name: 'Party Setup',
    description: 'Full 8-player party with positions',
    code: '[stgy:aGz4kwGPfaf8h3GsnyGY8RcjsvIuShQZmcZtFzkdlUwjlvyIRWEM51OI5bb5wPoW9i5fdIqflSXuQuxO-ssbT0x7z7vVNICXYJLPw7BJrkNEkkdL1PsxTGiDSFSfaQVelWWN705StQ-Cfi25ZbbkEPv2nSuoIdeqFF8554DetpRZgJT+LXbHdZD2nCqwbMyhNX2kFAsLY-RNiNgl+BPNiNOPOLG+NrovN-mG+Qy8MQrjKFGrLUELwIq-]',
  },
  {
    name: 'Crazy Big Test Case',
    description: 'Many objects and waymarks',
    code: '[stgy:a0+u8JeWQVQAx60m2Y0wAIu23QoZGDvyV5KyDjjggEtEroCeMIyaHoXQiM8a8857H02DXLRo-4bhGIWRpeFcBBTGD-3lkSBpuGRhHgr7oqhqbY933N4lT8u-UMNf9mB8eei-fQ22PjLgH9+xdQjeiZmuVWo3qNs2DQ9Ww91F39iVYIoc5mC4hMgLGixT4L2RkTqMgnhQ-80K1SKuDyZvFS+OQVpUnnQBsTT+TxFsQXiroaRViCTQCBEZvJAUutzWpdFW5fv+jJw2z-0jKsYy10DAzwQVXrD8w9L9hQLqBN3snPK0rLH346qlHb8tGIhgDwE06jMo5z4rlTk3LhKuXT1KzKArIASUVns9MDMkgQMgbJGfQGiX8P3Hos-QqtGAcX1wUj8YY3hFcgxUgWZrdVcwJwMl]',
  },
]

function HomePage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedCode = code.trim()
    if (!trimmedCode) {
      setError('Please enter a strategy board code')
      return
    }

    // Extract just the code part if wrapped in brackets
    let cleanCode = trimmedCode
    if (cleanCode.startsWith('[') && cleanCode.endsWith(']')) {
      cleanCode = cleanCode.slice(1, -1)
    }

    // Navigate to the view page
    navigate({ to: '/$code', params: { code: encodeURIComponent(cleanCode) } })
  }

  const handleExampleClick = (exampleCode: string) => {
    let cleanCode = exampleCode
    if (cleanCode.startsWith('[') && cleanCode.endsWith(']')) {
      cleanCode = cleanCode.slice(1, -1)
    }
    navigate({ to: '/$code', params: { code: encodeURIComponent(cleanCode) } })
  }

  return (
    <div className="max-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="relative py-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Grid3X3 className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              board<span className="text-primary text-xl">.wtfdig.info</span>
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Decode and view FF14 Strategy Board share codes. Paste your code below to see it in your browser.
          </p>

          {/* Code Input Form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="[stgy:a...]"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  setError(null)
                }}
                className="flex-1 h-12 bg-card border-border text-base font-mono"
              />
              <Button type="submit" size="lg" className="h-12 px-6">
                View
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </form>
        </div>
      </section>

      <section className="py-12 px-6 max-w-4xl mx-auto border-t border-border">
        <Link to="/b">
          <Card className="bg-card/30 border-primary/30 hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <CardTitle className="text-primary">bundler</CardTitle>
              <CardDescription>
                share a collection of boards with one link
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </section>

      {/* Create Placeholder */}
      <section className="py-12 px-6 max-w-4xl mx-auto border-t border-border">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Coming Soon
        </h2>
        <Card className="bg-card/30 border-dashed mb-4">
          <CardHeader className="text-center">
            <CardTitle className="text-muted-foreground">editor</CardTitle>
            <CardDescription>
              create and edit strategy boards
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  )
}
