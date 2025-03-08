import { motion } from "framer-motion";

interface PlayerProps {
  position: number;
}

export const Player = ({ position }: PlayerProps) => {
  return (
    <motion.div
      className="relative"
      style={{
        position: 'absolute',
        left: `calc(50% + ${position}px - 16px)`,
        bottom: '80px'
      }}
      animate={{
        x: position
      }}
      transition={{
        type: "tween",
        duration: 0.1
      }}
    >
      <div className="w-8 h-8 player">
        <img
          src="/spaceinvaders-player.svg"
          alt="Player ship"
          className="w-full h-full"
        />
      </div>
    </motion.div>
  );
}; 