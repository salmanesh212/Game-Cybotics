
interface TimerProps {
  current: number;
  total: number;
}

export default function Timer({ current, total }: TimerProps) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  
  return (
    <div className="timer-container">
      <div className="timer-text">ROUND {current}/{total}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
