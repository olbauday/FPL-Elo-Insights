import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayerCard from '../components/PlayerCard';
import type { CaptainCandidate } from '../types';

const mk = (over: Partial<CaptainCandidate> = {}): CaptainCandidate => ({
  player_id: 1,
  name: 'Test Player',
  team: 'ABC',
  position: 'MID',
  price: 9.5,
  ownership: 35.2,
  expected_ownership: 40,
  form_score: 10.2,
  fixture_difficulty: 3,
  minutes_risk: 15,
  xgi_per_90: 0.7,
  captain_score: 80.1,
  ...over,
});

describe('PlayerCard render and interactions', () => {
  test('renders key fields and supports click/keyboard', () => {
    const onClick = vi.fn();
    render(<PlayerCard player={mk()} onClick={onClick} />);

    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText('ABC')).toBeInTheDocument();
    expect(screen.getByText('MID')).toBeInTheDocument();
    expect(screen.getByText('£9.5m')).toBeInTheDocument();
    expect(screen.getByText('35.2%')).toBeInTheDocument();
    expect(screen.getByText('10.2')).toBeInTheDocument();
    expect(screen.getByText('Diff: 3')).toBeInTheDocument();
    expect(screen.getByText('0.7')).toBeInTheDocument();
  expect(screen.queryByText('0%')).not.toBeInTheDocument();

    const card = screen.getByRole('button', { name: /select test player/i });
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  test('size variants affect classes roughly as expected', () => {
    const { rerender } = render(<PlayerCard player={mk()} size="small" />);
    // small has smaller score font; check class presence heuristically
    const getRoot = () => screen.getByRole('button', { name: /select test player/i });
  expect(getRoot().className).toContain('p-3');

    rerender(<PlayerCard player={mk()} size="medium" />);
    expect(getRoot().className).toContain('p-6');

    rerender(<PlayerCard player={mk()} size="large" />);
    expect(getRoot().className).toContain('p-8');
  });
});
