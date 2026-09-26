import { useState, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { createInitialState, parseRoundConfig, GameState } from '../game/engine';
import { ScoringService } from '../game/scoring';
import { soundManager } from '../game/sounds';

export function useGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scorePopup, setScorePopup] = useState<{ id: number, value: number } | null>(null);
  const popupIdCounter = useRef(0);

  const startGame = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      soundManager.init();
      soundManager.playStart();
      
      const res = await api.startGame(token);
      const initialState = createInitialState(res.gameId, res.totalRounds);
      initialState.roundConfig = parseRoundConfig(res.firstRound);
      initialState.currentRound = 1;
      initialState.roundStartTime = Date.now();
      
      setGameState(initialState);
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTap = useCallback(async (value: string, token: string) => {
    if (!gameState || !gameState.roundConfig || !gameState.isPlaying) return;
    if (gameState.feedback) return; // Prevent multiple taps

    const tapTime = Date.now();
    const reactionMs = tapTime - gameState.roundStartTime;
    const isCorrect = value === gameState.roundConfig.targetValue;
    
    // Optimistic local update
    const { score: roundScore, newCombo } = ScoringService.calculateRoundScore(isCorrect, reactionMs, gameState.combo);
    
    if (isCorrect) {
      soundManager.playCorrect();
      if (newCombo % 5 === 0 && newCombo > 0) soundManager.playCombo();
    } else {
      soundManager.playError();
    }

    popupIdCounter.current += 1;
    setScorePopup({ id: popupIdCounter.current, value: roundScore });

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        score: Math.max(0, prev.score + roundScore),
        combo: isCorrect ? newCombo : 0,
        maxCombo: Math.max(prev.maxCombo, isCorrect ? newCombo : 0),
        correct: prev.correct + (isCorrect ? 1 : 0),
        errors: prev.errors + (isCorrect ? 0 : 1),
        feedback: isCorrect ? 'correct' : 'wrong'
      };
    });

    try {
      // Send to server using fixed schema names
      const payload = {
        roundNumber: gameState.currentRound,
        selectedValue: value
      };
      const res = await api.submitRound(gameState.gameId, payload, token);
      
      // Wait a bit to show feedback
      setTimeout(async () => {
        if (res.completed) {
          // Game over
          setGameState(prev => prev ? { ...prev, isPlaying: false, feedback: null } : null);
        } else if (res.nextRound) {
          // Next round
          setGameState(prev => {
            if (!prev) return prev;
            // Also sync score with server authority
            return {
              ...prev,
              currentRound: res.nextRound.roundNumber,
              roundConfig: parseRoundConfig(res.nextRound),
              feedback: null,
              roundStartTime: Date.now(),
              score: res.currentScore // sync
            };
          });
        }
      }, 300);

    } catch (err: any) {
      setError(err.message || 'Failed to submit round');
    }
  }, [gameState]);

  return { gameState, isLoading, error, startGame, handleTap, scorePopup };
}
