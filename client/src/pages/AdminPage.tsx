import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AdminPage() {
  const [token, setToken] = useState(sessionStorage.getItem('adminToken'));
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.adminLogin(password);
      sessionStorage.setItem('adminToken', res.token);
      setToken(res.token);
    } catch (err) {
      alert('Login failed');
    }
  };

  const loadData = async () => {
    if (!token) return;
    try {
      if (activeTab === 'overview') setData(await api.adminGetStats(token));
      else if (activeTab === 'players') setData(await api.adminGetPlayers(token));
      else if (activeTab === 'games') setData(await api.adminGetGames(token));
      else if (activeTab === 'events') setData(await api.adminGetEvents(token));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, activeTab]);

  const handleDeleteGame = async (id: string) => {
    if (!token || !window.confirm('Are you sure you want to delete this game?')) return;
    try {
      await api.adminDeleteGame(id, token);
      loadData();
    } catch (err) {
      alert('Failed to delete game');
    }
  };

  const handleCreateEvent = async () => {
    if (!token) return;
    const name = prompt('Enter new event name (e.g. CYBOTICS FAIR 2026):');
    if (!name) return;
    try {
      await api.adminCreateEvent(name, token);
      loadData();
    } catch (err) {
      alert('Failed to create event');
    }
  };

  const handleResetEvent = async (id: string) => {
    if (!token || !window.confirm('Are you sure? This will archive all games for this event and clear the leaderboard.')) return;
    try {
      await api.adminResetEvent(id, token);
      alert('Event reset successfully');
      loadData();
    } catch (err) {
      alert('Failed to reset event');
    }
  };

  const handleExport = async () => {
    if (!token) return;
    try {
      const csv = await api.adminExport(token);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cybotics_export.csv';
      a.click();
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  if (!token) {
    return (
      <div className="page" style={{ justifyContent: 'center' }}>
        <div className="card">
          <h2 className="title">ADMIN LOGIN</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              className="input" 
              placeholder="PASSWORD" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <button className="btn btn-primary" type="submit">LOGIN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="title" style={{ fontSize: '2rem' }}>⚙️ ADMIN PANEL</h1>
        <button className="btn btn-secondary" style={{ width: 'auto', minHeight: '40px', padding: '0 16px' }} onClick={() => { sessionStorage.removeItem('adminToken'); setToken(null); }}>LOGOUT</button>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto' }}>
        {['overview', 'players', 'games', 'events'].map(tab => (
          <button 
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minHeight: '40px', fontSize: '1rem' }}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="card" style={{ minHeight: '400px' }}>
        {activeTab === 'overview' && data && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Overview</h3>
              <button className="btn btn-primary" style={{ width: 'auto', minHeight: '40px' }} onClick={handleExport}>EXPORT CSV</button>
            </div>
            <pre style={{ background: 'black', padding: '16px', borderRadius: '8px', overflow: 'auto' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'players' && data && (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nickname</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p: any) => (
                <tr key={p.id} className="leaderboard-row">
                  <td>{p.id.substring(0,8)}</td>
                  <td>{p.nickname}</td>
                  <td>{new Date(p.createdAt || p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'games' && data && (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Game ID</th>
                <th>Player</th>
                <th>Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((g: any) => (
                <tr key={g.id} className="leaderboard-row">
                  <td>{g.id.substring(0,8)}</td>
                  <td>{g.nickname}</td>
                  <td>{g.score}</td>
                  <td>
                    <button className="btn btn-danger" style={{ minHeight: '30px', padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleDeleteGame(g.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {activeTab === 'events' && data && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Events Management</h3>
              <button className="btn btn-primary" style={{ width: 'auto', minHeight: '40px' }} onClick={handleCreateEvent}>+ NEW EVENT</button>
            </div>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((e: any) => (
                  <tr key={e.id} className="leaderboard-row" style={{ opacity: e.isActive || e.is_active ? 1 : 0.5 }}>
                    <td style={{ fontWeight: e.isActive || e.is_active ? 'bold' : 'normal' }}>{e.name}</td>
                    <td style={{ color: e.isActive || e.is_active ? 'var(--lime)' : 'inherit' }}>
                      {e.isActive || e.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </td>
                    <td>{new Date(e.createdAt || e.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn btn-danger" 
                        style={{ minHeight: '30px', padding: '4px 8px', fontSize: '0.8rem' }}
                        disabled={!(e.isActive || e.is_active)}
                        onClick={() => handleResetEvent(e.id)}
                      >
                        Reset / Archive Games
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
