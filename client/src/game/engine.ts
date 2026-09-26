export interface RoundConfig {
  roundNumber: number;
  targetType: 'color' | 'emoji' | 'mixed';
  targetValue: string;
  targetLabel: string;
  grid: string[];
  gridCols: number;
  gridRows: number;
}

export interface GameState {
  gameId: string;
  currentRound: number;
  totalRounds: number;
  score: number;
  combo: number;
  maxCombo: number;
  correct: number;
  errors: number;
  roundStartTime: number;
  isPlaying: boolean;
  roundConfig: RoundConfig | null;
  feedback: 'correct' | 'wrong' | null;
}

const COLOR_NAMES: Record<string, string> = {
  '🔴': 'RED',
  '🟢': 'GREEN',
  '🔵': 'BLUE',
  '🟡': 'YELLOW',
  '🟣': 'PURPLE',
  '🟠': 'ORANGE'
};

const EMOJI_NAMES: Record<string, string> = {
  '🤖': 'ROBOT',
  '🚀': 'ROCKET',
  '🎯': 'TARGET',
  '😎': 'COOL',
  '😂': 'LAUGH',
  '🔥': 'FIRE',
  '⭐': 'STAR',
  '⚡': 'LIGHTNING',
  '🧠': 'BRAIN',
  '👾': 'ALIEN'
};

export function getTargetName(val: string): string {
    return COLOR_NAMES[val] || EMOJI_NAMES[val] || val;
}

export function parseRoundConfig(serverData: any): RoundConfig {
  const len = serverData.grid.length;
  let gridCols = 3;
  let gridRows = 3;
  if (len === 12) { gridCols = 3; gridRows = 4; }
  else if (len === 16) { gridCols = 4; gridRows = 4; }
  else if (len === 20) { gridCols = 4; gridRows = 5; }

  const targetName = getTargetName(serverData.targetValue);

  return {
    roundNumber: serverData.roundNumber,
    targetType: serverData.targetType,
    targetValue: serverData.targetValue,
    targetLabel: `TAP THE ${targetName}`,
    grid: serverData.grid,
    gridCols,
    gridRows
  };
}

export function createInitialState(gameId: string, totalRounds: number): GameState {
  return {
    gameId,
    currentRound: 0,
    totalRounds,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correct: 0,
    errors: 0,
    roundStartTime: 0,
    isPlaying: true,
    roundConfig: null,
    feedback: null
  };
}
