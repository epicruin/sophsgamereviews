import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from './GameState';
import { playSound } from '@/utils/audio';

const SHOOTABLE_COLORS = ['purple', 'blue', 'rose', 'emerald'];

interface Bullet {
  id: number;
  x: number;
  y: number;
}

interface EnemyControllerProps {
  isPlaying: boolean;
}

export const EnemyController = ({ isPlaying }: EnemyControllerProps) => {
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [nextBulletId, setNextBulletId] = useState(0);
  const [lastShotTime, setLastShotTime] = useState(0);
  const { gameState, currentWave } = useGameState();

  // Clear bullets when game state changes or wave changes
  useEffect(() => {
    setBullets([]);
    setNextBulletId(0);
    setLastShotTime(0);
  }, [gameState, currentWave]);

  // Enemy shooting effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isPlaying && gameState === 'playing') {
      intervalId = setInterval(() => {
        const now = Date.now();
        
        if (now - lastShotTime >= 1400) {
          // Try to find a valid shooter by checking multiple enemies
          let foundShooter = false;
          let attempts = 0;
          const maxAttempts = 10;

          while (!foundShooter && attempts < maxAttempts) {
            // Randomly select color and index
            const colorIndex = Math.floor(Math.random() * SHOOTABLE_COLORS.length);
            const shooterIndex = Math.floor(Math.random() * 10);
            const color = SHOOTABLE_COLORS[colorIndex];
            
            // Try to find this enemy
            const currentEnemy = document.querySelector(`[data-enemy-id="${color}-${shooterIndex}-wave-${currentWave}"]`);
            if (currentEnemy) {
              const enemyRect = currentEnemy.getBoundingClientRect();
              
              // Play shooting sound
              playSound('/enemyshootsound.mp3');
              
              setBullets(prev => [...prev, { 
                id: nextBulletId, 
                x: enemyRect.left + (enemyRect.width / 2),
                y: enemyRect.bottom
              }]);
              setNextBulletId(prev => prev + 1);
              setLastShotTime(now);
              foundShooter = true;
            }
            
            attempts++;
          }
        }
      }, 1500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, gameState, nextBulletId, lastShotTime, currentWave]);

  // Reset shooting state when game state changes
  useEffect(() => {
    if (gameState !== 'playing') {
      setLastShotTime(0);
    }
  }, [gameState]);

  // Move bullets downward and handle collisions
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (bullets.length > 0 && gameState === 'playing') {
      intervalId = setInterval(() => {
        setBullets(prev => {
          const newBullets = prev.map(bullet => ({
            ...bullet,
            y: bullet.y + 15
          })).filter(bullet => {
            const bulletElement = document.querySelector(`[data-bullet-id="enemy-${bullet.id}"]`);
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
                  bulletRect.bottom >= charRect.top &&
                  bulletRect.top <= charRect.bottom &&
                  bulletRect.right >= charRect.left &&
                  bulletRect.left <= charRect.right
                ) {
                  collision = true;
                  const charIndex = parseInt(charSpan.getAttribute('data-char-index') || '-1');
                  if (charIndex >= 0) {
                    playSound('/letterhitsound.mp3');
                    charSpan.parentElement?.dispatchEvent(new CustomEvent('bulletCollision', { 
                      bubbles: true,
                      detail: { charIndex }
                    }));
                  }
                }
              });
            });

            // Check for player collision if no text collision
            if (!collision) {
              const player = document.querySelector('.player');
              if (player) {
                const playerRect = player.getBoundingClientRect();
                if (
                  bulletRect.bottom >= playerRect.top &&
                  bulletRect.top <= playerRect.bottom &&
                  bulletRect.right >= playerRect.left &&
                  bulletRect.left <= playerRect.right
                ) {
                  collision = true;
                  window.dispatchEvent(new CustomEvent('gameOver'));
                }
              }
            }

            // Keep bullets that haven't collided and are still on screen
            return !collision && bullet.y < 2500;
          });

          return newBullets;
        });
      }, 16);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [bullets, gameState]);

  // Clear bullets when game is over
  useEffect(() => {
    if (gameState === 'gameover') {
      setBullets([]);
      setNextBulletId(0);
    }
  }, [gameState]);

  return (
    <div className="fixed inset-0 pointer-events-none">
      <AnimatePresence>
        {bullets.map(bullet => (
          <motion.div
            key={`enemy-${bullet.id}`}
            data-bullet-id={`enemy-${bullet.id}`}
            className="absolute w-2 h-4 bg-rose-500 rounded-full"
            style={{
              left: bullet.x - 4,
              top: bullet.y,
              height: '1rem',
              zIndex: 1
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}; 