import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { soundManager } from '../game/sounds';

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = sessionStorage.getItem('playerToken');
  const gameId = location.state?.gameId;
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !gameId) {
      navigate('/');
      return;
    }

    const finish = async () => {
      try {
        const data = await api.finishGame(gameId, token);
        setResult(data);
        soundManager.playFinish();
      } catch (err: any) {
        setError(err.message || 'Failed to finish game');
      } finally {
        setLoading(false);
      }
    };

    finish();
  }, [token, gameId, navigate]);

  if (loading) return <div className="page" style={{ justifyContent: 'center' }}><h2 className="title">CALCULATING...</h2></div>;
  if (error) return <div className="page"><div className="card">{error}</div></div>;

  return (
    <div className="page" style={{ justifyContent: 'center' }}>
      <h1 className="title" style={{ fontSize: '2rem' }}>🎉 GAME COMPLETE</h1>
      
      <div className="card" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>FINAL SCORE</div>
        <div style={{ fontSize: '3.5rem', fontFamily: 'var(--font-heading)', color: 'var(--cyan)', margin: '16px 0' }}>
          {result.totalScore?.toLocaleString() ?? 0}
        </div>
        <div style={{ fontSize: '1.2rem', color: 'var(--gold)' }}>
          🏆 RANK #{result.rank || '-'}
        </div>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-text">Avg Reaction</div>
          <div style={{ fontSize: '1.2rem', color: 'var(--cyan)' }}>{result.avgReaction ?? 0}ms</div>
        </div>
        <div className="feature-card">
          <div className="feature-text">Best Reaction</div>
          <div style={{ fontSize: '1.2rem', color: 'var(--lime)' }}>{result.bestReaction ?? 0}ms</div>
        </div>
        <div className="feature-card">
          <div className="feature-text">Accuracy</div>
          <div style={{ fontSize: '1.2rem' }}>{result.correct ?? 0}/{(result.correct || 0) + (result.errors || 0)}</div>
        </div>
        <div className="feature-card">
          <div className="feature-text">Max Combo</div>
          <div style={{ fontSize: '1.2rem', color: 'var(--magenta)' }}>×{result.maxCombo ?? 0}</div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => navigate('/game')}>
        PLAY AGAIN
      </button>
      <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => navigate('/')}>
        HOME
      </button>
    </div>
  );
}
