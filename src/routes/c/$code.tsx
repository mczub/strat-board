/**
 * Legacy redirect route
 * Redirects /c/[code] to /[code]
 */

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/c/$code')({
    beforeLoad: ({ params }) => {
        throw redirect({
            to: '/$code',
            params: { code: params.code },
        })
    },
})
