/**
 * Bundle API routes
 * Server functions for creating and fetching bundles from KV
 * 
 * These server functions run on Cloudflare Workers and have access to KV bindings
 */

import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { nanoid } from 'nanoid'
import { serializeBundle, deserializeBundle } from '@/lib/bundleUtils'
import { env } from "cloudflare:workers"

// Share code length (13 characters as specified)
const SHARE_CODE_LENGTH = 13

// Type definitions for server function inputs
interface CreateBundleInput {
    codes: string[]
}

interface GetBundleInput {
    shareCode: string
}

/**
 * Create a new bundle and store it in KV
 * Returns the share code
 */
export const createBundle = createServerFn({
    method: 'POST',
}).handler(async (ctx: { data: CreateBundleInput }) => {
    const { codes } = ctx.data

    // Validate codes array
    if (!Array.isArray(codes) || codes.length === 0) {
        throw new Error('No codes provided')
    }
    if (codes.length > 10) {
        throw new Error('Maximum 10 codes allowed')
    }

    // Filter out empty codes
    const validCodes = codes.filter((c: string) => c.trim().length > 0)
    if (validCodes.length === 0) {
        throw new Error('No valid codes provided')
    }

    // Generate share code using nanoid
    const shareCode = nanoid(SHARE_CODE_LENGTH)

    // Serialize the codes
    const serialized = serializeBundle(validCodes)

    // Access KV through the Cloudflare module-level env (from wrangler)
    // @ts-expect-error - env.BUNDLE_STORE is set by wrangler
    const kv = env.BUNDLE_STORE
    if (!kv) {
        throw new Error('KV store not available')
    }

    await kv.put(shareCode, serialized)

    return { shareCode }
})

/**
 * Get a bundle from KV by share code
 * Returns the array of codes
 */
export const getBundle = createServerFn({
    method: 'GET',
}).handler(async (ctx: { data: GetBundleInput }) => {
    const { shareCode } = ctx.data

    if (!shareCode || shareCode.length !== SHARE_CODE_LENGTH) {
        throw new Error('Invalid share code')
    }

    // Access KV through env
    // @ts-expect-error - env.BUNDLE_STORE is set by wrangler
    const kv = env.BUNDLE_STORE
    if (!kv) {
        throw new Error('KV store not available')
    }

    const value = await kv.get(shareCode)

    if (!value) {
        throw new Error('Bundle not found')
    }

    const codes = deserializeBundle(value)
    return { codes }
})

/**
 * Public API Route for getting bundle codes as comma-separated string
 * URL: /api/v1/bundles?code=[shareCode]
 */
export const Route = createFileRoute('/api/bundles')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                const url = new URL(request.url)
                const shareCode = url.searchParams.get('code')

                if (!shareCode || shareCode.length !== SHARE_CODE_LENGTH) {
                    return new Response('Invalid or missing share code', { status: 400 })
                }

                try {
                    // Access KV through env
                    // @ts-expect-error - env.BUNDLE_STORE is set by wrangler
                    const kv = env.BUNDLE_STORE
                    if (!kv) {
                        return new Response('KV store not available', { status: 500 })
                    }

                    const value = await kv.get(shareCode)

                    if (!value) {
                        return new Response('Bundle not found', { status: 404 })
                    }

                    const codes = deserializeBundle(value)
                    const csvCodes = codes.map(c => `[${c}]`).join(',')

                    return new Response(csvCodes, {
                        status: 200,
                        headers: {
                            'Content-Type': 'text/plain',
                            'Cache-Control': 'public, max-age=3600',
                        },
                    })
                } catch (e) {
                    console.error('Bundle API error:', e)
                    return new Response(`Failed to fetch bundle: ${e instanceof Error ? e.message : String(e)}`, {
                        status: 500,
                        headers: { 'Content-Type': 'text/plain' }
                    })
                }
            },
        },
    },
})
