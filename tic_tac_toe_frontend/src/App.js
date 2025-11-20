import React, { useState, useMemo, useCallback } from 'react';
import './App.css';
import './index.css';

/**
 * Ocean Professional theme constants
 * Primary: #2563EB, Secondary: #F59E0B, Error: #EF4444, Background: #f9fafb, Surface: #ffffff, Text: #111827
 */

/** Calculate winner helper for board states */
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// PUBLIC_INTERFACE
export function calculateWinner(squares) {
  /** Determine the winner ('X' or 'O') and return the winning line indices if any. */
  for (let i = 0; i < LINES.length; i += 1) {
    const [a, b, c] = LINES[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { player: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

/** Square component: accessible button representing a cell */
// PUBLIC_INTERFACE
function Square({ value, onClick, isWinning, index, disabled }) {
  /** A single interactive square; uses aria-pressed semantics and clear focus styles. */
  const label = value ? `Cell ${index + 1}, ${value}` : `Cell ${index + 1}, empty`;
  return (
    <button
      type="button"
      className={`ttt-square ${isWinning ? 'ttt-square--win' : ''} ${
        value ? 'ttt-square--filled' : ''
      }`}
      onClick={onClick}
      aria-pressed={Boolean(value)}
      aria-label={label}
      disabled={disabled}
      data-index={index}
    >
      <span className="ttt-square__value">{value}</span>
    </button>
  );
}

/** Board component: renders the 3x3 grid with proper ARIA semantics */
// PUBLIC_INTERFACE
function Board({ squares, onSquareClick, winningLine, isBoardLocked }) {
  /** Renders a 3x3 grid with role=grid and role=gridcell for accessibility. */
  return (
    <div
      className="ttt-board"
      role="grid"
      aria-label="Tic Tac Toe Board"
      aria-rowcount={3}
      aria-colcount={3}
    >
      {Array.from({ length: 3 }).map((_, row) => (
        <div className="ttt-board__row" role="row" key={`row-${row}`}>
          {Array.from({ length: 3 }).map((__, col) => {
            const idx = row * 3 + col;
            const isWinning = winningLine?.includes(idx);
            return (
              <div
                className="ttt-board__cell"
                role="gridcell"
                aria-colindex={col + 1}
                aria-rowindex={row + 1}
                key={`cell-${idx}`}
              >
                <Square
                  value={squares[idx]}
                  onClick={() => onSquareClick(idx)}
                  isWinning={isWinning}
                  index={idx}
                  disabled={isBoardLocked || Boolean(squares[idx])}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Status bar component to display game state */
// PUBLIC_INTERFACE
function StatusBar({ status, substatus }) {
  /** Displays the main status and optional substatus text. */
  return (
    <div className="ttt-status" role="status" aria-live="polite">
      <div className="ttt-status__primary">{status}</div>
      {substatus ? <div className="ttt-status__secondary">{substatus}</div> : null}
    </div>
  );
}

/** Controls component: actions like new game and navigation through history */
// PUBLIC_INTERFACE
function Controls({ onNewGame, onReset, canReset, history, jumpTo, currentStep }) {
  /** Action buttons and a history list to time-travel into previous moves. */
  return (
    <div className="ttt-controls">
      <div className="ttt-controls__actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNewGame}
          aria-label="Start a new game"
        >
          New Game
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onReset}
          aria-label="Reset current game"
          disabled={!canReset}
        >
          Reset
        </button>
      </div>
      <div className="ttt-controls__history" aria-label="Move history">
        <div className="ttt-controls__history-title">Move History</div>
        <ol className="ttt-controls__history-list">
          {history.map((_, move) => {
            const desc = move ? `Go to move #${move}` : 'Go to game start';
            const isCurrent = currentStep === move;
            return (
              <li key={`move-${move}`}>
                <button
                  type="button"
                  className={`btn btn-ghost ${isCurrent ? 'btn-ghost--active' : ''}`}
                  onClick={() => jumpTo(move)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={desc}
                >
                  {desc}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** Main Game component orchestrating board state and history */
// PUBLIC_INTERFACE
export default function App() {
  /** Interactive Tic Tac Toe game with local two-player play and time-travel history. */
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [stepNumber, setStepNumber] = useState(0);
  const [xIsNext, setXIsNext] = useState(true);

  const current = history[stepNumber];
  const winnerInfo = useMemo(() => calculateWinner(current), [current]);
  const isDraw = useMemo(
    () => !winnerInfo && current.every((c) => c !== null),
    [winnerInfo, current]
  );
  const isLocked = Boolean(winnerInfo) || isDraw;

  const statusText = useMemo(() => {
    if (winnerInfo?.player) return `Winner: ${winnerInfo.player}`;
    if (isDraw) return 'Draw: No more moves';
    return `Next Player: ${xIsNext ? 'X' : 'O'}`;
  }, [winnerInfo, isDraw, xIsNext]);

  const substatusText = useMemo(() => {
    if (winnerInfo?.line) return `Winning line: ${winnerInfo.line.map((i) => i + 1).join(', ')}`;
    if (isDraw) return 'All cells filled.';
    return `Move: ${stepNumber}`;
  }, [winnerInfo, isDraw, stepNumber]);

  const handleClick = useCallback(
    (i) => {
      if (isLocked || current[i]) return;
      const truncated = history.slice(0, stepNumber + 1);
      const nextSquares = current.slice();
      nextSquares[i] = xIsNext ? 'X' : 'O';
      setHistory(truncated.concat([nextSquares]));
      setStepNumber(truncated.length);
      setXIsNext(!xIsNext);
    },
    [isLocked, current, history, stepNumber, xIsNext]
  );

  const jumpTo = useCallback(
    (step) => {
      setStepNumber(step);
      setXIsNext(step % 2 === 0);
    },
    []
  );

  const handleNewGame = useCallback(() => {
    setHistory([Array(9).fill(null)]);
    setStepNumber(0);
    setXIsNext(true);
  }, []);

  const handleReset = useCallback(() => {
    // Reset current board only, keep past history before current move
    const baseHistory = history.slice(0, stepNumber);
    setHistory(baseHistory.concat([Array(9).fill(null)]));
    setXIsNext(true);
  }, [history, stepNumber]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Tic Tac Toe</h1>
        <p className="app-subtitle">Ocean Professional</p>
      </header>

      <main className="app-main">
        <StatusBar status={statusText} substatus={substatusText} />
        <section className="game-area">
          <Board
            squares={current}
            onSquareClick={handleClick}
            winningLine={winnerInfo?.line}
            isBoardLocked={isLocked}
          />
          <Controls
            onNewGame={handleNewGame}
            onReset={handleReset}
            canReset={stepNumber > 0 || current.some((c) => c !== null)}
            history={history}
            jumpTo={jumpTo}
            currentStep={stepNumber}
          />
        </section>
      </main>

      <footer className="app-footer" aria-label="Footer">
        <small>Two-player local play • No data collected</small>
      </footer>
    </div>
  );
}
