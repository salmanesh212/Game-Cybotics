import { API_BASE_URL } from './config';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(response.status, errorData.error || response.statusText);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export interface PlayerSession {
  playerId: string;
  token: string;
}

export const api = {
  getPublicConfig: async (): Promise<{ gameUrl: string }> => request<{ gameUrl: string }>('/config'),

  registerPlayer: async (nickname: string): Promise<PlayerSession> => {
    return request<PlayerSession>('/players', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    });
  },

  startGame: async (token: string) => {
    return request<any>('/games/start', {
      method: 'POST',
      headers: { 'x-player-token': token },
    });
  },

  submitRound: async (gameId: string, data: { roundNumber: number; selectedValue: string }, token: string) => {
    return request<any>(`/games/${gameId}/round`, {
      method: 'POST',
      headers: { 'x-player-token': token },
      body: JSON.stringify(data),
    });
  },

  finishGame: async (gameId: string, token: string) => {
    return request<any>(`/games/${gameId}/finish`, {
      method: 'POST',
      headers: { 'x-player-token': token },
    });
  },

  getLeaderboard: async () => {
    return request<any>('/leaderboard');
  },

  getPlayerLeaderboard: async (playerId: string) => {
    return request<any>(`/leaderboard/player/${playerId}`);
  },

  getStats: async () => {
    return request<any>('/stats');
  },

  adminLogin: async (password: string): Promise<{ token: string }> => {
    return request<{ token: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  adminGetPlayers: async (token: string) => {
    return request<any>('/admin/players', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  adminGetGames: async (token: string) => {
    return request<any>('/admin/games', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  adminDeleteGame: async (gameId: string, token: string) => {
    return request<any>(`/admin/games/${gameId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  adminGetEvents: async (token: string) => {
    return request<any>('/admin/events', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  adminCreateEvent: async (name: string, token: string) => {
    return request<any>('/admin/events', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
  },

  adminResetEvent: async (eventId: string, token: string) => {
    return request<any>(`/admin/events/${eventId}/reset`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  adminExport: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/export`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Export failed');
    return response.text();
  },

  adminGetStats: async (token: string) => {
    return request<any>('/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }
};
