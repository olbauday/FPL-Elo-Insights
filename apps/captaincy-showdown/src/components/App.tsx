import { useEffect, useState } from 'react';
import { getCaptainCandidates } from '../services/captaincyDataService';
import type { CaptainCandidate } from '../types';

function PlayerCard({ player }: { player: CaptainCandidate }) {
  return (
    <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '1rem',
        margin: '0.5rem',
        width: '16rem'
      }}>
      <h2 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{player.name}</h2>
      <p>Team: {player.team}</p>
      <p>Position: {player.position}</p>
      <p>Price: £{player.price.toFixed(1)}m</p>
      <p>Ownership: {player.ownership}%</p>
      <p>Form: {player.form_score}</p>
      <p>Fixture Difficulty: {player.fixture_difficulty}</p>
      <p>xGI/90: {player.xgi_per_90}</p>
      <p>Minutes Risk: {player.minutes_risk}</p>
      <p style={{ fontWeight: 'bold', color: '#2563eb' }}>Captain Score: {player.captain_score.toFixed(1)}</p>
    </div>
  );
}

export default function App() {
  const [candidates, setCandidates] = useState<CaptainCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test with 2024-2025 GW5 for early season data comparison
    getCaptainCandidates(5, '2024-2025').then(data => {
      setCandidates(data);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{
        minHeight: '100vh',
        background: '#f3f4f6',
        padding: '2rem'
      }}>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1rem'
      }}>Captaincy Candidates (2024-25 GW5)</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap'
        }}>
          {candidates.slice(0, 10).map(player => (
            <PlayerCard key={player.player_id} player={player} />
          ))}
        </div>
      )}
    </div>
  );
}
