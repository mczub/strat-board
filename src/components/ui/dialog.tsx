import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />
            {/* Content container */}
            <div className="relative z-50">
                {children}
            </div>
        </div>
    )
}

export const DialogContent = forwardRef<
    HTMLDivElement,
    ComponentPropsWithoutRef<'div'> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative bg-card border border-border rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[85vh] overflow-auto",
            className
        )}
        {...props}
    >
        {onClose && (
            <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </button>
        )}
        {children}
    </div>
))
DialogContent.displayName = 'DialogContent'

export const DialogHeader = forwardRef<
    HTMLDivElement,
    ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
        {...props}
    />
))
DialogHeader.displayName = 'DialogHeader'

export const DialogTitle = forwardRef<
    HTMLHeadingElement,
    ComponentPropsWithoutRef<'h2'>
>(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
    />
))
DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = forwardRef<
    HTMLParagraphElement,
    ComponentPropsWithoutRef<'p'>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
DialogDescription.displayName = 'DialogDescription'

export const DialogFooter = forwardRef<
    HTMLDivElement,
    ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4", className)}
        {...props}
    />
))
DialogFooter.displayName = 'DialogFooter'
