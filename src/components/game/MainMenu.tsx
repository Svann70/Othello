/**
 * OthelloGame Component
 * Main game container - Optimized for web performance
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  GameState,
  Player,
  Move,
  Position,
  createInitialGameState,
  applyMove,
  getValidMoves,
  countPieces,
  getOpponent,
  getAiMove,
  getAiEvaluation,
  evaluateAllMoves,
} from '@/lib/gameLogic';
import { FuzzyGameState, calculateFuzzyState } from '@/lib/fuzzyLogic';
import MainMenu from './MainMenu';
import GameBoard from './GameBoard';
import ScorePanel, { GameMode } from './ScorePanel';
import GameOverlay from './GameOverlay';
import CreditsFooter from './CreditsFooter';
import AIVisualization, { MoveEvaluation } from './AIVisualization';

type GamePhase = 'menu' | 'playing' | 'gameover';

const OthelloGame = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [gameMode, setGameMode] = useState<GameMode>('pve');
  const [playerColor, setPlayerColor] = useState<Player>('black');
  const [difficulty, setDifficulty] = useState(2);
  const [recentlyPlaced, setRecentlyPlaced] = useState<Position | null>(null);
  const [recentlyFlipped, setRecentlyFlipped] = useState<Position[]>([]);
  
  // AI Visualization state - lazy updated
  const [showAiViz, setShowAiViz] = useState(true);
  const [fuzzyState, setFuzzyState] = useState<FuzzyGameState | null>(null);
  const [evalWeights, setEvalWeights] = useState<{
    position: number;
    mobility: number;
    corner: number;
    stability: number;
    pieces: number;
  } | null>(null);
  const [topMoves, setTopMoves] = useState<MoveEvaluation[]>([]);
  const [currentEval, setCurrentEval] = useState(0);
  
  const aiTimeoutRef = useRef<number | null>(null);
  const evalTimeoutRef = useRef<number | null>(null);

  // Debounced AI visualization update - runs with delay to not block UI
  useEffect(() => {
    if (gamePhase !== 'playing' || gameMode !== 'pve' || gameState.isGameOver) return;
    
    // Clear previous timeout
    if (evalTimeoutRef.current) {
      clearTimeout(evalTimeoutRef.current);
    }
    
    // Debounce evaluation to prevent lag
    evalTimeoutRef.current = window.setTimeout(() => {
      try {
        const aiPlayer = getOpponent(playerColor);
        const evaluation = getAiEvaluation(gameState.board, aiPlayer);
        const fuzzy = calculateFuzzyState(gameState.board, aiPlayer);
        
        setFuzzyState(fuzzy);
        setEvalWeights(evaluation.weights);
        setCurrentEval(evaluation.finalScore);
        
        // Get top moves with minimal depth
        const moves = evaluateAllMoves(gameState.board, aiPlayer, 1);
        setTopMoves(moves);
      } catch {
        // Ignore errors
      }
    }, 100); // 100ms debounce
    
    return () => {
      if (evalTimeoutRef.current) {
        clearTimeout(evalTimeoutRef.current);
      }
    };
  }, [gameState.board, gamePhase, gameMode, playerColor, gameState.isGameOver]);

  const handleStartGame = useCallback((color: Player, diff: number, mode: GameMode) => {
    setPlayerColor(color);
    setDifficulty(diff);
    setGameMode(mode);
    setGameState(createInitialGameState());
    setGamePhase('playing');
    setRecentlyPlaced(null);
    setRecentlyFlipped([]);
    setFuzzyState(null);
    setEvalWeights(null);
    setTopMoves([]);
    setCurrentEval(0);
  }, []);

  const handleCellClick = useCallback((move: Move) => {
    if (gameMode === 'pve') {
      if (gameState.isAiThinking || gameState.currentPlayer !== playerColor) return;
    }

    const newBoard = applyMove(gameState.board, move, gameState.currentPlayer);
    const pieces = countPieces(newBoard);
    const nextPlayer = getOpponent(gameState.currentPlayer);
    const nextValidMoves = getValidMoves(newBoard, nextPlayer);

    setRecentlyPlaced({ row: move.row, col: move.col });
    setRecentlyFlipped(move.flips);

    setTimeout(() => {
      setRecentlyPlaced(null);
      setRecentlyFlipped([]);
    }, 400);

    let finalNextPlayer = nextPlayer;
    let finalValidMoves = nextValidMoves;

    if (nextValidMoves.length === 0) {
      const currentPlayerMoves = getValidMoves(newBoard, gameState.currentPlayer);
      if (currentPlayerMoves.length === 0) {
        const winner = pieces.black > pieces.white 
          ? 'black' 
          : pieces.white > pieces.black ? 'white' : 'tie';
        
        setGameState(prev => ({
          ...prev,
          board: newBoard,
          blackScore: pieces.black,
          whiteScore: pieces.white,
          validMoves: [],
          lastMove: { row: move.row, col: move.col },
          isGameOver: true,
          winner,
        }));
        setGamePhase('gameover');
        return;
      }
      finalNextPlayer = gameState.currentPlayer;
      finalValidMoves = currentPlayerMoves;
    }

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: finalNextPlayer,
      blackScore: pieces.black,
      whiteScore: pieces.white,
      validMoves: finalValidMoves,
      lastMove: { row: move.row, col: move.col },
    }));
  }, [gameState, playerColor, gameMode]);

  // AI move logic - optimized
  useEffect(() => {
    if (gameMode === 'pvp') return;
    if (gamePhase !== 'playing' || gameState.isGameOver || gameState.currentPlayer === playerColor) return;

    setGameState(prev => ({ ...prev, isAiThinking: true }));

    // Reduced delay for snappier feel
    aiTimeoutRef.current = window.setTimeout(() => {
      const aiMove = getAiMove(gameState.board, gameState.currentPlayer, difficulty);

      if (!aiMove) {
        const playerMoves = getValidMoves(gameState.board, playerColor);
        if (playerMoves.length === 0) {
          const pieces = countPieces(gameState.board);
          const winner = pieces.black > pieces.white ? 'black' : pieces.white > pieces.black ? 'white' : 'tie';
          
          setGameState(prev => ({
            ...prev,
            isAiThinking: false,
            isGameOver: true,
            winner,
            validMoves: [],
          }));
          setGamePhase('gameover');
        } else {
          setGameState(prev => ({
            ...prev,
            isAiThinking: false,
            currentPlayer: playerColor,
            validMoves: playerMoves,
          }));
        }
        return;
      }

      const newBoard = applyMove(gameState.board, aiMove, gameState.currentPlayer);
      const pieces = countPieces(newBoard);
      const playerMoves = getValidMoves(newBoard, playerColor);

      setRecentlyPlaced({ row: aiMove.row, col: aiMove.col });
      setRecentlyFlipped(aiMove.flips);

      setTimeout(() => {
        setRecentlyPlaced(null);
        setRecentlyFlipped([]);
      }, 400);

      if (playerMoves.length === 0) {
        const aiMoves = getValidMoves(newBoard, gameState.currentPlayer);
        if (aiMoves.length === 0) {
          const winner = pieces.black > pieces.white ? 'black' : pieces.white > pieces.black ? 'white' : 'tie';
          
          setGameState(prev => ({
            ...prev,
            board: newBoard,
            blackScore: pieces.black,
            whiteScore: pieces.white,
            lastMove: { row: aiMove.row, col: aiMove.col },
            isAiThinking: false,
            isGameOver: true,
            winner,
            validMoves: [],
          }));
          setGamePhase('gameover');
        } else {
          setGameState(prev => ({
            ...prev,
            board: newBoard,
            blackScore: pieces.black,
            whiteScore: pieces.white,
            lastMove: { row: aiMove.row, col: aiMove.col },
            isAiThinking: false,
            validMoves: aiMoves,
          }));
        }
      } else {
        setGameState(prev => ({
          ...prev,
          board: newBoard,
          currentPlayer: playerColor,
          blackScore: pieces.black,
          whiteScore: pieces.white,
          validMoves: playerMoves,
          lastMove: { row: aiMove.row, col: aiMove.col },
          isAiThinking: false,
        }));
      }
    }, 500); // Reduced from 800ms

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [gamePhase, gameMode, gameState.currentPlayer, gameState.isGameOver, gameState.board, playerColor, difficulty]);

  const handleRestart = useCallback(() => {
    setGamePhase('menu');
    setGameState(createInitialGameState());
    setRecentlyPlaced(null);
    setRecentlyFlipped([]);
    setFuzzyState(null);
    setEvalWeights(null);
    setTopMoves([]);
    setCurrentEval(0);
  }, []);

  if (gamePhase === 'menu') {
    return <MainMenu onStartGame={handleStartGame} />;
  }

  const isBoardDisabled = gameMode === 'pve' 
    ? gameState.isAiThinking || gameState.currentPlayer !== playerColor
    : false;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center gap-6 p-4 sm:p-8">
      {/* Main board */}
      <div className="w-full max-w-[min(90vw,500px)] lg:max-w-[500px]">
        <GameBoard
          board={gameState.board}
          validMoves={gameState.validMoves}
          lastMove={gameState.lastMove}
          onCellClick={handleCellClick}
          disabled={isBoardDisabled}
          recentlyPlaced={recentlyPlaced}
          recentlyFlipped={recentlyFlipped}
        />
      </div>

      {/* Side panel */}
      <div className="w-full max-w-[min(90vw,300px)] lg:max-w-[280px] flex flex-col gap-4">
        <ScorePanel
          blackScore={gameState.blackScore}
          whiteScore={gameState.whiteScore}
          currentPlayer={gameState.currentPlayer}
          isAiThinking={gameState.isAiThinking}
          isGameOver={gameState.isGameOver}
          playerColor={playerColor}
          gameMode={gameMode}
        />

        {/* AI Visualization */}
        {gameMode === 'pve' && (
          <>
            <button
              type="button"
              onClick={() => setShowAiViz(!showAiViz)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left px-1"
            >
              {showAiViz ? '▼ Hide' : '▶ Show'} AI Analysis
            </button>
            <AIVisualization
              isVisible={showAiViz}
              isThinking={gameState.isAiThinking}
              fuzzyState={fuzzyState}
              weights={evalWeights}
              topMoves={topMoves}
              currentEvaluation={currentEval}
            />
          </>
        )}

        {/* Game controls */}
        <div className="game-panel rounded-xl p-4">
          <button
            type="button"
            onClick={handleRestart}
            className="w-full py-2 px-4 rounded-lg border border-border text-sm font-medium transition-colors duration-200 hover:bg-secondary/50"
          >
            Return to Menu
          </button>
        </div>

        <div className="game-panel rounded-xl p-4">
          <CreditsFooter />
        </div>
      </div>

      <GameOverlay
        isVisible={gamePhase === 'gameover'}
        winner={gameState.winner}
        blackScore={gameState.blackScore}
        whiteScore={gameState.whiteScore}
        playerColor={playerColor}
        onRestart={handleRestart}
        gameMode={gameMode}
      />
    </div>
  );
};

export default OthelloGame;
