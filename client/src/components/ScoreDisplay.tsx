
interface ScoreDisplayProps {
  score: number;
  popup: { id: number, value: number } | null;
}

export default function ScoreDisplay({ score, popup }: ScoreDisplayProps) {
  return (
    <div className="score-display">
      {score.toLocaleString()}
      {popup && (
        <div 
          key={popup.id} 
          className={`score-popup ${popup.value < 0 ? 'negative' : ''}`}
        >
          {popup.value > 0 ? '+' : ''}{popup.value}
        </div>
      )}
    </div>
  );
}
