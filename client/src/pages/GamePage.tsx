import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import GameGrid from '../components/GameGrid';
import ScoreDisplay from '../components/ScoreDisplay';
import ComboIndicator from '../components/ComboIndicator';
import Timer from '../components/Timer';
import { soundManager } from '../game/sounds';

export default function GamePage() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('playerToken');
  const { gameState, isLoading, error, startGame, handleTap, scorePopup } = useGame();
  
  // Ref to track if we've mounted so we don't start the game twice in React.StrictMode
  const mounted = useRef(false);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    
    if (!mounted.current) {
      mounted.current = true;
      startGame(token);
    }
  }, [token, navigate, startGame]);

  useEffect(() => {
    if (gameState && !gameState.isPlaying && gameState.currentRound > 0) {
      // Game finished
      navigate('/result', { state: { gameId: gameState.gameId } });
    }
  }, [gameState, navigate]);

  if (error) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--red)', marginBottom: '16px' }}>Error</h2>
          <p style={{ marginBottom: '24px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>RETURN HOME</button>
        </div>
      </div>
    );
  }

  if (isLoading || !gameState || !gameState.roundConfig) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <h2 className="title">GET READY...</h2>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: '8px' }}>
      <div className="top-bar">
        <Timer current={gameState.currentRound} total={gameState.totalRounds} />
        <ScoreDisplay score={gameState.score} popup={scorePopup} />
        <ComboIndicator combo={gameState.combo} />
      </div>

      <div className="game-container">
        <div className="target-instruction">
          {gameState.roundConfig.targetLabel}
        </div>

        <GameGrid 
          grid={gameState.roundConfig.grid}
          gridCols={gameState.roundConfig.gridCols}
          gridRows={gameState.roundConfig.gridRows}
          onCellTap={(value) => {
            soundManager.playTap(); // Added touch sound
            handleTap(value, token!);
          }}
          disabled={gameState.feedback !== null || !gameState.isPlaying}
          feedback={gameState.feedback}
          targetValue={gameState.roundConfig.targetValue}
        />
      </div>
    </div>
  );
}
