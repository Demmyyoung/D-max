import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Download, Share2, Command } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useDesignStore } from '../../store/useDesignStore';

const StudioHeader = () => {
  const { addToCart } = useCart();
  const { blocks, canvasColor } = useDesignStore();
  
  const handleDownload = () => {
    // For now, show a message - in production this would use a server-side rendering service
    alert('To download your design:\n\n1. Right-click on the garment preview\n2. Select "Save image as..."\n\nFor high-quality exports, the full version uses server-side rendering.');
  };

  const handleAddToBag = () => {
    if (blocks.length === 0) {
      alert('Your design is empty! Add some graphics or text first.');
      return;
    }

    // Capture current design as a virtual product
    const customProduct = {
      id: `custom-${Date.now()}`,
      name: 'Custom D-MAX Piece',
      price: 125.00, // Premium price for custom designs
      image: '/garments/hoodie-front.png', // Fallback to current garment view
      isCustom: true,
      designData: {
        blocks,
        canvasColor
      }
    };

    addToCart(customProduct);
    alert('Design added to your bag!');
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'D-MAX Design',
          text: 'Check out my custom D-MAX design!',
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

  const openCommandPalette = () => {
    // Dispatch Ctrl+K event to open command palette
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
  };

  return (
    <header className="studio-header">
      <div className="studio-header-left">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          <span>Exit</span>
        </Link>
        <div className="project-info">
          <span className="project-name">Untitled Design</span>
          <span className="project-status">● Auto-saved</span>
        </div>
      </div>
      
      <div className="studio-header-center">
        <span className="studio-title">
          <img
            src="/logo.png"
            alt="D-MAX"
            style={{
              height: '22px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)', /* white logo on dark header */
              verticalAlign: 'middle',
              marginRight: '6px',
            }}
          />
          STUDIO
        </span>
      </div>
      
      <div className="studio-header-right">
        <button 
          className="header-btn secondary" 
          onClick={openCommandPalette} 
          title="Command Palette (Ctrl+K)"
        >
          <Command size={16} />
          <span>⌘K</span>
        </button>
        <button className="header-btn secondary" onClick={handleDownload} title="Download Design">
          <Download size={16} />
          <span>Export</span>
        </button>
        <button className="header-btn secondary" onClick={handleShare} title="Share">
          <Share2 size={16} />
        </button>
        <button className="header-btn primary" onClick={handleAddToBag}>
          <ShoppingCart size={16} />
          <span>Add to Bag</span>
        </button>
      </div>
    </header>
  );
};

export default StudioHeader;

