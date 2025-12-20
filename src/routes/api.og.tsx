/**
 * OG Image Generation API Route
 * 
 * Generates PNG preview images for strategy board share codes.
 * URL: /api/og?code=[stgy:...]
 * 
 * Uses workers-og (Satori + resvg-wasm) designed for Cloudflare Workers.
 */

import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from 'workers-og'
import { decode } from 'xiv-strat-board'

export const Route = createFileRoute('/api/og')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const codeMatch = url.search.match(/[?&]code=([^&]*)/)
        const rawCode = codeMatch ? codeMatch[1] : null
        const code = rawCode ? decodeURIComponent(rawCode) : null

        if (!code) {
          return new Response('Missing code parameter', { status: 400 })
        }

        try {
          const fullCode = code.startsWith('stgy:') ? `[${code}]` : code
          const board = decode(fullCode)

          // Image dimensions
          const width = 1200
          const height = 630
          const boardWidth = 696
          const boardHeight = 522
          const scale = boardWidth / 512
          const offsetX = (width - boardWidth) / 2
          const offsetY = 80

          // Build object elements
          const objectElements = board.objects
            .filter(obj => !obj.hidden)
            .map((obj, idx) => {
              const color = getObjectColor(obj.type)
              const label = getObjectLabel(obj.type)
              const baseSize = getBaseSize(obj.type)
              const objScale = (obj.size ?? 100) / 100
              const size = baseSize * objScale * scale
              const x = offsetX + obj.x * scale
              const y = offsetY + obj.y * scale

              return {
                type: 'div',
                key: `obj${idx}`,
                props: {
                  style: {
                    position: 'absolute',
                    left: x - size / 2,
                    top: y - size / 2,
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    backgroundColor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: Math.max(10, size * 0.4),
                    fontWeight: 'bold',
                  },
                  children: label,
                },
              }
            })

          // Build the element tree
          const element = {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                backgroundColor: '#1a1625',
                position: 'relative',
              },
              children: [
                // Board name
                board.name ? {
                  type: 'div',
                  props: {
                    style: {
                      position: 'absolute',
                      left: offsetX,
                      top: 30,
                      fontSize: 28,
                      fontWeight: 'bold',
                      color: '#a855f7',
                    },
                    children: board.name,
                  },
                } : null,
                // Board background
                {
                  type: 'div',
                  props: {
                    style: {
                      position: 'absolute',
                      left: offsetX,
                      top: offsetY,
                      width: boardWidth,
                      height: boardHeight,
                      backgroundColor: '#2d2640',
                      borderRadius: 16,
                      border: '3px solid #4c3d6e',
                    },
                  },
                },
                // Grid lines - vertical
                ...[1, 2, 3, 4, 5, 6, 7].map((i) => ({
                  type: 'div',
                  key: `v${i}`,
                  props: {
                    style: {
                      position: 'absolute',
                      left: offsetX + i * (boardWidth / 8),
                      top: offsetY,
                      width: 1,
                      height: boardHeight,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  },
                })),
                // Grid lines - horizontal
                ...[1, 2, 3, 4, 5].map((i) => ({
                  type: 'div',
                  key: `h${i}`,
                  props: {
                    style: {
                      position: 'absolute',
                      left: offsetX,
                      top: offsetY + i * (boardHeight / 6),
                      width: boardWidth,
                      height: 1,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  },
                })),
                // Objects
                ...objectElements,
              ].filter(Boolean),
            },
          }

          return new ImageResponse(element, { width, height })
        } catch (e) {
          console.error('OG image generation failed:', e)
          return new Response(`Failed to generate image: ${e instanceof Error ? e.message : String(e)}`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          })
        }
      },
    },
  },
})

function getBaseSize(type: string): number {
  const sizes: Record<string, number> = {
    waymark_a: 44, waymark_b: 44, waymark_c: 44, waymark_d: 44,
    waymark_1: 44, waymark_2: 44, waymark_3: 44, waymark_4: 44,
    tank: 28, tank_1: 28, tank_2: 28,
    healer: 28, healer_1: 28, healer_2: 28,
    dps: 28, dps_1: 28, dps_2: 28, dps_3: 28, dps_4: 28,
    small_enemy: 64, medium_enemy: 64, large_enemy: 90,
    circle_aoe: 100, fan_aoe: 100, donut: 100,
    stack: 60, tower: 50,
  }
  return sizes[type] ?? 32
}

function getObjectColor(type: string): string {
  const colors: Record<string, string> = {
    tank: '#3b82f6', tank_1: '#3b82f6', tank_2: '#3b82f6',
    healer: '#22c55e', healer_1: '#22c55e', healer_2: '#22c55e',
    dps: '#ef4444', dps_1: '#ef4444', dps_2: '#ef4444', dps_3: '#ef4444', dps_4: '#ef4444',
    melee_dps: '#ef4444', ranged_dps: '#ef4444', physical_ranged_dps: '#ef4444', magical_ranged_dps: '#ef4444',
    waymark_a: '#ef4444', waymark_b: '#facc15', waymark_c: '#3b82f6', waymark_d: '#a855f7',
    waymark_1: '#ef4444', waymark_2: '#facc15', waymark_3: '#3b82f6', waymark_4: '#a855f7',
    small_enemy: '#ff9900', medium_enemy: '#ff6600', large_enemy: '#ff3300',
    circle_aoe: 'rgba(255,123,0,0.5)', fan_aoe: 'rgba(255,123,0,0.5)', donut: 'rgba(255,123,0,0.5)',
    stack: '#00ff00', tower: '#00aaff', gaze: '#ff00ff',
  }
  return colors[type] ?? '#9333ea'
}

function getObjectLabel(type: string): string {
  const labels: Record<string, string> = {
    tank: 'T', tank_1: 'T1', tank_2: 'T2',
    healer: 'H', healer_1: 'H1', healer_2: 'H2',
    dps: 'D', dps_1: 'D1', dps_2: 'D2', dps_3: 'D3', dps_4: 'D4',
    melee_dps: 'M', ranged_dps: 'R', physical_ranged_dps: 'PR', magical_ranged_dps: 'MR',
    waymark_a: 'A', waymark_b: 'B', waymark_c: 'C', waymark_d: 'D',
    waymark_1: '1', waymark_2: '2', waymark_3: '3', waymark_4: '4',
    small_enemy: 'E', medium_enemy: 'E', large_enemy: 'E',
  }
  return labels[type] ?? ''
}
