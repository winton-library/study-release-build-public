import { useState, useEffect, useCallback, useRef } from "react";
import {
  GetState,
  ToggleCell,
  SetCell,
  Step,
  StartAutoPlay,
  StopAutoPlay,
  Clear,
  Randomize,
} from "../wailsjs/go/main/App";
import { EventsOn, EventsOff } from "../wailsjs/runtime/runtime";
import "./App.css";

interface GameState {
  grid: boolean[][];
  generation: number;
  playing: boolean;
}

const CELL_SIZE = 14;
const GAP = 1;
const PITCH = CELL_SIZE + GAP;

const COLOR_DEAD = "#16213e";
const COLOR_ALIVE = "#00d4aa";
const COLOR_GAP = "#2a2a4a";

function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: boolean[][],
  width: number,
  height: number
) {
  ctx.fillStyle = COLOR_GAP;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      ctx.fillStyle = grid[y][x] ? COLOR_ALIVE : COLOR_DEAD;
      ctx.fillRect(x * PITCH, y * PITCH, CELL_SIZE, CELL_SIZE);
    }
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  alive: boolean
) {
  ctx.fillStyle = alive ? COLOR_ALIVE : COLOR_DEAD;
  ctx.fillRect(x * PITCH, y * PITCH, CELL_SIZE, CELL_SIZE);
}

function cellFromEvent(
  canvas: HTMLCanvasElement,
  e: React.MouseEvent | MouseEvent
): [number, number] {
  const rect = canvas.getBoundingClientRect();
  return [
    Math.floor((e.clientX - rect.left) / PITCH),
    Math.floor((e.clientY - rect.top) / PITCH),
  ];
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({ grid: [], generation: 0, playing: false });
  const drawingRef = useRef(false);
  const drawModeRef = useRef(true); // true = draw alive, false = erase
  const lastCellRef = useRef<string>(""); // track last cell to avoid duplicate calls
  const [generation, setGeneration] = useState(0);
  const [playing, setPlaying] = useState(false);

  const updateState = useCallback((s: GameState) => {
    stateRef.current = s;
    setGeneration(s.generation);
    setPlaying(s.playing);

    const canvas = canvasRef.current;
    if (!canvas || s.grid.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const h = s.grid.length;
    const w = s.grid[0].length;
    const canvasW = w * PITCH - GAP;
    const canvasH = h * PITCH - GAP;

    if (canvas.width !== canvasW || canvas.height !== canvasH) {
      canvas.width = canvasW;
      canvas.height = canvasH;
    }

    drawGrid(ctx, s.grid, w, h);
  }, []);

  useEffect(() => {
    GetState().then(updateState);
  }, [updateState]);

  useEffect(() => {
    EventsOn("game-tick", (s: GameState) => updateState(s));
    EventsOn("cell-updated", (x: number, y: number, alive: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Update local grid state
      const grid = stateRef.current.grid;
      if (grid[y]) grid[y][x] = alive;
      drawCell(ctx, x, y, alive);
    });
    return () => {
      EventsOff("game-tick");
      EventsOff("cell-updated");
    };
  }, [updateState]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (stateRef.current.playing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const [x, y] = cellFromEvent(canvas, e);
      const grid = stateRef.current.grid;
      if (!grid[y]) return;

      // First cell: toggle. Then drag continues in that mode.
      const currentlyAlive = grid[y][x];
      drawModeRef.current = !currentlyAlive;
      drawingRef.current = true;
      lastCellRef.current = `${x},${y}`;

      ToggleCell(x, y).then(updateState);
    },
    [updateState]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current || stateRef.current.playing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const [x, y] = cellFromEvent(canvas, e);
      const key = `${x},${y}`;
      if (key === lastCellRef.current) return;
      lastCellRef.current = key;

      const grid = stateRef.current.grid;
      if (!grid[y] || grid[y][x] === drawModeRef.current) return;

      SetCell(x, y, drawModeRef.current);
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    drawingRef.current = false;
    lastCellRef.current = "";
  }, []);

  // Stop drawing if mouse leaves canvas
  const handleMouseLeave = useCallback(() => {
    drawingRef.current = false;
    lastCellRef.current = "";
  }, []);

  const handleStep = useCallback(() => {
    Step().then(updateState);
  }, [updateState]);

  const handlePlay = useCallback(() => {
    StartAutoPlay(100);
    setPlaying(true);
  }, []);

  const handleStop = useCallback(() => {
    StopAutoPlay().then(updateState);
  }, [updateState]);

  const handleClear = useCallback(() => {
    Clear().then(updateState);
  }, [updateState]);

  const handleRandomize = useCallback(() => {
    Randomize().then(updateState);
  }, [updateState]);

  return (
    <div className="container">
      <h1>Conway's Game of Life</h1>
      <div className="controls">
        {playing ? (
          <button onClick={handleStop}>Pause</button>
        ) : (
          <button onClick={handlePlay}>Play</button>
        )}
        <button onClick={handleStep} disabled={playing}>
          Step
        </button>
        <button className="secondary" onClick={handleRandomize}>
          Randomize
        </button>
        <button className="danger" onClick={handleClear}>
          Clear
        </button>
        <span className="generation">Generation: {generation}</span>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

export default App;
