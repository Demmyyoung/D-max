import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MousePointer, Hand, Minus, Plus, RotateCcw, Copy, Trash2, Edit3, Trash } from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import { useStudio } from '../../context/StudioContext';
import TransformWrapper from './TransformWrapper';
import TextTransformWrapper from './TextTransformWrapper';
import FloatingAddButton from './FloatingAddButton';
import ContextToolbar from './ContextToolbar';
import './BigCanvas.css';

const WORKSPACE_SIZE = 5000;
const MAX_ZOOM = 5;

const BigCanvas = () => {
  const containerRef = useRef(null);
  
  // Design Store Integration
  const storeBlocks = useDesignStore((state) => state.blocks);
  const selectedId = useDesignStore((state) => state.selectedId);
  const selectBlock = useDesignStore((state) => state.selectBlock);
  const deselectAll = useDesignStore((state) => state.deselectAll);
  const updateBlock = useDesignStore((state) => state.updateBlock);
  const canvasColor = useDesignStore((state) => state.canvasColor);
  
  // Backwards compatibility with activeGarment
  const { activeGarment } = useStudio();
  
  // Measure container to calculate center offsets and dynamic min zoom
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Dynamic min zoom so we can't zoom out further than fitting the workspace
  const [minZoom, setMinZoom] = useState(0.1);

  // Camera state: x and y represent the center of the viewport in world coordinates
  const [camera, setCamera] = useState({ 
    x: WORKSPACE_SIZE / 2, 
    y: WORKSPACE_SIZE / 2, 
    zoom: 1 
  });
  
  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Block dragging state (local, syncs to store on end drag for performance)
  const [draggingBlock, setDraggingBlock] = useState(null);

  // rAF handle for throttled drag updates
  const dragRafId = useRef(null);
  // Precomputed snap X/Y values (calculated once on pointerDown, not every frame)
  const dragSnapX = useRef([]); // [number]
  const dragSnapY = useRef([]); // [number]
  // World-space starting positions for each selected block (absolute delta math)
  const dragStartPositions = useRef({}); // { id: { x, y, width, height } }
  // Current pending drag position computed in event handler, applied in rAF
  const pendingDragUpdate = useRef(null);
  // Mouse start position for absolute delta calculation
  const dragMouseStart = useRef({ x: 0, y: 0 });
  // Snapshot of camera.zoom at drag start (avoids stale closure)
  const dragZoomRef = useRef(1);
  
  // Touch/Pinch tracking
  const touches = useRef({});
  const initialPinchDist = useRef(null);
  const initialPinchZoom = useRef(null);
  const initialPinchMid = useRef(null);
  
  const [localBlocks, setLocalBlocks] = useState({}); // { id: { x, y, width, height, scale, rotation } }

  // Active snap/alignment guide lines shown during drag
  // Each guide: { type: 'v'|'h', pos: number (world coords) }
  const [activeGuides, setActiveGuides] = useState([]);

  // Tool state (select | pan)
  const [activeTool, setActiveTool] = useState('select');

  // Context Menu and Text Editing state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, blockId: null });
  const [editingBlockId, setEditingBlockId] = useState(null);

  // Close context menu & clear edit mode on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenu]);
  
  // Keyboard shortcuts for tools
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input/textarea
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 'h' || e.key === 'H') setActiveTool('pan');
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        setContainerSize({ width, height });
        
        // Calculate the MIN_ZOOM so that WORKSPACE_SIZE * MIN_ZOOM = max(width, height)
        const newMinZoom = Math.max(width / WORKSPACE_SIZE, height / WORKSPACE_SIZE);
        setMinZoom(newMinZoom);
        
        // Clamp current zoom if we resized and it's now too small
        setCamera(prev => ({
          ...prev,
          zoom: Math.max(newMinZoom, prev.zoom)
        }));
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Sync local blocks with store blocks when store blocks change (e.g. adding new elements)
  useEffect(() => {
    const newLocalBlocks = { ...localBlocks };
    storeBlocks.forEach(block => {
      // Initialize if missing or not currently animating
      if (!newLocalBlocks[block.id] && draggingBlock !== block.id) {
        // If the block is new, place it near the center of the viewport
        if (block.x === null || block.y === null) {
          updateBlock(block.id, {
             x: camera.x - (block.width || 100) / 2,
             y: camera.y - (block.height || 100) / 2
          });
        }
        newLocalBlocks[block.id] = { 
          x: block.x || (camera.x - (block.width || 100) / 2), 
          y: block.y || (camera.y - (block.height || 100) / 2),
          width: block.width || 100,
          height: block.height || 100,
          scale: block.scale || 1,
          rotation: block.rotation || 0
        };
      } else if (draggingBlock !== block.id) {
        // Sync back from store if not interacting locally
        newLocalBlocks[block.id] = { 
           x: block.x, y: block.y, 
           width: block.width, height: block.height, 
           scale: block.scale || 1, rotation: block.rotation || 0 
        };
      }
    });
    
    // Clean up deleted blocks
    Object.keys(newLocalBlocks).forEach(id => {
      if (!storeBlocks.find(b => b.id === id)) {
        delete newLocalBlocks[id];
      }
    });

    setLocalBlocks(newLocalBlocks);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeBlocks]); // Intentionally omitting localBlocks and interaction states to avoid infinite loops

  // Utility to clamp camera within bounds
  // Camera represents the CENTER of the screen in world coordinates
  const clampCamera = (x, y, currentZoom) => {
    // How much of the world does the screen currently see?
    const viewWidthWorld = containerSize.width / currentZoom;
    const viewHeightWorld = containerSize.height / currentZoom;

    // Minimum camera X is where the left edge of the screen touches world X=0
    const minCamX = viewWidthWorld / 2;
    // Maximum camera X is where the right edge of the screen touches world X=WORKSPACE_SIZE
    const maxCamX = WORKSPACE_SIZE - viewWidthWorld / 2;

    const minCamY = viewHeightWorld / 2;
    const maxCamY = WORKSPACE_SIZE - viewHeightWorld / 2;

    return {
      // If we're zoomed out so far that the screen is wider than the workspace (shouldn't happen with our minZoom),
      // we just lock the camera to the center.
      x: maxCamX <= minCamX ? WORKSPACE_SIZE / 2 : Math.max(minCamX, Math.min(maxCamX, x)),
      y: maxCamY <= minCamY ? WORKSPACE_SIZE / 2 : Math.max(minCamY, Math.min(maxCamY, y))
    };
  };

  // Selection box state
  const [selectionBox, setSelectionBox] = useState(null);

  // --- Wheel Zoom ---
  // ... (No changes to handleWheel) ...
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!containerRef.current || containerSize.width === 0) return;

    const zoomSensitivity = 0.002;
    const deltaZoom = -e.deltaY * zoomSensitivity;
    
    setCamera((prev) => {
      const newZoom = Math.max(minZoom, Math.min(MAX_ZOOM, prev.zoom + deltaZoom));
      
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = prev.x + (mouseX - containerSize.width / 2) / prev.zoom;
      const worldY = prev.y + (mouseY - containerSize.height / 2) / prev.zoom;

      const unclampedX = worldX - (mouseX - containerSize.width / 2) / newZoom;
      const unclampedY = worldY - (mouseY - containerSize.height / 2) / newZoom;

      const clamped = clampCamera(unclampedX, unclampedY, newZoom);

      return { x: clamped.x, y: clamped.y, zoom: newZoom };
    });
  }, [containerSize, minZoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // --- Pointer Events (Panning, Dragging, Selecting) ---
  const getPointerWorldPos = (e) => {
     const rect = containerRef.current.getBoundingClientRect();
     const mouseX = e.clientX - rect.left;
     const mouseY = e.clientY - rect.top;
     return {
       x: camera.x + (mouseX - containerSize.width / 2) / camera.zoom,
       y: camera.y + (mouseY - containerSize.height / 2) / camera.zoom
     };
  };

  const handlePointerDown = (e) => {
    // Track pointer
    touches.current[e.pointerId] = { x: e.clientX, y: e.clientY };
    const touchIds = Object.keys(touches.current);

    // Initial Pinch
    if (touchIds.length === 2) {
      const p1 = touches.current[touchIds[0]];
      const p2 = touches.current[touchIds[1]];
      initialPinchDist.current = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      initialPinchZoom.current = camera.zoom;
      
      const rect = containerRef.current.getBoundingClientRect();
      initialPinchMid.current = {
        x: (p1.x + p2.x) / 2 - rect.left,
        y: (p1.y + p2.y) / 2 - rect.top
      };
      return;
    }

    const blockElement = e.target.closest('[data-block-id]');
    const targetId = blockElement ? blockElement.getAttribute('data-block-id') : null;
    
    const isMiddleClick = e.button === 1;
    const isPanTool = activeTool === 'pan';
    
    if (isMiddleClick || isPanTool) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.target.setPointerCapture(e.pointerId);
      return;
    }

    if (targetId) {
      setDraggingBlock(targetId);

      const isAlreadySelected = useDesignStore.getState().selectedIds.includes(targetId);
      if (!isAlreadySelected) {
        if (e.shiftKey) useDesignStore.getState().toggleBlockSelection(targetId);
        else            selectBlock(targetId);
      }

      // ── Precompute snap points once (not every pointermove frame) ──
      const SNAP_PX = 5 / camera.zoom;
      const canvasCX = WORKSPACE_SIZE / 2;
      const canvasCY = WORKSPACE_SIZE / 2;

      const snapX = [canvasCX]; // canvas vertical centre line
      const snapY = [canvasCY]; // canvas horizontal centre line

      storeBlocks.forEach(other => {
        if (other.id === targetId) return;
        snapX.push(other.x, other.x + other.width / 2, other.x + other.width);
        snapY.push(other.y, other.y + other.height / 2, other.y + other.height);
      });

      dragSnapX.current = snapX;
      dragSnapY.current = snapY;
      dragZoomRef.current = camera.zoom;

      // ── Capture starting world positions for all selected blocks ──
      const startPos = {};
      const currentLocalBlocks = localBlocks; // snapshot
      useDesignStore.getState().selectedIds.forEach(id => {
        const lb = currentLocalBlocks[id];
        if (lb) {
          startPos[id] = { x: lb.x, y: lb.y, width: lb.width || 100, height: lb.height || 100 };
        }
      });
      // Also capture the block that was just selected if not yet in startPos
      if (!startPos[targetId]) {
        const lb = currentLocalBlocks[targetId];
        if (lb) startPos[targetId] = { x: lb.x, y: lb.y, width: lb.width || 100, height: lb.height || 100 };
      }
      dragStartPositions.current = startPos;
      dragMouseStart.current = { x: e.clientX, y: e.clientY };

      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.target.setPointerCapture(e.pointerId);
    } else {
      if (!e.shiftKey) deselectAll();
      const worldPos = getPointerWorldPos(e);
      setSelectionBox({
        startX: worldPos.x,
        startY: worldPos.y,
        currentX: worldPos.x,
        currentY: worldPos.y
      });
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (touches.current[e.pointerId]) {
      touches.current[e.pointerId] = { x: e.clientX, y: e.clientY };
    }
    const touchIds = Object.keys(touches.current);

    // Handle Pinch Zoom
    if (touchIds.length === 2 && initialPinchDist.current) {
      const p1 = touches.current[touchIds[0]];
      const p2 = touches.current[touchIds[1]];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const factor = dist / initialPinchDist.current;
      
      const newZoom = Math.max(minZoom, Math.min(MAX_ZOOM, initialPinchZoom.current * factor));
      const mid = initialPinchMid.current;

      setCamera((prev) => {
        const worldX = prev.x + (mid.x - containerSize.width / 2) / prev.zoom;
        const worldY = prev.y + (mid.y - containerSize.height / 2) / prev.zoom;

        const unclampedX = worldX - (mid.x - containerSize.width / 2) / newZoom;
        const unclampedY = worldY - (mid.y - containerSize.height / 2) / newZoom;

        const clamped = clampCamera(unclampedX, unclampedY, newZoom);
        return { x: clamped.x, y: clamped.y, zoom: newZoom };
      });
      return;
    }

    if (isPanning) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;

      setCamera((prev) => {
        const unclampedX = prev.x - deltaX / prev.zoom;
        const unclampedY = prev.y - deltaY / prev.zoom;
        const clamped = clampCamera(unclampedX, unclampedY, prev.zoom);
        return { ...prev, x: clamped.x, y: clamped.y };
      });

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
    else if (draggingBlock) {
      // ── Absolute delta from drag start (no accumulation drift) ──
      const zoom = dragZoomRef.current;
      const totalDeltaX = (e.clientX - dragMouseStart.current.x) / zoom;
      const totalDeltaY = (e.clientY - dragMouseStart.current.y) / zoom;

      const snapXPts = dragSnapX.current;
      const snapYPts = dragSnapY.current;
      const SNAP_PX  = 5 / zoom;

      // Store pending values — will be applied in rAF
      pendingDragUpdate.current = { totalDeltaX, totalDeltaY, snapXPts, snapYPts, SNAP_PX };

      // Schedule exactly one rAF
      if (dragRafId.current === null) {
        dragRafId.current = requestAnimationFrame(() => {
          dragRafId.current = null;
          const p = pendingDragUpdate.current;
          if (!p) return;

          const startPos = dragStartPositions.current;
          const newGuides = [];

          setLocalBlocks(prev => {
            const next = { ...prev };

            Object.keys(startPos).forEach(id => {
              const sp = startPos[id];
              let newX = sp.x + p.totalDeltaX;
              let newY = sp.y + p.totalDeltaY;
              const bW = sp.width;
              const bH = sp.height;

              // ── Snap on X axis ──────────────────────────────────────
              let bestSnapX = null;
              let bestDiffX = p.SNAP_PX;
              const myEdgesX = [newX, newX + bW / 2, newX + bW];
              p.snapXPts.forEach(sx => {
                myEdgesX.forEach(me => {
                  const d = Math.abs(me - sx);
                  if (d < bestDiffX) { bestDiffX = d; bestSnapX = { snap: sx, edge: me }; }
                });
              });
              if (bestSnapX) {
                newX += bestSnapX.snap - bestSnapX.edge;
                newGuides.push({ type: 'v', pos: bestSnapX.snap });
              }

              // ── Snap on Y axis ──────────────────────────────────────
              let bestSnapY = null;
              let bestDiffY = p.SNAP_PX;
              const myEdgesY = [newY, newY + bH / 2, newY + bH];
              p.snapYPts.forEach(sy => {
                myEdgesY.forEach(me => {
                  const d = Math.abs(me - sy);
                  if (d < bestDiffY) { bestDiffY = d; bestSnapY = { snap: sy, edge: me }; }
                });
              });
              if (bestSnapY) {
                newY += bestSnapY.snap - bestSnapY.edge;
                newGuides.push({ type: 'h', pos: bestSnapY.snap });
              }

              newX = Math.max(0, Math.min(WORKSPACE_SIZE - bW, newX));
              newY = Math.max(0, Math.min(WORKSPACE_SIZE - bH, newY));

              next[id] = { ...prev[id], x: newX, y: newY };
            });

            return next;
          });

          // Deduplicate guides and update in the same tick
          const unique = newGuides.filter(
            (g, i, arr) => arr.findIndex(o => o.type === g.type && o.pos === g.pos) === i
          );
          setActiveGuides(unique);
        });
      }
    }
    else if (selectionBox) {
      const worldPos = getPointerWorldPos(e);
      setSelectionBox(prev => ({
        ...prev,
        currentX: worldPos.x,
        currentY: worldPos.y
      }));
    }
  };

  const handlePointerUp = (e) => {
    delete touches.current[e.pointerId];
    if (Object.keys(touches.current).length < 2) {
      initialPinchDist.current = null;
      initialPinchZoom.current = null;
    }

    if (isPanning) {
      setIsPanning(false);
      if (e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
    }
    if (draggingBlock) {
      // Cancel any pending rAF
      if (dragRafId.current !== null) {
        cancelAnimationFrame(dragRafId.current);
        dragRafId.current = null;
      }
      pendingDragUpdate.current = null;

      // Sync final positions to store
      useDesignStore.getState().selectedIds.forEach(id => {
         if (localBlocks[id]) {
            updateBlock(id, {
              x: localBlocks[id].x,
              y: localBlocks[id].y
            });
         }
      });
      setDraggingBlock(null);
      setActiveGuides([]);
      dragStartPositions.current = {};
      if (e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
    }
    if (selectionBox) {
      // Calculate intersection and select blocks
      const boxLeft = Math.min(selectionBox.startX, selectionBox.currentX);
      const boxRight = Math.max(selectionBox.startX, selectionBox.currentX);
      const boxTop = Math.min(selectionBox.startY, selectionBox.currentY);
      const boxBottom = Math.max(selectionBox.startY, selectionBox.currentY);
      
      // Only select if there was an actual box drawn (prevent 0x0 clicks from clearing)
      if (boxRight - boxLeft > 5 && boxBottom - boxTop > 5) {
         const idsToSelect = storeBlocks.filter(block => {
           const bX = localBlocks[block.id]?.x || block.x || 0;
           const bY = localBlocks[block.id]?.y || block.y || 0;
           const bW = block.width || 100;
           const bH = block.height || 100;
           
           // Simple box intersection math
           return !(
             boxRight < bX || 
             boxBottom < bY || 
             boxLeft > bX + bW || 
             boxTop > bY + bH
           );
         }).map(b => b.id);
         
         if (idsToSelect.length > 0) {
           useDesignStore.getState().selectBlocks(idsToSelect);
         }
      }
      
      setSelectionBox(null);
      if (e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
    }
  };

  const screenX = containerSize.width / 2 - camera.x * camera.zoom;
  const screenY = containerSize.height / 2 - camera.y * camera.zoom;

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const blockElement = e.target.closest('[data-block-id]');
    const targetId = blockElement ? blockElement.getAttribute('data-block-id') : null;
    
    if (targetId) {
      if (!useDesignStore.getState().selectedIds.includes(targetId)) {
        selectBlock(targetId);
      }
    } else {
      deselectAll();
      setEditingBlockId(null);
    }
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      blockId: targetId
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data && data.type) {
        // Calculate world position where the drop occurred
        const rect = containerRef.current.getBoundingClientRect();
        const dropXScreen = e.clientX - rect.left;
        const dropYScreen = e.clientY - rect.top;
        
        // Convert screen coordinates to world coordinates
        const dropWorldX = camera.x + (dropXScreen - containerSize.width / 2) / camera.zoom;
        const dropWorldY = camera.y + (dropYScreen - containerSize.height / 2) / camera.zoom;
        
        // Default sizes for determining centering offsets
        const width = data.payload.width || 150;
        const height = data.payload.height || 40;

        useDesignStore.getState().addBlock(data.type, data.payload.url || '', {
          ...data.payload,
          x: dropWorldX - width / 2,
          y: dropWorldY - height / 2,
        });
      }
    } catch (err) {
      console.warn('Invalid drop payload', err);
    }
  };

  return (
    <div 
      className="big-canvas-container" 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ cursor: isPanning ? 'grabbing' : draggingBlock ? 'default' : 'grab' }}
    >
      <div 
        className="big-canvas-workspace"
        style={{
          transform: `translate(${screenX}px, ${screenY}px) scale(${camera.zoom})`,
          backgroundColor: canvasColor // Apply background color from store
        }}
      >
        {/* Render Garment Silhouette */}
        {activeGarment && (
          <div 
            className="canvas-garment-silhouette"
            style={{
              position: 'absolute',
              top: WORKSPACE_SIZE / 2 - 420 / 2, // Centered vertically
              left: WORKSPACE_SIZE / 2 - 350 / 2, // Centered horizontally
              width: 350,
              height: 420,
              backgroundImage: `url(${activeGarment.image})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.85,
              pointerEvents: 'none' // Silhouette shouldn't interfere with interactions
            }}
          />
        )}
      
        {/* Render Blocks */}
        {storeBlocks.map((block) => {
          const pos = localBlocks[block.id] || { 
             x: block.x || 0, y: block.y || 0, 
             width: block.width || 100, height: block.height || 100,
             scale: block.scale || 1, rotation: block.rotation || 0
          };
          const isSelected = useDesignStore.getState().selectedIds.includes(block.id);
          const isBlockDragging = draggingBlock !== null && isSelected;
          const workspaceSize = containerSize.width > 0 ? containerSize.width * 5 : 5000;
          
          // ── Text blocks → TextTransformWrapper (direct manipulation) ──
          if (block.type === 'text') {
            return (
              <TextTransformWrapper
                key={block.id}
                block={block}
                localPos={pos}
                setLocalBlocks={setLocalBlocks}
                isSelected={isSelected}
                activeTool={activeTool}
                camera={camera}
                storeBlocks={storeBlocks}
                WORKSPACE_SIZE={workspaceSize}
                isDragging={isBlockDragging}
                setEditingBlockId={setEditingBlockId}
                editingBlockId={editingBlockId}
              />
            );
          }

          // ── All other block types → generic TransformWrapper ──
          return (
            <TransformWrapper
              key={block.id}
              block={block}
              localPos={pos}
              setLocalBlocks={setLocalBlocks}
              isSelected={isSelected}
              activeTool={activeTool}
              camera={camera}
              storeBlocks={storeBlocks}
              WORKSPACE_SIZE={workspaceSize}
              isDragging={isBlockDragging}
            >
              {block.type === 'pattern' && block.url ? (
                // Blend mode applied here creates the "printed on fabric" illusion
                <img
                  data-block-id={block.id}
                  src={block.url}
                  alt={block.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                    mixBlendMode: block.blendMode || 'multiply',
                    opacity: block.opacity ?? 1,
                  }}
                />
              ) : block.type === 'image' && block.url ? (
                <img
                  data-block-id={block.id}
                  src={block.url}
                  alt={block.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    mixBlendMode: block.blendMode || 'normal',
                    opacity: block.opacity ?? 1,
                    transform: block.flipX ? 'scaleX(-1)' : 'none',
                  }}
                />
              ) : (
                <div style={{ padding: '0.5rem' }}>
                  {block.name || block.type}
                </div>
              )}
            </TransformWrapper>
          );
        })}

        {/* Render Marquee Selection Box */}
        {selectionBox && (
          <div
            className="marquee-box"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY)
            }}
          />
        )}

        {/* Snap / Alignment Guides */}
        {activeGuides.map((g, i) =>
          g.type === 'v'
            ? <div key={`guide-v-${i}`} className="smart-guide vertical" style={{ left: g.pos }} />
            : <div key={`guide-h-${i}`} className="smart-guide horizontal" style={{ top: g.pos }} />
        )}
      </div>

      {/* Bottom Navigation Dock */}
      <div className="canvas-bottom-dock">
        {/* Tools */}

        <div className="dock-divider"></div>

        {/* Zoom Controls */}
        <div className="dock-group">
          <button 
            className="dock-btn"
            onClick={() => setCamera(prev => ({ ...prev, zoom: Math.max(minZoom, prev.zoom - 0.25) }))}
            title="Zoom Out"
          >
            <Minus size={22} />
          </button>
          
          <div 
            className="dock-text" 
            title="Reset View"
            onClick={() => setCamera({ x: WORKSPACE_SIZE / 2, y: WORKSPACE_SIZE / 2, zoom: 1 })}
            style={{ cursor: 'pointer' }}
          >
            {Math.round(camera.zoom * 100)}%
          </div>

          <button 
            className="dock-btn"
            onClick={() => setCamera(prev => ({ ...prev, zoom: Math.min(MAX_ZOOM, prev.zoom + 0.25) }))}
            title="Zoom In"
          >
            <Plus size={22} />
          </button>
        </div>

        <div className="dock-divider"></div>

        {/* Add Button Centerpiece */}
        <FloatingAddButton />

        <div className="dock-divider"></div>

        {/* Recenter */}
        <button 
          className="dock-btn"
          onClick={() => setCamera({ x: WORKSPACE_SIZE / 2, y: WORKSPACE_SIZE / 2, zoom: 1 })}
          title="Recenter Canvas"
        >
          <RotateCcw size={22} />
        </button>
      </div>

      {/* Contextual Toolbar for selected block */}
      {selectedId && (
        <ContextToolbar
          selectedId={selectedId}
          localBlocks={localBlocks}
          camera={camera}
          containerSize={containerSize}
        />
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
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
          onPointerDown={(e) => e.stopPropagation()}
        >
          {contextMenu.blockId ? (
            <>
              {storeBlocks.find(b => b.id === contextMenu.blockId)?.type === 'text' && (
                <button
                  className="context-menu-item"
                  onClick={() => {
                    setEditingBlockId(contextMenu.blockId);
                    setContextMenu({ ...contextMenu, visible: false });
                  }}
                >
                  <Edit3 size={14} />
                  <span>Edit Text</span>
                </button>
              )}
              
              <button
                className="context-menu-item"
                onClick={() => {
                  useDesignStore.getState().duplicateBlock(contextMenu.blockId);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                <Copy size={14} />
                <span>Duplicate</span>
              </button>
              
              <div className="context-menu-divider" />
              
              <button
                className="context-menu-item danger"
                onClick={() => {
                  useDesignStore.getState().deleteBlock(contextMenu.blockId);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <>
              <button
                className="context-menu-item"
                onClick={() => {
                  setCamera(prev => ({ ...prev, zoom: Math.min(MAX_ZOOM, prev.zoom + 0.25) }));
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                <Plus size={14} />
                <span>Zoom In</span>
              </button>
              <button
                className="context-menu-item"
                onClick={() => {
                  setCamera(prev => ({ ...prev, zoom: Math.max(minZoom, prev.zoom - 0.25) }));
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                <Minus size={14} />
                <span>Zoom Out</span>
              </button>
              
              <div className="context-menu-divider" />
              
              <button
                className="context-menu-item danger"
                onClick={() => {
                  useDesignStore.getState().clearAll();
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                <Trash size={14} />
                <span>Clear Canvas</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BigCanvas;
