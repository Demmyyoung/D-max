import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Download, Share2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useDesignStore } from '../../store/useDesignStore';

const StudioHeader = () => {
  const { addToCart } = useCart();
  const { blocks, canvasColor } = useDesignStore();
  const [designName, setDesignName] = useState('Untitled Design');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(designName);
  const inputRef = useRef(null);
  
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
    <header className="studio-header">
      <div className="studio-header-left">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          <span>Exit</span>
        </Link>
      </div>
      
      <div className="studio-header-center">
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
              <span className="project-name" style={{ fontSize: '0.95rem' }}>{designName}</span>
              <Pencil size={11} className="project-name-edit-icon" />
            </button>
          )}
          <span className="project-status">● Auto-saved</span>
        </div>
      </div>
      
      <div className="studio-header-right">
        <motion.button
          className="header-btn secondary"
          onClick={handleDownload}
          title="Download Design"
          whileHover={{ scale: 1.06, transition: { type: 'spring', stiffness: 500, damping: 22 } }}
          whileTap={{ scale: 0.93, transition: { type: 'spring', stiffness: 600, damping: 20 } }}
        >
          <Download size={16} />
          <span>Export</span>
        </motion.button>
        <motion.button
          className="header-btn secondary"
          onClick={handleShare}
          title="Share"
          whileHover={{ scale: 1.06, transition: { type: 'spring', stiffness: 500, damping: 22 } }}
          whileTap={{ scale: 0.93, transition: { type: 'spring', stiffness: 600, damping: 20 } }}
        >
          <Share2 size={16} />
        </motion.button>
        <motion.button
          className="header-btn brand-forward"
          onClick={handleOrderSample}
          whileHover={{ scale: 1.08, y: -1, transition: { type: 'spring', stiffness: 500, damping: 22 } }}
          whileTap={{ scale: 0.94, transition: { type: 'spring', stiffness: 600, damping: 20 } }}
        >
          <ShoppingCart size={16} />
          <span>Order Sample</span>
        </motion.button>
      </div>
    </header>
  );
};

export default StudioHeader;

