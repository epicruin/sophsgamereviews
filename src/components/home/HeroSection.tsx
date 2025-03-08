import { motion, AnimatePresence } from "framer-motion";
import { GameController } from "@/components/game/GameController";
import { Enemy } from "@/components/game/Enemy";
import { DestructibleText } from "@/components/game/DestructibleText";
import { useGameState } from "@/components/game/GameState";
import { EnemyController } from "@/components/game/EnemyController";
import { useEffect, useState } from "react";

export const HeroSection = () => {
  const { 
    statusText, 
    isTimerRunning, 
    showEnemy, 
    isTextAnimating,
    isFlashing,
    score,
    formatScore,
    startGame,
    stopGame,
    forceStop,
    gameState,
    currentWave
  } = useGameState();

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to top when enemies appear
  useEffect(() => {
    if (showEnemy) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [showEnemy]);

  // Stop game when window width goes below full width
  useEffect(() => {
    if (windowWidth < 1200 && gameState === 'playing') {
      forceStop();
    }
  }, [windowWidth, gameState, forceStop]);

  const displayText = isTimerRunning ? formatScore(score) : statusText;

  // Apply extra small text size for screens narrower than 622px
  const getTextSize = () => {
    if (windowWidth < 360) return "0.875rem";    // Tiny phones - extremely small
    if (windowWidth < 405) return "1.25rem";     // Ultra small phones - REDUCED from 1.5rem
    if (windowWidth < 445) return "1.5rem";      // Extra small phones - REDUCED from 1.75rem
    if (windowWidth < 480) return "1.75rem";     // Small phones - REDUCED from 2rem
    if (windowWidth < 622) return "2.25rem";     // Medium phones
    if (windowWidth < 768) return "3rem";        // Large phones/small tablets
    if (windowWidth < 992) return "3.25rem";     // Tablets
    if (windowWidth < 1200) return "3.5rem";     // Small desktops
    return "3.75rem";                            // Large desktops
  }

  // Tiny screens (<360px)
  const TinyScreenText = () => (
    <>
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "0.75rem" }} className="welcome-text">
          Join our inclusive
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "0.75rem" }} className="welcome-text">
          community of
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "0.75rem" }} className="welcome-text">
          gamers sharing
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "0.75rem" }} className="welcome-text">
          thoughtful reviews
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "0.75rem" }} className="welcome-text">
          and discovering
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "0.75rem" }} className="welcome-text">
          amazing games
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "0.75rem" }} className="welcome-text">
          together.
        </span>
      </DestructibleText>
    </>
  );

  // Ultra small screens (360px-404px)
  const UltraSmallScreenText = () => (
    <>
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "0.875rem" }} className="welcome-text">
          Join our inclusive
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "0.875rem" }} className="welcome-text">
          community of gamers
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "0.875rem" }} className="welcome-text">
          sharing thoughtful
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "0.875rem" }} className="welcome-text">
          reviews and discovering
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "0.875rem" }} className="welcome-text">
          amazing games together.
        </span>
      </DestructibleText>
    </>
  );

  // Extra small screens (405px-514px)
  const ExtraSmallScreenText = () => (
    <>
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "1rem" }} className="welcome-text">
          Join our inclusive community
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "1rem" }} className="welcome-text">
          of gamers sharing thoughtful
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "1rem" }} className="welcome-text">
          reviews and discovering amazing
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline", fontSize: "1rem" }} className="welcome-text">
          games together.
        </span>
      </DestructibleText>
    </>
  );

  // Medium screens (515px-621px)
  const MediumScreenText = () => (
    <>
      <DestructibleText>
        <span style={{ display: "inline" }} className="welcome-text">
          Join our inclusive community of gamers
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline" }} className="welcome-text">
          sharing thoughtful reviews and discovering
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline" }} className="welcome-text">
          amazing games together.
        </span>
      </DestructibleText>
    </>
  );

  // Large screens (622px-765px)
  const LargeScreenText = () => (
    <>
      <DestructibleText>
        <span style={{ display: "inline" }} className="welcome-text">
          Join our inclusive community of gamers
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline" }} className="welcome-text">
          sharing thoughtful reviews and discovering amazing
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline" }} className="welcome-text">
          games together.
        </span>
      </DestructibleText>
    </>
  );

  // XL screens (765px and up)
  const XLScreenText = () => (
    <>
      <DestructibleText>
        <span style={{ display: "inline" }} className="welcome-text">
          Join our inclusive community of gamers
        </span>
      </DestructibleText>
      <br />
      <DestructibleText>
        <span style={{ display: "inline" }} className="welcome-text">
          sharing thoughtful reviews and discovering amazing games together.
        </span>
      </DestructibleText>
    </>
  );

  return (
    <section className={`container mx-auto ${windowWidth < 480 ? 'px-2' : 'px-4'} flex flex-col justify-center relative`}>
      <motion.div
        initial={{
          opacity: 0,
          y: 20
        }}
        animate={{
          opacity: isFlashing ? [1, 0] : 1,
          y: 0
        }}
        transition={{
          duration: isFlashing ? 0.3 : 0.6,
          repeat: isFlashing ? Infinity : 0,
          repeatType: "reverse"
        }}
        className="text-center max-w-5xl mx-auto relative z-10"
        style={{ overflow: 'visible' }}
      >
        <div className="relative" style={{ overflow: 'visible' }}>
          <div className="h-[13rem] relative" style={{ overflow: 'visible' }}>
            <div style={{ overflow: 'visible' }}>
              <AnimatePresence mode="wait">
                {(statusText || isTimerRunning) && (
                  <>
                    <motion.div
                      key={isTimerRunning ? "score-pill" : "status-pill"}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.4 }}
                      className={`z-20 ${isTimerRunning ? 'fixed top-6 right-6' : 'absolute top-20 left-0 right-0 flex justify-center'}`}
                    >
                      <div className="px-6 py-3 rounded-full glass-effect text-rose-500 font-medium"
                           style={{ fontSize: windowWidth < 313 ? '0.65rem' : windowWidth < 341 ? '0.75rem' : '0.875rem' }}>
                        {displayText}
                      </div>
                    </motion.div>
                    {isTimerRunning && gameState === 'playing' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.4 }}
                        className="z-20 fixed top-6 right-48"
                      >
                        <div className="px-6 py-3 rounded-full glass-effect text-blue-500 text-sm font-medium">
                          Wave {currentWave}
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>

            {showEnemy && (
              <>
                <motion.div 
                  className="absolute top-[-30px] inset-x-0"
                  key={`wave-${currentWave}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ 
                    opacity: gameState === 'gameover' ? 0 : 1,
                    y: 0 
                  }}
                  transition={{ 
                    duration: gameState === 'gameover' ? 0.2 : 0.4 
                  }}
                >
                  <div className="max-w-3xl mx-auto h-48">
                    {/* Enemy formation - all enemies in a single container for synchronized movement */}
                    <div className="relative">
                      {/* Purple enemies row */}
                      <div className="flex justify-center gap-3 mb-3">
                        {Array.from({ length: 11 }).map((_, index) => (
                          <Enemy 
                            key={`purple-${index}-wave-${currentWave}`}
                            isPlaying={true} 
                            color="bg-purple-600" 
                            zIndex={8} 
                            enemyId={`purple-${index}-wave-${currentWave}`}
                            syncMovement={true}
                          />
                        ))}
                      </div>
                      
                      {/* Blue enemies row */}
                      <div className="flex justify-center gap-3 mb-3">
                        {Array.from({ length: 11 }).map((_, index) => (
                          <Enemy 
                            key={`blue-${index}-wave-${currentWave}`}
                            isPlaying={true} 
                            color="bg-blue-600" 
                            zIndex={9} 
                            enemyId={`blue-${index}-wave-${currentWave}`}
                            syncMovement={true}
                          />
                        ))}
                      </div>
                      
                      {/* Rose enemies row */}
                      <div className="flex justify-center gap-3 mb-3">
                        {Array.from({ length: 11 }).map((_, index) => (
                          <Enemy 
                            key={`rose-${index}-wave-${currentWave}`}
                            isPlaying={true} 
                            color="bg-rose-600" 
                            zIndex={10} 
                            enemyId={`rose-${index}-wave-${currentWave}`}
                            syncMovement={true}
                          />
                        ))}
                      </div>
                      
                      {/* First Emerald enemies row */}
                      <div className="flex justify-center gap-3 mb-3">
                        {Array.from({ length: 11 }).map((_, index) => (
                          <Enemy 
                            key={`emerald-${index}-wave-${currentWave}`}
                            isPlaying={true} 
                            color="bg-emerald-600" 
                            zIndex={11} 
                            enemyId={`emerald-${index}-wave-${currentWave}`}
                            syncMovement={true}
                          />
                        ))}
                      </div>
                      
                      {/* Second Emerald enemies row (new) */}
                      <div className="flex justify-center gap-3">
                        {Array.from({ length: 11 }).map((_, index) => (
                          <Enemy 
                            key={`emerald2-${index}-wave-${currentWave}`}
                            isPlaying={true} 
                            color="bg-emerald-600" 
                            zIndex={12} 
                            enemyId={`emerald2-${index}-wave-${currentWave}`}
                            syncMovement={true}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
                <EnemyController isPlaying={true} />
              </>
            )}
          </div>

          <h1 className="font-bold mb-8 tracking-tight gradient-text pt-2 overflow-visible">
            <motion.div 
              className="overflow-visible"
              initial={{
                lineHeight: 1.2,
                wordSpacing: "0.25em"
              }}
              animate={{ 
                lineHeight: isTextAnimating ? 2.5 : 1.2,
                wordSpacing: isTextAnimating ? "3em" : "0.25em"
              }}
              transition={{
                duration: 5.5,
                ease: [0.4, 0, 0.2, 1]
              }}
              style={{
                whiteSpace: isTextAnimating ? "nowrap" : "normal",
                fontSize: getTextSize(),
                maxWidth: windowWidth < 480 ? "100%" : "none",
                wordWrap: windowWidth < 480 ? "break-word" : "normal"
              }}
            >
              <DestructibleText>
                <span style={{ display: "inline" }} className="welcome-text">
                  Discover Games That
                </span>
              </DestructibleText>
              <br />
              <DestructibleText>
                <span style={{ display: "inline" }} className="welcome-text">
                  Speak to You
                </span>
              </DestructibleText>
            </motion.div>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 overflow-visible text-center">
            <motion.div 
              className="overflow-visible mx-auto inline-block"
              initial={{
                lineHeight: 1.75,
                wordSpacing: "0.25em",
                position: "relative",
                y: 40
              }}
              animate={{ 
                lineHeight: isTextAnimating ? 1 : 1.75,
                wordSpacing: isTextAnimating ? "12em" : "0.25em",
                y: isTextAnimating ? 120 : 40,
                opacity: 1,
                zIndex: 5
              }}
              transition={{
                duration: 5.5,
                ease: [0.4, 0, 0.2, 1]
              }}
              style={{
                whiteSpace: "normal",
                wordBreak: "break-word",
                maxWidth: "100%",
                width: "100%"
              }}
            >
              {/* First line */}
              <DestructibleText>
                <span style={{ 
                  display: "inline",
                  fontSize: windowWidth < 360 ? "0.75rem" :
                           windowWidth < 405 ? "0.875rem" :
                           windowWidth < 515 ? "1rem" :
                           "1.1rem"
                }} className="welcome-text">
                  {windowWidth < 360 ? "Join our inclusive" :
                   windowWidth < 405 ? "Join our inclusive" :
                   windowWidth < 515 ? "Join our inclusive community" :
                   "Join our inclusive community of gamers"}
                </span>
              </DestructibleText>
              <br />
              
              {/* Second line */}
              <DestructibleText>
                <span style={{ 
                  display: "inline",
                  fontSize: windowWidth < 360 ? "0.75rem" :
                           windowWidth < 405 ? "0.875rem" :
                           windowWidth < 515 ? "1rem" :
                           "1.1rem"
                }} className="welcome-text">
                  {windowWidth < 360 ? "community of" :
                   windowWidth < 405 ? "community of gamers" :
                   windowWidth < 515 ? "of gamers sharing thoughtful" :
                   "sharing thoughtful reviews and discovering amazing games together."}
                </span>
              </DestructibleText>

              {/* Third line */}
              {windowWidth < 515 && (
                <>
                  <br />
                  <DestructibleText>
                    <span style={{ 
                      display: "inline",
                      fontSize: windowWidth < 360 ? "0.75rem" :
                               windowWidth < 405 ? "0.875rem" :
                               windowWidth < 515 ? "1rem" :
                               "1.1rem"
                    }} className="welcome-text">
                      {windowWidth < 360 ? "gamers sharing" :
                       windowWidth < 405 ? "sharing thoughtful" :
                       "reviews and discovering amazing"}
                    </span>
                  </DestructibleText>
                  {/* Add fourth line for screens between 405px and 515px */}
                  {windowWidth >= 405 && windowWidth < 515 && (
                    <>
                      <br />
                      <DestructibleText>
                        <span style={{ 
                          display: "inline",
                          fontSize: "1rem"
                        }} className="welcome-text">
                          games together.
                        </span>
                      </DestructibleText>
                    </>
                  )}
                </>
              )}

              {/* Fourth line */}
              {windowWidth < 405 && (
                <>
                  <br />
                  <DestructibleText>
                    <span style={{ 
                      display: "inline",
                      fontSize: windowWidth < 360 ? "0.75rem" :
                               windowWidth < 405 ? "0.875rem" :
                               "1rem"
                    }} className="welcome-text">
                      {windowWidth < 360 ? "thoughtful reviews" :
                       "reviews and discovering"}
                    </span>
                  </DestructibleText>
                </>
              )}

              {/* Extra lines for tiniest screens */}
              {windowWidth < 360 && (
                <>
                  <br />
                  <DestructibleText>
                    <span style={{ 
                      display: "inline",
                      fontSize: "0.75rem"
                    }} className="welcome-text">
                      amazing games
                    </span>
                  </DestructibleText>
                  <br />
                  <DestructibleText>
                    <span style={{ 
                      display: "inline",
                      fontSize: "0.75rem"
                    }} className="welcome-text">
                      together.
                    </span>
                  </DestructibleText>
                </>
              )}
            </motion.div>
          </p>
        </div>
        <div className="h-32">
          {windowWidth >= 1200 && (
            <GameController onStateChange={startGame} />
          )}
        </div>
      </motion.div>
    </section>
  );
};
