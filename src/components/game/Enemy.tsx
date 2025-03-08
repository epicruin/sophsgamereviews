import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useGameState } from './GameState';

// Movement constants
const BASE_MOVE_INTERVAL = 750; // Base speed (0.75 seconds between steps)
const MIN_MOVE_INTERVAL = 50; // Maximum speed (0.05 seconds between steps)
const LAST_ENEMY_SPEED_MULTIPLIER = 4; // Last enemy moves 4x faster
const STEP_SIZE = 20; // Size of each horizontal step
const MAX_X_OFFSET = 315; // Increased from 285 to accommodate wider formation
const STEP_DOWN = 20;

// Point values for different enemy colors
export const POINT_VALUES = {
  'bg-purple-600': 50,   // Purple enemies - easiest to hit (bottom row)
  'bg-blue-600': 100,    // Blue enemies
  'bg-rose-600': 150,    // Rose enemies
  'bg-emerald-600': 200  // Emerald enemies - hardest to hit (top row)
};

// Shared movement state for synchronized movement
let currentMoveInterval = BASE_MOVE_INTERVAL;
let sharedXOffset = 0;
let sharedYOffset = 0;
let sharedMovingRight = true;
let lastUpdateTime = 0;
let currentLeader = 'purple-0-wave-1'; // Track the current leader
let leaderDestroyed = false; // Flag to indicate leader was destroyed
let lastWave = 1; // Track the current wave to detect wave changes

// Shared set to track active enemies
const activeEnemies = new Set<string>();

interface EnemyProps {
  isPlaying: boolean;
  color?: string;
  zIndex?: number;
  enemyId?: string;
  syncMovement?: boolean;
}

const getEnemySvgPath = (color: string) => {
  const colorMap: { [key: string]: string } = {
    'bg-purple-600': '/spaceinvaders-enemy-purple.svg',
    'bg-blue-600': '/spaceinvaders-enemy-blue.svg',
    'bg-rose-600': '/spaceinvaders-enemy-rose.svg',
    'bg-emerald-600': '/spaceinvaders-enemy-emerald.svg'
  };
  return colorMap[color] || colorMap['bg-rose-600'];
};

// Function to reset shared state for a new wave
const resetSharedStateForNewWave = (wave: number) => {
  if (wave !== lastWave) {
    console.log(`Resetting shared state for wave ${wave}`);
    sharedXOffset = 0;
    sharedYOffset = 0;
    sharedMovingRight = true;
    lastUpdateTime = 0;
    currentMoveInterval = BASE_MOVE_INTERVAL;
    lastWave = wave;
    // Don't reset the leader or leadership status as that's handled separately
  }
};

// Function to update shared movement state
const updateSharedMovement = (destroyedCount: number) => {
  const now = Date.now();
  if (now - lastUpdateTime < currentMoveInterval) return;
  
  // Calculate new interval based on destroyed enemies
  const totalEnemies = 55; // Updated from 50 to 55 (5 rows of 11)
  const remainingEnemies = totalEnemies - destroyedCount;
  const speedIncreaseFactor = 1 + ((totalEnemies - remainingEnemies) / totalEnemies);
  const isLastEnemy = remainingEnemies === 1;
  
  // Update shared movement interval
  currentMoveInterval = Math.max(
    BASE_MOVE_INTERVAL / (isLastEnemy ? speedIncreaseFactor * LAST_ENEMY_SPEED_MULTIPLIER : speedIncreaseFactor),
    MIN_MOVE_INTERVAL
  );

  // Calculate next position
  const nextOffset = sharedXOffset + (sharedMovingRight ? STEP_SIZE : -STEP_SIZE);
  
  // Check if we need to change direction and move down
  if (nextOffset >= MAX_X_OFFSET || nextOffset <= -MAX_X_OFFSET) {
    sharedMovingRight = !sharedMovingRight;
    sharedYOffset += STEP_DOWN;
  } else {
    sharedXOffset = nextOffset;
  }
  
  lastUpdateTime = now;
};

// Function to elect a new leader
const electNewLeader = () => {
  if (activeEnemies.size > 0) {
    currentLeader = Array.from(activeEnemies)[0];
    leaderDestroyed = false;
    console.log('New leader elected:', currentLeader);
    return true;
  }
  return false;
};

export const Enemy = ({ 
  isPlaying, 
  color = 'bg-rose-600', 
  zIndex = 10,
  enemyId = 'default',
  syncMovement = false
}: EnemyProps) => {
  const [xOffset, setXOffset] = useState(0);
  const [movingRight, setMovingRight] = useState(true);
  const [yOffset, setYOffset] = useState(0);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const { gameState, destroyedEnemies, addDestroyedEnemy, currentWave } = useGameState();
  const isLeaderRef = useRef(false);

  // Reset shared state when wave changes
  useEffect(() => {
    if (syncMovement) {
      // Extract wave from enemyId to ensure we're checking the right wave
      const waveFromId = enemyId.split('-wave-')[1];
      const waveNumber = parseInt(waveFromId || '1', 10);
      
      // Only reset if this is the first enemy of a new wave
      if (enemyId.includes('purple-0') && waveNumber === currentWave) {
        resetSharedStateForNewWave(currentWave);
      }
    }
  }, [currentWave, enemyId, syncMovement]);

  // Register this enemy as active on mount
  useEffect(() => {
    if (syncMovement) {
      activeEnemies.add(enemyId);
      
      // If this is the designated initial leader, mark it
      if (enemyId === currentLeader) {
        isLeaderRef.current = true;
      }
      
      // If leader was destroyed and we need a new one, check if this enemy should become leader
      if (leaderDestroyed) {
        electNewLeader();
        if (enemyId === currentLeader) {
          isLeaderRef.current = true;
          leaderDestroyed = false;
        }
      }
      
      return () => {
        activeEnemies.delete(enemyId);
      };
    }
  }, [enemyId, syncMovement]);

  // Handle bullet collision
  useEffect(() => {
    const handleCollision = () => {
      // If this was the leader, mark the leader as destroyed
      if (isLeaderRef.current) {
        leaderDestroyed = true;
        isLeaderRef.current = false;
      }
      
      // Remove from active enemies
      activeEnemies.delete(enemyId);
      
      // Get point value based on enemy color
      const pointValue = POINT_VALUES[color] || 100;
      
      // Mark as destroyed and update game state with appropriate point value
      setIsDestroyed(true);
      addDestroyedEnemy(enemyId, pointValue);
    };

    const element = document.querySelector(`[data-enemy-id="${enemyId}"]`);
    if (element) {
      element.addEventListener('playerBulletCollision', handleCollision);
      return () => element.removeEventListener('playerBulletCollision', handleCollision);
    }
  }, [enemyId, addDestroyedEnemy, color]);

  // Reset shared state when game state changes to ready
  useEffect(() => {
    if (gameState === 'ready') {
      sharedXOffset = 0;
      sharedYOffset = 0;
      sharedMovingRight = true;
      lastUpdateTime = 0;
      currentMoveInterval = BASE_MOVE_INTERVAL;
      currentLeader = 'purple-0-wave-1';
      leaderDestroyed = false;
      lastWave = 1;
      
      // Reset leadership status
      isLeaderRef.current = enemyId === currentLeader;
    }
  }, [gameState, enemyId]);

  // Check if this enemy should become the leader
  useEffect(() => {
    if (syncMovement && !isDestroyed) {
      // If leader was destroyed, try to elect a new one
      if (leaderDestroyed) {
        electNewLeader();
      }
      
      // Check if this enemy is the current leader
      if (enemyId === currentLeader) {
        isLeaderRef.current = true;
      }
    }
  }, [syncMovement, enemyId, isDestroyed, destroyedEnemies.size]);

  // Enemy movement - synchronized version
  useEffect(() => {
    if (!syncMovement) return;
    
    let intervalId: NodeJS.Timeout;
    
    if (isPlaying && gameState === 'playing') {
      const updateMovement = () => {
        // If leader was destroyed, try to elect a new one
        if (leaderDestroyed) {
          if (electNewLeader() && enemyId === currentLeader) {
            isLeaderRef.current = true;
          }
        }
        
        // If this is the current leader, update the shared state
        if (isLeaderRef.current) {
          updateSharedMovement(destroyedEnemies.size);
        }
        
        // All enemies use the shared state
        setXOffset(sharedXOffset);
        setYOffset(sharedYOffset);
        setMovingRight(sharedMovingRight);
        
        // Schedule next update
        intervalId = setTimeout(updateMovement, 16); // 60fps update rate
      };
      
      intervalId = setTimeout(updateMovement, 16);
    }
    
    return () => {
      if (intervalId) clearTimeout(intervalId);
    };
  }, [isPlaying, gameState, syncMovement, destroyedEnemies.size, enemyId]);

  // Enemy movement - original version for non-synchronized movement
  useEffect(() => {
    if (syncMovement) return;
    
    let intervalId: NodeJS.Timeout;
    
    if (isPlaying && gameState === 'playing') {
      const updateMovement = () => {
        // Calculate new interval based on destroyed enemies
        const totalEnemies = 55; // Updated from 50 to 55 (5 rows of 11)
        const remainingEnemies = totalEnemies - destroyedEnemies.size;
        const speedIncreaseFactor = 1 + ((totalEnemies - remainingEnemies) / totalEnemies);
        const isLastEnemy = remainingEnemies === 1;
        
        // Update shared movement interval
        currentMoveInterval = Math.max(
          BASE_MOVE_INTERVAL / (isLastEnemy ? speedIncreaseFactor * LAST_ENEMY_SPEED_MULTIPLIER : speedIncreaseFactor),
          MIN_MOVE_INTERVAL
        );

        setXOffset(prev => {
          const nextOffset = prev + (movingRight ? STEP_SIZE : -STEP_SIZE);
          
          // Check if we need to change direction and move down
          if (nextOffset >= MAX_X_OFFSET || nextOffset <= -MAX_X_OFFSET) {
            setMovingRight(prev => !prev);
            setYOffset(prev => prev + STEP_DOWN);
            return prev;
          }
          
          return nextOffset;
        });

        // Schedule next movement using shared interval
        intervalId = setTimeout(updateMovement, currentMoveInterval);
      };

      // Start the movement loop using current shared interval
      intervalId = setTimeout(updateMovement, currentMoveInterval);
    }

    return () => {
      if (intervalId) clearTimeout(intervalId);
    };
  }, [isPlaying, gameState, movingRight, destroyedEnemies.size, syncMovement]);

  // Reset when game state changes
  useEffect(() => {
    if (gameState === 'ready') {
      setIsDestroyed(false);
      setXOffset(0);
      setYOffset(0);
      setMovingRight(true);
    }
  }, [gameState]);

  if (isDestroyed) {
    return null;
  }

  return (
    <motion.div
      style={{ 
        zIndex,
        transform: `translate(${xOffset}px, ${yOffset}px)`
      }}
      className="relative"
      animate={{ x: xOffset, y: yOffset }}
      transition={{
        duration: 0,
        type: "tween"
      }}
      data-enemy-id={enemyId}
    >
      <motion.div 
        className="w-8 h-8"
        animate={isDestroyed ? {
          scale: 0,
          opacity: 0
        } : {}}
        transition={{
          duration: 0.2
        }}
      >
        <img
          src={getEnemySvgPath(color)}
          alt={`${color.replace('bg-', '').replace('-600', '')} enemy`}
          className="w-full h-full"
        />
      </motion.div>
    </motion.div>
  );
}; 