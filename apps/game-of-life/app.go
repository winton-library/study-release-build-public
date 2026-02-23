package main

import (
	"context"
	"sync"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	defaultWidth  = 40
	defaultHeight = 30
)

// App is the backend for the Game of Life.
// Exported methods are bound to the frontend via Wails.
type App struct {
	ctx context.Context

	mu       sync.Mutex
	grid     [][]bool
	width    int
	height   int
	gen      int
	playing  bool
	stopChan chan struct{}
}

// GameState is sent to the frontend on each tick.
type GameState struct {
	Grid       [][]bool `json:"grid"`
	Generation int      `json:"generation"`
	Playing    bool     `json:"playing"`
}

func NewApp() *App {
	return &App{
		width:  defaultWidth,
		height: defaultHeight,
		grid:   makeGrid(defaultWidth, defaultHeight),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// GetState returns the current game state.
func (a *App) GetState() GameState {
	a.mu.Lock()
	defer a.mu.Unlock()
	return GameState{
		Grid:       a.grid,
		Generation: a.gen,
		Playing:    a.playing,
	}
}

// ToggleCell flips a cell at (x, y).
func (a *App) ToggleCell(x, y int) GameState {
	a.mu.Lock()
	defer a.mu.Unlock()
	if x >= 0 && x < a.width && y >= 0 && y < a.height {
		a.grid[y][x] = !a.grid[y][x]
	}
	return GameState{
		Grid:       a.grid,
		Generation: a.gen,
		Playing:    a.playing,
	}
}

// SetCell sets a cell at (x, y) to the given value. Used for drag-drawing.
func (a *App) SetCell(x, y int, alive bool) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if x >= 0 && x < a.width && y >= 0 && y < a.height {
		a.grid[y][x] = alive
	}
	wailsruntime.EventsEmit(a.ctx, "cell-updated", x, y, alive)
}

// Step advances one generation.
func (a *App) Step() GameState {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.grid = nextGeneration(a.grid, a.width, a.height)
	a.gen++
	return GameState{
		Grid:       a.grid,
		Generation: a.gen,
		Playing:    a.playing,
	}
}

// StartAutoPlay runs the game automatically, emitting state via Wails events.
func (a *App) StartAutoPlay(intervalMs int) {
	a.mu.Lock()
	if a.playing {
		a.mu.Unlock()
		return
	}
	a.playing = true
	a.stopChan = make(chan struct{})
	a.mu.Unlock()

	if intervalMs < 50 {
		intervalMs = 50
	}

	go func() {
		ticker := time.NewTicker(time.Duration(intervalMs) * time.Millisecond)
		defer ticker.Stop()

		for {
			select {
			case <-a.stopChan:
				return
			case <-ticker.C:
				a.mu.Lock()
				a.grid = nextGeneration(a.grid, a.width, a.height)
				a.gen++
				state := GameState{
					Grid:       a.grid,
					Generation: a.gen,
					Playing:    a.playing,
				}
				a.mu.Unlock()
				wailsruntime.EventsEmit(a.ctx, "game-tick", state)
			}
		}
	}()
}

// StopAutoPlay stops the auto-play goroutine.
func (a *App) StopAutoPlay() GameState {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.playing {
		close(a.stopChan)
		a.playing = false
	}
	return GameState{
		Grid:       a.grid,
		Generation: a.gen,
		Playing:    a.playing,
	}
}

// Clear resets the grid and generation counter.
func (a *App) Clear() GameState {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.playing {
		close(a.stopChan)
		a.playing = false
	}
	a.grid = makeGrid(a.width, a.height)
	a.gen = 0
	return GameState{
		Grid:       a.grid,
		Generation: a.gen,
		Playing:    a.playing,
	}
}

// Randomize fills the grid with random cells.
func (a *App) Randomize() GameState {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.playing {
		close(a.stopChan)
		a.playing = false
	}
	a.grid = randomGrid(a.width, a.height)
	a.gen = 0
	return GameState{
		Grid:       a.grid,
		Generation: a.gen,
		Playing:    a.playing,
	}
}

func makeGrid(w, h int) [][]bool {
	grid := make([][]bool, h)
	for i := range grid {
		grid[i] = make([]bool, w)
	}
	return grid
}

func randomGrid(w, h int) [][]bool {
	grid := make([][]bool, h)
	// Simple pseudo-random using time
	seed := time.Now().UnixNano()
	for y := range grid {
		grid[y] = make([]bool, w)
		for x := range grid[y] {
			seed = (seed*6364136223846793005 + 1442695040888963407) & 0x7fffffffffffffff
			grid[y][x] = seed%3 == 0 // ~33% alive
		}
	}
	return grid
}

func nextGeneration(grid [][]bool, w, h int) [][]bool {
	next := make([][]bool, h)
	for y := range next {
		next[y] = make([]bool, w)
		for x := range next[y] {
			neighbors := countNeighbors(grid, x, y, w, h)
			if grid[y][x] {
				next[y][x] = neighbors == 2 || neighbors == 3
			} else {
				next[y][x] = neighbors == 3
			}
		}
	}
	return next
}

func countNeighbors(grid [][]bool, x, y, w, h int) int {
	count := 0
	for dy := -1; dy <= 1; dy++ {
		for dx := -1; dx <= 1; dx++ {
			if dx == 0 && dy == 0 {
				continue
			}
			nx, ny := (x+dx+w)%w, (y+dy+h)%h
			if grid[ny][nx] {
				count++
			}
		}
	}
	return count
}
