import { useEffect, useState } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { socketService } from '../services/socket';
import Leaderboard from '../components/Leaderboard';
import QRCode from '../components/QRCode';
import StatsBar from '../components/StatsBar';
import NewRecord from '../components/NewRecord';
import { PUBLIC_GAME_URL } from '../services/config';
import { api } from '../services/api';

export default function ArenaPage() {
  const { leaderboard, newRecord } = useLeaderboard();
  const [gameUrl, setGameUrl] = useState(PUBLIC_GAME_URL);

  useEffect(() => {
    api.getPublicConfig().then(({ gameUrl: publicUrl }) => {
      if (publicUrl) setGameUrl(publicUrl);
    }).catch(() => undefined);
  }, []);
  
  useEffect(() => {
    socketService.joinArena();
  }, []);

  return (
    <div className="arena-page">
      {newRecord && <NewRecord record={newRecord} />}
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 className="title" style={{ fontSize: '4rem', marginBottom: '8px' }}>⚡ CYBOTICS TAP</h1>
        <div className="subtitle" style={{ fontSize: '2rem' }}>SCAN. TAP. BEAT THE RANKING.</div>
        
        <div style={{ marginTop: '2rem' }}>
          <QRCode url={gameUrl} />
        </div>
      </div>
      
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 className="title" style={{ fontSize: '2.5rem', color: 'var(--gold)' }}>🏆 LIVE TOP 10</h2>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Leaderboard scores={leaderboard} limit={10} />
        </div>
      </div>
      
      <div style={{ gridColumn: '1 / -1' }}>
        <StatsBar />
      </div>
    </div>
  );
}
