import { useState, useEffect } from 'react';
import Home from './components/Home';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [matchId, setMatchId] = useState(null);

  useEffect(() => {
    // Check for user in localStorage
    const savedUser = localStorage.getItem('footballTennisUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleUserLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('footballTennisUser', JSON.stringify(userData));
  };

  const handleStartMatch = (id) => {
    setMatchId(id);
    setCurrentView('game');
  };

  const handleLeaveMatch = () => {
    setMatchId(null);
    setCurrentView('home');
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <Home
            user={user}
            onUserLogin={handleUserLogin}
            onStartMatch={handleStartMatch}
            onViewLeaderboard={() => setCurrentView('leaderboard')}
          />
        );
      case 'game':
        return (
          <Game
            user={user}
            matchId={matchId}
            onLeaveMatch={handleLeaveMatch}
          />
        );
      case 'leaderboard':
        return (
          <Leaderboard
            user={user}
            onBack={() => setCurrentView('home')}
          />
        );
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderView()}
    </div>
  );
}

export default App;
