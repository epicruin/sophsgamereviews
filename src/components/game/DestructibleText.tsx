import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from './GameState';

interface DestructibleTextProps {
  children: ReactNode;
}

export const DestructibleText = ({ children }: DestructibleTextProps) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [visibleChars, setVisibleChars] = useState<boolean[]>([]);
  const [initialized, setInitialized] = useState(false);
  const { gameState } = useGameState();

  useEffect(() => {
    const span = spanRef.current;
    if (!span || !span.textContent || initialized) return;

    // Initialize visibility
    setVisibleChars(Array(span.textContent.length).fill(true));
    setInitialized(true);
  }, [initialized]);

  // Reset text when game state changes
  useEffect(() => {
    if (gameState === 'ready' || gameState === 'gameover' || gameState === 'win') {
      // For force stop (ready state), reset immediately
      // For game over/win, wait for animation
      const delay = gameState === 'ready' ? 0 : 2500;
      setTimeout(() => {
        setVisibleChars(prev => prev.map(() => true));
      }, delay);
    }
  }, [gameState]);

  useEffect(() => {
    const span = spanRef.current;
    if (!span) return;

    const handleCollision = (e: CustomEvent) => {
      const { charIndex } = e.detail;
      if (typeof charIndex === 'number' && charIndex >= 0 && charIndex < visibleChars.length) {
        setVisibleChars(prev => {
          const newVisibility = [...prev];
          newVisibility[charIndex] = false;
          return newVisibility;
        });
      }
    };

    span.addEventListener('bulletCollision', handleCollision as EventListener);
    return () => span.removeEventListener('bulletCollision', handleCollision as EventListener);
  }, [visibleChars.length]);

  const renderChar = (char: string, idx: number) => {
    // If it's a space, render it without collision detection attributes
    if (char === ' ') {
      return <span key={idx}>&nbsp;</span>;
    }

    // If visibleChars is not initialized yet, show all characters
    if (visibleChars.length === 0) return (
      <span 
        key={idx} 
        data-char-index={idx}
        data-disabled="false"
      >
        {char}
      </span>
    );

    // After initialization, animate characters
    return (
      <motion.span
        key={idx}
        initial={{ opacity: 1 }}
        animate={{ 
          opacity: visibleChars[idx] ? 1 : 0,
          scale: visibleChars[idx] ? 1 : 0.8,
          y: visibleChars[idx] ? 0 : 10
        }}
        transition={{ 
          duration: 0.3,
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
      >
        <span 
          data-char-index={idx}
          data-disabled={!visibleChars[idx] ? 'true' : 'false'}
        >
          {char}
        </span>
      </motion.span>
    );
  };

  return (
    <span ref={spanRef}>
      {React.Children.map(children, child => {
        if (typeof child === 'string') {
          return child.split('').map((char, idx) => renderChar(char, idx));
        }
        // If it's a span element, preserve its props but wrap its content
        if (React.isValidElement(child) && child.type === 'span') {
          return React.cloneElement(child, {
            ...child.props,
            children: typeof child.props.children === 'string' 
              ? child.props.children.split('').map((char: string, idx: number) => 
                  renderChar(char, idx)
                )
              : child.props.children
          });
        }
        return child;
      })}
    </span>
  );
}; 