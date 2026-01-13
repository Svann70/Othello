/**
 * ScorePanel Component
 * Displays scores and turn indicator
 */

import { memo } from 'react';
import { Player } from '@/lib/gameLogic';
import { cn } from '@/lib/utils';

export type GameMode = 'pvp' | 'pve';

interface ScorePanelProps {
  blackScore: number;
  whiteScore: number;
  currentPlayer: Player;
  isAiThinking: boolean;
  isGameOver: boolean;
  playerColor: Player;
  gameMode: GameMode;
}

const ScorePanel = memo(function ScorePanel({
  blackScore,
  whiteScore,
  currentPlayer,
  isAiThinking,
  isGameOver,
  playerColor,
  gameMode,
}: ScorePanelProps) {
  const isPvP = gameMode === 'pvp';
  const isPlayerTurn = currentPlayer === playerColor;
  
  const getBlackLabel = () => isPvP ? 'Player 1' : (playerColor === 'black' ? 'You' : 'AI');
  const getWhiteLabel = () => isPvP ? 'Player 2' : (playerColor === 'white' ? 'You' : 'AI');

  const getTurnText = () => {
    if (isPvP) return currentPlayer === 'black' ? 'Player 1 turn' : 'Player 2 turn';
    return isPlayerTurn ? 'Your turn' : 'AI thinking...';
  };
  
  return (
    <div className="game-panel rounded-xl p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-4 text-center font-serif">Score</h2>
      
      <div className="flex justify-center gap-6 sm:gap-8">
        {/* Black score */}
        <div 
          className={cn(
            'flex flex-col items-center p-3 rounded-lg transition-all duration-300',
            currentPlayer === 'black' && !isGameOver && 'score-indicator-active bg-secondary/50'
          )}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2 piece-black relative" />
          <span className="text-2xl sm:text-3xl font-bold">{blackScore}</span>
          <span className="text-xs text-muted-foreground mt-1">{getBlackLabel()}</span>
        </div>

        <div className="w-px bg-border self-stretch" />

        {/* White score */}
        <div 
          className={cn(
            'flex flex-col items-center p-3 rounded-lg transition-all duration-300',
            currentPlayer === 'white' && !isGameOver && 'score-indicator-active bg-secondary/50'
          )}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2 piece-white relative" />
          <span className="text-2xl sm:text-3xl font-bold">{whiteScore}</span>
          <span className="text-xs text-muted-foreground mt-1">{getWhiteLabel()}</span>
        </div>
      </div>

      {/* Turn indicator */}
      <div className="mt-6 text-center">
        {isGameOver ? (
          <p className="text-muted-foreground">Game Over</p>
        ) : isAiThinking ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-muted-foreground">AI thinking</span>
            <div className="thinking-indicator">
              <div className="thinking-dot" />
              <div className="thinking-dot" />
              <div className="thinking-dot" />
            </div>
          </div>
        ) : (
          <p className="text-foreground">{getTurnText()}</p>
        )}
      </div>
    </div>
  );
});

export default ScorePanel;
