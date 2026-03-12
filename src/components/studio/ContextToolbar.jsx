import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Copy, FlipHorizontal, Minus, Plus } from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import './ContextToolbar.css';

const ContextToolbar = ({ selectedId, localBlocks, camera, containerSize }) => {
  const blocks = useDesignStore((state) => state.blocks);
  const updateBlock = useDesignStore((state) => state.updateBlock);
  const deleteBlock = useDesignStore((state) => state.deleteBlock);
  const duplicateBlock = useDesignStore((state) => state.duplicateBlock);

  const block = blocks.find(b => b.id === selectedId);
  const localPos = localBlocks?.[selectedId];

  if (!block || !localPos) return null;

  // Convert world position to screen position
  const WORKSPACE_SIZE = 5000;
  const screenX = containerSize.width / 2 - camera.x * camera.zoom;
  const screenY = containerSize.height / 2 - camera.y * camera.zoom;
  const blockScreenX = screenX + localPos.x * camera.zoom;
  const blockScreenY = screenY + localPos.y * camera.zoom;
  const blockScreenW = localPos.width * camera.zoom;

  // Center toolbar above block
  const toolbarLeft = blockScreenX + blockScreenW / 2;
  const toolbarTop = blockScreenY - 52;

  const isImage = block.type === 'image';
  const isText = block.type === 'text';
  const opacity = block.opacity ?? 1;

  return (
    <div
      className="context-toolbar"
      style={{
        left: toolbarLeft,
        top: toolbarTop,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Opacity — shown for both image and text */}
      <div className="ctx-group">
        <button
          className="ctx-btn"
          title="Decrease Opacity"
          onClick={() => updateBlock(block.id, { opacity: Math.max(0.1, +(opacity - 0.1).toFixed(1)) })}
        >
          <Minus size={13} />
        </button>
        <span className="ctx-label">{Math.round(opacity * 100)}%</span>
        <button
          className="ctx-btn"
          title="Increase Opacity"
          onClick={() => updateBlock(block.id, { opacity: Math.min(1, +(opacity + 0.1).toFixed(1)) })}
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="ctx-divider" />

      {/* Flip — images only */}
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

      {/* Text color — text only */}
      {isText && (
        <>
          <div className="ctx-color-wrap" title="Text Color">
            <input
              type="color"
              className="ctx-color"
              value={block.fill || block.color || '#000000'}
              onChange={(e) => updateBlock(block.id, { fill: e.target.value, color: e.target.value })}
            />
          </div>
          <div className="ctx-divider" />
        </>
      )}

      {/* Duplicate */}
      <button className="ctx-btn" title="Duplicate" onClick={() => duplicateBlock(block.id)}>
        <Copy size={15} />
      </button>

      <div className="ctx-divider" />

      {/* Delete */}
      <button className="ctx-btn danger" title="Delete" onClick={() => deleteBlock(block.id)}>
        <Trash2 size={15} />
      </button>
    </div>
  );
};

export default ContextToolbar;
