import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuroraBackgroundBlueProps {
  useAbsolute?: boolean;
  className?: string;
}

export const AuroraBackgroundBlue: React.FC<AuroraBackgroundBlueProps> = ({
  useAbsolute = false,
  className
}) => {
  return (
    <div className={cn(useAbsolute ? "absolute" : "fixed", "inset-0 -z-30 overflow-hidden", className)}>
      {/* Base aurora layer - deep blue */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, 
              rgba(59, 130, 246, 0) 0%, 
              rgba(59, 130, 246, 0.6) 50%, 
              rgba(59, 130, 246, 0) 100%
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

      {/* Secondary blue wave */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, 
              rgba(37, 99, 235, 0) 0%, 
              rgba(37, 99, 235, 0.5) 50%, 
              rgba(37, 99, 235, 0) 100%
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

      {/* Pink-purple blend wave */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, 
              rgba(124, 58, 237, 0) 0%, 
              rgba(194, 65, 164, 0.65) 50%, 
              rgba(124, 58, 237, 0) 100%
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

      {/* Enhanced pink accent layer */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, 
              rgba(236, 72, 153, 0) 0%, 
              rgba(236, 72, 153, 0.45) 50%, 
              rgba(236, 72, 153, 0) 100%
            )`
        }}
        animate={{
          transform: [
            "translateX(-70%) skewX(-30deg) scaleY(1.6)",
            "translateX(70%) skewX(30deg) scaleY(1.3)",
            "translateX(-70%) skewX(-30deg) scaleY(1.6)"
          ]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Cyan/teal highlights with pink blend */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, 
              rgba(6, 182, 212, 0) 0%, 
              rgba(6, 182, 212, 0.7) 30%,
              rgba(219, 39, 119, 0.3) 60%,
              rgba(6, 182, 212, 0) 100%
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

      {/* Strong blue-purple-pink glow overlay */}
      <div 
        className="absolute inset-0 opacity-70"
        style={{
          background: `
            radial-gradient(
              circle at 50% 0%, 
              rgba(59, 130, 246, 0.5), 
              rgba(124, 58, 237, 0.5),
              rgba(219, 39, 119, 0.3),
              rgba(236, 72, 153, 0.25),
              rgba(6, 182, 212, 0.2), 
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