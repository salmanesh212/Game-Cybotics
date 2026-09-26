import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        query: { 'bypass-tunnel-reminder': 'true' },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity
      });

      this.socket.on('connect', () => {
        this.connected = true;
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
      });
    }
  }

  onConnect(callback: () => void) {
    if (!this.socket) this.connect();
    this.socket?.on('connect', callback);
    return () => this.socket?.off('connect', callback);
  }

  onDisconnect(callback: () => void) {
    if (!this.socket) this.connect();
    this.socket?.on('disconnect', callback);
    return () => this.socket?.off('disconnect', callback);
  }

  onLeaderboardUpdate(callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('leaderboard:update', callback);
    return () => this.socket?.off('leaderboard:update', callback);
  }

  onNewRecord(callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('new-record', callback);
    return () => this.socket?.off('new-record', callback);
  }

  onStatsUpdate(callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('stats:update', callback);
    return () => this.socket?.off('stats:update', callback);
  }

  joinArena() {
    if (!this.socket) this.connect();
    this.socket?.emit('join-arena');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.connected;
  }
}

export const socketService = new SocketService();
