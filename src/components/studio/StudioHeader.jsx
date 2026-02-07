import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Download, Share2 } from 'lucide-react';

const StudioHeader = () => {
  
  const handleDownload = () => {
    // For now, show a message - in production this would use a server-side rendering service
    alert('To download your design:\n\n1. Right-click on the garment preview\n2. Select "Save image as..."\n\nFor high-quality exports, the full version uses server-side rendering.');
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

  return (
    <header className="studio-header">
      <div className="studio-header-left">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <div className="project-info">
          <span className="project-name">Untitled Design</span>
          <span className="project-status">Draft</span>
        </div>
      </div>
      
      <div className="studio-header-center">
        <span className="studio-title">D-MAX STUDIO</span>
      </div>
      
      <div className="studio-header-right">
        <button className="header-btn secondary" onClick={handleDownload} title="Download Design">
          <Download size={18} />
          <span>Download</span>
        </button>
        <button className="header-btn secondary" onClick={handleShare} title="Share">
          <Share2 size={18} />
        </button>
        <button className="header-btn primary">
          <ShoppingCart size={18} />
          <span>Add to Bag</span>
        </button>
      </div>
    </header>
  );
};

export default StudioHeader;
