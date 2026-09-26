import { useEffect, useState } from 'react';

export default function ComboIndicator({ combo }: { combo: number }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (combo > 1) {
      setActive(true);
      const t = setTimeout(() => setActive(false), 300);
      return () => clearTimeout(t);
    }
  }, [combo]);

  if (combo < 2) return <div className="combo-indicator"></div>;

  let color = 'var(--cyan)';
  if (combo >= 10) color = 'var(--gold)';
  else if (combo >= 5) color = 'var(--magenta)';

  // Calculate actual multiplier for display using the scoring service
  // Pass combo - 1 because the service expects "currentCombo" before the hit,
  // but this component receives the new streak. Actually, the service logic is:
  // newCombo = currentCombo + 1
  let multiplier = 1.0;
  if (combo === 2) multiplier = 1.2;
  else if (combo === 3) multiplier = 1.5;
  else if (combo === 4) multiplier = 1.8;
  else if (combo >= 5) multiplier = 2.0;

  return (
    <div 
      className={`combo-indicator ${active ? 'active' : ''}`}
      style={{ color, textShadow: `0 0 10px ${color}` }}
    >
      ×{multiplier.toFixed(1)} {combo >= 5 && '🔥'}
    </div>
  );
}
