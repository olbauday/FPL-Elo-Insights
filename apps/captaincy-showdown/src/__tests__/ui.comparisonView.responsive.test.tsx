import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ComparisonView from '../components/ComparisonView';
import type { CaptainCandidate } from '../types';

const mk = (over: Partial<CaptainCandidate> = {}): CaptainCandidate => ({
  player_id: 1,
  name: 'Alpha',
  team: 'AAA',
  position: 'MID',
  price: 9.5,
  ownership: 10,
  expected_ownership: 15,
  form_score: 9,
  fixture_difficulty: 2,
  minutes_risk: 10,
  xgi_per_90: 0.6,
  captain_score: 81,
  ...over,
});

describe('ComparisonView responsive hints', () => {
  test('renders players and vs indicator in horizontal layout by default', () => {
    render(
      <ComparisonView
        candidateA={mk({ name: 'Alpha', player_id: 1 })}
        candidateB={mk({ name: 'Bravo', player_id: 2 })}
        size="medium"
        layout="horizontal"
      />
    );

    expect(screen.getByRole('region', { name: /comparison/i })).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
    expect(screen.getByLabelText(/versus/i)).toBeInTheDocument();
  });
});
