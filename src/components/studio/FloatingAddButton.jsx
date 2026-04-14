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
      text: 'W$', 
      fontSize: 28, 
      fontFamily: '"Playfair Display", Georgia, serif', 
      width: 150, 
      height: 40 
    });
    setIsOpen(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    console.log('[D-MAX Studio] File selected:', file?.name, file?.size, file?.type);
    if (!file) return;
    
    // We remove the 5MB limit and implement client-side compression instead!
    
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      console.log('[D-MAX Studio] FileReader loaded');
      const img = new window.Image();
      img.onload = () => {
        console.log('[D-MAX Studio] Image object loaded:', img.width, 'x', img.height);
        try {
          // --- COMPRESSION LOGIC ---
          const MAX_DIMENSION = 1200; // Limit max resolution to keep Base64 size safe for localStorage
          let targetWidth = img.width;
          let targetHeight = img.height;
          
          if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
            const ratio = targetWidth / targetHeight;
            if (ratio > 1) {
              targetWidth = MAX_DIMENSION;
              targetHeight = MAX_DIMENSION / ratio;
            } else {
              targetHeight = MAX_DIMENSION;
              targetWidth = MAX_DIMENSION * ratio;
            }
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          // Use WebP for good compression with transparency support
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.85);
          // -------------------------

          const MAX_INITIAL = 350;
          const ratio = targetWidth / targetHeight;
          
          let blockWidth = 200;
          let blockHeight = 200;

          if (ratio > 1) { // Landscape
            blockWidth = Math.min(targetWidth, MAX_INITIAL);
            blockHeight = blockWidth / ratio;
          } else { // Portrait or Square
            blockHeight = Math.min(targetHeight, MAX_INITIAL);
            blockWidth = blockHeight * ratio;
          }

          const initialScale = blockWidth / targetWidth;

          addBlock('image', compressedDataUrl, {
            name: file.name,
            width: blockWidth,
            height: blockHeight,
            imageScale: initialScale,
            imageOffsetX: 0,
            imageOffsetY: 0
          });
        } catch (err) {
          console.error('[D-MAX] Error during image block creation:', err);
          alert('Failed to process image. It might be corrupted.');
        }
      };
      
      img.onerror = () => {
        alert('Invalid image file. Please try another.');
      };
      
      img.src = readerEvent.target.result;
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
      action: () => {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
    },
    {
      label: 'Add Flat',
      icon: <Layout size={18} />,
      action: () => {
        addBlock('raglan-flat', '', {
          name: 'Raglan Flat',
          width: 300,
          height: 300,
          bodyColor: '#FFFFFF',
          leftSleeveColor: '#7C3AED',
          rightSleeveColor: '#7C3AED'
        });
        setIsOpen(false);
      }
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
            initial={{ opacity: 0, y: 40, scale: 0.85, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 40, scale: 0.85, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
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
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2), 0 12px 24px rgba(0, 0, 0, 0.1)',
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
              <motion.button
                key={i}
                onClick={opt.action}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22, delay: i * 0.045 }}
                whileHover={{
                  scale: 1.04,
                  x: 3,
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  transition: { type: 'spring', stiffness: 500, damping: 20 }
                }}
                whileTap={{
                  scale: 0.96,
                  transition: { type: 'spring', stiffness: 600, damping: 20 }
                }}
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
                }}
              >
                <span style={{ color: '#111111' }}>{opt.icon}</span>
                <span style={{ 
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                  color: '#111111',
                }}>{opt.label}</span>
              </motion.button>
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
        id="studio-image-upload-input"
      />

      <motion.button
        layout
        onClick={() => setIsOpen(!isOpen)}
        className="dock-add-btn"
        animate={isOpen
          ? { scale: 1.06, backgroundColor: '#333333' }
          : { scale: 1,    backgroundColor: '#000000' }
        }
        whileHover={!isOpen
          ? { scale: 1.07, transition: { type: 'spring', stiffness: 500, damping: 22 } }
          : {}
        }
        whileTap={{ scale: 0.94, transition: { type: 'spring', stiffness: 600, damping: 20 } }}
        transition={{ type: 'spring', stiffness: 160, damping: 14 }}
        style={{ overflow: 'hidden' }}
      >
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          <Plus size={16} strokeWidth={3} />
        </motion.span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={isOpen ? 'close' : 'add'}
            initial={{ opacity: 0, y: 6, width: isOpen ? 'auto' : 'auto' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
          >
            {isOpen ? 'Close' : 'Add'}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {ReactDOM.createPortal(tray, document.body)}
    </>
  );
};

export default FloatingAddButton;
