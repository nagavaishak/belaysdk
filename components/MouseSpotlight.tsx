// components/MouseSpotlight.tsx
'use client';

import { useEffect, useState } from 'react';

export default function MouseSpotlight() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      className="fixed pointer-events-none z-10 transition-opacity duration-300"
      style={{
        left: mousePosition.x - 300,
        top: mousePosition.y - 300,
        width: '600px',
        height: '600px',
      }}
    >
      {/* Spotlight effect */}
      <div 
        className="w-full h-full rounded-full blur-3xl opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}