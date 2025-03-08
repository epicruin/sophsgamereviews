import React from 'react';

interface StaticBackgroundProps {
  color: string;
}

const getGradient = (color: string) => {
  const gradients = {
    staticPink: 'linear-gradient(to bottom right, rgb(245, 190, 220), rgb(235, 120, 170), rgb(70, 65, 75))',
    staticBlue: 'linear-gradient(to bottom right, rgb(180, 210, 250), rgb(140, 180, 245), rgb(65, 70, 85))',
    lavender: 'linear-gradient(to bottom right, rgb(220, 200, 245), rgb(180, 160, 235), rgb(75, 70, 95))',
    peach: 'linear-gradient(to bottom right, rgb(245, 205, 180), rgb(235, 165, 140), rgb(85, 70, 75))',
    mint: 'linear-gradient(to bottom right, rgb(200, 235, 215), rgb(160, 225, 185), rgb(70, 85, 80))',
    lilac: 'linear-gradient(to bottom right, rgb(225, 205, 245), rgb(185, 165, 235), rgb(80, 70, 95))',
    rosePetal: 'linear-gradient(to bottom right, rgb(245, 210, 220), rgb(235, 170, 180), rgb(85, 65, 75))',
    babyBlue: 'linear-gradient(to bottom right, rgb(195, 220, 245), rgb(155, 180, 235), rgb(70, 75, 90))',
    coral: 'linear-gradient(to bottom right, rgb(245, 195, 185), rgb(235, 155, 145), rgb(90, 70, 75))',
    periwinkle: 'linear-gradient(to bottom right, rgb(205, 210, 245), rgb(165, 170, 235), rgb(75, 75, 95))'
  };
  return gradients[color as keyof typeof gradients] || gradients.staticPink;
};

export const StaticBackground = ({ color }: StaticBackgroundProps) => {
  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        background: getGradient(color),
        opacity: 1,
        zIndex: -2
      }}
    />
  );
}; 