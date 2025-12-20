/**
 * OG Image Generation API Route
 * 
 * Generates PNG preview images for strategy board share codes.
 * URL: /api/og?code=[stgy:...]
 * 
 * Uses workers-og with pre-embedded base64 icons for realistic previews.
 * Supports geometric shapes: circle AoE, line AoE, donut, fan AoE, text.
 */

import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from 'workers-og'
import { decode } from 'xiv-strat-board'
import { getIconDataUrl } from '@/lib/iconData'
import type { StrategyObject } from 'xiv-strat-board'

// Default icon sizes (matching StrategyBoardRenderer)
const ICON_SIZE_DEFAULTS: Record<string, number> = {
  // Waymarks
  waymark_a: 44, waymark_b: 44, waymark_c: 44, waymark_d: 44,
  waymark_1: 44, waymark_2: 44, waymark_3: 44, waymark_4: 44,

  // Role/job icons
  tank: 28, tank_1: 28, tank_2: 28,
  healer: 28, healer_1: 28, healer_2: 28,
  dps: 28, dps_1: 28, dps_2: 28, dps_3: 28, dps_4: 28,
  melee_dps: 28, ranged_dps: 28, physical_ranged_dps: 28, magical_ranged_dps: 28,
  melee_1: 28, melee_2: 28, ranged_dps_1: 28, ranged_dps_2: 28,

  // Jobs
  paladin: 28, monk: 28, warrior: 28, dragoon: 28, bard: 28,
  white_mage: 28, black_mage: 28, summoner: 28, scholar: 28,
  ninja: 28, machinist: 28, dark_knight: 28, astrologian: 28,
  samurai: 28, red_mage: 28, gunbreaker: 28, dancer: 28,
  reaper: 28, sage: 28, viper: 28, pictomancer: 28,

  // Enemies
  small_enemy: 64, medium_enemy: 64, large_enemy: 90,

  // Markers
  attack_1: 30, attack_2: 30, attack_3: 30, attack_4: 30,
  bind_1: 30, bind_2: 30, ignore_1: 30, ignore_2: 30,
  circle_marker: 30, square_marker: 30, triangle_marker: 30, plus_marker: 30,

  // Shapes
  shape_circle: 32, shape_square: 32, shape_triangle: 32, shape_x: 32,
  up_arrow: 32, rotate: 32,

  // Geometric AoEs (base size)
  circle_aoe: 248, donut: 248, fan_aoe: 200,
  line_aoe: 80, line: 80,
}

// Types that use geometric rendering (not icons)
const GEOMETRIC_TYPES = new Set([
  'circle_aoe', 'fan_aoe', 'donut', 'line_aoe', 'line', 'text'
])

// Types that render as transparent overlays
const OVERLAY_TYPES = new Set([
  'checkered_circle', 'checkered_square', 'grey_circle', 'grey_square'
])

// AoE colors
const AOE_COLOR = 'rgba(255, 123, 0, 0.4)'
const AOE_BORDER = 'rgba(255, 123, 0, 0.8)'

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

          // Build object elements (positioned relative to board origin)
          const objectElements = board.objects
            .filter(obj => !obj.hidden && !OVERLAY_TYPES.has(obj.type))
            .map((obj, idx) => renderObject(obj, idx, scale, 0, 0)) // relative to board
            .filter(Boolean)

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
                // Board container with children inside
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
                      border: '3px solid #4c3d6e',
                      display: 'flex', // Required for Satori to handle nested children
                      overflow: 'hidden',
                    },
                    children: [
                      // Grid lines - vertical
                      ...[1, 2, 3, 4, 5, 6, 7].map((i) => ({
                        type: 'div',
                        key: `v${i}`,
                        props: {
                          style: {
                            position: 'absolute',
                            left: i * (boardWidth / 8),
                            top: 0,
                            width: 2,
                            height: boardHeight,
                            backgroundColor: 'rgba(255,255,255,0.15)',
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
                            left: 0,
                            top: i * (boardHeight / 6),
                            width: boardWidth,
                            height: 2,
                            backgroundColor: 'rgba(255,255,255,0.15)',
                          },
                        },
                      })),
                      // Objects (relative to board origin)
                      ...objectElements,
                    ],
                  },
                },
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

function renderObject(obj: StrategyObject, idx: number, scale: number, offsetX: number, offsetY: number): object | null {
  const x = offsetX + obj.x * scale
  const y = offsetY + obj.y * scale
  const objScale = (obj.size ?? 100) / 100
  const type = obj.type

  // Circle AoE
  if (type === 'circle_aoe') {
    const radius = 248 * objScale * scale
    return {
      type: 'div',
      key: `obj${idx}`,
      props: {
        style: {
          position: 'absolute',
          left: x - radius,
          top: y - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: '50%',
          backgroundColor: AOE_COLOR,
          border: `2px solid ${AOE_BORDER}`,
        },
      },
    }
  }

  // Donut AoE (approximated as ring)
  if (type === 'donut') {
    const outerRadius = 248 * objScale * scale
    const innerRadius = (obj.donutRadius ?? 100) * scale
    return {
      type: 'div',
      key: `obj${idx}`,
      props: {
        style: {
          position: 'absolute',
          left: x - outerRadius,
          top: y - outerRadius,
          width: outerRadius * 2,
          height: outerRadius * 2,
          borderRadius: '50%',
          backgroundColor: AOE_COLOR,
          border: `2px solid ${AOE_BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        children: {
          type: 'div',
          props: {
            style: {
              width: innerRadius * 2,
              height: innerRadius * 2,
              borderRadius: '50%',
              backgroundColor: '#2d2640',
              border: `2px solid ${AOE_BORDER}`,
            },
          },
        },
      },
    }
  }

  // Line AoE (rectangle)
  if (type === 'line_aoe' || type === 'line') {
    const lineWidth = (obj.width ?? 20) * scale
    const lineHeight = (obj.height ?? 80) * scale
    return {
      type: 'div',
      key: `obj${idx}`,
      props: {
        style: {
          position: 'absolute',
          left: x - lineWidth / 2,
          top: y - lineHeight / 2,
          width: lineWidth,
          height: lineHeight,
          backgroundColor: AOE_COLOR,
          border: `2px solid ${AOE_BORDER}`,
        },
      },
    }
  }

  // Fan AoE (approximated as pie slice using conic gradient)
  if (type === 'fan_aoe') {
    const radius = 200 * objScale * scale
    const angle = obj.arcAngle ?? 90
    // Note: Satori doesn't support conic-gradient, so we approximate with a circle
    return {
      type: 'div',
      key: `obj${idx}`,
      props: {
        style: {
          position: 'absolute',
          left: x - radius,
          top: y - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: '50%',
          backgroundColor: AOE_COLOR,
          border: `2px solid ${AOE_BORDER}`,
          opacity: angle / 360,
        },
      },
    }
  }

  // Text
  if (type === 'text') {
    const fontSize = 16 * scale
    return {
      type: 'div',
      key: `obj${idx}`,
      props: {
        style: {
          position: 'absolute',
          left: x,
          top: y,
          fontSize: fontSize,
          color: obj.color ?? '#ffffff',
          transform: 'translate(-50%, -50%)',
        },
        children: obj.text ?? 'Text',
      },
    }
  }

  // Try to get embedded icon
  const iconDataUrl = getIconDataUrl(type)
  if (iconDataUrl) {
    const baseSize = ICON_SIZE_DEFAULTS[type] ?? 32
    const size = baseSize * objScale * scale
    return {
      type: 'img',
      key: `obj${idx}`,
      props: {
        src: iconDataUrl,
        width: size,
        height: size,
        style: {
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
        },
      },
    }
  }

  // Fallback to colored circle
  const baseSize = ICON_SIZE_DEFAULTS[type] ?? 32
  const size = baseSize * objScale * scale
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
        backgroundColor: '#9333ea',
      },
    },
  }
}
