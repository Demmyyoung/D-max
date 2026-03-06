import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, Type, Image as ImageIcon, ChevronDown, Upload, ChevronLeft, Cat } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { useDesignStore, FELINE_PATTERNS } from '../../store/useDesignStore';
import { fetchGraphics } from '../../services/sanity';
import { GARMENTS, GRAPHICS as FALLBACK_GRAPHICS, FONTS, COLORS } from '../../data/studioAssets';

const LeftSidebar = ({ isOpen, onToggle }) => {
  const { addLayer, activeGarment, setActiveGarment } = useStudio();
  const addBlock = useDesignStore((state) => state.addBlock);
  const addFelinePattern = useDesignStore((state) => state.addFelinePattern);
  const blocks = useDesignStore((state) => state.blocks);
  const selectedIds = useDesignStore((state) => state.selectedIds);
  const selectedBlocks = blocks.filter(b => selectedIds.includes(b.id));
  const updateBlock = useDesignStore((state) => state.updateBlock);
  
  const [expandedSection, setExpandedSection] = useState(null); // Closed by default
  const [mockups, setMockups] = useState(GARMENTS);
  const [graphics, setGraphics] = useState(FALLBACK_GRAPHICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        // Mockups are now always loaded from local studioAssets.js (GARMENTS)
        
        const graphicsData = await fetchGraphics();
        if (graphicsData && graphicsData.length > 0) {
          setGraphics(graphicsData);
        }
      } catch (err) {
        console.log('Using fallback assets (Sanity unavailable)');
      }
      
      setLoading(false);
    };
    
    loadAssets();
  }, []);

  const handleAddText = (e) => {
    // Determine target based on context (click vs drop)
    const options = { text: 'YOUR TEXT', fontSize: 28, fontFamily: 'Inter', width: 150, height: 40 };
    if (e && e.clientX && e.clientY) {
       // Best effort for click placement
    }
    
    // Add to both legacy context and Zustand store
    addLayer({ 
      type: 'text', 
      content: 'YOUR TEXT', 
      ...options
    });
    addBlock('text', '', options);
  };
  
  const handleDragStart = (e, type, payload) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, payload }));
    e.dataTransfer.effectAllowed = 'copy';
  };
  
  const handleAddGraphic = (graphic) => {
    addLayer({
      type: 'image',
      name: graphic.name,
      src: graphic.src,
      width: 80
    });
    addBlock('image', graphic.src, { name: graphic.name, width: 80, height: 80 });
  };
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        addLayer({
          type: 'image',
          name: file.name,
          src: event.target.result,
          width: 100
        });
        addBlock('image', event.target.result, { name: file.name, width: 100, height: 100 });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <>
      {/* Toggle Button when closed */}
      {!isOpen && (
        <motion.button
          className="sidebar-toggle left"
          onClick={onToggle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Shirt size={20} />
        </motion.button>
      )}
      
      <AnimatePresence>
        {isOpen && (
          <motion.aside 
            className="studio-sidebar left"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="sidebar-header">
              <span>Design Tools</span>
              <button className="close-sidebar" onClick={onToggle}>
                <ChevronLeft size={18} />
              </button>
            </div>
            
            {/* Garment Section */}
            <div className="sidebar-section">
              <button 
                className="section-header" 
                onClick={() => toggleSection('garment')}
              >
                <div className="section-title">
                  <Shirt size={18} />
                  <span>Base Garment</span>
                </div>
                <ChevronDown 
                  size={18} 
                  className={`chevron ${expandedSection === 'garment' ? 'open' : ''}`}
                />
              </button>
              
              <AnimatePresence>
                {expandedSection === 'garment' && (
                  <motion.div 
                    className="section-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="garment-grid">
                      {mockups.map(g => (
                        <button
                          key={g.id}
                          className={`garment-option ${activeGarment.id === g.id ? 'active' : ''}`}
                          onClick={() => setActiveGarment(g)}
                        >
                          <img src={g.image} alt={g.name} />
                          <span>{g.name}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="color-section">
                      <label>Garment Color</label>
                      <div className="color-grid">
                        {COLORS.garment.map(color => (
                          <button
                            key={color}
                            className={`color-swatch ${activeGarment.color === color ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setActiveGarment({ ...activeGarment, color })}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Text Section */}
            <div className="sidebar-section">
              <button 
                className="section-header" 
                onClick={() => toggleSection('text')}
              >
                <div className="section-title">
                  <Type size={18} />
                  <span>Text</span>
                </div>
                <ChevronDown 
                  size={18} 
                  className={`chevron ${expandedSection === 'text' ? 'open' : ''}`}
                />
              </button>
              
              <AnimatePresence>
                {expandedSection === 'text' && (
                  <motion.div 
                    className="section-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <button 
                      className="add-element-btn" 
                      onClick={handleAddText}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, 'text', { text: 'YOUR TEXT', fontSize: 28, fontFamily: 'Inter' })}
                    >
                      + Add Text Element
                    </button>
                    
                    {/* If a text block is selected, show edit controls for it */}
                    {selectedBlocks.length > 0 && selectedBlocks.every(b => b.type === 'text') && (
                      <div className="text-edit-controls" style={{ marginBottom: '1rem', padding: '0.8rem', background: 'var(--studio-bg-tertiary)', borderRadius: 'var(--studio-radius-sm)' }}>
                        <div className="color-section" style={{ marginTop: 0 }}>
                          <label>Text Color</label>
                          <div className="color-grid small">
                            {['#FFFFFF', '#000000', '#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#6366F1', '#EC4899'].map(color => (
                              <button
                                key={color}
                                className={`color-swatch ${(selectedBlocks[0].fill || selectedBlocks[0].color) === color ? 'active' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => selectedBlocks.forEach(b => updateBlock(b.id, { fill: color, color }))}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="font-presets">
                      {FONTS.map(font => (
                        <button
                          key={font.name}
                          className="font-preset"
                          style={{ fontFamily: font.name }}
                          onClick={() => {
                            if (selectedBlocks.length > 0 && selectedBlocks.every(b => b.type === 'text')) {
                              selectedBlocks.forEach(b => updateBlock(b.id, { fontFamily: font.name }));
                            } else {
                              addLayer({ type: 'text', content: 'TEXT', fontFamily: font.name });
                              addBlock('text', '', { text: 'TEXT', fontSize: 28, fontFamily: font.name, width: 150, height: 40 });
                            }
                          }}
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, 'text', { text: 'TEXT', fontSize: 28, fontFamily: font.name })}
                        >
                          Aa
                          <span>{font.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Graphics Section */}
            <div className="sidebar-section">
              <button 
                className="section-header" 
                onClick={() => toggleSection('graphics')}
              >
                <div className="section-title">
                  <ImageIcon size={18} />
                  <span>Graphics</span>
                </div>
                <ChevronDown 
                  size={18} 
                  className={`chevron ${expandedSection === 'graphics' ? 'open' : ''}`}
                />
              </button>
              
              <AnimatePresence>
                {expandedSection === 'graphics' && (
                  <motion.div 
                    className="section-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <label className="upload-btn">
                      <Upload size={16} />
                      <span>Upload Your Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                    
                    <label className="subsection-label">Library</label>
                    <div className="graphics-grid">
                      {graphics.map(graphic => (
                        <button
                          key={graphic.id}
                          className="graphic-item"
                          onClick={() => handleAddGraphic(graphic)}
                          title={graphic.name}
                        >
                          <img src={graphic.src} alt={graphic.name} />
                        </button>
                      ))}
                    </div>
                    
                    <p className="hint-text">Click to add to canvas</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="sidebar-footer">
              <p className="tip">Press <kbd>/</kbd> for quick actions</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default LeftSidebar;
