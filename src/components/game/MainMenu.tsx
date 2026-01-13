/**
 * MainMenu Component
 * Game start screen with mode and difficulty selection
 */

import { memo, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Player } from '@/lib/gameLogic';
import { cn } from '@/lib/utils';
import { GameMode } from './ScorePanel';
import CreditsFooter from './CreditsFooter';
import TutorialOverlay from './TutorialOverlay';

interface MainMenuProps {
  onStartGame: (playerColor: Player, difficulty: number, mode: GameMode) => void;
}

const DIFFICULTY_OPTIONS = [
  { level: 1, label: 'Easy', description: 'Quick & casual' },
  { level: 2, label: 'Medium', description: 'Balanced play' },
  { level: 3, label: 'Hard', description: 'Challenging' },
];

const MainMenu = memo(function MainMenu({ onStartGame }: MainMenuProps) {
  const [gameMode, setGameMode] = useState<GameMode>('pve');
  const [selectedColor, setSelectedColor] = useState<Player>('black');
  const [selectedDifficulty, setSelectedDifficulty] = useState(2);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleStart = () => {
    onStartGame(selectedColor, selectedDifficulty, gameMode);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="game-panel rounded-2xl p-8 sm:p-12 max-w-lg w-full flex flex-col">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-2">Othello</h1>
            <p className="text-muted-foreground">Classic strategy board game</p>
          </div>

          {/* Game Mode Selection */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">Game Mode</h3>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setGameMode('pve')}
                className={cn(
                  'flex-1 p-4 rounded-lg transition-all duration-200 border-2 text-center',
                  gameMode === 'pve' ? 'border-accent bg-secondary/50' : 'border-transparent hover:bg-secondary/30'
                )}
              >
                <div className="font-medium mb-1">vs AI</div>
                <div className="text-xs text-muted-foreground">Play against computer</div>
              </button>

              <button
                type="button"
                onClick={() => setGameMode('pvp')}
                className={cn(
                  'flex-1 p-4 rounded-lg transition-all duration-200 border-2 text-center',
                  gameMode === 'pvp' ? 'border-accent bg-secondary/50' : 'border-transparent hover:bg-secondary/30'
                )}
              >
                <div className="font-medium mb-1">2 Players</div>
                <div className="text-xs text-muted-foreground">Local multiplayer</div>
              </button>
            </div>
          </div>

          {/* Color selection - PvE only */}
          {gameMode === 'pve' && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">Your Color</h3>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedColor('black')}
                  className={cn(
                    'flex flex-col items-center p-4 rounded-lg transition-all duration-200 border-2',
                    selectedColor === 'black' ? 'border-accent bg-secondary/50' : 'border-transparent hover:bg-secondary/30'
                  )}
                >
                  <div className="w-12 h-12 rounded-full mb-2 piece-black relative" />
                  <span className="text-sm">Black</span>
                  <span className="text-xs text-muted-foreground">Moves first</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedColor('white')}
                  className={cn(
                    'flex flex-col items-center p-4 rounded-lg transition-all duration-200 border-2',
                    selectedColor === 'white' ? 'border-accent bg-secondary/50' : 'border-transparent hover:bg-secondary/30'
                  )}
                >
                  <div className="w-12 h-12 rounded-full mb-2 piece-white relative" />
                  <span className="text-sm">White</span>
                  <span className="text-xs text-muted-foreground">Moves second</span>
                </button>
              </div>
            </div>
          )}

          {/* Difficulty selection - PvE only */}
          {gameMode === 'pve' && (
            <div className="mb-10">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">Difficulty</h3>
              <div className="flex flex-col gap-2">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <button
                    key={option.level}
                    type="button"
                    onClick={() => setSelectedDifficulty(option.level)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg transition-all duration-200 border',
                      selectedDifficulty === option.level ? 'border-accent bg-secondary/50' : 'border-border hover:bg-secondary/30'
                    )}
                  >
                    <span className="font-medium">{option.label}</span>
                    <span className="text-sm text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PvP mode info */}
          {gameMode === 'pvp' && (
            <div className="mb-10 p-4 rounded-lg bg-secondary/30 text-center">
              <p className="text-sm text-muted-foreground mb-2">Two players on the same device</p>
              <div className="flex justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full piece-black" />
                  <span className="text-sm">Player 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full piece-white" />
                  <span className="text-sm">Player 2</span>
                </div>
              </div>
            </div>
          )}

          {/* Start button */}
          <button type="button" onClick={handleStart} className="btn-game rounded-lg text-primary-foreground text-lg py-4">
            Start Game
          </button>

          {/* Tutorial button */}
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Cara Bermain</span>
          </button>

          <CreditsFooter />
        </div>
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay isVisible={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
});

export default MainMenu;
