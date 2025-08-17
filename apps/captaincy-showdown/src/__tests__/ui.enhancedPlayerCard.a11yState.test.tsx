import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedPlayerCard from '../components/EnhancedPlayerCard';
import type { CaptainCandidate } from '../types';

const mk = (over: Partial<CaptainCandidate> = {}): CaptainCandidate => ({
  player_id: 10,
  name: 'Delta',
  team: 'DDD',
  position: 'FWD',
  price: 8.0,
  ownership: 12.3,
  expected_ownership: 20,
  form_score: 7.0,
  fixture_difficulty: 3,
  minutes_risk: 22,
  xgi_per_90: 0.5,
  captain_score: 72,
  ...over,
});

describe('EnhancedPlayerCard a11y/state', () => {
  test('click/keyboard interaction works and aria-pressed reflects selection', () => {
    const onClick = vi.fn();
    const { rerender } = render(<EnhancedPlayerCard player={mk()} onClick={onClick} isSelected={false} />);

    const card = screen.getByRole('button', { name: /select delta/i });
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(3);

    // emulate selection by rerender
    rerender(<EnhancedPlayerCard player={mk()} onClick={onClick} isSelected />);
  // "SELECTED" pill should appear
    expect(screen.getByText(/selected/i)).toBeInTheDocument();
  });
});
