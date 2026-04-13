import React from 'react';

const RaglanFlat = ({ 
  bodyColor = "#FFFFFF", 
  leftSleeveColor = "#7C3AED", // Defaulting to the brand purple
  rightSleeveColor = "#7C3AED",
  strokeColor = "#111827",
  strokeWidth = 2 
}) => {
  return (
    <svg 
      viewBox="0 0 400 400" 
      xmlns="http://www.w3.org/2000/svg" 
      className="w-full h-full drop-shadow-sm"
      style={{ width: '100%', height: '100%' }}
    >
      {/* 1. THE BODY 
        The top points align exactly with the inner collar. 
      */}
      <path 
        d="M 160 90 L 240 90 L 260 320 L 140 320 Z" 
        fill={bodyColor} 
        stroke={strokeColor} 
        strokeWidth={strokeWidth} 
        strokeLinejoin="round"
      />

      {/* 2. LEFT SLEEVE (Raglan Cut)
        Notice the diagonal line starting from the collar (160 90) 
        down to the armpit. This is the defining feature of a raglan.
      */}
      <path 
        d="M 160 90 L 70 200 L 100 230 L 150 160 Z" 
        fill={leftSleeveColor} 
        stroke={strokeColor} 
        strokeWidth={strokeWidth} 
        strokeLinejoin="round"
      />

      {/* 3. RIGHT SLEEVE (Raglan Cut)
        Mirrors the left sleeve's geometry.
      */}
      <path 
        d="M 240 90 L 330 200 L 300 230 L 250 160 Z" 
        fill={rightSleeveColor} 
        stroke={strokeColor} 
        strokeWidth={strokeWidth} 
        strokeLinejoin="round"
      />

      {/* 4. COLLAR 
        Rendered last so it sits on top of the body and sleeves.
      */}
      <path 
        d="M 150 85 Q 200 110 250 85 Q 200 120 150 85 Z" 
        fill={bodyColor} 
        stroke={strokeColor} 
        strokeWidth={strokeWidth} 
      />
      
      {/* Curved back collar line for depth */}
      <path 
        d="M 160 90 Q 200 100 240 90" 
        fill="none" 
        stroke={strokeColor} 
        strokeWidth={strokeWidth} 
      />
    </svg>
  );
};

export default RaglanFlat;
