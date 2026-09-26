import { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/socket';
import { Socket } from 'socket.io-client';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(socketService.isConnected());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketService.connect();
    socketRef.current = socketService.getSocket();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketService.onConnect(handleConnect);
    socketService.onDisconnect(handleDisconnect);

    // Initial check
    setIsConnected(socketService.isConnected());

    return () => {
      // Don't disconnect here if we want to share socket across app
      // or implement reference counting.
    };
  }, []);

  return { isConnected, socket: socketRef.current };
}
