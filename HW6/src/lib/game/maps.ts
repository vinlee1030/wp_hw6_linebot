export type MazeCell = "W" | "F" | "K" | "E" | "R";

export const MAZE_1: MazeCell[][] = [
  ["W", "W", "W", "W", "W", "W", "W"],
  ["W", "F", "F", "F", "R", "F", "W"],
  ["W", "F", "W", "F", "W", "F", "W"],
  ["W", "F", "W", "K", "F", "F", "W"],
  ["W", "F", "F", "F", "W", "E", "W"],
  ["W", "W", "W", "W", "W", "W", "W"],
  ["W", "W", "W", "W", "W", "W", "W"],
];

export const MAPS: Record<string, MazeCell[][]> = {
  maze1: MAZE_1,
};

