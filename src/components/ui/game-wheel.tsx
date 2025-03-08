import * as React from "react";
import { motion, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GameWheelProps {
  games: string[];
  onSelect?: (game: string) => void;
  className?: string;
}

export function GameWheel({ games, onSelect, className }: GameWheelProps) {
  const [spinning, setSpinning] = React.useState(false);
  const [selectedGame, setSelectedGame] = React.useState<string | null>(null);
  const controls = useAnimation();
  const [totalRotation, setTotalRotation] = React.useState(0);
  
  const normalizedGames = React.useMemo(() => {
    if (games.length === 10) return games;
    if (games.length > 10) return games.slice(0, 10);
    const result = [...games];
    while (result.length < 10) {
      result.push(games[result.length % games.length]);
    }
    return result;
  }, [games]);
  
  const handleSpin = React.useCallback(() => {
    if (spinning) return;
    
    setSpinning(true);
    setSelectedGame(null);
    
    const fullSpins = 5;
    const randomAngle = Math.random() * 360;
    const newRotation = totalRotation + (fullSpins * 360) + randomAngle;
    
    controls.start({ 
      rotate: newRotation, 
      transition: { 
        duration: 4,
        type: "spring",
        stiffness: 10,
        damping: 10
      } 
    }).then(() => {
      setTotalRotation(newRotation);
      
      const normalizedRotation = newRotation % 360;
      const segmentSize = 360 / normalizedGames.length;
      const pointerPosition = (360 - normalizedRotation + 270) % 360;
      const selectedIndex = Math.floor(pointerPosition / segmentSize);
      
      const selected = normalizedGames[selectedIndex % normalizedGames.length];
      
      setSelectedGame(selected);
      setSpinning(false);
      
      if (onSelect) {
        onSelect(selected);
      }
    });
  }, [spinning, controls, totalRotation, normalizedGames, onSelect]);
  
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0 
                        border-l-[12px] border-l-transparent 
                        border-r-[12px] border-r-transparent 
                        border-t-[24px] border-t-rose-500" />
        
        <div className="relative">
          <motion.svg
            width="400"
            height="400"
            viewBox="0 0 400 400"
            style={{ originX: "50%", originY: "50%" }}
            animate={controls}
            initial={{ rotate: 0 }}
            className="drop-shadow-xl max-w-full h-auto"
          >
            <circle 
              cx="200" 
              cy="200" 
              r="190" 
              fill="white" 
              stroke="#FDA4AF" 
              strokeWidth="8" 
            />
            
            {normalizedGames.map((game, index) => {
              const startAngle = index * 36;
              const endAngle = (index + 1) * 36;
              const centerAngle = startAngle + 18;
              
              const textX = 200 + 133 * Math.cos(centerAngle * Math.PI / 180);
              const textY = 200 + 133 * Math.sin(centerAngle * Math.PI / 180);
              
              const startX = 200 + 190 * Math.cos(startAngle * Math.PI / 180);
              const startY = 200 + 190 * Math.sin(startAngle * Math.PI / 180);
              const endX = 200 + 190 * Math.cos(endAngle * Math.PI / 180);
              const endY = 200 + 190 * Math.sin(endAngle * Math.PI / 180);
              
              const path = `
                M 200 200
                L ${startX} ${startY}
                A 190 190 0 0 1 ${endX} ${endY}
                Z
              `;
              
              return (
                <g key={index}>
                  <path
                    d={path}
                    fill={index % 2 === 0 ? "#FB7185" : "#F43F5E"}
                    stroke="white"
                    strokeWidth="1"
                  />
                  <text 
                    x={textX} 
                    y={textY} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                    transform={`rotate(${centerAngle}, ${textX}, ${textY})`}
                  >
                    {game.length > 12 ? `${game.substring(0, 10)}...` : game}
                  </text>
                </g>
              );
            })}
            
            <circle 
              cx="200" 
              cy="200" 
              r="30" 
              fill="#F43F5E" 
              stroke="white" 
              strokeWidth="4" 
            />
          </motion.svg>
        </div>
      </div>
      
      <Button
        onClick={handleSpin}
        disabled={spinning}
        className="mt-6 bg-rose-500 hover:bg-rose-600 text-white"
        size="lg"
      >
        {spinning ? "Spinning..." : "Spin"}
      </Button>
      
      {selectedGame && (
        <div className="mt-4 text-lg font-semibold text-rose-600">
          You should play a <span className="text-rose-800 font-bold">{selectedGame}</span> game!
        </div>
      )}
    </div>
  );
}