import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CaptaincyComparison, { Player } from '../components/CaptaincyComparison';

test('CaptaincyComparison renders cards and VS indicator', () => {
  const p1: Player = {
    name: 'Foden', team: 'MCI', position: 'MID', price: 9.5, ownership: 38.5,
    form: 12.2, captainScore: 83.3, status: 'TOP PICK', xGI90: 0.7, minutesRisk: 0,
    fixtureDifficulty: ['green','green','gray','gray','red']
  };
  const p2: Player = {
    name: 'Isak', team: 'NEW', position: 'FWD', price: 9.5, ownership: 60.8,
    form: 9.5, captainScore: 80.9, status: 'TOP PICK', xGI90: 0.9, minutesRisk: 0,
    fixtureDifficulty: ['green','gray','gray','red','red']
  };

  render(<CaptaincyComparison player1={p1} player2={p2} winner="player1" />);
  expect(screen.getByText('Foden')).toBeInTheDocument();
  expect(screen.getByText('Isak')).toBeInTheDocument();
  expect(screen.getByRole('separator', { name: /versus/i })).toBeInTheDocument();
  expect(screen.getByRole('status', { name: /advantage/i })).toHaveTextContent('Advantage +2.4 • Foden');
});
