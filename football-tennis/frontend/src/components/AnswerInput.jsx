import { useState, useEffect, useRef } from 'react';

function AnswerInput({ isMyTurn, onSubmit, lastResult }) {
  const [answer, setAnswer] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMyTurn]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim() || !isMyTurn) return;

    onSubmit(answer.trim());
    setAnswer('');
  };

  return (
    <div className="space-y-3">
      {/* Last Result Feedback */}
      {lastResult && (
        <div
          className={`p-3 rounded-lg border ${
            lastResult.valid
              ? 'bg-tennis-green/20 border-tennis-green'
              : 'bg-court-red/20 border-court-red'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {lastResult.valid ? '✓' : '✗'}
            </span>
            <div className="flex-1">
              <div className="font-bold">
                {lastResult.answer}
              </div>
              <div className="text-sm opacity-80">
                {lastResult.reason}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            className="input-field flex-1"
            placeholder={isMyTurn ? "Type your answer..." : "Waiting for your turn..."}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={!isMyTurn}
          />
          <button
            type="submit"
            className={`${isMyTurn ? 'btn-primary' : 'btn-secondary'} px-6`}
            disabled={!isMyTurn || !answer.trim()}
          >
            Submit
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {isMyTurn
            ? '💡 Tip: Be quick and accurate!'
            : '⏳ Wait for your opponent to answer...'}
        </p>
      </form>
    </div>
  );
}

export default AnswerInput;
