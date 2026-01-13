/**
 * GameOverlay Component
 * Displays game over state with winner announcement and restart option
 * Supports both PvE and PvP game modes
 */

import { memo } from 'react';
import { Player } from '@/lib/gameLogic';
import { cn } from '@/lib/utils';
import { GameMode } from './MainMenu';

interface GameOverlayProps {
  isVisible: boolean;
  winner: Player | 'tie' | null;
  blackScore: number;
  whiteScore: number;
  playerColor: Player;
  onRestart: () => void;
  gameMode: GameMode;
}

const GameOverlay = memo(function GameOverlay({
  isVisible,
  winner,
  blackScore,
  whiteScore,
  playerColor,
  onRestart,
  gameMode,
}: GameOverlayProps) {
  if (!isVisible) return null;

  const isPvP = gameMode === 'pvp';
  const playerWon = winner === playerColor;
  const isTie = winner === 'tie';

  const getMessage = () => {
    if (isTie) return 'Draw';
    if (isPvP) {
      return winner === 'black' ? 'Player 1 Wins' : 'Player 2 Wins';
    }
    return playerWon ? 'Victory' : 'Defeat';
  };

  const getSubMessage = () => {
    if (isTie) return 'The game ended in a tie';
    if (isPvP) {
      return winner === 'black' 
        ? 'Player 1 (Black) has won the match' 
        : 'Player 2 (White) has won the match';
    }
    return playerWon 
      ? 'Congratulations on your victory' 
      : 'The AI has won this match';
  };

  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-background/80 backdrop-blur-sm',
        'animate-fade-in'
      )}
    >
      <div 
        className={cn(
          'game-panel rounded-2xl p-8 sm:p-12 text-center max-w-md mx-4',
          'animate-scale-in'
        )}
      >
        {/* Result heading */}
        <h2 className="text-4xl sm:text-5xl font-serif font-bold mb-2">
          {getMessage()}
        </h2>
        
        <p className="text-muted-foreground mb-8">
          {getSubMessage()}
        </p>

        {/* Final scores */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div 
              className="w-12 h-12 rounded-full mx-auto mb-2 piece-black"
              style={{ position: 'relative' }}
            />
            <span className="text-2xl font-bold">{blackScore}</span>
            <div className="text-xs text-muted-foreground mt-1">
              {isPvP ? 'Player 1' : (playerColor === 'black' ? 'You' : 'AI')}
            </div>
          </div>
          
          <div className="flex items-center text-2xl text-muted-foreground">
            -
          </div>
          
          <div className="text-center">
            <div 
              className="w-12 h-12 rounded-full mx-auto mb-2 piece-white"
              style={{ position: 'relative' }}
            />
            <span className="text-2xl font-bold">{whiteScore}</span>
            <div className="text-xs text-muted-foreground mt-1">
              {isPvP ? 'Player 2' : (playerColor === 'white' ? 'You' : 'AI')}
            </div>
          </div>
        </div>

        {/* Restart button */}
        <button
          type="button"
          onClick={onRestart}
          className="btn-game rounded-lg text-primary-foreground w-full sm:w-auto"
        >
          Play Again
        </button>
      </div>
    </div>
  );
});

export default GameOverlay;
