
import { motion } from "framer-motion";

export const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 -z-30 overflow-hidden">
      {/* Base aurora layer - stronger pink/magenta */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, 
              rgba(236, 72, 153, 0) 0%, 
              rgba(236, 72, 153, 0.6) 50%, 
              rgba(236, 72, 153, 0) 100%
            )`
        }}
        animate={{
          transform: [
            "translateX(-50%) skewX(-15deg)",
            "translateX(50%) skewX(15deg)",
            "translateX(-50%) skewX(-15deg)"
          ]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Secondary pink wave */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, 
              rgba(219, 39, 119, 0) 0%, 
              rgba(219, 39, 119, 0.5) 50%, 
              rgba(219, 39, 119, 0) 100%
            )`
        }}
        animate={{
          transform: [
            "translateX(30%) skewX(20deg) scaleY(1.5)",
            "translateX(-30%) skewX(-20deg) scaleY(2)",
            "translateX(30%) skewX(20deg) scaleY(1.5)"
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Magenta wave */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, 
              rgba(217, 70, 239, 0) 0%, 
              rgba(217, 70, 239, 0.7) 50%, 
              rgba(217, 70, 239, 0) 100%
            )`
        }}
        animate={{
          transform: [
            "translateX(-20%) skewX(-25deg) scaleY(1.8)",
            "translateX(40%) skewX(25deg) scaleY(1.3)",
            "translateX(-20%) skewX(-25deg) scaleY(1.8)"
          ]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Additional pink highlights */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, 
              rgba(236, 72, 153, 0) 0%, 
              rgba(236, 72, 153, 0.8) 50%, 
              rgba(236, 72, 153, 0) 100%
            )`
        }}
        animate={{
          transform: [
            "translateX(-100%) skewX(-45deg) scaleY(2)",
            "translateX(100%) skewX(45deg) scaleY(2.5)",
            "translateX(-100%) skewX(-45deg) scaleY(2)"
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Strong pink glow overlay */}
      <div 
        className="absolute inset-0 opacity-70"
        style={{
          background: `
            radial-gradient(
              circle at 50% 0%, 
              rgba(236, 72, 153, 0.5), 
              rgba(217, 70, 239, 0.5), 
              rgba(219, 39, 119, 0.3), 
              transparent 70%
            )
          `
        }}
      />

      {/* Bottom fade out */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90" />
    </div>
  );
};
