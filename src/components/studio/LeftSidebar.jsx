import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, Type, Image as ImageIcon, ChevronDown, Upload, ChevronLeft } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { fetchMockups, fetchGraphics } from '../../services/strapi';
import { GARMENTS, GRAPHICS as FALLBACK_GRAPHICS, FONTS, COLORS } from '../../data/studioAssets';

const LeftSidebar = ({ isOpen, onToggle }) => {
  const { addLayer, activeGarment, setActiveGarment } = useStudio();
  const [expandedSection, setExpandedSection] = useState(null); // Closed by default
  const [mockups, setMockups] = useState(GARMENTS);
  const [graphics, setGraphics] = useState(FALLBACK_GRAPHICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const mockupsData = await fetchMockups();
        if (mockupsData && mockupsData.length > 0) {
          setMockups(mockupsData);
        }
        
        const graphicsData = await fetchGraphics();
        if (graphicsData && graphicsData.length > 0) {
          setGraphics(graphicsData);
        }
      } catch (err) {
        console.log('Using fallback assets (Strapi unavailable)');
      }
      
      setLoading(false);
    };
    
    loadAssets();
  }, []);

  const handleAddText = () => {
    addLayer({ 
      type: 'text', 
      content: 'YOUR TEXT', 
      fontSize: 28,
      fontFamily: 'Inter'
    });
  };
  
  const handleAddGraphic = (graphic) => {
    addLayer({
      type: 'image',
      name: graphic.name,
      src: graphic.src,
      width: 80
    });
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
          whileHover={{ scale: 1.05 }}
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
                    <button className="add-element-btn" onClick={handleAddText}>
                      + Add Text Element
                    </button>
                    
                    <div className="font-presets">
                      {FONTS.map(font => (
                        <button
                          key={font.name}
                          className="font-preset"
                          style={{ fontFamily: font.name }}
                          onClick={() => addLayer({ type: 'text', content: 'TEXT', fontFamily: font.name })}
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
