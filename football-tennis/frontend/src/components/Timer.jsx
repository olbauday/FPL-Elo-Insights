import { useEffect } from 'react';

function Timer({ timeLeft, isMyTurn, onTimeout, setTimeLeft }) {
  useEffect(() => {
    if (!isMyTurn) return;

    if (timeLeft <= 0) {
      onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isMyTurn, onTimeout, setTimeLeft]);

  const percentage = (timeLeft / 10) * 100;
  const isUrgent = timeLeft <= 3;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-400">Time Remaining</span>
        <span className={`font-bold font-mono ${isUrgent ? 'text-court-red animate-pulse' : 'text-tennis-green'}`}>
          {timeLeft}s
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isUrgent ? 'bg-court-red' : 'bg-tennis-green'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default Timer;
