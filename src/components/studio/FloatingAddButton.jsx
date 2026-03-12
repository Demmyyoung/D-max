import React, { useState, useRef } from 'react';
import { Plus, Type, Image, Layout, X } from 'lucide-react';
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
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        addBlock('image', event.target.result, { 
          name: file.name, 
          width: 150, 
          height: 150 
        });
      };
      reader.readAsDataURL(file);
    }
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

  return (
    <div className="floating-add-container" style={{
      position: 'fixed',
      bottom: '2rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={handleImageUpload}
      />

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
                zIndex: -1
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              style={{
                background: 'rgba(15, 15, 15, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '1.5rem',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                minWidth: '180px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(99, 102, 241, 0.1)'
              }}
            >
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.4)',
                padding: '0.5rem 0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                marginBottom: '0.25rem'
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
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '1rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ color: '#6366f1' }}>{opt.icon}</span>
                  <span style={{ 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.02em'
                  }}>{opt.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          border: 'none',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          style={{ display: 'flex' }}
        >
          <Plus size={28} />
        </motion.div>
      </motion.button>
    </div>
  );
};

export default FloatingAddButton;
