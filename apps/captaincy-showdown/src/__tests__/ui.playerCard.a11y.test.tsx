import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PlayerCard from '../components/PlayerCard';
import type { CaptainCandidate } from '../types';

expect.extend(toHaveNoViolations);

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

describe('PlayerCard accessibility', () => {
  test('has no detectable a11y violations', async () => {
    const { container } = render(<PlayerCard player={mk()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
