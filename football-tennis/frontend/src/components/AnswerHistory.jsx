function AnswerHistory({ answers, currentUserId }) {
  if (answers.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        <div className="text-4xl mb-2">🎾</div>
        <p>No answers yet. Start the rally!</p>
      </div>
    );
  }

  return (
    <div id="answers-container" className="space-y-2 max-h-64 overflow-y-auto">
      {answers.map((answer, index) => {
        const isMe = answer.userId === currentUserId;

        return (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              answer.valid
                ? 'bg-tennis-green/10 border border-tennis-green/30'
                : 'bg-court-red/10 border border-court-red/30'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">
                {answer.valid ? '✓' : '✗'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">
                    {isMe ? 'You' : 'Opponent'}
                  </span>
                  {answer.entity && (
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                      {answer.entity.name}
                    </span>
                  )}
                </div>
                <div className="font-medium">{answer.answer}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {answer.reason}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AnswerHistory;
