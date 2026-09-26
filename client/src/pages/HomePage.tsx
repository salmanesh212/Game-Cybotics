import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ConnectionStatus from '../components/ConnectionStatus';

export default function HomePage() {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Nickname is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const session = await api.registerPlayer(nickname);
      sessionStorage.setItem('playerToken', session.token);
      sessionStorage.setItem('playerId', session.playerId);
      sessionStorage.setItem('nickname', nickname);
      navigate('/game');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <ConnectionStatus />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 className="title">⚡ CYBOTICS TAP</h1>
        <div className="subtitle">SCAN. TAP. BEAT THE RANKING.</div>
        
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <div className="feature-text">20 ROUNDS</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-text">FAST REACTIONS</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔥</div>
            <div className="feature-text">COMBOS</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <div className="feature-text">LIVE RANKING</div>
          </div>
        </div>

        <form onSubmit={handleStart} className="card">
          <input
            type="text"
            className="input"
            placeholder="ENTER NICKNAME"
            value={nickname}
            onChange={e => setNickname(e.target.value.substring(0, 16))}
            maxLength={16}
            disabled={isLoading}
            style={{ marginBottom: '16px' }}
          />
          {error && <div style={{ color: 'var(--red)', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={isLoading || !nickname.trim()}>
            {isLoading ? 'CONNECTING...' : 'START GAME'}
          </button>
        </form>
      </div>
    </div>
  );
}
