import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedPlayerCard from '../components/EnhancedPlayerCard';
import type { CaptainCandidate } from '../types';

const mk = (over: Partial<CaptainCandidate> = {}): CaptainCandidate => ({
  player_id: 11,
  name: 'Echo',
  team: 'EEE',
  position: 'MID',
  price: 7.5,
  ownership: 18.2,
  expected_ownership: 22,
  form_score: 6.5,
  fixture_difficulty: 3,
  minutes_risk: 12,
  xgi_per_90: 0.4,
  captain_score: 68,
  ...over,
});

describe('EnhancedPlayerCard focus & aria', () => {
  test('is focusable and reflects aria-pressed when selected', () => {
    const { rerender } = render(<EnhancedPlayerCard player={mk()} isSelected={false} />);
    const btn = screen.getByRole('button', { name: /select echo/i });
    expect(btn).toHaveAttribute('tabindex', '0');
    (btn as HTMLElement).focus();
    expect(document.activeElement).toBe(btn);

    rerender(<EnhancedPlayerCard player={mk()} isSelected={true} />);
    expect(screen.getByRole('button', { name: /select echo/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
