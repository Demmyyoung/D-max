import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Copy, Layers, ChevronRight } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { useDesignStore } from '../../store/useDesignStore';
import { COLORS } from '../../data/studioAssets';

const RightSidebar = ({ isOpen, onToggle }) => {
  const { selectedLayer, updateLayer, deleteLayer, layers, selectLayer, addLayer } = useStudio();
  
  // Zustand store integration
  const blocks = useDesignStore((state) => state.blocks);
  const selectedId = useDesignStore((state) => state.selectedId);
  const selectBlock = useDesignStore((state) => state.selectBlock);
  const updateBlock = useDesignStore((state) => state.updateBlock);
  const deleteBlock = useDesignStore((state) => state.deleteBlock);
  const duplicateBlock = useDesignStore((state) => state.duplicateBlock);
  
  // Use Zustand blocks if available, fallback to legacy layers
  const displayItems = blocks.length > 0 ? blocks : layers;
  const selectedItem = blocks.find(b => b.id === selectedId) || selectedLayer;

  const handleSliderChange = (property, value) => {
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { [property]: parseFloat(value) });
    }
  };
  
  const handleTextChange = (e) => {
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { content: e.target.value });
    }
  };
  
  const handleDuplicate = () => {
    if (selectedLayer) {
      addLayer({
        ...selectedLayer,
        x: selectedLayer.x + 20,
        y: selectedLayer.y + 20
      });
    }
  };

  return (
    <>
      {/* Toggle Button when closed */}
      {!isOpen && (
        <motion.button
          className="sidebar-toggle right"
          onClick={onToggle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Layers size={20} />
          {layers.length > 0 && <span className="badge">{layers.length}</span>}
        </motion.button>
      )}
      
      <AnimatePresence>
        {isOpen && (
          <motion.aside 
            className="studio-sidebar right"
            initial={{ x: 280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="sidebar-header">
              <span>Layers & Properties</span>
              <button className="close-sidebar" onClick={onToggle}>
                <ChevronRight size={18} />
              </button>
            </div>
            
            {/* Layers Panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Layers size={16} />
                  <span>Layers ({layers.length})</span>
                </div>
              </div>
              <div className="layers-list">
                {layers.length === 0 ? (
                  <p className="empty-text">No layers yet. Add text or graphics!</p>
                ) : (
                  [...layers].reverse().map((layer, index) => (
                    <button
                      key={layer.id}
                      className={`layer-row ${selectedLayer?.id === layer.id ? 'active' : ''}`}
                      onClick={() => selectLayer(layer.id)}
                    >
                      <span className="layer-type">{layer.type === 'text' ? 'T' : 'I'}</span>
                      <span className="layer-name">
                        {layer.type === 'text' 
                          ? (layer.content.length > 12 ? layer.content.substring(0, 12) + '...' : layer.content)
                          : (layer.name || `Image ${layers.length - index}`)
                        }
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Properties Panel */}
            {selectedLayer ? (
              <div className="panel properties-panel">
                <div className="panel-header">
                  <span>Properties</span>
                  <div className="panel-actions">
                    <button 
                      className="icon-btn" 
                      title="Duplicate"
                      onClick={handleDuplicate}
                    >
                      <Copy size={14} />
                    </button>
                    <button 
                      className="icon-btn danger" 
                      title="Delete"
                      onClick={() => deleteLayer(selectedLayer.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                {selectedLayer.type === 'text' && (
                  <div className="prop-group">
                    <label>Text Content</label>
                    <input 
                      type="text"
                      value={selectedLayer.content}
                      onChange={handleTextChange}
                      className="text-input"
                      placeholder="Enter your text..."
                    />
                  </div>
                )}
                
                <div className="prop-group">
                  <label>Scale</label>
                  <div className="slider-row">
                    <input 
                      type="range" 
                      min="0.2" 
                      max="3" 
                      step="0.1"
                      value={selectedLayer.scale}
                      onChange={(e) => handleSliderChange('scale', e.target.value)}
                    />
                    <span className="value">{selectedLayer.scale.toFixed(1)}x</span>
                  </div>
                </div>
                
                <div className="prop-group">
                  <label>Rotation</label>
                  <div className="slider-row">
                    <input 
                      type="range" 
                      min="-180" 
                      max="180" 
                      step="1"
                      value={selectedLayer.rotation}
                      onChange={(e) => handleSliderChange('rotation', e.target.value)}
                    />
                    <span className="value">{selectedLayer.rotation}°</span>
                  </div>
                </div>
                
                <div className="prop-group">
                  <label>Opacity</label>
                  <div className="slider-row">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="1"
                      value={selectedLayer.opacity}
                      onChange={(e) => handleSliderChange('opacity', e.target.value)}
                    />
                    <span className="value">{selectedLayer.opacity}%</span>
                  </div>
                </div>
                
                {selectedLayer.type === 'text' && (
                  <>
                    <div className="prop-group">
                      <label>Font Size</label>
                      <div className="slider-row">
                        <input 
                          type="range" 
                          min="12" 
                          max="72" 
                          step="1"
                          value={selectedLayer.fontSize}
                          onChange={(e) => handleSliderChange('fontSize', e.target.value)}
                        />
                        <span className="value">{selectedLayer.fontSize}px</span>
                      </div>
                    </div>
                    
                    <div className="prop-group">
                      <label>Text Color</label>
                      <div className="color-grid small">
                        {COLORS.text.map(color => (
                          <button
                            key={color}
                            className={`color-swatch ${selectedLayer.color === color ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateLayer(selectedLayer.id, { color })}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                {selectedLayer.type === 'image' && (
                  <div className="prop-group">
                    <label>Width</label>
                    <div className="slider-row">
                      <input 
                        type="range" 
                        min="30" 
                        max="200" 
                        step="5"
                        value={selectedLayer.width || 80}
                        onChange={(e) => updateLayer(selectedLayer.id, { width: parseInt(e.target.value) })}
                      />
                      <span className="value">{selectedLayer.width || 80}px</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="panel empty-state">
                <p>Select a layer to edit its properties</p>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default RightSidebar;
