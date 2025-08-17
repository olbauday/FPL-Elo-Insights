import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedApp from '../components/EnhancedApp';
import type { CaptainCandidate } from '../types';

const mk = (over: Partial<CaptainCandidate> = {}): CaptainCandidate => ({
  player_id: 1,
  name: 'Alpha',
  team: 'AAA',
  position: 'MID',
  price: 9.5,
  ownership: 25,
  expected_ownership: 30,
  form_score: 9.2,
  fixture_difficulty: 2,
  minutes_risk: 10,
  xgi_per_90: 0.6,
  captain_score: 81,
  ...over,
});

describe('EnhancedApp compare flow', () => {
  test('enables compare mode, selects players, and shows comparison at 2 selections (capped at 2)', async () => {
    const players: CaptainCandidate[] = [
      mk({ player_id: 1, name: 'Alpha' }),
      mk({ player_id: 2, name: 'Bravo', captain_score: 79.5 }),
      mk({ player_id: 3, name: 'Charlie', captain_score: 78.4 }),
    ];

    render(<EnhancedApp players={players} gameweek={1} season="2025-2026" lastUpdated="Just now" />);

    // Enable Compare Mode
    const compareBtn = screen.getByRole('button', { name: /compare mode/i });
    fireEvent.click(compareBtn);
  expect(screen.getByText(/Compare Mode \(0\/2\)/i)).toBeInTheDocument();

    // Select two players
    fireEvent.click(screen.getByText('Alpha'));
    fireEvent.click(screen.getByText('Bravo'));
  expect(screen.getByText(/2\/2 selected/i)).toBeInTheDocument();

    // ComparisonView should appear when exactly two are selected
    expect(screen.getByRole('region', { name: /captain candidate comparison/i })).toBeInTheDocument();

  // Attempt to select a third player should have no effect due to 2-cap
  fireEvent.click(screen.getByText('Charlie'));
  expect(screen.getByText(/2\/2 selected/i)).toBeInTheDocument();
  // Comparison section should remain visible
  expect(screen.getByRole('region', { name: /captain candidate comparison/i })).toBeInTheDocument();
  });
});
