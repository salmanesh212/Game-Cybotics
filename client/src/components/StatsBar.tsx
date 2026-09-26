import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';

export default function StatsBar() {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalGames: 0,
    highScore: 0,
    activeConnections: 0
  });

  useEffect(() => {
    // Initial fetch
    api.getStats().then(data => {
      setStats(prev => ({
        ...prev,
        totalPlayers: data.playerCount || 0,
        totalGames: data.gameCount || 0,
        highScore: data.highScore || 0
      }));
    }).catch(console.error);

    // Socket updates
    const unbind = socketService.onStatsUpdate((data) => {
      setStats(prev => ({
        ...prev,
        activeConnections: data.connectedClients || 0,
        totalGames: Math.max(prev.totalGames, data.totalGames || 0)
      }));
    });

    return () => { unbind(); };
  }, []);

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <div className="stat-value">{stats.activeConnections}</div>
        <div className="stat-label">LIVE PLAYERS</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{stats.totalPlayers}</div>
        <div className="stat-label">TOTAL PLAYERS</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{stats.totalGames}</div>
        <div className="stat-label">GAMES PLAYED</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{stats.highScore.toLocaleString()}</div>
        <div className="stat-label">HIGH SCORE</div>
      </div>
    </div>
  );
}
