import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Redo2, Trash2, Hand, MousePointer, Plus, Minus, RotateCcw, ZoomIn } from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import { useStudio } from '../../context/StudioContext';
import KonvaBlock from './KonvaBlock';

/**
 * High-performance Konva-based canvas with direct manipulation
 * Replaces framer-motion drag with native canvas transforms
 */
const KonvaCanvas = () => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  
  // Zustand store for blocks
  const blocks = useDesignStore((state) => state.blocks);
  const selectedId = useDesignStore((state) => state.selectedId);
  const canvasColor = useDesignStore((state) => state.canvasColor);
  const selectBlock = useDesignStore((state) => state.selectBlock);
  const deselectAll = useDesignStore((state) => state.deselectAll);
  const clearAll = useDesignStore((state) => state.clearAll);
  
  // Legacy context for garment (backward compatibility)
  const { activeGarment } = useStudio();
  
  // Canvas state
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState('select');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [garmentImage, setGarmentImage] = useState(null);

  // Load garment image
  useEffect(() => {
    if (activeGarment?.image) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = activeGarment.image;
      img.onload = () => setGarmentImage(img);
    }
  }, [activeGarment?.image]);

  // Resize handler
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setStageSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'h' || e.key === 'H') setTool('pan');
      if (e.key === 'v' || e.key === 'V') setTool('select');
      if (e.key === 'Escape') deselectAll();
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleResetView();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && document.activeElement.tagName !== 'INPUT') {
          useDesignStore.getState().deleteBlock(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deselectAll]);

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
    }
  }, []);

  // Pan handlers
  const handleMouseDown = (e) => {
    if (tool === 'pan' || e.button === 1) {
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

  const handleMouseUp = () => setIsPanning(false);

  // Stage click handler
  const handleStageClick = (e) => {
    if (e.target === e.target.getStage() || e.target.name() === 'background') {
      deselectAll();
    }
  };

  // Calculate garment position (centered)
  const garmentWidth = 350;
  const garmentHeight = 420;
  const garmentX = (stageSize.width / zoom - garmentWidth) / 2;
  const garmentY = (stageSize.height / zoom - garmentHeight) / 2;
  
  // Define Printable Area (A smaller rectangle inside the garment)
  const printablePadding = 30; // 30px padding
  const printableWidth = garmentWidth - (printablePadding * 2);
  const printableHeight = garmentHeight - (printablePadding * 2);
  const printableX = garmentX + printablePadding;
  const printableY = garmentY + printablePadding;
  
  // Center Lines for Snapping
  const centerX = printableX + (printableWidth / 2);
  const centerY = printableY + (printableHeight / 2);

  return (
    <div 
      className="studio-canvas" 
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
            title="Pan (H)"
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
      
      {/* Konva Stage */}
      <div 
        ref={containerRef}
        className={`whiteboard ${tool === 'pan' ? 'pan-mode' : ''} ${isPanning ? 'panning' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <motion.div
          className="canvas-content"
          style={{ 
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={zoom}
            scaleY={zoom}
            onClick={handleStageClick}
            onTap={handleStageClick}
            style={{ cursor: tool === 'pan' ? 'grab' : 'default' }}
          >
            <Layer>
              {/* Canvas Background */}
              <Rect
                name="background"
                x={0}
                y={0}
                width={stageSize.width / zoom}
                height={stageSize.height / zoom}
                fill="#f5f5f5"
              />
              
              {/* Garment Preview Area */}
              <Rect
                x={garmentX - 10}
                y={garmentY - 10}
                width={garmentWidth + 20}
                height={garmentHeight + 20}
                fill={canvasColor}
                cornerRadius={8}
                shadowColor="rgba(0,0,0,0.1)"
                shadowBlur={20}
                shadowOffset={{ x: 0, y: 4 }}
              />
              
              {/* Garment Image */}
              {garmentImage && (
                <KonvaImage
                  image={garmentImage}
                  x={garmentX}
                  y={garmentY}
                  width={garmentWidth}
                  height={garmentHeight}
                  listening={false}
                />
              )}
              
              {/* Whitesmoke Overlay - Masking non-printable area */}
              {/* Top border */}
              <Rect
                x={garmentX}
                y={garmentY}
                width={garmentWidth}
                height={printablePadding}
                fill="rgba(245, 245, 245, 0.6)"
                listening={false}
                cornerRadius={[8, 8, 0, 0]}
              />
              {/* Bottom border */}
              <Rect
                x={garmentX}
                y={printableY + printableHeight}
                width={garmentWidth}
                height={printablePadding}
                fill="rgba(245, 245, 245, 0.6)"
                listening={false}
                cornerRadius={[0, 0, 8, 8]}
              />
              {/* Left border */}
              <Rect
                x={garmentX}
                y={printableY}
                width={printablePadding}
                height={printableHeight}
                fill="rgba(245, 245, 245, 0.6)"
                listening={false}
              />
              {/* Right border */}
              <Rect
                x={printableX + printableWidth}
                y={printableY}
                width={printablePadding}
                height={printableHeight}
                fill="rgba(245, 245, 245, 0.6)"
                listening={false}
              />
              
              {/* Printable Area border hint */}
              <Rect
                x={printableX}
                y={printableY}
                width={printableWidth}
                height={printableHeight}
                stroke="rgba(0,0,0,0.1)"
                strokeWidth={1}
                dash={[5, 5]}
                listening={false}
              />
              
              {/* Design Blocks */}
              {blocks.map((block) => (
                <KonvaBlock
                  key={block.id}
                  block={{
                    ...block,
                    // Offset blocks relative to garment design area initially
                    x: block.x || centerX,
                    y: block.y || centerY,
                  }}
                  isSelected={selectedId === block.id}
                  onSelect={() => selectBlock(block.id)}
                  bounds={{
                    x: printableX,
                    y: printableY,
                    width: printableWidth,
                    height: printableHeight
                  }}
                  centerLines={{ centerX, centerY }}
                />
              ))}
            </Layer>
          </Stage>
        </motion.div>
      </div>
      
      {/* Bottom Controls */}
      <div className="canvas-controls">
        <div className="control-group">
          <button 
            className="control-btn"
            onClick={() => useDesignStore.getState().undo?.()}
            title="Undo (Ctrl+Z)"
            disabled
          >
            <Undo2 size={18} />
          </button>
          <button 
            className="control-btn"
            onClick={() => useDesignStore.getState().redo?.()}
            title="Redo (Ctrl+Y)"
            disabled
          >
            <Redo2 size={18} />
          </button>
        </div>
        <div className="control-divider"></div>
        <button 
          className="control-btn danger"
          onClick={clearAll}
          disabled={blocks.length === 0}
          title="Clear All"
        >
          <Trash2 size={18} />
          <span>Clear</span>
        </button>
      </div>
      
      {/* Pan hint */}
      {tool === 'pan' && (
        <div className="pan-hint">
          Click and drag to move canvas
        </div>
      )}
    </div>
  );
};

export default KonvaCanvas;
