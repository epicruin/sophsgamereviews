import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from './Player';
import { useGameState } from './GameState';
import { playSound } from '@/utils/audio';
import LeaderboardDisplay from './LeaderboardDisplay';

interface Bullet {
  id: number;
  position: number;
  x: number;
}

interface GameControllerProps {
  onStateChange: () => Promise<void>;
}

export const GameController = ({ onStateChange }: GameControllerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [nextBulletId, setNextBulletId] = useState(0);
  const [lastShotTime, setLastShotTime] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { gameState } = useGameState();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isPlaying) return;

    const MOVE_AMOUNT = 20;
    const MAX_DISTANCE = 315; // Increased from 285 to match enemy movement range
    const SHOOT_COOLDOWN = 1200; // 1.2 seconds in milliseconds

    if (e.code === 'Space' && gameState === 'playing') {
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastShotTime < SHOOT_COOLDOWN) {
        return; // Still in cooldown
      }
      
      // Play shooting sound
      playSound('/playershootsound.mp3');
      
      // Calculate absolute pixel position for the bullet
      const playerElement = document.querySelector('.player');
      if (!playerElement) return;
      
      const playerRect = playerElement.getBoundingClientRect();
      const bulletX = playerRect.left + (playerRect.width / 2);
      
      setBullets(prev => [...prev, { 
        id: nextBulletId, 
        position: 0,
        x: bulletX
      }]);
      setNextBulletId(prev => prev + 1);
      setLastShotTime(now);
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        setPlayerPosition(prev => Math.max(prev - MOVE_AMOUNT, -MAX_DISTANCE));
        break;
      case 'ArrowRight':
        setPlayerPosition(prev => Math.min(prev + MOVE_AMOUNT, MAX_DISTANCE));
        break;
    }
  }, [isPlaying, gameState, nextBulletId, lastShotTime]);

  // Reset cooldown when game state changes
  useEffect(() => {
    if (gameState !== 'playing') {
      setLastShotTime(0);
    }
  }, [gameState]);

  // Clear bullets when game state changes
  useEffect(() => {
    if (gameState !== 'playing') {
      setBullets([]);
      setNextBulletId(0);
    }
  }, [gameState]);

  // Move bullets upward and handle collisions
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (bullets.length > 0 && gameState === 'playing') {
      intervalId = setInterval(() => {
        setBullets(prev => {
          const newBullets = prev.map(bullet => ({
            ...bullet,
            position: bullet.position + 15 // Much faster bullet speed
          })).filter(bullet => {
            const bulletElement = document.querySelector(`[data-bullet-id="bullet-${bullet.id}"]`);
            if (!bulletElement) return false;

            const bulletRect = bulletElement.getBoundingClientRect();
            
            // Check for text collisions with individual characters
            let collision = false;
            document.querySelectorAll('.welcome-text').forEach(textElement => {
              if (collision) return;

              const charSpans = textElement.querySelectorAll('span > span[data-disabled="false"]');
              charSpans.forEach(charSpan => {
                if (collision) return;

                const charRect = charSpan.getBoundingClientRect();
                if (
                  bulletRect.top <= charRect.bottom &&
                  bulletRect.bottom >= charRect.top &&
                  bulletRect.right >= charRect.left &&
                  bulletRect.left <= charRect.right
                ) {
                  collision = true;
                  const charIndex = parseInt(charSpan.getAttribute('data-char-index') || '-1');
                  // Play letter hit sound
                  playSound('/letterhitsound.mp3');
                  charSpan.parentElement?.dispatchEvent(new CustomEvent('bulletCollision', { 
                    bubbles: true,
                    detail: { charIndex }
                  }));
                }
              });
            });

            // Check for enemy collisions if no text collision
            if (!collision) {
              document.querySelectorAll('[data-enemy-id]').forEach(enemy => {
                if (collision) return;
                const enemyRect = enemy.getBoundingClientRect();
                if (
                  bulletRect.top <= enemyRect.bottom &&
                  bulletRect.bottom >= enemyRect.top &&
                  bulletRect.right >= enemyRect.left &&
                  bulletRect.left <= enemyRect.right
                ) {
                  collision = true;
                  playSound('/enemyhitsound.mp3');
                  enemy.dispatchEvent(new CustomEvent('playerBulletCollision', { bubbles: true }));
                }
              });
            }

            // Keep bullets that haven't collided and are still on screen
            return !collision && bullet.position < 1000; // Much higher max height
          });

          return newBullets;
        });
      }, 16);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [bullets, gameState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameState === 'playing' && !isPlaying) {
      setIsPlaying(true);
    } else if (gameState !== 'playing' && isPlaying) {
      setIsPlaying(false);
      setPlayerPosition(0);
    }
  }, [gameState, isPlaying]);

  const startGame = () => {
    playSound('/clicktoplaysound.mp3');
    setTimeout(() => {
      onStateChange();
    }, 2800); // 2 second delay
  };

  const openLeaderboard = () => {
    playSound('/leaderboardbuttonsound.mp3');
    setShowLeaderboard(true);
  };

  const closeLeaderboard = () => {
    setShowLeaderboard(false);
  };

  return (
    <div className="relative h-full">
      <div className="absolute inset-x-0 bottom-[-120px] flex justify-center">
        <AnimatePresence>
          {!isPlaying && (
            <div className="flex flex-col items-center">
              {/* Enemy Icons */}
              <div className="flex gap-4 mb-6">
                {['purple', 'blue', 'rose', 'emerald'].map((color, index) => (
                  <motion.div
                    key={color}
                    className="w-6 h-6"
                    animate={{
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: index * 0.3, // Creates wave effect
                      ease: "easeInOut"
                    }}
                  >
                    <img
                      src={`/spaceinvaders-enemy-${color}.svg`}
                      alt={`${color} enemy`}
                      className="w-full h-full"
                    />
                  </motion.div>
                ))}
              </div>
              
              {/* Play Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={startGame}
                className="px-6 py-3 rounded-full bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors mb-3 retro-game-text"
                style={{ paddingTop: '13px', paddingBottom: '11px' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Click to Play
              </motion.button>
              
              {/* Leaderboard Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={openLeaderboard}
                className="px-6 py-2 pt-2.5 pb-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-medium hover:from-yellow-400 hover:to-amber-500 transition-colors text-sm mt-2 mb-6 retro-game-text"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Leaderboard
              </motion.button>
            </div>
          )}
        </AnimatePresence>

        {/* Bullets rendered independently */}
        <AnimatePresence>
          {bullets.map(bullet => (
            <motion.div
              key={`bullet-${bullet.id}`}
              data-bullet-id={`bullet-${bullet.id}`}
              className="fixed w-2 h-4 bg-rose-300 rounded-full"
              style={{
                left: bullet.x - 4,
                bottom: `${bullet.position + 50}px`,
                height: '1rem',
                zIndex: 1
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          ))}
        </AnimatePresence>

        {isPlaying && <Player position={playerPosition} />}
      </div>
      
      {/* Leaderboard Display */}
      {showLeaderboard && <LeaderboardDisplay onClose={closeLeaderboard} />}
    </div>
  );
}; 