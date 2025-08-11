import { expect, test } from 'vitest'
import { calculateCaptainScore } from './captainScore'

test('calculateCaptainScore returns expected values', () => {
  const player = {
    form: 8.5,
    fixture_difficulty: 2,
    xgi_per_90: 1.8,
    minutes_risk: 10
  }
  
  const score = calculateCaptainScore(player)
  
  expect(score).toBeGreaterThan(0)
  expect(score).toBeLessThan(100)
  
  // Test specific weights
  const formWeight = (8.5 / 10) * 100 * 0.4
  const fixtureWeight = (6 - 2) * 20 * 0.3
  const xgiWeight = Math.min(1.8 * 50, 100) * 0.2
  const minutesWeight = (100 - 10) * 0.1
  
  const expectedScore = formWeight + fixtureWeight + xgiWeight + minutesWeight
  expect(score).toBeCloseTo(expectedScore, 1)
})
