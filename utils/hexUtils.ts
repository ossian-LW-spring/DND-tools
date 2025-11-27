import { HEX_SIZE } from '../constants';
import { Point, HexCoord } from '../types';

export const HexUtils = {
  // Convert offset (q,r) to pixel (x,y)
  hexToPixel: (q: number, r: number): Point => {
    const x = HEX_SIZE * Math.sqrt(3) * (q + 0.5 * (r & 1));
    const y = HEX_SIZE * 3/2 * r;
    return { x, y };
  },

  // Calculate the 6 points of a hexagon
  getHexPoints: (x: number, y: number, radius: number): string => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle_deg = 60 * i - 30;
      const angle_rad = Math.PI / 180 * angle_deg;
      points.push(
        `${x + radius * Math.cos(angle_rad)},${y + radius * Math.sin(angle_rad)}`
      );
    }
    return points.join(" ");
  },

  // Generate unique ID for coord
  getHexId: (q: number, r: number): string => `${q},${r}`,

  // Parse ID back to coords
  parseHexId: (id: string): HexCoord => {
    const [q, r] = id.split(',').map(Number);
    return { q, r };
  },

  // Check if two hexes are neighbors (for roads)
  isNeighbor: (h1: HexCoord, h2: HexCoord): boolean => {
    const p1 = HexUtils.hexToPixel(h1.q, h1.r);
    const p2 = HexUtils.hexToPixel(h2.q, h2.r);
    const dist = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
    // distance between centers should be ~ sqrt(3) * radius (~1.73 * size)
    // allowing small epsilon for floating point
    return dist < HEX_SIZE * 1.9; 
  },

  // Calculate new coord based on direction vector (dx, dy)
  getDisplacedHex: (q: number, r: number, dx: number, dy: number): HexCoord => {
      // Grid is "Odd-R" (Odd rows shoved right)
      // dx: -1 (Left), 0, 1 (Right)
      // dy: -1 (Up), 0, 1 (Down)
      
      // Pure Horizontal
      if (dy === 0) return { q: q + dx, r };
      
      const isEven = (r & 1) === 0; // Row 0, 2, 4... (Not shifted)
      
      if (dy === -1) { // UP
          if (dx === -1) { // UP-LEFT (NW)
              // Even: (q-1, r-1)
              // Odd:  (q, r-1)
              return { q: isEven ? q - 1 : q, r: r - 1 };
          }
          if (dx === 1) { // UP-RIGHT (NE)
              // Even: (q, r-1)
              // Odd:  (q+1, r-1)
              return { q: isEven ? q : q + 1, r: r - 1 };
          }
          // Pure UP (Zig-Zag)
          // Even (Right bias): NE -> (q, r-1)
          // Odd (Left bias): NW -> (q, r-1)
          return { q, r: r - 1 }; 
      }
      
      if (dy === 1) { // DOWN
          if (dx === -1) { // DOWN-LEFT (SW)
              // Even: (q-1, r+1)
              // Odd:  (q, r+1)
              return { q: isEven ? q - 1 : q, r: r + 1 };
          }
          if (dx === 1) { // DOWN-RIGHT (SE)
              // Even: (q, r+1)
              // Odd:  (q+1, r+1)
              return { q: isEven ? q : q + 1, r: r + 1 };
          }
          // Pure DOWN (Zig-Zag)
          return { q, r: r + 1 };
      }
      
      return { q, r };
  }
};