/**
 * Hook to detect if the current page is rendered inside an iframe
 */
import { useState, useEffect } from 'react'

export function useIsInIframe(): boolean {
    const [isInIframe, setIsInIframe] = useState(false)

    useEffect(() => {
        // Check if window.self is different from window.top
        // This will be true when rendered in an iframe
        try {
            setIsInIframe(window.self !== window.top)
        } catch {
            // If we can't access window.top due to cross-origin restrictions,
            // we're definitely in an iframe
            setIsInIframe(true)
        }
    }, [])

    return isInIframe
}
