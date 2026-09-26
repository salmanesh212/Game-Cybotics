
interface GameGridProps {
  grid: string[];
  gridCols: number;
  gridRows: number;
  onCellTap: (value: string, index: number) => void;
  disabled: boolean;
  feedback: 'correct' | 'wrong' | null;
  targetValue: string;
}

export default function GameGrid({ grid, gridCols, gridRows, onCellTap, disabled, feedback, targetValue }: GameGridProps) {
  return (
    <div 
      className="game-grid"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${gridRows}, 1fr)`
      }}
    >
      {grid.map((cell, index) => {
        let cellClass = 'grid-cell';
        if (feedback && disabled) {
          if (feedback === 'correct' && cell === targetValue) {
            cellClass += ' correct';
          } else if (feedback === 'wrong') {
            // Need a way to mark the wrong tapped cell, simplified:
            cellClass += ' wrong';
          }
        }

        return (
          <div 
            key={`${index}-${cell}`}
            className={cellClass}
            style={{ animationDelay: `${index * 0.02}s` }}
            onPointerDown={(e) => {
              e.preventDefault(); // Prevent touch selection
              if (!disabled) onCellTap(cell, index);
            }}
          >
            {cell}
          </div>
        );
      })}
    </div>
  );
}
