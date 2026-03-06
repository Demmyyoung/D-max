import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Copy, MoveUp, MoveDown } from 'lucide-react';
import { useDesignStore } from '../../store/useDesignStore';

const FloatingToolbar = ({ selectedId }) => {
  const blocks = useDesignStore((state) => state.blocks);
  const deleteBlock = useDesignStore((state) => state.deleteBlock);
  const duplicateBlock = useDesignStore((state) => state.duplicateBlock);
  const moveBlockUp = useDesignStore((state) => state.moveBlockUp);
  const moveBlockDown = useDesignStore((state) => state.moveBlockDown);
  
  const selectedBlock = blocks.find(b => b.id === selectedId);

  return (
    <AnimatePresence>
      {selectedBlock && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: 'absolute',
            left: selectedBlock.x,
            top: selectedBlock.y - 50, // 50px above the block
            zIndex: 1000,
            display: 'flex',
            gap: '4px',
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '6px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            pointerEvents: 'auto'
          }}
        >
          <button 
            onClick={() => duplicateBlock(selectedId)}
            className="toolbar-btn"
            title="Duplicate"
            style={{ padding: '6px', color: 'white', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px', display: 'flex' }}
          >
            <Copy size={16} />
          </button>
          <button 
            onClick={() => moveBlockUp(selectedId)}
            className="toolbar-btn"
            title="Bring Forward"
            style={{ padding: '6px', color: 'white', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px', display: 'flex' }}
          >
            <MoveUp size={16} />
          </button>
          <button 
            onClick={() => moveBlockDown(selectedId)}
            className="toolbar-btn"
            title="Send Backward"
            style={{ padding: '6px', color: 'white', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px', display: 'flex' }}
          >
            <MoveDown size={16} />
          </button>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
          <button 
            onClick={() => deleteBlock(selectedId)}
            className="toolbar-btn danger"
            title="Delete"
            style={{ padding: '6px', color: '#ff4d4d', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px', display: 'flex' }}
          >
            <Trash2 size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingToolbar;
