import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [newRecord, setNewRecord] = useState<any | null>(null);

  useEffect(() => {
    // Initial fetch
    api.getLeaderboard().then(data => setLeaderboard(data)).catch(console.error);

    // Socket listeners
    const unbindLeaderboard = socketService.onLeaderboardUpdate((data) => {
      setLeaderboard(data);
    });

    const unbindRecord = socketService.onNewRecord((data) => {
      setNewRecord(data);
      setTimeout(() => setNewRecord(null), 5000);
    });

    return () => {
      unbindLeaderboard();
      unbindRecord();
    };
  }, []);

  return { leaderboard, newRecord };
}
