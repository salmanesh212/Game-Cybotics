
interface LeaderboardProps {
  scores: any[];
  limit?: number;
  highlightPlayerId?: string;
}

export default function Leaderboard({ scores, limit = 10, highlightPlayerId }: LeaderboardProps) {
  const displayScores = scores.slice(0, limit);

  return (
    <table className="leaderboard-table">
      <tbody>
        {displayScores.map((score, index) => {
          const isHighlight = score.playerId === highlightPlayerId;
          return (
            <tr 
              key={`${score.playerId}-${index}`} 
              className={`leaderboard-row ${isHighlight ? 'highlight' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <td style={{ width: '50px', textAlign: 'center' }}>
                {index === 0 && <span className="rank-medal">🥇</span>}
                {index === 1 && <span className="rank-medal">🥈</span>}
                {index === 2 && <span className="rank-medal">🥉</span>}
                {index > 2 && <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>#{index + 1}</span>}
              </td>
              <td style={{ fontWeight: 600 }}>{score.nickname}</td>
              <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {(score.avgReaction || 0)}ms
              </td>
              <td>{score.totalScore?.toLocaleString() || score.score?.toLocaleString()}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
