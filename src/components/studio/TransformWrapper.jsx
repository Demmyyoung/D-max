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
  const [activeGuides, setActiveGuides] = useState([]);
  const [naturalSize, setNaturalSize] = useState({ width: null, height: null });
  const cropDragStart = useRef(null);
  const blockRef = useRef(null);
  const imageRef = useRef(null);
  
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
      startImageScale: imageScale,
      aspectRatio: block.type === 'image' && naturalSize.width 
        ? naturalSize.width / naturalSize.height 
        : localPos.width / localPos.height
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

    // Images always resize proportionally on corners to avoid empty frame space
    const isImageCorner = block.type === 'image' && 
      ['nw', 'ne', 'sw', 'se'].includes(resizeHandle);
    const shouldBeProportional = proportional || isImageCorner;

    // Calculate changes based on which handle was grabbed
    if (resizeHandle.includes('e')) {
      newWidth = Math.max(20, startDrag.current.width + deltaX);
      if (shouldBeProportional) newHeight = newWidth / startDrag.current.aspectRatio;
    }
    if (resizeHandle.includes('s')) {
      newHeight = Math.max(20, startDrag.current.height + deltaY);
      if (shouldBeProportional) newWidth = newHeight * startDrag.current.aspectRatio;
    }
    if (resizeHandle.includes('w')) {
      const maxX = startDrag.current.x + startDrag.current.width - 20;
      newX = Math.min(maxX, startDrag.current.x + deltaX);
      newWidth = startDrag.current.width - (newX - startDrag.current.x);
      
      if (shouldBeProportional) {
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
      
      if (shouldBeProportional) {
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
    if (shouldBeProportional) {
       if (resizeHandle === 'sw') {
         // bottom-left: height grew, width must grow left
         newX = startDrag.current.x + (startDrag.current.width - newWidth);
       }
    }

    // SPECIAL CASE: For images, corner drags scale the imageScale too
    if (isImageCorner) {
      const scaleFactor = newWidth / startDrag.current.width;
      const nextScale = startDrag.current.startImageScale * scaleFactor;
      setImageScale(nextScale);
    }

    // ── Snapping Logic ──────────────────────────────────────────────────
    const SNAP_THRESHOLD = 5;
    const canvasCX = WORKSPACE_SIZE / 2;
    const canvasCY = WORKSPACE_SIZE / 2;
    const newGuides = [];

    // Snap points (workspace center + other blocks)
    const snapXPts = [canvasCX];
    const snapYPts = [canvasCY];
    storeBlocks.forEach(other => {
      if (other.id === block.id) return;
      snapXPts.push(other.x, other.x + other.width / 2, other.x + other.width);
      snapYPts.push(other.y, other.y + other.height / 2, other.y + other.height);
    });

    // 1. Horizontal Snapping (X/Width)
    let bestSnapX = null;
    let minDistX = SNAP_THRESHOLD;
    const currentEdgesX = [newX, newX + newWidth / 2, newX + newWidth];
    
    snapXPts.forEach(sx => {
      currentEdgesX.forEach((me, i) => {
        const d = Math.abs(me - sx);
        if (d < minDistX) {
          minDistX = d;
          bestSnapX = { snap: sx, edge: me, type: i === 0 ? 'left' : i === 1 ? 'center' : 'right' };
        }
      });
    });

    if (bestSnapX) {
      const delta = bestSnapX.snap - bestSnapX.edge;
      if (resizeHandle.includes('w')) {
        newX += delta;
        newWidth -= delta;
      } else if (resizeHandle.includes('e')) {
        newWidth += delta;
      } else if (resizeHandle === 'n' || resizeHandle === 's') {
        // For N/S pills, alignment might move the whole block or just keep it centered
        newX += delta;
      }
      newGuides.push({ type: 'v', pos: bestSnapX.snap });
    }

    // 2. Vertical Snapping (Y/Height)
    let bestSnapY = null;
    let minDistY = SNAP_THRESHOLD;
    const currentEdgesY = [newY, newY + newHeight / 2, newY + newHeight];
    
    snapYPts.forEach(sy => {
      currentEdgesY.forEach((me, i) => {
        const d = Math.abs(me - sy);
        if (d < minDistY) {
          minDistY = d;
          bestSnapY = { snap: sy, edge: me, type: i === 0 ? 'top' : i === 1 ? 'center' : 'bottom' };
        }
      });
    });

    if (bestSnapY) {
      const delta = bestSnapY.snap - bestSnapY.edge;
      if (resizeHandle.includes('n')) {
        newY += delta;
        newHeight -= delta;
      } else if (resizeHandle.includes('s')) {
        newHeight += delta;
      } else if (resizeHandle === 'w' || resizeHandle === 'e') {
        newY += delta;
      }
      newGuides.push({ type: 'h', pos: bestSnapY.snap });
    }

    setActiveGuides(newGuides);

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

    // Position tooltip relative to the viewport/mouse (accounting for zoom)
    const rect = blockRef.current?.parentElement?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        visible: true,
        text: `${widthCm} × ${heightCm} cm`,
        x: (e.clientX - rect.left) / camera.zoom + 15 / camera.zoom,
        y: (e.clientY - rect.top) / camera.zoom + 15 / camera.zoom
      });
    }
  };

  const handlePointerUp = (e) => {
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setTooltip({ ...tooltip, visible: false });
      setActiveGuides([]);
      
      // Commit size and imageScale to store
      if (localPos) {
         useDesignStore.getState().updateBlock(block.id, {
           x: localPos.x,
           y: localPos.y,
           width: localPos.width,
           height: localPos.height,
           imageScale: imageScale,
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
    // Save offset and scale to store
    useDesignStore.getState().updateBlock(block.id, {
      imageOffsetX: imageOffset.x,
      imageOffsetY: imageOffset.y,
      imageScale: imageScale,
    });
  };

  const handleImageLoad = (e) => {
    const w = e.target.naturalWidth;
    const h = e.target.naturalHeight;
    setNaturalSize({ width: w, height: h });
    // Update startDrag aspectRatio to match actual image aspect ratio
    // This ensures proportional resize uses the real image ratio
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
    setImageScale(block.imageScale || 1);
  }, [block.id, block.imageOffsetX, block.imageOffsetY, block.imageScale]);

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
          outline: 'none',
          boxShadow: 'none',
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
              ref={imageRef}
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
                width: naturalSize.width ? `${naturalSize.width}px` : 'auto',
                height: naturalSize.height ? `${naturalSize.height}px` : 'auto',
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(calc(-50% + ${imageOffset.x}px), calc(-50% + ${imageOffset.y}px)) scale(${imageScale})`,
                objectFit: 'none',
                pointerEvents: isCropMode ? 'auto' : 'none',
                userSelect: 'none',
              }}
              onLoad={handleImageLoad}
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

  // Snapping guides logic moved to handlePointerMove for better performance and block-to-block support

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
          outline: '1px solid #ffffff',
          outlineOffset: '1px',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.15)',
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
              ref={imageRef}
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
                width: naturalSize.width ? `${naturalSize.width}px` : 'auto',
                height: naturalSize.height ? `${naturalSize.height}px` : 'auto',
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(calc(-50% + ${imageOffset.x}px), calc(-50% + ${imageOffset.y}px)) scale(${imageScale})`,
                objectFit: 'none',
                pointerEvents: isCropMode ? 'auto' : 'none',
                userSelect: 'none',
              }}
              onLoad={handleImageLoad}
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
          <div style={{
            position: 'absolute',
            top: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            zIndex: 300,
          }}>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsCropMode(false)}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '100px',
                padding: '6px 16px',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              ✓ Done
            </button>
            <div style={{
              background: 'rgba(0, 0, 0, 0.85)',
              padding: '6px 12px',
              borderRadius: '100px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(10px)',
            }}>
              <span style={{ color: 'white', fontSize: '10px', fontWeight: 600 }}>Zoom</span>
              <input 
                type="range"
                min="0.5"
                max="3"
                step="0.01"
                value={imageScale}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const newScale = parseFloat(e.target.value);
                  setImageScale(newScale);
                  useDesignStore.getState().updateBlock(block.id, {
                    imageScale: newScale
                  });
                }}
                style={{
                  width: '80px',
                  height: '4px',
                  accentColor: '#4f46e5',
                  cursor: 'pointer',
                }}
              />
              <span style={{ color: 'white', fontSize: '10px', fontWeight: 600, minWidth: '35px', textAlign: 'right' }}>
                {Math.round(imageScale * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* 8 Handles — Unified visibility logic */}
        {!isCropMode && (
          (isResizing 
            ? [resizeHandle] 
            : (block.type === 'image' 
                ? ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'] 
                : ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'])
          ).map(h => {
            const isPill = block.type === 'image' && ['n', 's', 'w', 'e'].includes(h);
            return (
              <div 
                key={h}
                className={isPill ? `transform-handle-pill ${h}` : `transform-handle ${h}`}
                onPointerDown={(e) => startResize(e, h)}
              />
            );
          })
        )}
      </div>

      {/* Smart Guides rendered relative to workspace */}
      {activeGuides.map((g, i) => (
        <div 
          key={i} 
          className={`smart-guide ${g.type === 'v' ? 'vertical' : 'horizontal'}`} 
          style={{ [g.type === 'v' ? 'left' : 'top']: g.pos }} 
        />
      ))}

      {/* Tooltip */}
      {tooltip.visible && (
         <div 
           className="transform-tooltip"
           style={{ 
             left: tooltip.x, 
             top: tooltip.y,
             transform: `scale(${1 / camera.zoom}) translate(15px, 15px)`,
             transformOrigin: '0 0'
           }}
         >
           {tooltip.text}
         </div>
      )}
    </>
  );
};

export default TransformWrapper;
