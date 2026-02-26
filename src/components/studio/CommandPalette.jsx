import React, { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Trash2, 
  Download, 
  Image, 
  Type, 
  Sparkles,
  Cat
} from 'lucide-react';
import { useDesignStore, FELINE_PATTERNS } from '../../store/useDesignStore';
import './CommandPalette.css';

/**
 * Cmd+K Command Palette for quick studio actions
 * Implements God Mode for power users
 */
const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const addBlock = useDesignStore((state) => state.addBlock);
  const addFelinePattern = useDesignStore((state) => state.addFelinePattern);
  const setCanvasColor = useDesignStore((state) => state.setCanvasColor);
  const clearAll = useDesignStore((state) => state.clearAll);

  // Ctrl+K / Cmd+K to open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Parse and execute color command
  const handleColorCommand = useCallback((value) => {
    const hexMatch = value.match(/^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/);
    if (hexMatch) {
      const color = hexMatch[0].startsWith('#') ? hexMatch[0] : `#${hexMatch[0]}`;
      setCanvasColor(color);
      setOpen(false);
      setSearch('');
    }
  }, [setCanvasColor]);

  // Handle command selection
  const runCommand = useCallback((callback) => {
    setOpen(false);
    setSearch('');
    callback();
  }, []);

  // Check if search looks like a color command
  const isColorSearch = search.startsWith('/color ') || search.match(/^#?[0-9A-Fa-f]{3,6}$/);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="command-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          
          {/* Command Dialog */}
          <motion.div
            className="command-dialog"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Command 
              className="command-root"
              filter={(value, search) => {
                // Custom filter that handles slash commands
                if (search.startsWith('/')) {
                  const cmd = search.slice(1).toLowerCase();
                  if (value.toLowerCase().includes(cmd)) return 1;
                  return 0;
                }
                if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                return 0;
              }}
            >
              <div className="command-header">
                <Command.Input 
                  className="command-input"
                  placeholder="Type a command or search..."
                  value={search}
                  onValueChange={setSearch}
                  autoFocus
                />
                <kbd className="command-kbd">ESC</kbd>
              </div>
              
              <Command.List className="command-list">
                <Command.Empty className="command-empty">
                  {isColorSearch ? (
                    <div className="color-preview">
                      <span>Set canvas color to:</span>
                      <div 
                        className="color-swatch"
                        style={{ 
                          backgroundColor: search.replace('/color ', '').startsWith('#') 
                            ? search.replace('/color ', '') 
                            : `#${search.replace('/color ', '')}` 
                        }}
                      />
                      <button 
                        onClick={() => handleColorCommand(search.replace('/color ', ''))}
                        className="apply-color-btn"
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    'No results found.'
                  )}
                </Command.Empty>

                {/* Feline Patterns */}
                <Command.Group heading="🐆 Feline Patterns">
                  {Object.entries(FELINE_PATTERNS).map(([key, pattern]) => (
                    <Command.Item
                      key={key}
                      value={`feline-${key} ${pattern.name}`}
                      onSelect={() => runCommand(() => addFelinePattern(key))}
                      className="command-item"
                    >
                      <Cat size={16} />
                      <span>/feline-{key}</span>
                      <span className="command-description">{pattern.name}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

                {/* Design Actions */}
                <Command.Group heading="Design">
                  <Command.Item
                    value="text add"
                    onSelect={() => runCommand(() => addBlock('text', '', { text: 'YOUR TEXT', width: 150, height: 40 }))}
                    className="command-item"
                  >
                    <Type size={16} />
                    <span>Add Text</span>
                    <span className="command-description">Add text element</span>
                  </Command.Item>
                  
                  <Command.Item
                    value="image add"
                    onSelect={() => runCommand(() => {
                      const url = prompt('Enter image URL:');
                      if (url) addBlock('image', url, { width: 100, height: 100 });
                    })}
                    className="command-item"
                  >
                    <Image size={16} />
                    <span>Add Image</span>
                    <span className="command-description">Add image from URL</span>
                  </Command.Item>
                </Command.Group>

                {/* Canvas Actions */}
                <Command.Group heading="Canvas">
                  <Command.Item
                    value="color white"
                    onSelect={() => runCommand(() => setCanvasColor('#ffffff'))}
                    className="command-item"
                  >
                    <Palette size={16} />
                    <span>/color white</span>
                    <span className="command-description">White background</span>
                  </Command.Item>
                  
                  <Command.Item
                    value="color black"
                    onSelect={() => runCommand(() => setCanvasColor('#1a1a1a'))}
                    className="command-item"
                  >
                    <Palette size={16} />
                    <span>/color black</span>
                    <span className="command-description">Black background</span>
                  </Command.Item>
                  
                  <Command.Item
                    value="clean clear"
                    onSelect={() => runCommand(clearAll)}
                    className="command-item danger"
                  >
                    <Trash2 size={16} />
                    <span>/clean</span>
                    <span className="command-description">Clear all blocks</span>
                  </Command.Item>
                </Command.Group>

                {/* Export */}
                <Command.Group heading="Export">
                  <Command.Item
                    value="export download"
                    onSelect={() => runCommand(() => {
                      // TODO: Implement canvas export
                      alert('Export feature coming soon!');
                    })}
                    className="command-item"
                  >
                    <Download size={16} />
                    <span>/export</span>
                    <span className="command-description">Download design</span>
                  </Command.Item>
                </Command.Group>
              </Command.List>
              
              <div className="command-footer">
                <span>Type <kbd>/</kbd> for commands</span>
                <span><kbd>↑↓</kbd> navigate</span>
                <span><kbd>↵</kbd> select</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
