import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComparisonView from '../components/ComparisonView';
import type { CaptainCandidate } from '../types';

const mk = (over: Partial<CaptainCandidate> = {}): CaptainCandidate => ({
  player_id: 1,
  name: 'Test Player',
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

describe('ComparisonView', () => {
  test('renders both players and VS indicator', () => {
    render(
      <ComparisonView
        candidateA={mk({ name: 'A' })}
        candidateB={mk({ name: 'B', player_id: 2 })}
        size="small"
        layout="horizontal"
      />
    );

    expect(screen.getByRole('region', { name: /comparison/i })).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByRole('separator', { name: /versus/i })).toBeInTheDocument();
  });
});
