/**
 * AIVisualization Component
 * Displays AI evaluation metrics and fuzzy logic state
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { FuzzyGameState } from '@/lib/fuzzyLogic';

interface MoveEvaluation {
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

// Convert row/col to algebraic notation
function toAlgebraic(row: number, col: number): string {
  const columns = 'ABCDEFGH';
  return `${columns[col]}${8 - row}`;
}

// Fuzzy value bar component
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
    <div className="mb-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-secondary/50 gap-0.5">
        {values.map((v, i) => (
          <div
            key={v.name}
            className={cn('h-full transition-all duration-300', colors[i])}
            style={{ width: `${v.value * 100}%` }}
            title={`${v.name}: ${(v.value * 100).toFixed(0)}%`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
        {values.map((v) => (
          <span key={v.name} className="opacity-70">
            {v.name}: {(v.value * 100).toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
});

// Weight indicator component
const WeightIndicator = memo(function WeightIndicator({
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
      <span className="text-xs text-muted-foreground w-16">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-xs font-medium w-10 text-right">
        {(value * 100).toFixed(0)}%
      </span>
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
      <div className="mb-4 p-3 rounded-lg bg-secondary/30">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-xs">Board Evaluation</span>
          <span className={cn(
            'font-mono font-bold text-lg',
            currentEvaluation > 0 ? 'text-game-valid' : 
            currentEvaluation < 0 ? 'text-destructive' : 'text-foreground'
          )}>
            {currentEvaluation > 0 ? '+' : ''}{currentEvaluation.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Fuzzy State Visualization */}
      {fuzzyState && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Fuzzy State</h4>
          
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
          
          <FuzzyBar
            label="Corner Control"
            values={[
              { name: 'Weak', value: fuzzyState.cornerControl.weak },
              { name: 'Mod', value: fuzzyState.cornerControl.moderate },
              { name: 'Strong', value: fuzzyState.cornerControl.strong },
            ]}
            colors={['bg-orange-400', 'bg-blue-400', 'bg-emerald-400']}
          />
          
          <FuzzyBar
            label="Stability"
            values={[
              { name: 'Unstable', value: fuzzyState.stability.unstable },
              { name: 'Neutral', value: fuzzyState.stability.neutral },
              { name: 'Stable', value: fuzzyState.stability.stable },
            ]}
            colors={['bg-rose-400', 'bg-slate-400', 'bg-teal-400']}
          />
        </div>
      )}

      {/* Dynamic Weights */}
      {weights && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Evaluation Weights</h4>
          <div className="space-y-1.5">
            <WeightIndicator label="Position" value={weights.position} color="bg-purple-500" />
            <WeightIndicator label="Mobility" value={weights.mobility} color="bg-cyan-500" />
            <WeightIndicator label="Corners" value={weights.corner} color="bg-amber-500" />
            <WeightIndicator label="Stability" value={weights.stability} color="bg-emerald-500" />
            <WeightIndicator label="Pieces" value={weights.pieces} color="bg-rose-500" />
          </div>
        </div>
      )}

      {/* Top Moves */}
      {topMoves.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Top Moves</h4>
          <div className="space-y-1">
            {topMoves.slice(0, 5).map((move, index) => (
              <div 
                key={`${move.row}-${move.col}`}
                className={cn(
                  'flex justify-between items-center px-2 py-1 rounded text-xs',
                  index === 0 ? 'bg-accent/20 font-medium' : 'bg-secondary/20'
                )}
              >
                <span className="font-mono">{toAlgebraic(move.row, move.col)}</span>
                <span className={cn(
                  'font-mono',
                  move.score > 0 ? 'text-game-valid' : 
                  move.score < 0 ? 'text-destructive' : ''
                )}>
                  {move.score > 0 ? '+' : ''}{move.score.toFixed(1)}
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
export type { MoveEvaluation };
