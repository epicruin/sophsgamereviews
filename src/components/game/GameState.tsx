import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { startBackgroundMusic, fadeOutBackgroundMusic, playSound } from '@/utils/audio';
import LeaderboardForm from './LeaderboardForm';

interface GameStateContextType {
  gameState: 'ready' | 'playing' | 'gameover' | 'win';
  statusText: string;
  score: number;
  isTimerRunning: boolean;
  showEnemy: boolean;
  isTextAnimating: boolean;
  isFlashing: boolean;
  currentWave: number;
  startGame: () => Promise<void>;
  stopGame: () => void;
  forceStop: () => void;
  formatScore: (score: number) => string;
  checkWin: () => void;
  destroyedEnemies: Set<string>;
  addDestroyedEnemy: (enemyId: string, points: number) => void;
  incrementScore: (points: number) => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover' | 'win'>('ready');
  const [statusText, setStatusText] = useState("Welcome to Your Community");
  const [score, setScore] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showEnemy, setShowEnemy] = useState(false);
  const [isTextAnimating, setIsTextAnimating] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [destroyedEnemies] = useState(() => new Set<string>());
  const [currentWave, setCurrentWave] = useState(1);
  const [startupTimeouts, setStartupTimeouts] = useState<NodeJS.Timeout[]>([]);
  const [showLeaderboardForm, setShowLeaderboardForm] = useState(false);
  const [gameEndState, setGameEndState] = useState<'win' | 'gameover' | null>(null);
  const [resetPending, setResetPending] = useState(false);
  const TOTAL_WAVES = 10;

  const incrementScore = (points: number = 100) => {
    setScore(prev => prev + points);
  };

  const addDestroyedEnemy = (enemyId: string, points: number = 100) => {
    destroyedEnemies.add(enemyId);
    incrementScore(points); // Increment score when enemy is destroyed with specific point value
    checkWin();
  };

  const checkWin = () => {
    // Total number of enemies (5 rows of 11)
    const totalEnemies = 55;
    if (destroyedEnemies.size === totalEnemies) {
      handleWaveComplete();
    }
  };

  // Handle wave completion
  const handleWaveComplete = async () => {
    const nextWave = currentWave + 1;
    
    if (nextWave > TOTAL_WAVES) {
      handleWin();
      return;
    }

    setIsTimerRunning(false);
    setShowEnemy(false);  // Hide enemies during transition
    setStatusText(""); // Clear any existing text immediately
    
    // Fade out music during wave transition
    await fadeOutBackgroundMusic();
    
    // Start flashing animation
    setIsFlashing(true);
    setStatusText(`Starting Wave ${nextWave}`);
    
    // Flash 3 times (300ms on, 300ms off)
    for(let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsFlashing(false);
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsFlashing(true);
    }
    
    // Keep the last flash state for a moment
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsFlashing(false);

    // Wait for text restoration animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start next wave and restart music
    setCurrentWave(nextWave);
    destroyedEnemies.clear();
    setShowEnemy(true);  // Show new enemies
    setIsTimerRunning(true);
    setStatusText("");
    startBackgroundMusic();
  };

  // Handle win state
  const handleWin = async () => {
    setGameState('win');
    setGameEndState('win');
    // Emit game state change event
    window.dispatchEvent(new CustomEvent('gameStateChange', { detail: { gameState: 'win' } }));
    setIsTimerRunning(false);
    
    // Play win sound and fade out music
    playSound('/winsound.mp3');
    await fadeOutBackgroundMusic();
    
    // Start flashing animation
    setIsFlashing(true);
    setStatusText(`YOU WIN!!! SCORE: ${score}`);
    
    // Flash 3 times (300ms on, 300ms off)
    for(let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsFlashing(false);
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsFlashing(true);
    }
    
    // Keep the last flash state for a moment
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Show leaderboard form
    setShowLeaderboardForm(true);
  };

  // Handle game over state
  const handleGameOver = async () => {
    // Clear any pending timeouts from the startup sequence
    startupTimeouts.forEach(timeout => clearTimeout(timeout));
    setStartupTimeouts([]);
    
    // Clear status text immediately to prevent "GO!" from showing
    setStatusText("");
    
    setGameState('gameover');
    setGameEndState('gameover');
    // Emit game state change event
    window.dispatchEvent(new CustomEvent('gameStateChange', { detail: { gameState: 'gameover' } }));
    setIsTimerRunning(false);
    
    // Play death and lose sounds, then fade out music
    playSound('/playerdiesound.mp3');
    playSound('/losesound.mp3');
    await fadeOutBackgroundMusic();
    
    // Start flashing animation
    setIsFlashing(true);
    setStatusText(`GAME OVER!!! SCORE: ${score}`);
    
    // Flash 3 times (300ms on, 300ms off)
    for(let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsFlashing(false);
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsFlashing(true);
    }
    
    // Keep the last flash state for a moment
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Show leaderboard form
    setShowLeaderboardForm(true);
  };

  // Function to handle game reset after leaderboard form is closed or submitted
  const handleGameReset = async () => {
    setShowLeaderboardForm(false);
    setIsFlashing(false);

    // Wait for text restoration animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset game state
    setShowEnemy(false);
    setIsTextAnimating(false);
    setStatusText("Welcome to Your Community");
    setGameState('ready');
    setGameEndState(null);
    destroyedEnemies.clear();
    setCurrentWave(1);
    setScore(0);
    setResetPending(false);
  };

  // Handle leaderboard form close
  const handleLeaderboardClose = () => {
    setResetPending(true);
    handleGameReset();
  };

  // Handle leaderboard form submission
  const handleLeaderboardSubmit = () => {
    setResetPending(true);
    handleGameReset();
  };

  // Listen for game over event
  useEffect(() => {
    const handleGameOverEvent = () => {
      handleGameOver();
    };

    window.addEventListener('gameOver', handleGameOverEvent);
    return () => window.removeEventListener('gameOver', handleGameOverEvent);
  }, [handleGameOver, startupTimeouts]);

  // Start music when enemies appear
  useEffect(() => {
    if (showEnemy && gameState === 'playing') {
      startBackgroundMusic();
    }
  }, [showEnemy, gameState]);

  const formatScore = (score: number) => {
    return `SCORE: ${score}`;
  };

  const stopGame = () => {
    setGameState('gameover');
    // Emit game state change event
    window.dispatchEvent(new CustomEvent('gameStateChange', { detail: { gameState: 'gameover' } }));
    setIsTimerRunning(false);
    setShowEnemy(false);
    setIsTextAnimating(false);
  };

  const forceStop = () => {
    // Clear any pending timeouts from the startup sequence
    startupTimeouts.forEach(timeout => clearTimeout(timeout));
    setStartupTimeouts([]);
    
    // Reset all game state immediately
    setGameState('ready');
    // Emit game state change event
    window.dispatchEvent(new CustomEvent('gameStateChange', { detail: { gameState: 'ready' } }));
    setIsTimerRunning(false);
    setShowEnemy(false);
    setIsTextAnimating(false);
    setIsFlashing(false);
    setStatusText("Welcome to Your Community");
    destroyedEnemies.clear();
    
    // Fade out background music
    fadeOutBackgroundMusic();
  };

  const startGame = async () => {
    // Clean up any existing state first
    destroyedEnemies.clear();
    setCurrentWave(1);
    setScore(0);
    setShowEnemy(false);
    setIsFlashing(false);
    
    // Now start the new game
    setGameState('playing');
    // Emit game state change event
    window.dispatchEvent(new CustomEvent('gameStateChange', { detail: { gameState: 'playing' } }));
    setIsTextAnimating(true);
    
    const timeouts: NodeJS.Timeout[] = [];
    
    const timeout1 = setTimeout(() => {
      setStatusText("GET READY!");
    }, 0);
    timeouts.push(timeout1);

    const timeout2 = setTimeout(() => {
      setStatusText("3");
    }, 1500);
    timeouts.push(timeout2);

    const timeout3 = setTimeout(() => {
      setStatusText("2");
    }, 2500);
    timeouts.push(timeout3);

    const timeout4 = setTimeout(() => {
      setStatusText("1");
    }, 3500);
    timeouts.push(timeout4);

    const timeout5 = setTimeout(() => {
      setStatusText("GO!");
    }, 4500);
    timeouts.push(timeout5);

    const timeout6 = setTimeout(() => {
      setIsTimerRunning(true);
      setShowEnemy(true);
      setStartupTimeouts([]); // Clear the timeouts array once startup is complete
    }, 5500);
    timeouts.push(timeout6);

    setStartupTimeouts(timeouts);
  };

  const value = {
    gameState,
    statusText,
    score,
    isTimerRunning,
    showEnemy,
    isTextAnimating,
    isFlashing,
    currentWave,
    startGame,
    stopGame,
    forceStop,
    formatScore,
    checkWin,
    destroyedEnemies,
    addDestroyedEnemy,
    incrementScore
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
      {showLeaderboardForm && (
        <LeaderboardForm
          score={score}
          wave={currentWave}
          onClose={handleLeaderboardClose}
          onSubmit={handleLeaderboardSubmit}
        />
      )}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
} 