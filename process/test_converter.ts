/**
 * Test script for raidplan conversion
 * Run with: npx tsx process/test_converter.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { convertRaidplanToBoards, getConversionStats } from '../src/lib/raidplanConverter'

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load sample raidplan data
const raidplanPath = path.join(__dirname, 'raidplan.json')
const raidplanData = JSON.parse(fs.readFileSync(raidplanPath, 'utf-8'))

console.log('=== Raidplan Conversion Test ===\n')
console.log(`Raidplan code: ${raidplanData.code}`)
console.log(`Total steps: ${raidplanData.steps}`)
console.log(`Total nodes: ${raidplanData.nodes.length}\n`)

// Convert to boards
const boards = convertRaidplanToBoards(raidplanData)

// Get stats
const stats = getConversionStats(raidplanData, boards)
console.log('=== Conversion Statistics ===')
console.log(`Total steps: ${stats.totalSteps}`)
console.log(`Total nodes: ${stats.totalNodes}`)
console.log(`Converted objects: ${stats.convertedObjects}`)
console.log(`Skipped nodes: ${stats.skippedNodes}`)
console.log('\nObjects by type:')
for (const [type, count] of Object.entries(stats.objectsByType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`)
}

// Show a sample board
console.log('\n=== Sample Board (Step 5) ===')
const sampleBoard = boards[4] // Step 5 (0-indexed)
if (sampleBoard) {
    console.log(`Name: ${sampleBoard.name}`)
    console.log(`Objects: ${sampleBoard.objects.length}`)
    console.log('\nFirst 5 objects:')
    for (const obj of sampleBoard.objects.slice(0, 5)) {
        console.log(`  - type: ${obj.type}, x: ${obj.x}, y: ${obj.y}${obj.text ? `, text: "${obj.text.substring(0, 30)}..."` : ''}`)
    }
}

console.log('\n=== Node Type Distribution (in raidplan) ===')
const nodeTypes: Record<string, number> = {}
for (const node of raidplanData.nodes) {
    nodeTypes[node.type] = (nodeTypes[node.type] ?? 0) + 1
}
for (const [type, count] of Object.entries(nodeTypes).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`)
}
