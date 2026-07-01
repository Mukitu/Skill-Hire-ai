import React from 'react';

/**
 * Deterministically generates a beautiful, high-tech SVG QR Code
 * complete with correct corner finder squares and seeded data patterns.
 */
export function generateQRCodeSVG(text: string, size: number = 120, fgColor: string = '#2dd4bf') {
  // Simple seedable hash function
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 21x21 Grid
  const grid: boolean[][] = Array(21).fill(null).map(() => Array(21).fill(false));

  // Helper to draw Finder Patterns (7x7)
  const drawFinderPattern = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[row + r][col + c] = isBorder || isCenter;
      }
    }
  };

  // Draw three standard finder patterns
  drawFinderPattern(0, 0);     // Top Left
  drawFinderPattern(0, 14);    // Top Right
  drawFinderPattern(14, 0);    // Bottom Left

  // Draw alignment pattern at bottom right (3x3 center)
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
      const isCenter = r === 2 && c === 2;
      grid[14 + r][14 + c] = isBorder || isCenter;
    }
  }

  // Populate remaining space deterministically based on seed hash
  let tempHash = Math.abs(hash);
  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 21; c++) {
      // Skip finder patterns
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= 13;
      const inBottomLeft = r >= 13 && c < 8;
      const inBottomRight = r >= 13 && c >= 13;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inBottomRight) {
        tempHash = (tempHash * 16807) % 2147483647;
        grid[r][c] = (tempHash % 3) === 0; // ~33% density
      }
    }
  }

  // Generate SVG blocks
  const cellSize = size / 21;
  const rects: React.JSX.Element[] = [];

  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 21; c++) {
      if (grid[r][c]) {
        // Round edges of points slightly for premium look
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize - 0.2}
            height={cellSize - 0.2}
            rx={cellSize * 0.2}
            fill={fgColor}
          />
        );
      }
    }
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`} 
      className="bg-white p-1.5 rounded-lg shadow-inner border border-slate-200"
      xmlns="http://www.w3.org/2000/svg"
    >
      {rects}
      {/* Central cyber security tech dot */}
      <circle cx={size / 2} cy={size / 2} r={cellSize * 1.5} fill="#0d1117" stroke={fgColor} strokeWidth={cellSize * 0.4} />
      <circle cx={size / 2} cy={size / 2} r={cellSize * 0.4} fill={fgColor} />
    </svg>
  );
}
