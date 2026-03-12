import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Type, Image, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesignStore } from '../../store/useDesignStore';

const FloatingAddButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);
  const addBlock = useDesignStore((state) => state.addBlock);

  const handleAddText = () => {
    addBlock('text', '', { 
      text: 'YOUR TEXT', 
      fontSize: 28, 
      fontFamily: 'Inter', 
      width: 150, 
      height: 40 
    });
    setIsOpen(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reject files over 5MB to prevent canvas crash
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Please use an image under 5MB.');
      e.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        addBlock('image', event.target.result, {
          name: file.name,
          width: 150,
          height: 150
        });
      } catch (err) {
        console.error('Failed to add image block:', err);
        alert('Could not add image. Please try a different file.');
      }
    };
    reader.onerror = () => {
      alert('Could not read file. Please try again.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setIsOpen(false);
  };

  const options = [
    { 
      label: 'Add Text', 
      icon: <Type size={18} />, 
      action: handleAddText 
    },
    { 
      label: 'Upload Image', 
      icon: <Image size={18} />, 
      action: () => fileInputRef.current.click() 
    },
    { 
      label: 'Browse Graphics', 
      icon: <Layout size={18} />, 
      action: () => alert('Graphics library coming in Phase 3') 
    },
  ];

  const tray = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for closing on outside click */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
            style={{
              position: 'fixed',
              bottom: '100px',
              left: '50%',
              zIndex: 9999,
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '20px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              minWidth: '200px',
              boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
            }}
          >
            <div style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(0, 0, 0, 0.35)',
              padding: '8px 12px 6px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              marginBottom: '4px',
            }}>
              Add Element
            </div>
            
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={opt.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: '#111111',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ color: '#111111' }}>{opt.icon}</span>
                <span style={{ 
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                  color: '#111111',
                }}>{opt.label}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={handleImageUpload}
      />

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="dock-add-btn"
      >
        <Plus size={16} strokeWidth={3} />
        <span>Add</span>
      </motion.button>

      {ReactDOM.createPortal(tray, document.body)}
    </>
  );
};

export default FloatingAddButton;
