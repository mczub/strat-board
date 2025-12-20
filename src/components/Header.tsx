/**
 * Minimal header component for Strategy Board app
 */

import { Link } from '@tanstack/react-router'
import { Grid3X3 } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <Grid3X3 className="w-6 h-6 text-primary" />
          <span className="font-semibold tracking-tight">board<span className="text-primary">.wtfdig.info</span></span>
        </Link>
      </nav>
    </header>
  )
}
