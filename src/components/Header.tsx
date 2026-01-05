/**
 * Minimal header component for Strategy Board app
 */

import { Link } from '@tanstack/react-router'
import { Grid3X3, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsInIframe } from '@/hooks/useIsInIframe'

export default function Header() {
  const isInIframe = useIsInIframe()

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {isInIframe ? (
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors text-sm sm:text-base">
            <Grid3X3 className="w-6 h-6 text-primary" />
            <span className="font-semibold tracking-tight">board<span className="text-primary">.wtfdig.info</span></span>
          </a>
        ) : (
          <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <Grid3X3 className="w-6 h-6 text-primary" />
            <span className="font-semibold tracking-tight">board<span className="text-primary">.wtfdig.info</span></span>
          </Link>
        )}
        {isInIframe && (
          <a href={typeof window !== 'undefined' ? window.location.href : ''} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Tab
            </Button>
          </a>
        )}
      </nav>
    </header>
  )
}
