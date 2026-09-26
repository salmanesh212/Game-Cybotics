import { useEffect } from 'react';
import Confetti from './Confetti';
import { soundManager } from '../game/sounds';

export default function NewRecord({ record }: { record: any }) {
  useEffect(() => {
    soundManager.playNewRecord();
  }, []);

  return (
    <div className="new-record-overlay">
      <Confetti />
      <div className="new-record-box">
        <h2 className="title" style={{ fontSize: '3rem', color: 'var(--gold)', textShadow: '0 0 20px rgba(255, 215, 0, 0.5)' }}>
          NEW RECORD!
        </h2>
        <div style={{ fontSize: '2rem', fontWeight: 800, margin: '24px 0' }}>
          {record.playerName || record.nickname}
        </div>
        <div style={{ fontSize: '4rem', fontFamily: 'var(--font-heading)', color: 'var(--cyan)' }}>
          {record.score?.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
