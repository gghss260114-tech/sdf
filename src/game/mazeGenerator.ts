import { ElementType } from '../types/game.ts';

export interface MazeGrid {
  width: number;
  height: number;
  grid: number[][]; // 0: wall, 1: path, 2: spawn, 3: exit
  cellSize: number; // in 3D world units (e.g. 5m)
  spawnPos: { x: number; z: number };
  exitPos: { x: number; z: number };
  elementSpawns: Array<{ x: number; z: number; type: ElementType }>;
  monsterSpawns: Array<{ x: number; z: number }>;
}

export function generateMaze(isHard: boolean = false): MazeGrid {
  const width = isHard ? 23 : 17;
  const height = isHard ? 23 : 17;
  const cellSize = 5.0; // 5 units per corridor

  // Initialize all walls (0)
  const grid: number[][] = Array.from({ length: height }, () => Array(width).fill(0));

  // Randomized Depth-First Search for maze generation
  const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

  function carve(cx: number, cy: number) {
    visited[cy][cx] = true;
    grid[cy][cx] = 1;

    const directions = [
      [0, -2], // North
      [2, 0],  // East
      [0, 2],  // South
      [-2, 0], // West
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of directions) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && !visited[ny][nx]) {
        // Carve wall between
        grid[cy + dy / 2][cx + dx / 2] = 1;
        carve(nx, ny);
      }
    }
  }

  // Start carving from (1, 1)
  carve(1, 1);

  // Add some loops / extra paths so players don't get trapped too easily
  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      if (Math.random() < 0.25) {
        grid[y][x] = 1;
      }
    }
  }

  // Player spawn at (1, 1)
  grid[1][1] = 2;
  const spawnPos = {
    x: (1 - width / 2) * cellSize,
    z: (1 - height / 2) * cellSize,
  };

  // Exit portal at (width - 2, height - 2)
  grid[height - 2][width - 2] = 3;
  const exitPos = {
    x: (width - 2 - width / 2) * cellSize,
    z: (height - 2 - height / 2) * cellSize,
  };

  // Gather all open pathway coordinates
  const openCells: Array<{ gx: number; gy: number }> = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === 1) {
        // Don't spawn right next to player
        const distFromSpawn = Math.hypot(x - 1, y - 1);
        if (distFromSpawn > 2) {
          openCells.push({ gx: x, gy: y });
        }
      }
    }
  }

  // Shuffle open cells
  openCells.sort(() => Math.random() - 0.5);

  // Distribute chemical elements abundantly: H, O, Cl, C, N, S
  const elementTypes: ElementType[] = ['H', 'H', 'H', 'O', 'O', 'Cl', 'Cl', 'C', 'C', 'N', 'N', 'S', 'S'];
  const elementSpawns: Array<{ x: number; z: number; type: ElementType }> = [];
  const totalElementsToSpawn = Math.min(openCells.length, isHard ? 50 : 35);

  for (let i = 0; i < totalElementsToSpawn; i++) {
    const cell = openCells[i];
    const type = elementTypes[i % elementTypes.length];
    elementSpawns.push({
      x: (cell.gx - width / 2) * cellSize + (Math.random() - 0.5) * 1.5,
      z: (cell.gy - height / 2) * cellSize + (Math.random() - 0.5) * 1.5,
      type,
    });
  }

  // Spawn monsters far from player
  const monsterSpawns: Array<{ x: number; z: number }> = [];
  const monsterCount = isHard ? 3 : 1;

  // Filter cells with at least 8 cells distance from player
  const farCells = openCells.filter(c => Math.hypot(c.gx - 1, c.gy - 1) > 6);
  farCells.sort(() => Math.random() - 0.5);

  for (let m = 0; m < monsterCount; m++) {
    const targetCell = farCells[m] || openCells[openCells.length - 1 - m];
    monsterSpawns.push({
      x: (targetCell.gx - width / 2) * cellSize,
      z: (targetCell.gy - height / 2) * cellSize,
    });
  }

  return {
    width,
    height,
    grid,
    cellSize,
    spawnPos,
    exitPos,
    elementSpawns,
    monsterSpawns,
  };
}
