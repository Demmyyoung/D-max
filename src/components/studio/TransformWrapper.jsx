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
  const [isCropMode, setIsCropMode] = useState(false);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const cropDragStart = useRef(null);
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

  const handleDoubleClick = (e) => {
    if (block.type !== 'image') return;
    e.stopPropagation();
    setIsCropMode(true);
  };

  const handleCropPointerDown = (e) => {
    if (!isCropMode) return;
    e.stopPropagation();
    cropDragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startOffsetX: imageOffset.x,
      startOffsetY: imageOffset.y,
    };
    e.target.setPointerCapture(e.pointerId);
  };

  const handleCropPointerMove = (e) => {
    if (!isCropMode || !cropDragStart.current) return;
    const deltaX = (e.clientX - cropDragStart.current.mouseX) / camera.zoom;
    const deltaY = (e.clientY - cropDragStart.current.mouseY) / camera.zoom;
    setImageOffset({
      x: cropDragStart.current.startOffsetX + deltaX,
      y: cropDragStart.current.startOffsetY + deltaY,
    });
  };

  const handleCropPointerUp = (e) => {
    if (!cropDragStart.current) return;
    cropDragStart.current = null;
    if (e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
    // Save offset to store
    useDesignStore.getState().updateBlock(block.id, {
      imageOffsetX: imageOffset.x,
      imageOffsetY: imageOffset.y,
    });
  };

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (isCropMode && blockRef.current && !blockRef.current.contains(e.target)) {
        setIsCropMode(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isCropMode]);

  React.useEffect(() => {
    setImageOffset({
      x: block.imageOffsetX || 0,
      y: block.imageOffsetY || 0,
    });
  }, [block.id, block.imageOffsetX, block.imageOffsetY]);

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
        {block.type === 'image' ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              borderRadius: 'inherit',
              cursor: isCropMode ? 'move' : 'inherit',
            }}
          >
            <img
              data-block-id={block.id}
              src={block.url}
              alt={block.name || 'image'}
              onDoubleClick={handleDoubleClick}
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerUp}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${imageOffset.x}px), calc(-50% + ${imageOffset.y}px)) scale(${imageScale})`,
                minWidth: '100%',
                minHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'none',
                pointerEvents: isCropMode ? 'auto' : 'none',
                userSelect: 'none',
                maxWidth: 'none',
              }}
            />
            {/* Crop mode overlay — darkens the clipped areas */}
            {isCropMode && (
              <div style={{
                position: 'absolute',
                inset: 0,
                boxShadow: 'inset 0 0 0 3px #000',
                borderRadius: 'inherit',
                pointerEvents: 'none',
                zIndex: 10,
              }} />
            )}
          </div>
        ) : children}
      </div>
    );
  }

  // Calculate guide positions for rendering (simplified center guides for now)
  const isCenterAlignedX = Math.abs((localPos.x + localPos.width/2) - (WORKSPACE_SIZE/2)) < 5;
  const isCenterAlignedY = Math.abs((localPos.y + localPos.height/2) - (WORKSPACE_SIZE/2)) < 5;

  return (
    <>
      <div
        ref={blockRef}
        data-block-id={block.id}
        className={`canvas-block selected transform-wrapper${isDragging ? ' is-dragging' : ''}`}
        style={{
          width: `${localPos.width}px`,
          height: `${localPos.height}px`,
          transform: `translate3d(${localPos.x}px, ${localPos.y}px, 0) rotate(${localPos.rotation}deg)`,
          transformOrigin: '50% 50%',
          opacity: block.opacity || 1,
          willChange: 'transform',
          zIndex: isDragging ? 200 : 50,
          outline: '1px solid rgba(0, 0, 0, 0.25)',
          boxShadow: 'none',
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {block.type === 'image' ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              borderRadius: 'inherit',
              cursor: isCropMode ? 'move' : 'inherit',
            }}
          >
            <img
              data-block-id={block.id}
              src={block.url}
              alt={block.name || 'image'}
              onDoubleClick={handleDoubleClick}
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerUp}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${imageOffset.x}px), calc(-50% + ${imageOffset.y}px)) scale(${imageScale})`,
                minWidth: '100%',
                minHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'none',
                pointerEvents: isCropMode ? 'auto' : 'none',
                userSelect: 'none',
                maxWidth: 'none',
              }}
            />
            {/* Crop mode overlay — darkens the clipped areas */}
            {isCropMode && (
              <div style={{
                position: 'absolute',
                inset: 0,
                boxShadow: 'inset 0 0 0 3px #000',
                borderRadius: 'inherit',
                pointerEvents: 'none',
                zIndex: 10,
              }} />
            )}
          </div>
        ) : children}

        {isCropMode && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setIsCropMode(false)}
            style={{
              position: 'absolute',
              top: '-36px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '100px',
              padding: '6px 16px',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              zIndex: 300,
              whiteSpace: 'nowrap',
            }}
          >
            ✓ Done
          </button>
        )}

        {/* 8 Handles */}
        {!isCropMode && (
          block.type === 'image' ? (
            <>
              <div className="transform-handle-pill w" onPointerDown={(e) => startResize(e, 'w')} />
              <div className="transform-handle-pill e" onPointerDown={(e) => startResize(e, 'e')} />
            </>
          ) : (
            <>
              <div className="transform-handle nw" onPointerDown={(e) => startResize(e, 'nw')} />
              <div className="transform-handle n" onPointerDown={(e) => startResize(e, 'n')} />
              <div className="transform-handle ne" onPointerDown={(e) => startResize(e, 'ne')} />
              <div className="transform-handle e" onPointerDown={(e) => startResize(e, 'e')} />
              <div className="transform-handle se" onPointerDown={(e) => startResize(e, 'se')} />
              <div className="transform-handle s" onPointerDown={(e) => startResize(e, 's')} />
              <div className="transform-handle sw" onPointerDown={(e) => startResize(e, 'sw')} />
              <div className="transform-handle w" onPointerDown={(e) => startResize(e, 'w')} />
            </>
          )
        )}
      </div>

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
