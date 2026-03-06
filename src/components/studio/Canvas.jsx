import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Redo2, Trash2, Hand, MousePointer, Plus, Minus, RotateCcw, Copy, Edit3 } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';

const Canvas = () => {
  const { 
    activeGarment, 
    layers, 
    selectLayer, 
    selectedLayerId, 
    updateLayer,
    deleteLayer,
    addLayer,
    deselectAll,
    undo,
    redo,
    clearAll,
    canUndo,
    canRedo
  } = useStudio();
  
  const containerRef = useRef(null);
  
  // Camera State Management (x, y, scale)
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const [tool, setTool] = useState('select');
  const [isPanning, setIsPanning] = useState(false);
  
  // Right Click Menu and Editing State
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, layerId: null });
  const [editingLayerId, setEditingLayerId] = useState(null);
  
  // Use a ref to track last mouse position for delta calculations without re-renders
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Close context menu on any global click
  const closeContextMenu = useCallback(() => {
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false });
    }
  }, [contextMenu]);

  useEffect(() => {
    window.addEventListener('click', closeContextMenu);
    return () => window.removeEventListener('click', closeContextMenu);
  }, [closeContextMenu]);

  // Zoom handlers
  const handleZoomIn = () => setCamera(prev => ({ ...prev, scale: Math.min(prev.scale + 0.25, 3) }));
  const handleZoomOut = () => setCamera(prev => ({ ...prev, scale: Math.max(prev.scale - 0.25, 0.25) }));
  const handleResetView = () => setCamera({ x: 0, y: 0, scale: 1 });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'h' || e.key === 'H') setTool('pan');
      if (e.key === 'v' || e.key === 'V') setTool('select');
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleResetView();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId && !editingLayerId) {
          deleteLayer(selectedLayerId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, deleteLayer, editingLayerId]);

  const handleCanvasClick = (e) => {
    // Only deselect if we click directly on the whiteboard background
    if (e.target.classList.contains('whiteboard') || e.target.classList.contains('canvas-content')) {
      deselectAll();
      setEditingLayerId(null);
    }
  };

  const handleDragEnd = (layerId, info) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    // Convert screen pixel delta to world space based on zoom
    const newX = layer.x + info.offset.x / camera.scale;
    const newY = layer.y + info.offset.y / camera.scale;
    
    updateLayer(layerId, { x: newX, y: newY });
  };

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setCamera(prev => {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.25, Math.min(3, prev.scale + delta));
        return { ...prev, scale: newScale };
      });
    }
  }, []);
  
  // Attach wheel listener non-passively to prevent browser zooming on trackpads
  useEffect(() => {
    const currentRef = containerRef.current;
    if (currentRef) {
      currentRef.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('wheel', handleWheel);
      }
    };
  }, [handleWheel]);

  // Infinite Pan handlers
  const handleMouseDown = useCallback((e) => {
    // Start panning on middle mouse button (1) or if pan tool is active (0 = left click)
    // Avoid preventing default on form elements and explicitly inside our layers
    if (e.target.tagName === 'INPUT') return;
    
    if (tool === 'pan' && e.button === 0 || e.button === 1) { 
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault(); // Prevent text selection/drag native behaviour
    }
  }, [tool]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;

    // Calculate mouse movement delta
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    // Update camera. Note: We divide by scale so pacing is 1:1 regardless of zoom level.
    // We add to x/y because panning "right" means moving the camera "left" over the world.
    setCamera(prev => ({
      ...prev,
      x: prev.x + (deltaX / prev.scale),
      y: prev.y + (deltaY / prev.scale)
    }));
    
    // Store new position
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isPanning]);

  const handleMouseUpOrLeave = useCallback(() => {
    setIsPanning(false);
  }, []);
  
  const handleContextMenuEvent = useCallback((e, layerId) => {
    e.preventDefault();
    e.stopPropagation();
    selectLayer(layerId);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      layerId
    });
  }, [selectLayer]);

  const handleDuplicateLayer = () => {
    const layerToDuplicate = layers.find(l => l.id === contextMenu.layerId);
    if (!layerToDuplicate) return;
    
    // We omit the id so addLayer will generate a new one, but we duplicate the properties
    const { id, ...properties } = layerToDuplicate;
    // slightly offset it so it doesn't appear exactly on top
    addLayer({ ...properties, x: properties.x + 20, y: properties.y + 20 });
  };

  return (
    <div 
      className="studio-canvas" 
      onClick={handleCanvasClick}
      onContextMenu={(e) => {
        // Prevent default context menu on the whole canvas if we want
        e.preventDefault();
        closeContextMenu();
      }}
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
            {Math.round(camera.scale * 100)}%
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
      
      {/* Infinite Canvas Area */}
      <div 
        ref={containerRef}
        className={`whiteboard ${tool === 'pan' ? 'pan-mode' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        style={{
          cursor: tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'default',
          overflow: 'hidden', // Crucial: acts as the window framing the world
          touchAction: 'none' // Prevent mobile swipe refresh over canvas
        }}
      >
        {/* The GPU Accelerated Camera Translation Layer */}
        <div 
          className="canvas-content"
          style={{ 
            // Core Formula: ScreenPos = (WorldPos - (-CameraPos)) * Scale
            transform: `scale(${camera.scale}) translate(${camera.x}px, ${camera.y}px)`,
            transformOrigin: '50% 50%', // Zoom to center of the canvas window
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            willChange: 'transform' // Tell the browser to prioritize GPU layer for butter smooth scrolling
          }}
        >
          {/* World Items Container */}
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
              
              {/* Design Bounds Area */}
              <div className="design-area">
                {layers.map(layer => (
                  <motion.div 
                    key={layer.id}
                    className={`layer-item ${selectedLayerId === layer.id ? 'selected' : ''}`}
                    style={{
                      position: 'absolute', // World coordinates
                      left: layer.x,
                      top: layer.y,
                      opacity: layer.opacity / 100,
                      transform: `scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                      color: layer.color,
                      fontSize: layer.fontSize,
                      fontFamily: layer.fontFamily,
                      transformOrigin: 'center center',
                      zIndex: selectedLayerId === layer.id ? 10 : 1
                    }}
                    drag={tool === 'select' && editingLayerId !== layer.id}
                    dragMomentum={false}
                    dragElastic={0}
                    onDragEnd={(event, info) => handleDragEnd(layer.id, info)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tool === 'select') selectLayer(layer.id);
                    }}
                    onContextMenu={(e) => handleContextMenuEvent(e, layer.id)}
                    whileHover={{ cursor: tool === 'select' && editingLayerId !== layer.id ? 'grab' : 'default' }}
                    whileDrag={{ cursor: 'grabbing', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}
                  >
                    {layer.type === 'text' && (
                      editingLayerId === layer.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={layer.content}
                          onChange={(e) => updateLayer(layer.id, { content: e.target.value })}
                          onBlur={() => setEditingLayerId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingLayerId(null);
                          }}
                          onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking input
                          style={{
                            background: 'transparent',
                            border: `1px dashed ${layer.color === '#FFFFFF' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}`,
                            color: 'inherit',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            outline: 'none',
                            padding: '0 4px',
                            margin: '0',
                            width: `${Math.max(1, layer.content.length)}ch`,
                            minWidth: '2ch',
                            textAlign: 'center',
                            display: 'block'
                          }}
                        />
                      ) : (
                        <span 
                          onDoubleClick={(e) => {
                            if (tool === 'select') {
                              e.stopPropagation();
                              setEditingLayerId(layer.id);
                            }
                          }}
                          style={{ whiteSpace: 'pre', display: 'block', padding: '0 4px' }}
                        >
                          {layer.content}
                        </span>
                      )
                    )}
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
      
      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="context-menu"
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 9999,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '6px',
              minWidth: '160px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {layers.find(l => l.id === contextMenu.layerId)?.type === 'text' && (
              <button
                className="context-menu-item"
                onClick={() => {
                  setEditingLayerId(contextMenu.layerId);
                  closeContextMenu();
                }}
              >
                <Edit3 size={14} />
                <span>Edit Text</span>
              </button>
            )}
            
            <button
              className="context-menu-item"
              onClick={() => {
                handleDuplicateLayer();
                closeContextMenu();
              }}
            >
              <Copy size={14} />
              <span>Duplicate</span>
            </button>
            
            <div className="context-menu-divider" />
            
            <button
              className="context-menu-item danger"
              onClick={() => {
                deleteLayer(contextMenu.layerId);
                closeContextMenu();
              }}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
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

