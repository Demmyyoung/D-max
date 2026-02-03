import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <div className="hero-section">
      <div className="hero-image-container">
        {/* Placeholder for high-end fashion image */}
        <img 
            src="https://images.unsplash.com/photo-1509319117193-518faad14d2d?q=80&w=2688&auto=format&fit=crop" 
            alt="Hero Fashion" 
            className="hero-image"
        />
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        {/* The text is handled by the Logo Shrink effect in Header, so we might not need text here except maybe a CTA or subtitle */}
        <p className="hero-subtitle">Volume 01 — 2026</p>
      </div>
    </div>
  );
};

export default Hero;
