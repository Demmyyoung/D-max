import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Copy, FlipHorizontal, Palette } from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import ColorPicker from './ColorPicker';
import './ContextToolbar.css';

const ContextToolbar = ({ selectedId, localBlocks, camera, containerSize }) => {
  const [showPicker, setShowPicker] = useState(false);
  const toolbarRef = useRef(null);

  const blocks = useDesignStore((state) => state.blocks);
  const updateBlock = useDesignStore((state) => state.updateBlock);
  const deleteBlock = useDesignStore((state) => state.deleteBlock);
  const duplicateBlock = useDesignStore((state) => state.duplicateBlock);

  const recentColors = useDesignStore((state) => state.recentColors);
  const addRecentColor = useDesignStore((state) => state.addRecentColor);

  const block = blocks.find(b => b.id === selectedId);
  const localPos = localBlocks?.[selectedId];

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const POPULAR_COLORS = [
    '#000000', '#ffffff', '#6366f1', '#f43f5e', 
    '#10b981', '#f59e0b', '#0ea5e9', '#64748b'
  ];

  if (!block || !localPos) return null;

  const screenX = containerSize.width / 2 - camera.x * camera.zoom;
  const screenY = containerSize.height / 2 - camera.y * camera.zoom;
  const blockScreenX = screenX + localPos.x * camera.zoom;
  const blockScreenY = screenY + localPos.y * camera.zoom;
  const blockScreenW = localPos.width * camera.zoom;

  const toolbarLeft = blockScreenX + blockScreenW / 2;
  const toolbarTop = blockScreenY - 52;

  const isImage = block.type === 'image';
  const isText = block.type === 'text';

  const handleColorChange = (color) => {
    updateBlock(block.id, { fill: color, color: color });
    addRecentColor(color);
  };

  return (
    <div
      ref={toolbarRef}
      className="context-toolbar"
      style={{ left: toolbarLeft, top: toolbarTop }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {isImage && (
        <>
          <button
            className="ctx-btn"
            title="Flip Horizontal"
            onClick={() => updateBlock(block.id, { flipX: !block.flipX })}
          >
            <FlipHorizontal size={15} />
          </button>
          <div className="ctx-divider" />
        </>
      )}

      {isText && (
        <>
          <div className="ctx-color-section">
            <div className="ctx-color-palette">
              {POPULAR_COLORS.map(color => (
                <button
                  key={color}
                  className={`ctx-color-pill ${ (block.fill === color || block.color === color) ? 'active' : '' }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={color}
                />
              ))}
              <div 
                className={`ctx-color-wrap custom ${showPicker ? 'active' : ''}`} 
                title="Custom color"
                onClick={() => setShowPicker(!showPicker)}
              >
                <Palette size={12} color="white" />
              </div>
            </div>
          </div>
          
          {showPicker && (
            <div className="ctx-picker-popover">
              <ColorPicker 
                color={block.fill || block.color || '#000000'} 
                onChange={handleColorChange}
                onClose={() => setShowPicker(false)}
              />
            </div>
          )}
          
          <div className="ctx-divider" />
        </>
      )}

      <button className="ctx-btn" title="Duplicate" onClick={() => duplicateBlock(block.id)}>
        <Copy size={15} />
      </button>

      <div className="ctx-divider" />

      <button className="ctx-btn danger" title="Delete" onClick={() => deleteBlock(block.id)}>
        <Trash2 size={15} />
      </button>
    </div>
  );
};

export default ContextToolbar;
