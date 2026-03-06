import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDesignStore } from '../../store/useDesignStore';
import './TransformWrapper.css';

const PIXELS_PER_CM = 38; 

const TransformWrapper = ({ 
  block, 
  children, 
  localPos, 
  setLocalBlocks, 
  isSelected, 
  activeTool,
  camera,
  storeBlocks,
  WORKSPACE_SIZE = 5000,
  isDragging = false
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
  const blockRef = useRef(null);
  
  // Track starting bounds for resize math
  const startDrag = useRef(null);

  const startResize = (e, handlePos) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handlePos);
    
    startDrag.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: localPos.x,
      y: localPos.y,
      width: localPos.width,
      height: localPos.height,
      aspectRatio: localPos.width / localPos.height
    };
    
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isResizing || !isSelected || activeTool !== 'select' || !startDrag.current) return;

    const deltaX = (e.clientX - startDrag.current.mouseX) / camera.zoom;
    const deltaY = (e.clientY - startDrag.current.mouseY) / camera.zoom;

    let newX = startDrag.current.x;
    let newY = startDrag.current.y;
    let newWidth = startDrag.current.width;
    let newHeight = startDrag.current.height;

    // Apply free-form scaling by default (Canva-style), override with Shift for strict proportional
    const proportional = e.shiftKey; 

    // Calculate changes based on which handle was grabbed
    if (resizeHandle.includes('e')) {
      newWidth = Math.max(20, startDrag.current.width + deltaX);
      if (proportional) newHeight = newWidth / startDrag.current.aspectRatio;
    }
    if (resizeHandle.includes('s')) {
      newHeight = Math.max(20, startDrag.current.height + deltaY);
      if (proportional) newWidth = newHeight * startDrag.current.aspectRatio;
    }
    if (resizeHandle.includes('w')) {
      const maxX = startDrag.current.x + startDrag.current.width - 20;
      newX = Math.min(maxX, startDrag.current.x + deltaX);
      newWidth = startDrag.current.width - (newX - startDrag.current.x);
      
      if (proportional) {
        newHeight = newWidth / startDrag.current.aspectRatio;
        if (resizeHandle === 'w') {
           // If dragging middle-west, adjust Y to keep it centered
           newY = startDrag.current.y + (startDrag.current.height - newHeight) / 2;
        }
      }
    }
    if (resizeHandle.includes('n')) {
      const maxY = startDrag.current.y + startDrag.current.height - 20;
      newY = Math.min(maxY, startDrag.current.y + deltaY);
      newHeight = startDrag.current.height - (newY - startDrag.current.y);
      
      if (proportional) {
        newWidth = newHeight * startDrag.current.aspectRatio;
        if (resizeHandle === 'n') {
           // If dragging middle-north, adjust X to keep it centered
           newX = startDrag.current.x + (startDrag.current.width - newWidth) / 2;
        } else if (resizeHandle === 'ne') {
           // Top Right corner: width grows to the right, so X doesn't change from proportional logic on height
        } else if (resizeHandle === 'nw') {
           newX = startDrag.current.x + (startDrag.current.width - newWidth);
        }
      }
    }
    
    // Additional proportional adjustments for corners where width wasn't the primary driver
    if (proportional) {
       if (resizeHandle === 'sw') {
         // bottom-left: height grew, width must grow left
         newX = startDrag.current.x + (startDrag.current.width - newWidth);
       }
    }

    setLocalBlocks(prev => ({
      ...prev,
      [block.id]: {
        ...prev[block.id],
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      }
    }));

    // Tooltip - Show physical dimensions
    const widthCm = (newWidth / PIXELS_PER_CM).toFixed(1);
    const heightCm = (newHeight / PIXELS_PER_CM).toFixed(1);

    // Position tooltip relative to the viewport/mouse
    const rect = blockRef.current?.parentElement?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        visible: true,
        text: `${widthCm} × ${heightCm} cm`,
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15
      });
    }
  };

  const handlePointerUp = (e) => {
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setTooltip({ ...tooltip, visible: false });
      
      // Commit size to store
      if (localPos) {
         useDesignStore.getState().updateBlock(block.id, {
           x: localPos.x,
           y: localPos.y,
           width: localPos.width,
           height: localPos.height
         });
      }

      if (e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
    }
  };

  if (!isSelected || activeTool !== 'select') {
    return (
      <div 
        ref={blockRef}
        data-block-id={block.id}
        className={`canvas-block${isDragging ? ' is-dragging' : ''}`}
        style={{
          width: `${localPos.width}px`,
          height: `${localPos.height}px`,
          transform: `translate3d(${localPos.x}px, ${localPos.y}px, 0) rotate(${localPos.rotation}deg)`,
          transformOrigin: '50% 50%',
          opacity: block.opacity || 1,
          willChange: 'transform',
          zIndex: isDragging ? 200 : 50,
        }}
      >
        {children}
      </div>
    );
  }

  // Calculate guide positions for rendering (simplified center guides for now)
  const isCenterAlignedX = Math.abs((localPos.x + localPos.width/2) - (WORKSPACE_SIZE/2)) < 5;
  const isCenterAlignedY = Math.abs((localPos.y + localPos.height/2) - (WORKSPACE_SIZE/2)) < 5;

  return (
    <>
      <motion.div
        ref={blockRef}
        data-block-id={block.id}
        className={`canvas-block selected transform-wrapper${isDragging ? ' is-dragging' : ''}`}
        initial={{ outlineColor: 'transparent', outlineWidth: 0 }}
        animate={{ outlineColor: '#E2E8F0', outlineWidth: 1 }}
        style={{
          width: `${localPos.width}px`,
          height: `${localPos.height}px`,
          transform: `translate3d(${localPos.x}px, ${localPos.y}px, 0) rotate(${localPos.rotation}deg)`,
          transformOrigin: '50% 50%',
          opacity: block.opacity || 1,
          outlineStyle: 'solid',
          willChange: 'transform',
          zIndex: isDragging ? 200 : 50,
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {children}

        {/* 8 Handles */}
        <div className="transform-handle nw" onPointerDown={(e) => startResize(e, 'nw')} />
        <div className="transform-handle n" onPointerDown={(e) => startResize(e, 'n')} />
        <div className="transform-handle ne" onPointerDown={(e) => startResize(e, 'ne')} />
        <div className="transform-handle e" onPointerDown={(e) => startResize(e, 'e')} />
        <div className="transform-handle se" onPointerDown={(e) => startResize(e, 'se')} />
        <div className="transform-handle s" onPointerDown={(e) => startResize(e, 's')} />
        <div className="transform-handle sw" onPointerDown={(e) => startResize(e, 'sw')} />
        <div className="transform-handle w" onPointerDown={(e) => startResize(e, 'w')} />
      </motion.div>

      {/* Smart Guides rendered relative to workspace */}
      {isResizing && isCenterAlignedX && (
        <div className="smart-guide vertical" style={{ left: WORKSPACE_SIZE / 2 }} />
      )}
      {isResizing && isCenterAlignedY && (
        <div className="smart-guide horizontal" style={{ top: WORKSPACE_SIZE / 2 }} />
      )}

      {/* Tooltip */}
      {tooltip.visible && (
         <div 
           className="transform-tooltip"
           style={{ left: tooltip.x, top: tooltip.y }}
         >
           {tooltip.text}
         </div>
      )}
    </>
  );
};

export default TransformWrapper;
