
import React from "react";
import { cn } from "@/lib/utils";

interface StaticStarsBackgroundProps {
  className?: string;
}

export const StaticStarsBackground: React.FC<StaticStarsBackgroundProps> = ({
  className,
}) => {
  return (
    <div className={cn("fixed inset-0 -z-10", className)}>
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,rgba(0,0,0,0)_80%)]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 130px 80px, #fff, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 180px 90px, #fff, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 210px 110px, #eee, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 240px 50px, #ddd, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 270px 140px, #fff, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 300px 70px, #eee, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 330px 130px, #ddd, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 360px 100px, #fff, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 390px 80px, #eee, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 420px 150px, #ddd, rgba(0,0,0,0))
            `,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
            animation: "twinkle 5s ease-in-out infinite",
            opacity: 0.5,
          }}
        />
      </div>
      <style>
        {`
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            25% { opacity: 0.5; }
            50% { opacity: 0.7; }
            75% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};
