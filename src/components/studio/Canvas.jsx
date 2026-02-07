import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Undo2, Redo2, Trash2, Hand, MousePointer, Plus, Minus, RotateCcw } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';

const Canvas = () => {
  const { 
    activeGarment, 
    layers, 
    selectLayer, 
    selectedLayerId, 
    updateLayer,
    deselectAll,
    undo,
    redo,
    clearAll,
    canUndo,
    canRedo
  } = useStudio();
  
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState('select');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'h' || e.key === 'H') setTool('pan');
      if (e.key === 'v' || e.key === 'V') setTool('select');
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleResetView();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCanvasClick = (e) => {
    if (e.target.classList.contains('whiteboard') || e.target.classList.contains('canvas-content')) {
      deselectAll();
    }
  };

  const handleDragEnd = (layerId, info) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const newX = layer.x + info.offset.x / zoom;
    const newY = layer.y + info.offset.y / zoom;
    
    updateLayer(layerId, { x: newX, y: newY });
  };
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
    }
  };

  // Pan handlers
  const handleMouseDown = (e) => {
    if (tool === 'pan' || e.button === 1) { // Pan tool or middle mouse button
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle mouse leaving the canvas area
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPanning(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div 
      className="studio-canvas" 
      onClick={handleCanvasClick}
      onWheel={handleWheel}
    >
      {/* Top Toolbar */}
      <div className="canvas-toolbar top">
        <div className="toolbar-group">
          <button 
            className={`toolbar-btn ${tool === 'select' ? 'active' : ''}`} 
            onClick={() => setTool('select')}
            title="Select (V)"
          >
            <MousePointer size={18} />
          </button>
          <button 
            className={`toolbar-btn ${tool === 'pan' ? 'active' : ''}`} 
            onClick={() => setTool('pan')}
            title="Pan (H) - Click and drag to move canvas"
          >
            <Hand size={18} />
          </button>
        </div>
        
        <div className="toolbar-divider"></div>
        
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={handleZoomOut} title="Zoom Out">
            <Minus size={18} />
          </button>
          <button className="zoom-display" onClick={handleResetView} title="Reset View">
            {Math.round(zoom * 100)}%
          </button>
          <button className="toolbar-btn" onClick={handleZoomIn} title="Zoom In">
            <Plus size={18} />
          </button>
        </div>
        
        <div className="toolbar-divider"></div>
        
        <button className="toolbar-btn" onClick={handleResetView} title="Reset View (Ctrl+0)">
          <RotateCcw size={18} />
        </button>
      </div>
      
      {/* Whiteboard Area */}
      <div 
        ref={containerRef}
        className={`whiteboard ${tool === 'pan' ? 'pan-mode' : ''} ${isPanning ? 'panning' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div 
          className="canvas-content"
          style={{ 
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <motion.div 
            className="garment-container"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div 
              className="garment-preview"
              style={{ backgroundColor: activeGarment.color }}
            >
              <img 
                src={activeGarment.image} 
                alt={activeGarment.name}
                className="garment-image"
                draggable={false}
              />
              
              {/* Design Area */}
              <div className="design-area">
                {layers.map(layer => (
                  <motion.div 
                    key={layer.id}
                    className={`layer-item ${selectedLayerId === layer.id ? 'selected' : ''}`}
                    style={{
                      position: 'absolute',
                      left: layer.x,
                      top: layer.y,
                      opacity: layer.opacity / 100,
                      transform: `scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                      color: layer.color,
                      fontSize: layer.fontSize,
                      fontFamily: layer.fontFamily,
                      transformOrigin: 'center center'
                    }}
                    drag={tool === 'select'}
                    dragMomentum={false}
                    dragElastic={0}
                    onDragEnd={(event, info) => handleDragEnd(layer.id, info)}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectLayer(layer.id);
                    }}
                    whileHover={{ cursor: tool === 'select' ? 'grab' : 'default' }}
                    whileDrag={{ cursor: 'grabbing', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}
                  >
                    {layer.type === 'text' && <span>{layer.content}</span>}
                    {layer.type === 'image' && (
                      <img 
                        src={layer.src} 
                        alt={layer.name || 'Graphic'} 
                        style={{ 
                          width: layer.width || 80, 
                          height: 'auto',
                          pointerEvents: 'none'
                        }} 
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Bottom Controls */}
      <div className="canvas-controls">
        <div className="control-group">
          <button 
            className={`control-btn ${!canUndo ? 'disabled' : ''}`}
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </button>
          <button 
            className={`control-btn ${!canRedo ? 'disabled' : ''}`}
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={18} />
          </button>
        </div>
        <div className="control-divider"></div>
        <button 
          className="control-btn danger"
          onClick={clearAll}
          disabled={layers.length === 0}
          title="Clear All"
        >
          <Trash2 size={18} />
          <span>Clear</span>
        </button>
      </div>
      
      {/* Pan instructions */}
      {tool === 'pan' && (
        <div className="pan-hint">
          Click and drag to move canvas
        </div>
      )}
    </div>
  );
};

export default Canvas;
