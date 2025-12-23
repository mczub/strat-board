/**
 * Raidplan API proxy
 * Server function to fetch raidplan data (avoids CORS issues)
 */

import { createServerFn } from '@tanstack/react-start'

interface FetchRaidplanInput {
    code: string
}

/**
 * Fetch raidplan data from raidplan.io API
 * This runs server-side to avoid CORS restrictions
 */
export const fetchRaidplan = createServerFn({
    method: 'GET',
}).handler(async (ctx: { data: FetchRaidplanInput }) => {
    console.log('[api.raidplan] Received ctx:', JSON.stringify(ctx, null, 2))

    // Handle both ctx.data.code and direct ctx (in case of type issues)
    const code = ctx?.data?.code ?? (ctx as unknown as FetchRaidplanInput)?.code
    console.log('[api.raidplan] Extracted code:', code)

    // Validate code format
    if (!code || !/^[a-zA-Z0-9_-]+$/.test(code)) {
        throw new Error('Invalid raidplan code format')
    }

    // Fetch from raidplan API (server-side, no CORS issues)
    const response = await fetch(`https://api.raidplan.io/api/v2/plan/${code}`, {
        headers: {
            'Accept': 'application/json',
        },
    })

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Raidplan not found. Check the code and try again.')
        }
        throw new Error(`Failed to fetch raidplan: ${response.status}`)
    }

    const responseData = await response.json()

    // The API wraps the plan data in a 'plan' object
    const plan = responseData.plan
    console.log('[api.raidplan] Plan keys:', Object.keys(plan || {}))
    console.log('[api.raidplan] Plan structure:', JSON.stringify({
        hasNodes: !!plan?.nodes,
        nodesCount: plan?.nodes?.length,
        steps: plan?.steps,
        name: plan?.name,
    }))

    if (!plan) {
        throw new Error('Invalid raidplan response - no plan data')
    }

    // Return the plan data directly
    return plan
})

