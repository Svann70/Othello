/**
 * BoardCell Component
 * Renders a single cell on the Othello game board
 * Handles piece display, valid move indicators, and hover states
 */

import { memo } from 'react';
import { CellState, Position, Move } from '@/lib/gameLogic';
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
  row,
  col,
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
      aria-label={`Cell ${row + 1}, ${col + 1}${state ? `, ${state} piece` : isValidMove ? ', valid move' : ''}`}
    >
      {/* Grid line overlay for visual separation */}
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
      
      {/* Hover indicator for valid moves */}
      {isValidMove && !state && isHovered && (
        <div 
          className={cn(
            'absolute rounded-full opacity-50',
            'top-[15%] left-[15%] w-[70%] h-[70%]',
            'border-2 border-dashed',
            'border-[hsl(var(--accent))]'
          )}
        />
      )}
    </button>
  );
});

export default BoardCell;
