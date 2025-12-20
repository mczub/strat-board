/**
 * Create page - placeholder for strategy board editor
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Construction } from 'lucide-react'

export const Route = createFileRoute('/create')({ component: CreatePage })

function CreatePage() {
    return (
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
            <Card className="max-w-md w-full bg-card/50 border-border">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Construction className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>Editor Coming Soon</CardTitle>
                    <CardDescription className="mt-2">
                        The strategy board editor is under development.
                        For now, you can create boards in-game and paste the share code here to view them.
                    </CardDescription>
                    <Link to="/" className="inline-block mt-6">
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Viewer
                        </Button>
                    </Link>
                </CardHeader>
            </Card>
        </div>
    )
}
