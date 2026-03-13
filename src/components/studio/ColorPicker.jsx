import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDesignStore } from '../../store/useDesignStore';
import { hexToRgb, rgbToHex, rgbToHsv, hsvToRgb } from '../../utils/colorUtils';
import { Pipette } from 'lucide-react';
import './ColorPicker.css';

const ColorPicker = ({ color, onChange, onClose }) => {
  // Parse initial color
  const initialHsv = useMemo(() => {
    const rgb = hexToRgb(color || '#000000');
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  }, [color]);

  const [hsv, setHsv] = useState(initialHsv);
  const recentColors = useDesignStore((state) => state.recentColors);
  
  const svAreaRef = useRef(null);
  const hueSliderRef = useRef(null);
  const isDraggingRef = useRef(null); // 'sv' or 'hue'

  // Update HSV when external color changes (but only if not dragging)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setHsv(initialHsv);
    }
  }, [initialHsv]);

  const updateColor = (newHsv) => {
    setHsv(newHsv);
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    onChange(hex);
  };

  const handlePointerDown = (e, type) => {
    isDraggingRef.current = type;
    handlePointerMove(e);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;

    if (isDraggingRef.current === 'sv') {
      const rect = svAreaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      updateColor({ ...hsv, s: x * 100, v: (1 - y) * 100 });
    } else if (isDraggingRef.current === 'hue') {
      const rect = hueSliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      updateColor({ ...hsv, h: x * 360 });
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = null;
  };

  const handleEyedropper = async () => {
    if (!window.EyeDropper) return;
    const dropper = new window.EyeDropper();
    try {
      const result = await dropper.open();
      onChange(result.sRGBHex);
    } catch (e) {
      console.log('Eyedropper cancelled');
    }
  };

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [hsv]);

  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);

  const POPULAR_COLORS = [
    '#000000', '#ffffff', '#6366f1', '#f43f5e', 
    '#10b981', '#f59e0b', '#0ea5e9', '#64748b'
  ];

  return (
    <div className="premium-color-picker" onPointerDown={(e) => e.stopPropagation()}>
      <div 
        ref={svAreaRef}
        className="color-sv-area" 
        style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
        onPointerDown={(e) => handlePointerDown(e, 'sv')}
      >
        <div className="color-sv-gradient" />
        <div 
          className="color-sv-handle"
          style={{ 
            left: `${hsv.s}%`, 
            top: `${100 - hsv.v}%` 
          }}
        />
      </div>

      <div className="color-picker-controls">
        <button 
          className="eyedropper-btn" 
          onClick={handleEyedropper}
          title="Pick color from screen"
        >
          <Pipette size={14} />
        </button>

        <div className="color-preview-circle" style={{ backgroundColor: color }} />

        <div 
          ref={hueSliderRef}
          className="color-slider hue-slider"
          onPointerDown={(e) => handlePointerDown(e, 'hue')}
        >
          <div 
            className="color-slider-handle"
            style={{ left: `${(hsv.h / 360) * 100}%` }}
          />
        </div>
      </div>

      <div className="color-picker-footer">
        <div className="color-inputs">
          <div className="color-input-group hex">
            <input 
              className="color-input-field" 
              value={color.toUpperCase()} 
              onChange={(e) => onChange(e.target.value)}
            />
            <span className="color-input-label">HEX</span>
          </div>
          <div className="color-input-group">
            <div className="color-input-field">{rgb.r}</div>
            <span className="color-input-label">R</span>
          </div>
          <div className="color-input-group">
            <div className="color-input-field">{rgb.g}</div>
            <span className="color-input-label">G</span>
          </div>
          <div className="color-input-group">
            <div className="color-input-field">{rgb.b}</div>
            <span className="color-input-label">B</span>
          </div>
        </div>
      </div>

      <div className="recent-colors-section">
        <span className="recent-colors-title">Popular Colors</span>
        <div className="recent-colors-grid">
          {POPULAR_COLORS.map((c, i) => (
            <div 
              key={i}
              className="recent-color-swatch"
              style={{ backgroundColor: c }}
              onClick={() => onChange(c)}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
