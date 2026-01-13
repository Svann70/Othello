/**
 * ScorePanel Component
 * Displays current scores, turn indicator, and AI thinking state
 * Supports both PvE and PvP game modes
 */

import { memo } from 'react';
import { Player } from '@/lib/gameLogic';
import { cn } from '@/lib/utils';
import { GameMode } from './MainMenu';

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
  
  // Label for each player based on game mode
  const getBlackLabel = () => {
    if (isPvP) return 'Player 1';
    return playerColor === 'black' ? 'You' : 'AI';
  };
  
  const getWhiteLabel = () => {
    if (isPvP) return 'Player 2';
    return playerColor === 'white' ? 'You' : 'AI';
  };

  // Turn indicator text
  const getTurnText = () => {
    if (isPvP) {
      return currentPlayer === 'black' ? 'Player 1 turn' : 'Player 2 turn';
    }
    return isPlayerTurn ? 'Your turn' : 'AI turn';
  };
  
  return (
    <div className="game-panel rounded-xl p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-4 text-center font-serif">Score</h2>
      
      <div className="flex justify-center gap-6 sm:gap-8">
        {/* Black score */}
        <div 
          className={cn(
            'score-indicator flex flex-col items-center p-3 rounded-lg transition-all duration-300',
            currentPlayer === 'black' && !isGameOver && 'score-indicator-active bg-secondary/50'
          )}
        >
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2 piece-black"
            style={{ position: 'relative' }}
          />
          <span className="text-2xl sm:text-3xl font-bold">{blackScore}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {getBlackLabel()}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px bg-border self-stretch" />

        {/* White score */}
        <div 
          className={cn(
            'score-indicator flex flex-col items-center p-3 rounded-lg transition-all duration-300',
            currentPlayer === 'white' && !isGameOver && 'score-indicator-active bg-secondary/50'
          )}
        >
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2 piece-white"
            style={{ position: 'relative' }}
          />
          <span className="text-2xl sm:text-3xl font-bold">{whiteScore}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {getWhiteLabel()}
          </span>
        </div>
      </div>

      {/* Turn / Status indicator */}
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
          <p className="text-foreground">
            {getTurnText()}
          </p>
        )}
      </div>
    </div>
  );
});

export default ScorePanel;
