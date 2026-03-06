import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Copy, Layers, ChevronRight, ChevronUp, ChevronDown,
  Type, Image as ImageIcon, Square, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, RotateCcw
} from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';
import { COLORS, FONTS } from '../../data/studioAssets';

/**
 * RightSidebar — Fully Zustand-wired Properties & Layers Panel
 *
 * Key design decisions:
 *  • Reads exclusively from useDesignStore — zero StudioContext dependency
 *  • activeBlock = blocks.find(b => b.id === selectedIds[0])
 *    so sliders reflect the EXACT state of whatever is selected on canvas
 *  • updateBlock() is called on every slider change → instant feedback loop
 *    (e.g. TextTransformWrapper scales font → sidebar slider moves live)
 *  • Blend mode selector for pattern blocks → "printed on garment" feel
 */

const BLEND_MODES = [
  { value: 'normal',   label: 'Normal'   },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen',   label: 'Screen'   },
  { value: 'overlay',  label: 'Overlay'  },
  { value: 'darken',   label: 'Darken'   },
  { value: 'lighten',  label: 'Lighten'  },
  { value: 'color-burn', label: 'Burn'   },
  { value: 'soft-light', label: 'Soft Light' },
];

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#EF4444', '#F59E0B',
  '#22C55E', '#3B82F6', '#A855F7', '#EC4899',
  '#F97316', '#06B6D4',
];

const RightSidebar = ({ isOpen, onToggle }) => {
  // ── Zustand (single source of truth) ──────────────────────────────────────
  const blocks       = useDesignStore(s => s.blocks);
  const selectedIds  = useDesignStore(s => s.selectedIds);
  const updateBlock  = useDesignStore(s => s.updateBlock);
  const deleteBlock  = useDesignStore(s => s.deleteBlock);
  const duplicateBlock = useDesignStore(s => s.duplicateBlock);
  const moveBlockUp  = useDesignStore(s => s.moveBlockUp);
  const moveBlockDown= useDesignStore(s => s.moveBlockDown);
  const selectBlock  = useDesignStore(s => s.selectBlock);

  // Primary selected block — drives all property sliders
  const activeBlock = blocks.find(b => b.id === selectedIds[0]) || null;

  const update = (key, value) => {
    if (!activeBlock) return;
    updateBlock(activeBlock.id, { [key]: value });
  };

  const layerIcon = (type) => {
    if (type === 'text')    return <Type size={11} />;
    if (type === 'pattern') return <Square size={11} />;
    return <ImageIcon size={11} />;
  };

  return (
    <>
      {/* ── Collapsed toggle button ── */}
      {!isOpen && (
        <motion.button
          className="sidebar-toggle right"
          onClick={onToggle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Layers size={20} />
          {blocks.length > 0 && <span className="badge">{blocks.length}</span>}
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="studio-sidebar right"
            initial={{ x: 280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="sidebar-header">
              <span>Layers & Properties</span>
              <button className="close-sidebar" onClick={onToggle}>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* ── Layers Panel ── */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Layers size={16} />
                  <span>Layers ({blocks.length})</span>
                </div>
              </div>

              <div className="layers-list">
                {blocks.length === 0 ? (
                  <p className="empty-text">No layers yet. Add text or graphics!</p>
                ) : (
                  [...blocks].reverse().map((block) => (
                    <button
                      key={block.id}
                      className={`layer-row ${selectedIds.includes(block.id) ? 'active' : ''}`}
                      onClick={() => selectBlock(block.id)}
                    >
                      <span className="layer-type">{layerIcon(block.type)}</span>
                      <span className="layer-name">
                        {block.type === 'text'
                          ? (block.text?.length > 14 ? block.text.substring(0, 14) + '…' : block.text || 'Text')
                          : (block.name || block.type)}
                      </span>
                      <span className="layer-actions" onClick={e => e.stopPropagation()}>
                        <button
                          className="layer-action-btn"
                          title="Move Up"
                          onClick={() => moveBlockUp(block.id)}
                        ><ChevronUp size={11} /></button>
                        <button
                          className="layer-action-btn"
                          title="Move Down"
                          onClick={() => moveBlockDown(block.id)}
                        ><ChevronDown size={11} /></button>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ── Properties Panel ── */}
            {activeBlock ? (
              <div className="panel properties-panel">
                <div className="panel-header">
                  <span>Properties</span>
                  <div className="panel-actions">
                    <button
                      className="icon-btn"
                      title="Duplicate"
                      onClick={() => duplicateBlock(activeBlock.id)}
                    ><Copy size={14} /></button>
                    <button
                      className="icon-btn danger"
                      title="Delete"
                      onClick={() => deleteBlock(activeBlock.id)}
                    ><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* ── TEXT BLOCK PROPERTIES ── */}
                {activeBlock.type === 'text' && (
                  <>
                    {/* Text Content */}
                    <div className="prop-group">
                      <label>Content</label>
                      <input
                        type="text"
                        className="text-input"
                        value={activeBlock.text || ''}
                        onChange={e => update('text', e.target.value)}
                        placeholder="Enter text…"
                      />
                    </div>

                    {/* Font Size — live-synced with canvas handle drags */}
                    <div className="prop-group">
                      <label>Font Size <span className="prop-value">{Math.round(activeBlock.fontSize || 24)}pt</span></label>
                      <div className="slider-row">
                        <input
                          type="range" min="4" max="200" step="1"
                          value={Math.round(activeBlock.fontSize || 24)}
                          onChange={e => update('fontSize', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Font Family */}
                    <div className="prop-group">
                      <label>Font</label>
                      <div className="font-presets compact">
                        {FONTS.map(font => (
                          <button
                            key={font.name}
                            className={`font-preset compact ${activeBlock.fontFamily === font.name ? 'active' : ''}`}
                            style={{ fontFamily: font.name }}
                            onClick={() => update('fontFamily', font.name)}
                            title={font.label}
                          >
                            Aa
                            <span>{font.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Color */}
                    <div className="prop-group">
                      <label>Color</label>
                      <div className="color-grid small">
                        {TEXT_COLORS.map(color => (
                          <button
                            key={color}
                            className={`color-swatch ${(activeBlock.fill || activeBlock.color) === color ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => update('fill', color)}
                            title={color}
                          />
                        ))}
                        <input
                          type="color"
                          value={activeBlock.fill || '#000000'}
                          onChange={e => update('fill', e.target.value)}
                          className="color-picker-input"
                          title="Custom color"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── PATTERN BLOCK PROPERTIES ── */}
                {activeBlock.type === 'pattern' && (
                  <div className="prop-group">
                    <label>
                      Blend Mode
                      <span className="prop-hint"> — "printed on" effect</span>
                    </label>
                    <select
                      className="blend-select"
                      value={activeBlock.blendMode || 'multiply'}
                      onChange={e => update('blendMode', e.target.value)}
                    >
                      {BLEND_MODES.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <div className="prop-group" style={{ marginTop: '0.6rem' }}>
                      <label>Pattern Scale <span className="prop-value">{Math.round((activeBlock.scale || 1) * 100)}%</span></label>
                      <div className="slider-row">
                        <input
                          type="range" min="20" max="300" step="5"
                          value={Math.round((activeBlock.scale || 1) * 100)}
                          onChange={e => update('scale', parseFloat(e.target.value) / 100)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SHARED PROPERTIES (all block types) ── */}

                {/* Opacity */}
                <div className="prop-group">
                  <label>Opacity <span className="prop-value">{Math.round((activeBlock.opacity ?? 1) * 100)}%</span></label>
                  <div className="slider-row">
                    <input
                      type="range" min="0" max="1" step="0.01"
                      value={activeBlock.opacity ?? 1}
                      onChange={e => update('opacity', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                {/* Rotation */}
                <div className="prop-group">
                  <label>
                    Rotation <span className="prop-value">{Math.round(activeBlock.rotation || 0)}°</span>
                  </label>
                  <div className="slider-row">
                    <input
                      type="range" min="-180" max="180" step="1"
                      value={activeBlock.rotation || 0}
                      onChange={e => update('rotation', parseFloat(e.target.value))}
                    />
                    <button
                      className="reset-btn"
                      title="Reset rotation"
                      onClick={() => update('rotation', 0)}
                    ><RotateCcw size={12} /></button>
                  </div>
                </div>

                {/* Position readout */}
                <div className="prop-group">
                  <label>Position</label>
                  <div className="xy-row">
                    <div className="xy-field">
                      <span>X</span>
                      <input
                        type="number"
                        value={Math.round(activeBlock.x || 0)}
                        onChange={e => update('x', parseFloat(e.target.value))}
                        className="num-input"
                      />
                    </div>
                    <div className="xy-field">
                      <span>Y</span>
                      <input
                        type="number"
                        value={Math.round(activeBlock.y || 0)}
                        onChange={e => update('y', parseFloat(e.target.value))}
                        className="num-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Size readout */}
                <div className="prop-group">
                  <label>Size</label>
                  <div className="xy-row">
                    <div className="xy-field">
                      <span>W</span>
                      <input
                        type="number" min="10"
                        value={Math.round(activeBlock.width || 100)}
                        onChange={e => update('width', parseFloat(e.target.value))}
                        className="num-input"
                      />
                    </div>
                    <div className="xy-field">
                      <span>H</span>
                      <input
                        type="number" min="10"
                        value={Math.round(activeBlock.height || 100)}
                        onChange={e => update('height', parseFloat(e.target.value))}
                        className="num-input"
                      />
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="panel empty-state">
                <p>Select a layer to edit its properties</p>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default RightSidebar;
