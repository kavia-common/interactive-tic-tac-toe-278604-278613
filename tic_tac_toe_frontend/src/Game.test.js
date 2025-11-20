import { render, screen, fireEvent } from '@testing-library/react';
import App, { calculateWinner } from './App';

test('calculateWinner detects horizontal win', () => {
  const res = calculateWinner(['X', 'X', 'X', null, null, null, null, null, null]);
  expect(res).toEqual({ player: 'X', line: [0, 1, 2] });
});

test('renders game title and status', () => {
  render(<App />);
  expect(screen.getByText(/Tic Tac Toe/i)).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(/Next Player:\s*X/i);
});

test('player turns alternate on click and winner is shown', () => {
  render(<App />);
  const cells = screen.getAllByRole('button', { name: /Cell/i });
  // X moves
  fireEvent.click(cells[0]);
  // O moves
  fireEvent.click(cells[3]);
  // X moves
  fireEvent.click(cells[1]);
  // O moves
  fireEvent.click(cells[4]);
  // X wins
  fireEvent.click(cells[2]);
  expect(screen.getByRole('status')).toHaveTextContent(/Winner:\s*X/i);
});

test('new game clears the board', () => {
  render(<App />);
  const cells = screen.getAllByRole('button', { name: /Cell/i });
  fireEvent.click(cells[0]); // X
  expect(cells[0]).toHaveTextContent('X');
  fireEvent.click(screen.getByRole('button', { name: /New Game/i }));
  expect(cells[0]).toHaveTextContent('');
  expect(screen.getByRole('status')).toHaveTextContent(/Next Player:\s*X/i);
});
