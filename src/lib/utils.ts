import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Converted from signed int32 values (format: ARGB where first byte is alpha)
// Stored as [r, g, b] tuples for efficient operations
export const VALID_COLORS_RGB: readonly [number, number, number][] = [
  [255, 255, 255],  // -1
  [255, 189, 191],  // -16961
  [255, 224, 200],  // -7992
  [255, 248, 176],  // -1872
  [233, 255, 226],  // -1441822
  [232, 255, 254],  // -1507330
  [156, 208, 244],  // -6500108
  [255, 220, 255],  // -8961
  [248, 248, 248],  // -460552
  [255, 0, 0],      // -65536
  [255, 128, 0],    // -32768
  [255, 255, 0],    // -256
  [0, 255, 0],      // -16711936
  [0, 255, 255],    // -16711681
  [0, 0, 255],      // -16776961
  [255, 0, 255],    // -65281
  [224, 224, 224],  // -2039584
  [255, 76, 76],    // -46004
  [255, 166, 102],  // -22938
  [255, 255, 178],  // -78
  [128, 255, 0],    // -8323328
  [188, 255, 240],  // -4390928
  [0, 128, 255],    // -16744193
  [226, 96, 144],   // -1941360
  [216, 216, 216],  // -2565928
  [255, 127, 127],  // -32897
  [255, 206, 172],  // -12628
  [255, 222, 115],  // -8589
  [128, 248, 96],   // -8325024
  [102, 230, 255],  // -10033409
  [148, 192, 255],  // -7028481
  [255, 140, 198],  // -29498
  [204, 204, 204],  // -3355444
  [255, 192, 192],  // -16192
  [255, 104, 0],    // -38912
  [240, 200, 108],  // -997268
  [212, 255, 127],  // -2818177
  [172, 220, 230],  // -5448474
  [128, 128, 255],  // -8355585
  [255, 184, 224],  // -18208
  [191, 191, 191],  // -4210753
  [216, 192, 192],  // -2572096
  [216, 104, 108],  // -2594708
  [204, 204, 102],  // -3355546
  [172, 216, 72],   // -5449656
  [176, 232, 232],  // -5183256
  [179, 140, 255],  // -5010177
  [224, 168, 188],  // -2053956
  [166, 166, 166],  // -5855578
  [198, 162, 162],  // -3759454
  [216, 190, 172],  // -2572628
  [200, 192, 160],  // -3620704
  [58, 232, 180],   // -12916556
  [60, 232, 232],   // -12785432
  [224, 192, 248],  // -2047752
  [224, 136, 244],  // -2062092
] as const;

// Derived rgba strings for CSS usage
export const VALID_COLORS = VALID_COLORS_RGB.map(
  ([r, g, b]) => `rgba(${r}, ${g}, ${b}, 1)`
) as string[];

/**
 * Find the closest matching color from VALID_COLORS palette
 * @param r - Red component (0-255) or an object with r, g, b properties
 * @param g - Green component (0-255) - optional if first arg is object
 * @param b - Blue component (0-255) - optional if first arg is object
 * @returns Object containing the index, rgba string, rgb tuple, and distance
 */
export function findClosestColor(
  r: number | { r: number; g: number; b: number },
  g?: number,
  b?: number
): { index: number; color: string; rgb: readonly [number, number, number]; distance: number } {
  // Handle object input
  const red = typeof r === 'object' ? r.r : r;
  const green = typeof r === 'object' ? r.g : (g ?? 0);
  const blue = typeof r === 'object' ? r.b : (b ?? 0);

  let closestIndex = 0;
  let closestDistance = Infinity;

  for (let i = 0; i < VALID_COLORS_RGB.length; i++) {
    const [cr, cg, cb] = VALID_COLORS_RGB[i];
    // Euclidean distance in RGB space
    const distance = Math.sqrt(
      (red - cr) ** 2 +
      (green - cg) ** 2 +
      (blue - cb) ** 2
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
      if (distance === 0) break; // Exact match
    }
  }

  return {
    index: closestIndex,
    color: VALID_COLORS[closestIndex],
    rgb: VALID_COLORS_RGB[closestIndex],
    distance: closestDistance
  };
}
