/**
 * Bundle Utilities
 * Shared utilities for bundle operations
 */

import { decode } from 'xiv-strat-board'
import type { StrategyBoard } from 'xiv-strat-board'

/**
 * Normalize a strat board code to full format with brackets
 */
export function makeFullCode(code: string): string {
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

/**
 * Extract just the code part without brackets
 */
export function extractCode(code: string): string {
    let cleanCode = code.trim()
    if (cleanCode.startsWith('[') && cleanCode.endsWith(']')) {
        cleanCode = cleanCode.slice(1, -1)
    }
    return cleanCode
}

/**
 * Validate a strat board code by attempting to decode it
 * Returns the decoded board if valid, null if invalid
 */
export function validateCode(code: string): StrategyBoard | null {
    try {
        const fullCode = makeFullCode(code.trim())
        return decode(fullCode)
    } catch {
        return null
    }
}

/**
 * Bundle data structure
 */
export interface BundleData {
    codes: string[]
    createdAt?: number
}

/**
 * Serialize bundle to KV format (comma-separated codes)
 */
export function serializeBundle(codes: string[]): string {
    return codes.map(extractCode).filter(c => c.length > 0).join(',')
}

/**
 * Deserialize bundle from KV format
 */
export function deserializeBundle(value: string): string[] {
    return value.split(',').filter(c => c.length > 0)
}
