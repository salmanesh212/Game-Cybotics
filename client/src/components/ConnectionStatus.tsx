import { useSocket } from '../hooks/useSocket';

export default function ConnectionStatus() {
  const { isConnected } = useSocket();
  
  return (
    <div className="connection-status">
      <div className={`status-dot ${isConnected ? 'connected' : 'connecting'}`}></div>
      {isConnected ? 'LIVE' : 'CONNECTING...'}
    </div>
  );
}
