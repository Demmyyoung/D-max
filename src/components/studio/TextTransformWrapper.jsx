import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDesignStore } from '../../store/useDesignStore';
import './TextTransformWrapper.css';

/**
 * TextTransformWrapper — Performance-Optimised Edition
 * ──────────────────────────────────────────────────────────────────────────
 * Key performance principles:
 *  1. ALL drag math lives in refs — zero React state during pointer-move hot path
 *  2. DOM is updated via direct style mutation (element.style.xxx = ...) for
 *     pixel-perfect 60fps without ever triggering a React re-render mid-drag
 *  3. React state & Zustand store are only written on pointer-UP (commit phase)
 *  4. Smart guides are rendered as real DOM nodes manipulated by ref, not re-renders
 */

const MIN_FONT_SIZE = 4;
const SNAP_THRESHOLD = 5;

const TextTransformWrapper = ({
  block,
  localPos,
  setLocalBlocks,
  isSelected,
  activeTool,
  camera,
  storeBlocks,
  WORKSPACE_SIZE = 5000,
  isDragging = false,
}) => {
  // ─── Refs (zero state during drag) ────────────────────────────────────────
  const blockRef        = useRef(null);
  const textContentRef  = useRef(null);
  const startDrag       = useRef(null);
  const activeHandleRef = useRef(null);   // 'nw'|'ne'|'sw'|'se'|'w'|'e' | null
  const rafId           = useRef(null);
  const pendingUpdate   = useRef(null);   // Last computed values, applied in rAF
  const measureRef      = useRef(null);   // Hidden span for min-width

  // Guide DOM node refs (manipulated directly, not via React state)
  const guideVRef = useRef(null);
  const guideHRef = useRef(null);

  // Tooltip DOM ref
  const tooltipRef = useRef(null);

  // React state ONLY for initial mount / unmount of handles — not updated mid-drag
  const [showHandles, setShowHandles] = useState(false);

  useEffect(() => {
    setShowHandles(isSelected && activeTool === 'select');
  }, [isSelected, activeTool]);

  // ─── Min-width helper (DOM measurement, cached per drag session) ──────────
  const getMinWidth = useCallback(() => {
    if (!measureRef.current) return 30;
    const words = (block.text || '').split(/\s+/);
    let maxW = 30;
    words.forEach(word => {
      measureRef.current.textContent = word;
      const w = measureRef.current.getBoundingClientRect().width;
      if (w > maxW) maxW = w;
    });
    return maxW + 16;
  }, [block.text]);

  // ─── Smart guide helpers (direct DOM manipulation) ────────────────────────
  const showGuides = (x, y, width, height) => {
    const canvasCX = WORKSPACE_SIZE / 2;
    const canvasCY = WORKSPACE_SIZE / 2;
    const blockCX  = x + width / 2;
    const blockCY  = y + height / 2;
    const blockR   = x + width;
    const blockB   = y + height;

    let vPos = null;
    let hPos = null;

    // Canvas centre snap
    if (Math.abs(blockCX - canvasCX) < SNAP_THRESHOLD ||
        Math.abs(x - canvasCX) < SNAP_THRESHOLD ||
        Math.abs(blockR - canvasCX) < SNAP_THRESHOLD) {
      vPos = canvasCX;
    }
    if (Math.abs(blockCY - canvasCY) < SNAP_THRESHOLD ||
        Math.abs(y - canvasCY) < SNAP_THRESHOLD ||
        Math.abs(blockB - canvasCY) < SNAP_THRESHOLD) {
      hPos = canvasCY;
    }

    // Other block snaps
    storeBlocks.forEach(other => {
      if (other.id === block.id) return;
      const oEdgesX = [other.x, other.x + other.width / 2, other.x + other.width];
      const oEdgesY = [other.y, other.y + other.height / 2, other.y + other.height];
      const myEdgesX = [x, blockCX, blockR];
      const myEdgesY = [y, blockCY, blockB];

      myEdgesX.forEach(me => oEdgesX.forEach(oe => {
        if (Math.abs(me - oe) < SNAP_THRESHOLD) vPos = oe;
      }));
      myEdgesY.forEach(me => oEdgesY.forEach(oe => {
        if (Math.abs(me - oe) < SNAP_THRESHOLD) hPos = oe;
      }));
    });

    if (guideVRef.current) {
      guideVRef.current.style.display = vPos !== null ? 'block' : 'none';
      if (vPos !== null) guideVRef.current.style.left = `${vPos}px`;
    }
    if (guideHRef.current) {
      guideHRef.current.style.display = hPos !== null ? 'block' : 'none';
      if (hPos !== null) guideHRef.current.style.top = `${hPos}px`;
    }
  };

  const hideGuides = () => {
    if (guideVRef.current) guideVRef.current.style.display = 'none';
    if (guideHRef.current) guideHRef.current.style.display = 'none';
  };

  // ─── Direct DOM update (called from rAF — no React state) ─────────────────
  const applyDOMUpdate = useCallback(() => {
    rafId.current = null;
    const u = pendingUpdate.current;
    if (!u || !blockRef.current) return;

    const el = blockRef.current;

    // 1. Reposition/resize the block wrapper directly
    el.style.width     = `${u.width}px`;
    el.style.height    = `${u.height}px`;
    el.style.transform = `translate3d(${u.x}px, ${u.y}px, 0) rotate(${u.rotation || 0}deg)`;

    // 2. Update font size directly on the inner text div
    if (textContentRef.current && u.fontSize !== undefined) {
      textContentRef.current.style.fontSize = `${u.fontSize}px`;
    }

    // 3. Tooltip
    if (tooltipRef.current && u.tooltipText) {
      tooltipRef.current.textContent = u.tooltipText;
      tooltipRef.current.style.display = 'block';
      tooltipRef.current.style.left = `${u.tooltipX}px`;
      tooltipRef.current.style.top  = `${u.tooltipY}px`;
      tooltipRef.current.style.transform = `scale(${1 / camera.zoom})`;
      tooltipRef.current.style.transformOrigin = '0 0';
    }

    // 4. Guides (no React state involved)
    showGuides(u.x, u.y, u.width, u.height);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleUpdate = (update) => {
    pendingUpdate.current = update;
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(applyDOMUpdate);
    }
  };

  // ─── Corner Handle (Font Size Scaling) ────────────────────────────────────
  const startCornerDrag = (e, handle) => {
    e.stopPropagation();
    activeHandleRef.current = handle;

    const startDiag = Math.hypot(localPos.width / 2, localPos.height / 2);

    startDrag.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startFontSize: block.fontSize || 24,
      startWidth:  localPos.width,
      startHeight: localPos.height,
      startX:      localPos.x,
      startY:      localPos.y,
      rotation:    localPos.rotation || 0,
      startDiag,
      handle,
    };

    e.target.setPointerCapture(e.pointerId);
  };

  const handleCornerMove = (e) => {
    const sd = startDrag.current;
    if (!sd) return;

    const handle = activeHandleRef.current;
    const rawDeltaX = (e.clientX - sd.mouseX) / camera.zoom;
    const rawDeltaY = (e.clientY - sd.mouseY) / camera.zoom;

    let scaleDelta;
    if (handle === 'se') scaleDelta = (rawDeltaX + rawDeltaY) / (2 * sd.startDiag) + 1;
    else if (handle === 'sw') scaleDelta = (-rawDeltaX + rawDeltaY) / (2 * sd.startDiag) + 1;
    else if (handle === 'ne') scaleDelta = (rawDeltaX - rawDeltaY) / (2 * sd.startDiag) + 1;
    else /* nw */             scaleDelta = (-rawDeltaX - rawDeltaY) / (2 * sd.startDiag) + 1;

    const newFontSize = Math.max(MIN_FONT_SIZE, Math.round(sd.startFontSize * scaleDelta));
    const fontRatio = newFontSize / sd.startFontSize;
    const newWidth  = Math.max(60, sd.startWidth  * fontRatio);
    const newHeight = Math.max(20, sd.startHeight * fontRatio);

    let newX = sd.startX;
    let newY = sd.startY;
    if (handle === 'nw') { newX = sd.startX + (sd.startWidth - newWidth); newY = sd.startY + (sd.startHeight - newHeight); }
    else if (handle === 'ne') { newY = sd.startY + (sd.startHeight - newHeight); }
    else if (handle === 'sw') { newX = sd.startX + (sd.startWidth - newWidth); }

    // Store computed values in the pending ref — NO setState
    sd._last = { x: newX, y: newY, width: newWidth, height: newHeight, fontSize: newFontSize };

    // Tooltip position (relative to workspace parent)
    const parentRect = blockRef.current?.parentElement?.getBoundingClientRect();

    scheduleUpdate({
      x: newX, y: newY, width: newWidth, height: newHeight,
      rotation: sd.rotation,
      fontSize: newFontSize,
      tooltipText: `${newFontSize}pt`,
      tooltipX: parentRect ? (e.clientX - parentRect.left) / camera.zoom + 16 / camera.zoom : 16,
      tooltipY: parentRect ? (e.clientY - parentRect.top) / camera.zoom + 16 / camera.zoom : 16,
    });
  };

  const handleCornerUp = (e) => {
    if (!startDrag.current) return;
    if (e.target.hasPointerCapture(e.pointerId)) e.target.releasePointerCapture(e.pointerId);

    // Cancel any pending rAF
    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = null; }

    const last = startDrag.current._last;
    if (last) {
      // Commit everything to React state + store in ONE batch (single re-render)
      setLocalBlocks(prev => ({
        ...prev,
        [block.id]: { ...prev[block.id], x: last.x, y: last.y, width: last.width, height: last.height },
      }));
      useDesignStore.getState().updateBlock(block.id, {
        x: last.x, y: last.y,
        width: last.width, height: last.height,
        fontSize: last.fontSize,
      });
    }

    // Hide tooltip
    if (tooltipRef.current) tooltipRef.current.style.display = 'none';
    hideGuides();
    activeHandleRef.current = null;
    startDrag.current = null;
  };

  // ─── Side Pill Handle (Text Reflow) ───────────────────────────────────────
  const startSideDrag = (e, side) => {
    e.stopPropagation();
    activeHandleRef.current = side;

    // Cache min width so getMinWidth isn't called every frame
    const minWidth = getMinWidth();

    startDrag.current = {
      mouseX:     e.clientX,
      startWidth: localPos.width,
      startX:     localPos.x,
      rotation:   localPos.rotation || 0,
      height:     localPos.height,
      minWidth,
    };

    e.target.setPointerCapture(e.pointerId);
  };

  const handleSideMove = (e) => {
    const sd = startDrag.current;
    if (!sd) return;

    const side = activeHandleRef.current;
    const rawDeltaX = (e.clientX - sd.mouseX) / camera.zoom;

    let newWidth = sd.startWidth;
    let newX = sd.startX;

    if (side === 'e') {
      newWidth = Math.max(sd.minWidth, sd.startWidth + rawDeltaX);
    } else {
      const rightEdge = sd.startX + sd.startWidth;
      newX = Math.min(rightEdge - sd.minWidth, sd.startX + rawDeltaX);
      newWidth = rightEdge - newX;
    }

    sd._last = { x: newX, width: newWidth };

    scheduleUpdate({ x: newX, y: localPos.y, width: newWidth, height: sd.height, rotation: sd.rotation });
  };

  const handleSideUp = (e) => {
    if (!startDrag.current) return;
    if (e.target.hasPointerCapture(e.pointerId)) e.target.releasePointerCapture(e.pointerId);

    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = null; }

    const last = startDrag.current._last;
    if (last) {
      setLocalBlocks(prev => ({
        ...prev,
        [block.id]: { ...prev[block.id], x: last.x, width: last.width },
      }));
      useDesignStore.getState().updateBlock(block.id, { x: last.x, width: last.width });
    }

    hideGuides();
    activeHandleRef.current = null;
    startDrag.current = null;
  };

  // ─── Unified pointer routing ───────────────────────────────────────────────
  const handlePointerMove = (e) => {
    const h = activeHandleRef.current;
    if (!h) return;
    if ('nwneswse'.includes(h) && h.length >= 2) handleCornerMove(e);
    else if (h === 'w' || h === 'e') handleSideMove(e);
  };

  const handlePointerUp = (e) => {
    const h = activeHandleRef.current;
    if (!h) return;
    if ('nwneswse'.includes(h) && h.length >= 2) handleCornerUp(e);
    else if (h === 'w' || h === 'e') handleSideUp(e);
  };

  // ─── Cleanup rAF on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  const liftShadow = isDragging
    ? '0 16px 40px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.15)'
    : undefined;

  const currentFontSize = block.fontSize || 24;

  return (
    <>
      {/* Hidden span for min-width measurement */}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          fontSize: `${currentFontSize}px`,
          fontFamily: block.fontFamily || 'inherit',
          pointerEvents: 'none',
          top: -9999,
          left: -9999,
        }}
      />

      {/* ── Block wrapper — positioned absolutely in workspace ── */}
      <div
        ref={blockRef}
        data-block-id={block.id}
        className={`text-block-wrapper${isDragging ? ' is-dragging' : ''}`}
        style={{
          position:        'absolute',
          top:             0,
          left:            0,
          width:           `${localPos.width}px`,
          height:          `${localPos.height}px`,
          transform:       `translate3d(${localPos.x}px, ${localPos.y}px, 0) rotate(${localPos.rotation || 0}deg)`,
          transformOrigin: '50% 50%',
          willChange:      'transform, width, height',
          opacity:         block.opacity || 1,
          boxShadow:       liftShadow,
          outline:         showHandles ? '1px solid #ffffff' : 'none',
          outlineOffset:   '1px',
          borderRadius:    0,
          cursor:          isDragging ? 'grabbing' : 'grab',
          userSelect:      'none',
          touchAction:     'none',
          zIndex:          isDragging ? 200 : 50,
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* ── Text content ── */}
        <div
          ref={textContentRef}
          style={{
            width:          '100%',
            height:         '100%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontFamily:     block.fontFamily || 'inherit',
            fontSize:       `${currentFontSize}px`,
            color:          block.fill || block.color || '#000000',
            lineHeight:     1.3,
            padding:        '4px 8px',
            boxSizing:      'border-box',
            wordWrap:       'break-word',
            overflowWrap:   'break-word',
            whiteSpace:     'pre-wrap',
            textAlign:      'center',
          }}
        >
          <span>{block.text || 'Text'}</span>
        </div>

        {/* ── Handles (rendered once on selection change) ── */}
        {showHandles && (
          <>
            {['nw', 'ne', 'sw', 'se'].map(h => (
              <div
                key={h}
                className={`text-handle text-handle-corner ${h}`}
                onPointerDown={(e) => startCornerDrag(e, h)}
              />
            ))}
            {['w', 'e'].map(h => (
              <div
                key={h}
                className={`text-handle text-handle-pill ${h}`}
                onPointerDown={(e) => startSideDrag(e, h)}
              />
            ))}
          </>
        )}
      </div>

      {/* ── Smart Guides — rendered once, shown/hidden via direct DOM ── */}
      <div
        ref={guideVRef}
        className="smart-guide text-guide vertical"
        style={{ display: 'none', left: 0 }}
      />
      <div
        ref={guideHRef}
        className="smart-guide text-guide horizontal"
        style={{ display: 'none', top: 0 }}
      />

      {/* ── Font Size Tooltip — shown/hidden via direct DOM ── */}
      <div
        ref={tooltipRef}
        className="text-font-tooltip"
        style={{ display: 'none', left: 0, top: 0 }}
      />
    </>
  );
};

export default TextTransformWrapper;
