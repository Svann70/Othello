/**
 * BoardCell Component
 * Renders a single cell on the Othello game board
 */

import { memo } from 'react';
import { CellState, Position } from '@/lib/gameLogic';
import { cn } from '@/lib/utils';

interface BoardCellProps {
  row: number;
  col: number;
  state: CellState;
  isValidMove: boolean;
  isLastMove: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  disabled: boolean;
  isNewPiece?: boolean;
  isFlipping?: boolean;
}

const BoardCell = memo(function BoardCell({
  state,
  isValidMove,
  isLastMove,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  disabled,
  isNewPiece,
  isFlipping,
}: BoardCellProps) {
  const canClick = isValidMove && !disabled;

  return (
    <button
      type="button"
      className={cn(
        'board-cell aspect-square relative',
        isLastMove && 'board-cell-last',
        isValidMove && !state && 'board-cell-valid',
        canClick && 'cursor-pointer',
        !canClick && 'cursor-default'
      )}
      onClick={canClick ? onClick : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={!canClick}
    >
      {/* Grid line overlay */}
      <div className="absolute inset-0 border border-[hsl(var(--board-grid))]" />
      
      {/* Piece rendering */}
      {state && (
        <div
          className={cn(
            'piece',
            state === 'black' ? 'piece-black' : 'piece-white',
            isNewPiece && 'piece-place',
            isFlipping && 'piece-flip'
          )}
        />
      )}
      
      {/* Valid move indicator */}
      {isValidMove && !state && (
        <div 
          className={cn(
            'absolute rounded-full transition-opacity duration-150',
            'top-[30%] left-[30%] w-[40%] h-[40%]',
            'bg-game-valid/30',
            isHovered && 'bg-game-valid/60'
          )}
        />
      )}
    </button>
  );
});

export default BoardCell;
