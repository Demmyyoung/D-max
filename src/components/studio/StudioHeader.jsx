import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Download, Share2, Pencil, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useDesignStore } from '../../store/useDesignStore';

const StudioHeader = () => {
  const { addToCart } = useCart();
  const { blocks, canvasColor, setCanvasColor } = useDesignStore();
  const [designName, setDesignName] = useState('Untitled Design');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(designName);
  const inputRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Auto-focus and select all when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    setDraft(designName);
    setIsEditing(true);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    setDesignName(trimmed || 'Untitled Design');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setIsEditing(false);
  };
  
  const handleDownload = () => {
    console.log('Export coming in Phase 5');
  };

  const handleOrderSample = () => {
    if (blocks.length === 0) {
      alert('Your design is empty! Add some graphics or text first.');
      return;
    }

    const customProduct = {
      id: `custom-${Date.now()}`,
      name: designName,
      price: 0,
      image: '/garments/hoodie-front.png',
      isCustom: true,
      designData: { blocks, canvasColor }
    };

    addToCart(customProduct);
    alert('Design added to your order!');
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: designName,
          text: `Check out my custom D-MAX design: ${designName}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };


  return (
    <header 
      className="studio-header"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '90%',
        maxWidth: '900px',
        padding: '12px 16px',
        borderRadius: '9999px',
        color: '#ffffff',
        border: 'none',
        background: 'transparent'
      }}
    >
      {/* Background Underlay */}
      <motion.div
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0.35 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(18, 18, 18, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '9999px',
          zIndex: -1
        }}
      />

      <motion.div 
        className="studio-header-left"
        animate={{ opacity: isHovered ? 1 : 0.35 }}
      >
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <motion.div 
            className="back-link" 
            whileHover={{ color: '#ef4444', transition: { duration: 0 } }} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={18} />
            <span>Exit</span>
          </motion.div>
        </Link>
      </motion.div>
      
      <motion.div 
        className="studio-header-center"
        animate={{ opacity: isHovered ? 1 : 0.35 }}
      >
        <div className="project-info" style={{ borderLeft: 'none', paddingLeft: 0, alignItems: 'center' }}>
          {isEditing ? (
            <input
              ref={inputRef}
              className="project-name-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              maxLength={40}
            />
          ) : (
            <button
              className="project-name-btn"
              onClick={startEditing}
              title="Click to rename"
            >
              <span className="project-name" style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'lowercase' }}>{designName}</span>
              <Pencil size={11} className="project-name-edit-icon" />
            </button>
          )}
          <span className="project-status" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#10b981' }}>● Auto-saved</span>
        </div>
      </motion.div>
      
      <div className="studio-header-right" style={{ display: 'flex', gap: '8px' }}>
        <motion.button
          className="header-btn secondary btn-pill"
          onClick={() => setCanvasColor(canvasColor === '#1e1e1e' ? '#ffffff' : '#1e1e1e')}
          title="Toggle Canvas Theme"
          animate={{ opacity: isHovered ? 1 : 0.15 }}
          whileHover={{ scale: 1.06, transition: { type: 'spring', stiffness: 500, damping: 22 } }}
          whileTap={{ scale: 0.93, transition: { type: 'spring', stiffness: 600, damping: 20 } }}
        >
          {canvasColor === '#1e1e1e' ? <Sun size={16} /> : <Moon size={16} />}
        </motion.button>
        <motion.button
          className="header-btn secondary btn-pill"
          onClick={handleDownload}
          title="Download Design"
          animate={{ opacity: isHovered ? 1 : 0.15 }}
          whileHover={{ scale: 1.06, transition: { type: 'spring', stiffness: 500, damping: 22 } }}
          whileTap={{ scale: 0.93, transition: { type: 'spring', stiffness: 600, damping: 20 } }}
        >
          <Download size={16} />
          <span>Export</span>
        </motion.button>
        <motion.button
          className="header-btn secondary btn-pill"
          onClick={handleShare}
          title="Share"
          animate={{ opacity: isHovered ? 1 : 0.15 }}
          whileHover={{ scale: 1.06, transition: { type: 'spring', stiffness: 500, damping: 22 } }}
          whileTap={{ scale: 0.93, transition: { type: 'spring', stiffness: 600, damping: 20 } }}
        >
          <Share2 size={16} />
        </motion.button>
        <motion.button
          className="header-btn brand-forward btn-pill"
          onClick={handleOrderSample}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.08, y: -1, opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 22 } }}
          whileTap={{ scale: 0.94, transition: { type: 'spring', stiffness: 600, damping: 20 } }}
          style={{ backgroundColor: 'var(--luxury-teal)', border: 'none', color: '#ffffff' }}
        >
          <ShoppingCart size={16} />
          <span>Order Sample</span>
        </motion.button>
      </div>
    </header>
  );
};

export default StudioHeader;

