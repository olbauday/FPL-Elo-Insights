import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComparisonView from '../components/ComparisonView';
import type { CaptainCandidate } from '../types';

const mk = (over: Partial<CaptainCandidate> = {}): CaptainCandidate => ({
  player_id: 1,
  name: 'Player A',
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

describe('ComparisonView + ScoreDeltaBadge', () => {
  test('renders badge when both candidates exist', () => {
    render(
      <ComparisonView
        candidateA={mk({ name: 'A', captain_score: 60 })}
        candidateB={mk({ name: 'B', player_id: 2, captain_score: 55 })}
        size="small"
      />
    );

    expect(screen.getByRole('separator', { name: /versus/i })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /score delta/i })).toBeInTheDocument();
    expect(screen.getByText('Score Δ')).toBeInTheDocument();
  });
});
