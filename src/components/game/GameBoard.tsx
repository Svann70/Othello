/**
 * GameBoard Component
 * Renders the 8x8 Othello game board
 */

import { useState, useCallback, memo } from 'react';
import { Board, Move, Position } from '@/lib/gameLogic';
import BoardCell from './BoardCell';

interface GameBoardProps {
  board: Board;
  validMoves: Move[];
  lastMove: Position | null;
  onCellClick: (move: Move) => void;
  disabled: boolean;
  recentlyPlaced: Position | null;
  recentlyFlipped: Position[];
}

const COLUMN_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROW_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const GameBoard = memo(function GameBoard({
  board,
  validMoves,
  lastMove,
  onCellClick,
  disabled,
  recentlyPlaced,
  recentlyFlipped,
}: GameBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);

  const getValidMove = useCallback((row: number, col: number): Move | undefined => {
    return validMoves.find(m => m.row === row && m.col === col);
  }, [validMoves]);

  const isLastMove = useCallback((row: number, col: number): boolean => {
    return lastMove?.row === row && lastMove?.col === col;
  }, [lastMove]);

  const isHovered = useCallback((row: number, col: number): boolean => {
    return hoveredCell?.row === row && hoveredCell?.col === col;
  }, [hoveredCell]);

  const isRecentlyPlaced = useCallback((row: number, col: number): boolean => {
    return recentlyPlaced?.row === row && recentlyPlaced?.col === col;
  }, [recentlyPlaced]);

  const isRecentlyFlipped = useCallback((row: number, col: number): boolean => {
    return recentlyFlipped.some(p => p.row === row && p.col === col);
  }, [recentlyFlipped]);

  const handleCellClick = useCallback((row: number, col: number) => {
    const move = getValidMove(row, col);
    if (move) onCellClick(move);
  }, [getValidMove, onCellClick]);

  const handleMouseEnter = useCallback((row: number, col: number) => {
    setHoveredCell({ row, col });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  return (
    <div className="game-panel rounded-xl p-4 sm:p-6">
      <div className="relative">
        {/* Column labels */}
        <div className="flex mb-2 pl-8">
          {COLUMN_LABELS.map((label) => (
            <div 
              key={label} 
              className="flex-1 text-center text-xs sm:text-sm font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Row labels */}
          <div className="flex flex-col w-8">
            {ROW_LABELS.map((label) => (
              <div 
                key={label} 
                className="flex-1 flex items-center justify-center text-xs sm:text-sm font-medium text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Game board grid */}
          <div 
            className="grid grid-cols-8 gap-0 rounded-lg overflow-hidden flex-1"
            style={{
              boxShadow: 'inset 0 2px 8px hsl(0 0% 0% / 0.3), 0 4px 16px hsl(0 0% 0% / 0.2)'
            }}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const validMove = getValidMove(rowIndex, colIndex);
                return (
                  <BoardCell
                    key={`${rowIndex}-${colIndex}`}
                    row={rowIndex}
                    col={colIndex}
                    state={cell}
                    isValidMove={!!validMove}
                    isLastMove={isLastMove(rowIndex, colIndex)}
                    isHovered={isHovered(rowIndex, colIndex)}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                    onMouseLeave={handleMouseLeave}
                    disabled={disabled}
                    isNewPiece={isRecentlyPlaced(rowIndex, colIndex)}
                    isFlipping={isRecentlyFlipped(rowIndex, colIndex)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default GameBoard;
