import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreDeltaBadge from '../components/ScoreDeltaBadge';
import type { CaptainCandidate } from '../types';

const mk = (over: Partial<CaptainCandidate> = {}): CaptainCandidate => ({
  player_id: 1,
  name: 'A',
  team: 'ABC',
  position: 'MID',
  price: 7.5,
  ownership: 20,
  expected_ownership: 20,
  form_score: 6,
  fixture_difficulty: 3,
  minutes_risk: 10,
  xgi_per_90: 0.8,
  captain_score: 65,
  ...over,
});

describe('ScoreDeltaBadge', () => {
  test('renders nothing when missing a candidate', () => {
    const { container } = render(<ScoreDeltaBadge a={mk()} b={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders delta and leader when both candidates provided', () => {
    render(<ScoreDeltaBadge a={mk({ name: 'Haaland', captain_score: 80 })} b={mk({ name: 'Salah', player_id: 2, captain_score: 75 })} />);
    expect(screen.getByRole('status', { name: /score delta/i })).toBeInTheDocument();
    expect(screen.getByText('Score Δ')).toBeInTheDocument();
    expect(screen.getByText('+5.0')).toBeInTheDocument();
  });

  test('shows tie state', () => {
    render(<ScoreDeltaBadge a={mk({ name: 'A', captain_score: 70 })} b={mk({ name: 'B', player_id: 2, captain_score: 70 })} />);
    expect(screen.getByText('Score Δ')).toBeInTheDocument();
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });
});
