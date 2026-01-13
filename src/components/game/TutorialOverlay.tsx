/**
 * Interactive Tutorial for Othello
 * Step-by-step guide for new players
 */

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, RotateCcw } from 'lucide-react';

interface TutorialStep {
  title: string;
  content: string;
  highlightCells?: { row: number; col: number }[];
  boardState?: (string | null)[][];
  validMoves?: { row: number; col: number }[];
  animation?: 'flip' | 'place' | 'highlight';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Selamat Datang di Othello!",
    content: "Othello adalah permainan strategi klasik untuk 2 pemain. Tujuannya adalah memiliki lebih banyak keping warna Anda di papan saat permainan berakhir.",
    boardState: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, 'white', 'black', null, null, null],
      [null, null, null, 'black', 'white', null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ],
    highlightCells: [{ row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }],
  },
  {
    title: "Posisi Awal",
    content: "Permainan dimulai dengan 4 keping di tengah papan: 2 hitam dan 2 putih dalam pola diagonal. Hitam selalu bergerak pertama.",
    boardState: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, 'white', 'black', null, null, null],
      [null, null, null, 'black', 'white', null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ],
    highlightCells: [{ row: 3, col: 3 }, { row: 4, col: 4 }],
  },
  {
    title: "Cara Bermain - Langkah Valid",
    content: "Anda hanya bisa meletakkan keping di posisi yang mengapit minimal satu keping lawan di antara keping baru dan keping Anda yang sudah ada. Lihat titik-titik hijau - ini adalah langkah yang valid untuk Hitam.",
    boardState: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, 'white', 'black', null, null, null],
      [null, null, null, 'black', 'white', null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ],
    validMoves: [{ row: 2, col: 3 }, { row: 3, col: 2 }, { row: 4, col: 5 }, { row: 5, col: 4 }],
  },
  {
    title: "Membalik Keping",
    content: "Ketika Anda menempatkan keping, semua keping lawan yang terjepit di antara keping baru Anda dan keping Anda lainnya akan dibalik menjadi warna Anda!",
    boardState: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, 'black', null, null, null, null],
      [null, null, null, 'black', 'black', null, null, null],
      [null, null, null, 'black', 'white', null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ],
    highlightCells: [{ row: 2, col: 3 }, { row: 3, col: 3 }],
    animation: 'flip',
  },
  {
    title: "Arah Pembalikan",
    content: "Keping bisa dibalik dalam 8 arah: horizontal, vertikal, dan diagonal. Dalam satu langkah, Anda bisa membalik keping di beberapa arah sekaligus!",
    boardState: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, 'black', null, 'black', null, null, null],
      [null, null, null, 'white', 'white', 'black', null, null],
      [null, null, 'black', 'white', 'white', null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ],
    highlightCells: [{ row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }],
  },
  {
    title: "Strategi: Sudut adalah Raja!",
    content: "Sudut papan sangat berharga karena keping di sudut TIDAK BISA dibalik! Usahakan untuk menguasai sudut sebanyak mungkin.",
    boardState: [
      ['black', null, null, null, null, null, null, 'black'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, 'white', 'black', null, null, null],
      [null, null, null, 'black', 'white', null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['black', null, null, null, null, null, null, 'black'],
    ],
    highlightCells: [{ row: 0, col: 0 }, { row: 0, col: 7 }, { row: 7, col: 0 }, { row: 7, col: 7 }],
  },
  {
    title: "Strategi: Mobilitas",
    content: "Cobalah untuk memiliki lebih banyak pilihan langkah daripada lawan. Jika lawan kehabisan langkah, giliran Anda terus berlanjut!",
    boardState: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, 'white', 'black', null, null, null],
      [null, null, null, 'black', 'white', null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ],
    validMoves: [{ row: 2, col: 3 }, { row: 3, col: 2 }, { row: 4, col: 5 }, { row: 5, col: 4 }],
  },
  {
    title: "Akhir Permainan",
    content: "Permainan berakhir ketika papan penuh ATAU kedua pemain tidak bisa bergerak. Pemain dengan keping terbanyak menang! Siap bermain?",
    boardState: [
      ['black', 'black', 'black', 'black', 'white', 'white', 'white', 'white'],
      ['black', 'black', 'black', 'black', 'white', 'white', 'white', 'white'],
      ['black', 'black', 'black', 'black', 'white', 'white', 'white', 'white'],
      ['black', 'black', 'black', 'black', 'white', 'white', 'white', 'white'],
      ['black', 'black', 'black', 'black', 'white', 'white', 'white', 'white'],
      ['black', 'black', 'black', 'black', 'white', 'white', 'white', 'white'],
      ['black', 'black', 'black', 'black', 'white', 'white', 'white', 'white'],
      ['black', 'black', 'black', 'black', 'white', 'white', 'white', 'white'],
    ],
  },
];

interface TutorialBoardProps {
  boardState: (string | null)[][];
  highlightCells?: { row: number; col: number }[];
  validMoves?: { row: number; col: number }[];
}

const TutorialBoard = memo(({ boardState, highlightCells = [], validMoves = [] }: TutorialBoardProps) => {
  const isHighlighted = (row: number, col: number) =>
    highlightCells.some(c => c.row === row && c.col === col);
  
  const isValidMove = (row: number, col: number) =>
    validMoves.some(c => c.row === row && c.col === col);

  return (
    <div className="grid grid-cols-8 gap-0.5 bg-border rounded-lg p-1 w-full max-w-[240px] mx-auto">
      {boardState.map((row, rowIdx) =>
        row.map((cell, colIdx) => (
          <motion.div
            key={`${rowIdx}-${colIdx}`}
            className={`
              aspect-square rounded-sm flex items-center justify-center
              ${isHighlighted(rowIdx, colIdx) ? 'bg-primary/30 ring-2 ring-primary' : 'bg-secondary'}
            `}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: (rowIdx * 8 + colIdx) * 0.005 }}
          >
            {cell && (
              <motion.div
                className={`w-[75%] h-[75%] rounded-full shadow-md ${
                  cell === 'black' ? 'bg-foreground' : 'bg-background border border-border'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
            )}
            {isValidMove(rowIdx, colIdx) && !cell && (
              <motion.div
                className="w-3 h-3 rounded-full bg-emerald-500/60"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))
      )}
    </div>
  );
});

TutorialBoard.displayName = 'TutorialBoard';

interface TutorialOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const TutorialOverlay = memo(({ isVisible, onClose }: TutorialOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const handleStartGame = useCallback(() => {
    onClose();
  }, [onClose]);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {currentStep + 1} / {TUTORIAL_STEPS.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-xl font-bold mb-4 text-center">{step.title}</h3>
                  
                  {step.boardState && (
                    <div className="mb-4">
                      <TutorialBoard
                        boardState={step.boardState}
                        highlightCells={step.highlightCells}
                        validMoves={step.validMoves}
                      />
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    {step.content}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="px-6 pb-2">
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={isFirstStep}
                  className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Kembali
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                  title="Mulai dari awal"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {isLastStep ? (
                <button
                  onClick={handleStartGame}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Mulai Bermain!
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Lanjut
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

TutorialOverlay.displayName = 'TutorialOverlay';

export default TutorialOverlay;
