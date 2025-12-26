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
import { makeFullCode } from '@/lib/bundleUtils'

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
  reaper: 28, sage: 28, viper: 28, pictomancer: 28, blue_mage: 28,
  gladiator: 28, marauder: 28, pugilist: 28, lancer: 28,
  archer: 28, conjurer: 28, thaumaturge: 28, arcanist: 28, rogue: 28,

  // Enemies
  small_enemy: 64, medium_enemy: 64, large_enemy: 90,

  // Markers
  attack_1: 30, attack_2: 30, attack_3: 30, attack_4: 30,
  attack_5: 30, attack_6: 30, attack_7: 30, attack_8: 30,
  bind_1: 30, bind_2: 30, bind_3: 30,
  ignore_1: 30, ignore_2: 30,
  circle_marker: 30, square_marker: 30, triangle_marker: 30, plus_marker: 30,
  lockon_red: 30, lockon_blue: 30, lockon_purple: 30, lockon_green: 30,

  // Shapes
  shape_circle: 32, shape_square: 32, shape_triangle: 32, shape_x: 32,
  up_arrow: 32, rotate: 32, rotate_clockwise: 32, rotate_counterclockwise: 32,
  highlighted_circle: 32, highlighted_x: 32, highlighted_square: 32, highlighted_triangle: 32,

  // Buffs/Debuffs
  enhancement: 30, enfeeblement: 30,

  // Mechanics - larger
  stack: 124, stack_multi: 124, line_stack: 124,
  gaze: 124, proximity: 248, proximity_player: 72,
  tankbuster: 72, tower: 64, targeting: 72,
  radial_knockback: 72, linear_knockback: 270,
  moving_circle_aoe: 64,

  // Geometric AoEs (base size)
  circle_aoe: 248, donut: 248, fan_aoe: 200,
  line_aoe: 80, line: 80,
}

// Pre-computed board dimensions (matching handler constants)
const BOARD_WIDTH = 696
const BOARD_HEIGHT = 522

// Pre-computed grid lines (static, no need to rebuild per-request)
const GRID_LINES_VERTICAL = [1, 2, 3, 4, 5, 6, 7].map((i) => ({
  type: 'div',
  key: `v${i}`,
  props: {
    style: {
      position: 'absolute',
      left: i * (BOARD_WIDTH / 8),
      top: 0,
      width: 2,
      height: BOARD_HEIGHT,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
  },
}))

const GRID_LINES_HORIZONTAL = [1, 2, 3, 4, 5].map((i) => ({
  type: 'div',
  key: `h${i}`,
  props: {
    style: {
      position: 'absolute',
      left: 0,
      top: i * (BOARD_HEIGHT / 6),
      width: BOARD_WIDTH,
      height: 2,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
  },
}))

// Types that render as transparent overlays
const OVERLAY_TYPES = new Set([
  'checkered_circle', 'checkered_square', 'grey_circle', 'grey_square'
])

// AoE colors (defaults)
const AOE_COLOR = 'rgba(255, 123, 0, 0.4)'
const AOE_BORDER = 'rgba(255, 123, 0, 0.8)'
const DEFAULT_AOE_COLOR = '#FFA131'

// Grid size limits to prevent excessive element generation
const MAX_KNOCKBACK_GRID = 5  // Max 5x5 = 25 elements per knockback
const MAX_LINE_STACK = 5      // Max 5 elements per line_stack

// Get color for an object (matching StrategyBoardRenderer logic)
function getObjectColor(obj: StrategyObject): string {
  if (obj.color) return obj.color
  if (obj.colorR !== undefined && obj.colorG !== undefined && obj.colorB !== undefined) {
    return `rgb(${obj.colorR}, ${obj.colorG}, ${obj.colorB})`
  }
  return DEFAULT_AOE_COLOR
}

// Get rgba version of color with alpha
function getColorWithAlpha(color: string, alpha: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  // Handle rgb colors
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
  }
  return color
}

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
          const fullCode = makeFullCode(code)
          const board = decode(fullCode)
          console.info('fullCode', fullCode)

          // Image dimensions
          const width = 1200
          const height = 630
          const boardWidth = BOARD_WIDTH
          const boardHeight = BOARD_HEIGHT
          const scale = boardWidth / 512
          const offsetX = (width - boardWidth) / 2
          const offsetY = 80

          // Build object elements (positioned relative to board origin)
          // Reverse so first items in array appear on top (rendered last in z-order)
          const objectElements = board.objects
            .filter(obj => !obj.hidden && !OVERLAY_TYPES.has(obj.type))
            .flatMap((obj, idx) => renderObject(obj, idx, scale, 0, 0)) // flatMap to handle arrays
            .filter(Boolean)
            .reverse()

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
                {
                  type: 'div',
                  props: {
                    style: {
                      position: 'absolute',
                      right: offsetX,
                      top: 34,
                      fontSize: 20,
                      fontWeight: 'bold',
                      color: '#ffffff',
                    },
                    children: "board.wtfdig.info for full board",
                  },
                },
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
                      // Pre-computed grid lines
                      ...GRID_LINES_VERTICAL,
                      ...GRID_LINES_HORIZONTAL,
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

  // Donut AoE - using inline SVG (matches StrategyBoardRenderer logic exactly)
  if (type === 'donut') {
    // In StrategyBoardRenderer: scale = (obj.size ?? 100) / 100, and both radii use it
    // Here: objScale = (obj.size ?? 100) / 100, scale = boardWidth / 512
    const outerRadius = 248 * objScale * scale
    const innerRadius = obj.donutRadius !== undefined
      ? obj.donutRadius * objScale * scale  // Fixed: apply objScale like outerRadius
      : outerRadius * 0.4
    const arcAngle = obj.arcAngle ?? 360
    const rotation = obj.angle ?? 0
    const color = getObjectColor(obj)  // Use same color as StrategyBoardRenderer

    // Build transform string for rotation and flips
    const buildTransform = (): string | undefined => {
      const transforms: string[] = []
      if (rotation) transforms.push(`rotate(${rotation}deg)`)
      if (obj.horizontalFlip) transforms.push('scaleX(-1)')
      if (obj.verticalFlip) transforms.push('scaleY(-1)')
      return transforms.length > 0 ? transforms.join(' ') : undefined
    }
    const transform = buildTransform()

    // Full circle donut - stroked circle approach
    if (arcAngle >= 360) {
      const ringWidth = outerRadius - innerRadius
      const meanRadius = (outerRadius + innerRadius) / 2
      // SVG size needs to fit the outer radius + stroke widths
      const svgSize = (outerRadius + 4) * 2

      return {
        type: 'svg',
        key: `obj${idx}`,
        props: {
          width: svgSize,
          height: svgSize,
          viewBox: `0 0 ${svgSize} ${svgSize}`,
          style: {
            position: 'absolute',
            left: x - svgSize / 2,
            top: y - svgSize / 2,
            ...(transform && { transform }),
          },
          children: {
            type: 'circle',
            props: {
              cx: svgSize / 2,
              cy: svgSize / 2,
              r: meanRadius,
              fill: 'none',
              stroke: color,
              strokeWidth: ringWidth,
              opacity: 0.5,
            },
          },
        },
      }
    }

    // Partial donut arc
    const svgSize = outerRadius * 2 + 8
    const arcAngleRad = (arcAngle * Math.PI) / 180
    const startAngleRad = -Math.PI / 2
    const endAngleRad = startAngleRad + arcAngleRad

    // Find bounding box extremes
    const outerEndX = outerRadius * Math.cos(endAngleRad)
    const outerEndY = outerRadius * Math.sin(endAngleRad)
    const innerEndX = innerRadius * Math.cos(endAngleRad)
    const innerEndY = innerRadius * Math.sin(endAngleRad)

    let minX = Math.min(0, 0, outerEndX, innerEndX)
    let maxX = Math.max(0, 0, outerEndX, innerEndX)
    let minY = Math.min(-outerRadius, -innerRadius, outerEndY, innerEndY)
    let maxY = Math.max(-outerRadius, -innerRadius, outerEndY, innerEndY)

    if (endAngleRad > 0) { maxX = outerRadius }
    if (endAngleRad > Math.PI / 2) { maxY = outerRadius }
    if (endAngleRad > Math.PI) { minX = -outerRadius }

    const bboxCenterX = (minX + maxX) / 2
    const bboxCenterY = (minY + maxY) / 2

    // x,y is bounding box center, offset to get arc center
    const centerX = svgSize / 2 - bboxCenterX
    const centerY = svgSize / 2 - bboxCenterY

    // Arc angles for SVG path (same as StrategyBoardRenderer)
    const startAngle = -90
    const endAngle = -90 + arcAngle
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const ox1 = centerX + outerRadius * Math.cos(startRad)
    const oy1 = centerY + outerRadius * Math.sin(startRad)
    const ox2 = centerX + outerRadius * Math.cos(endRad)
    const oy2 = centerY + outerRadius * Math.sin(endRad)

    const ix1 = centerX + innerRadius * Math.cos(startRad)
    const iy1 = centerY + innerRadius * Math.sin(startRad)
    const ix2 = centerX + innerRadius * Math.cos(endRad)
    const iy2 = centerY + innerRadius * Math.sin(endRad)

    const largeArc = arcAngle > 180 ? 1 : 0
    const d = `M ${ox1} ${oy1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`

    return {
      type: 'svg',
      key: `obj${idx}`,
      props: {
        width: svgSize,
        height: svgSize,
        viewBox: `0 0 ${svgSize} ${svgSize}`,
        style: {
          position: 'absolute',
          left: x - svgSize / 2,
          top: y - svgSize / 2,
          ...(transform && { transform }),
        },
        children: {
          type: 'path',
          props: {
            d: d,
            fill: color,
            fillOpacity: 0.5,
            stroke: color,
            strokeWidth: 2,
          },
        },
      },
    }
  }

  // Line AoE (rectangle centered at x,y with rotation)
  if (type === 'line_aoe') {
    const lineWidth = (obj.width ?? 20) * scale
    const lineHeight = (obj.height ?? 80) * scale
    const angle = obj.angle ?? 0
    const color = getObjectColor(obj)
    // Use object transparency if specified (0-255), otherwise default alpha values
    const fillColor = getColorWithAlpha(color, obj.transparency !== undefined ? obj.transparency / 255 : 1)
    const borderColor = getColorWithAlpha(color, obj.transparency !== undefined ? obj.transparency / 255 : 1)
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
          backgroundColor: fillColor,
          border: `2px solid ${borderColor}`,
          transform: `rotate(${angle}deg)`,
        },
      },
    }
  }

  // Line (from start point to end point)
  // Note: Satori doesn't support complex transforms well, so we simplify
  if (type === 'line') {
    const endX = (obj.endX ?? obj.x) * scale + offsetX
    const endY = (obj.endY ?? obj.y) * scale + offsetY
    const lineWidth = (obj.height ?? 20) * scale

    // Calculate length and angle
    const dx = endX - x
    const dy = endY - y
    const length = Math.sqrt(dx * dx + dy * dy)

    // If no length, skip
    if (length < 1) return null

    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    const color = getObjectColor(obj)
    const fillColor = getColorWithAlpha(color, 0.4)
    const borderColor = getColorWithAlpha(color, 0.8)

    // Render at start point and rotate from there
    return {
      type: 'div',
      key: `obj${idx}`,
      props: {
        style: {
          position: 'absolute',
          left: x,
          top: y - lineWidth / 2,
          width: length,
          height: lineWidth,
          backgroundColor: fillColor,
          border: `2px solid ${borderColor}`,
          transformOrigin: 'left center',
          transform: `rotate(${angle}deg)`,
        },
      },
    }
  }

  // Fan AoE (using inline SVG)
  if (type === 'fan_aoe') {
    const radius = 240 * objScale * scale
    const arcAngle = obj.arcAngle ?? 90
    const rotation = obj.angle ?? 0
    const color = getObjectColor(obj)

    // Build transform string for rotation and flips
    const buildTransform = (): string | undefined => {
      const transforms: string[] = []
      if (rotation) transforms.push(`rotate(${rotation}deg)`)
      if (obj.horizontalFlip) transforms.push('scaleX(-1)')
      if (obj.verticalFlip) transforms.push('scaleY(-1)')
      return transforms.length > 0 ? transforms.join(' ') : undefined
    }
    const transform = buildTransform()

    // Bounding box calculation
    const arcAngleRad = (arcAngle * Math.PI) / 180
    const startAngleRad = -Math.PI / 2
    const endAngleRad = startAngleRad + arcAngleRad

    // End point of the arc
    const outerEndX = radius * Math.cos(endAngleRad)
    const outerEndY = radius * Math.sin(endAngleRad)

    // Bounds include tip (0,0), start point (0, -radius) and end point
    let minX = Math.min(0, outerEndX)
    let maxX = Math.max(0, outerEndX)
    let minY = Math.min(0, -radius, outerEndY)
    let maxY = Math.max(0, -radius, outerEndY)

    // Check cardinal directions if they fall within the arc sweep
    if (endAngleRad > 0) { maxX = radius }
    if (endAngleRad > Math.PI / 2) { maxY = radius }
    if (endAngleRad > Math.PI) { minX = -radius }

    // Center of the bounding box
    const bboxCenterX = (minX + maxX) / 2
    const bboxCenterY = (minY + maxY) / 2

    // Size of the SVG canvas
    const svgSize = radius * 2 + 8

    // Calculate cone tip position in SVG coordinates
    // SVG Center = BBox Center. Tip is relative to BBox Center.
    const tipX = svgSize / 2 - bboxCenterX
    const tipY = svgSize / 2 - bboxCenterY

    // Path calculation
    const startAngle = -90
    const endAngle = -90 + arcAngle
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = tipX + radius * Math.cos(startRad)
    const y1 = tipY + radius * Math.sin(startRad)
    const x2 = tipX + radius * Math.cos(endRad)
    const y2 = tipY + radius * Math.sin(endRad)

    const largeArc = arcAngle > 180 ? 1 : 0

    // Cone path: Tip -> Start -> Arc -> End -> Close
    const d = `M ${tipX} ${tipY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

    return {
      type: 'svg',
      key: `obj${idx}`,
      props: {
        width: svgSize,
        height: svgSize,
        viewBox: `0 0 ${svgSize} ${svgSize}`,
        style: {
          position: 'absolute',
          left: x - svgSize / 2,
          top: y - svgSize / 2,
          ...(transform && { transform }),
        },
        children: {
          type: 'path',
          props: {
            d,
            fill: color,
            fillOpacity: 0.5,
            stroke: color,
            strokeWidth: 2,
          },
        },
      },
    }
  }

  // Text
  if (type === 'text') {
    const fontSize = 16 * scale
    const color = getObjectColor(obj)
    return {
      type: 'div',
      key: `obj${idx}`,
      props: {
        style: {
          position: 'absolute',
          left: x,
          top: y,
          fontSize: fontSize,
          color: color,
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
    const hasTransform = obj.angle || obj.horizontalFlip || obj.verticalFlip

    // Fast path: simple icons with no transforms
    if (!hasTransform && type !== 'linear_knockback' && type !== 'line_stack') {
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

    // Build transform string for rotation and flip
    const transforms: string[] = []
    if (obj.angle) {
      transforms.push(`rotate(${obj.angle}deg)`)
    }
    if (obj.horizontalFlip) {
      transforms.push('scaleX(-1)')
    }
    if (obj.verticalFlip) {
      transforms.push('scaleY(-1)')
    }
    const transform = transforms.length > 0 ? transforms.join(' ') : null

    // Special handling for linear_knockback (grid of icons)
    if (type === 'linear_knockback') {
      // Cap grid size to prevent excessive element generation
      const hCount = Math.min(obj.horizontalCount ?? 1, MAX_KNOCKBACK_GRID)
      const vCount = Math.min(obj.verticalCount ?? 1, MAX_KNOCKBACK_GRID)
      // Use baseSize for spacing calculation (same as StrategyBoardRenderer)
      const baseSpacing = baseSize * objScale * 0.91
      const spacing = baseSpacing * scale
      const children = []

      // Convert angle to radians for rotation calculation
      // Fast path: skip trig for zero rotation
      const angleRad = (obj.angle ?? 0) * Math.PI / 180
      const cos = angleRad === 0 ? 1 : Math.cos(angleRad)
      const sin = angleRad === 0 ? 0 : Math.sin(angleRad)

      for (let row = 0; row < vCount; row++) {
        for (let col = 0; col < hCount; col++) {
          // Calculate unrotated grid offsets
          const rawOffsetX = (col - (hCount - 1) / 2) * spacing
          const rawOffsetY = (row - (vCount - 1) / 2) * spacing

          // Rotate offsets around the center point
          const gridOffsetX = rawOffsetX * cos - rawOffsetY * sin
          const gridOffsetY = rawOffsetX * sin + rawOffsetY * cos

          children.push({
            type: 'img',
            key: `${idx}-${row}-${col}`,
            props: {
              src: iconDataUrl,
              width: size,
              height: size,
              style: {
                position: 'absolute',
                left: x - size / 2 + gridOffsetX,
                top: y - size / 2 + gridOffsetY,
                ...(transform && { transform }),
              },
            },
          })
        }
      }
      // Return first child if single, otherwise use wrapper
      if (children.length === 1) return children[0]
      return children
    }

    // Special handling for line_stack (vertical repeat)
    if (type === 'line_stack') {
      // Cap display count to prevent excessive element generation
      const displayCount = Math.min(obj.displayCount ?? 1, MAX_LINE_STACK)
      // Use baseSize for spacing calculation (same as StrategyBoardRenderer)
      const baseSpacing = baseSize * objScale * 1.04
      const spacing = baseSpacing * scale
      const children = []

      for (let i = 0; i < displayCount; i++) {
        const gridOffsetY = (i - (displayCount - 1) / 2) * spacing
        children.push({
          type: 'img',
          key: `${idx}-${i}`,
          props: {
            src: iconDataUrl,
            width: size,
            height: size,
            style: {
              position: 'absolute',
              left: x - size / 2,
              top: y - size / 2 + gridOffsetY,
              ...(transform && { transform }),
            },
          },
        })
      }
      // Return first child if single, otherwise use wrapper
      if (children.length === 1) return children[0]
      return children
    }

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
          ...(transform && { transform }),
        },
      },
    }
  }

  // Fallback to colored circle (for unknown icon types)
  const baseSize = ICON_SIZE_DEFAULTS[type] ?? 32
  const size = baseSize * objScale * scale

  // Build transform for fallback
  const fallbackTransforms: string[] = []
  if (obj.angle) fallbackTransforms.push(`rotate(${obj.angle}deg)`)
  if (obj.horizontalFlip) fallbackTransforms.push('scaleX(-1)')
  if (obj.verticalFlip) fallbackTransforms.push('scaleY(-1)')
  const fallbackTransform = fallbackTransforms.length > 0 ? fallbackTransforms.join(' ') : null

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
        ...(fallbackTransform && { transform: fallbackTransform }),
      },
    },
  }
}
