import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, Image, Hexagon } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';

const SlashMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { addLayer } = useStudio();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/') {
        // Prevent default only if we are not in an input
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        
        e.preventDefault();
        setIsOpen(prev => !prev);
        // Center of screen or cursor? Let's do center for now as cursor pos is tricky efficiently
        setPosition({ x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 });
      }
      if (e.key === 'Escape') {
         setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const handleSelect = (type) => {
    if (type === 'text') {
      addLayer({ id: Date.now(), type: 'text', content: 'Slash Text', x: 50, y: 50 });
    }
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
           className="slash-menu"
           style={{ top: position.y, left: position.x }}
           initial={{ opacity: 0, scale: 0.95, y: 10 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95 }}
        >
           <div className="slash-header">
             <span>Studio Commands</span>
           </div>
           <div className="slash-items">
              <button onClick={() => handleSelect('text')}><Type size={16} /> Text</button>
              <button onClick={() => handleSelect('image')}><Image size={16} /> Image</button>
              <button onClick={() => handleSelect('shape')}><Hexagon size={16} /> Shape</button>
           </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SlashMenu;
