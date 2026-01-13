/**
 * AIVisualization Component
 * Lightweight AI evaluation display
 */

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FuzzyGameState } from '@/lib/fuzzyLogic';

export interface MoveEvaluation {
  row: number;
  col: number;
  score: number;
}

interface AIVisualizationProps {
  isVisible: boolean;
  isThinking: boolean;
  fuzzyState: FuzzyGameState | null;
  weights: {
    position: number;
    mobility: number;
    corner: number;
    stability: number;
    pieces: number;
  } | null;
  topMoves: MoveEvaluation[];
  currentEvaluation: number;
}

function toAlgebraic(row: number, col: number): string {
  const columns = 'ABCDEFGH';
  return `${columns[col]}${8 - row}`;
}

const FuzzyBar = memo(function FuzzyBar({ 
  label, 
  values,
  colors,
}: { 
  label: string; 
  values: { name: string; value: number }[];
  colors: string[];
}) {
  return (
    <div className="mb-2">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-secondary/50 gap-0.5">
        {values.map((v, i) => (
          <div
            key={v.name}
            className={cn('h-full transition-all duration-300', colors[i])}
            style={{ width: `${v.value * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
});

const WeightBar = memo(function WeightBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-14">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-secondary/50 overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-xs w-8 text-right">{(value * 100).toFixed(0)}%</span>
    </div>
  );
});

const AIVisualization = memo(function AIVisualization({
  isVisible,
  isThinking,
  fuzzyState,
  weights,
  topMoves,
  currentEvaluation,
}: AIVisualizationProps) {
  if (!isVisible) return null;

  const limitedMoves = useMemo(() => topMoves.slice(0, 3), [topMoves]);

  return (
    <div className="game-panel rounded-xl p-4 text-sm">
      <h3 className="font-semibold mb-3 font-serif flex items-center gap-2">
        AI Analysis
        {isThinking && (
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.4s' }} />
          </span>
        )}
      </h3>

      {/* Current Evaluation */}
      <div className="mb-3 p-2 rounded-lg bg-secondary/30">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-xs">Evaluation</span>
          <span className={cn(
            'font-mono font-bold',
            currentEvaluation > 0 ? 'text-game-valid' : 
            currentEvaluation < 0 ? 'text-destructive' : 'text-foreground'
          )}>
            {currentEvaluation > 0 ? '+' : ''}{currentEvaluation.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Fuzzy State - Simplified */}
      {fuzzyState && (
        <div className="mb-3">
          <FuzzyBar
            label="Game Phase"
            values={[
              { name: 'Early', value: fuzzyState.gamePhase.early },
              { name: 'Mid', value: fuzzyState.gamePhase.mid },
              { name: 'Late', value: fuzzyState.gamePhase.late },
            ]}
            colors={['bg-blue-500', 'bg-yellow-500', 'bg-red-500']}
          />
          <FuzzyBar
            label="Mobility"
            values={[
              { name: 'Low', value: fuzzyState.mobility.low },
              { name: 'Med', value: fuzzyState.mobility.medium },
              { name: 'High', value: fuzzyState.mobility.high },
            ]}
            colors={['bg-red-400', 'bg-yellow-400', 'bg-green-400']}
          />
        </div>
      )}

      {/* Weights - Simplified */}
      {weights && (
        <div className="mb-3 space-y-1">
          <WeightBar label="Position" value={weights.position} color="bg-purple-500" />
          <WeightBar label="Mobility" value={weights.mobility} color="bg-cyan-500" />
          <WeightBar label="Corners" value={weights.corner} color="bg-amber-500" />
        </div>
      )}

      {/* Top Moves */}
      {limitedMoves.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">Top Moves</div>
          <div className="space-y-1">
            {limitedMoves.map((move, index) => (
              <div 
                key={`${move.row}-${move.col}`}
                className={cn(
                  'flex justify-between items-center px-2 py-0.5 rounded text-xs',
                  index === 0 ? 'bg-accent/20 font-medium' : 'bg-secondary/20'
                )}
              >
                <span className="font-mono">{toAlgebraic(move.row, move.col)}</span>
                <span className={cn(
                  'font-mono',
                  move.score > 0 ? 'text-game-valid' : 
                  move.score < 0 ? 'text-destructive' : ''
                )}>
                  {move.score > 0 ? '+' : ''}{move.score.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default AIVisualization;
