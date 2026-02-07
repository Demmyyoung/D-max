import React, { createContext, useContext, useState, useCallback } from 'react';

const StudioContext = createContext();

export const StudioProvider = ({ children }) => {
  const [activeGarment, setActiveGarment] = useState({
    id: 't-shirt',
    name: 'Classic T-Shirt',
    color: '#FFFFFF',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1780&auto=format&fit=crop'
  });
  
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  
  // Undo/Redo Stacks
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  
  const saveToHistory = useCallback((currentLayers) => {
    setHistory(prev => [...prev, currentLayers]);
    setFuture([]); // Clear future on new action
  }, []);

  const addLayer = useCallback((layer) => {
    saveToHistory(layers);
    const newLayer = {
      ...layer,
      id: `layer-${Date.now()}`,
      x: 150,
      y: 150,
      scale: 1,
      rotation: 0,
      opacity: 100,
      color: layer.color || '#000000',
      fontSize: layer.fontSize || 32,
      fontFamily: layer.fontFamily || 'Inter'
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  }, [layers, saveToHistory]);

  const updateLayer = useCallback((id, updates) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);
  
  const deleteLayer = useCallback((id) => {
    saveToHistory(layers);
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  }, [layers, selectedLayerId, saveToHistory]);
  
  const selectLayer = useCallback((id) => setSelectedLayerId(id), []);
  const deselectAll = useCallback(() => setSelectedLayerId(null), []);
  
  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture(prev => [layers, ...prev]);
    setLayers(previous);
    setHistory(prev => prev.slice(0, -1));
  }, [history, layers]);
  
  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(prev => [...prev, layers]);
    setLayers(next);
    setFuture(prev => prev.slice(1));
  }, [future, layers]);
  
  const clearAll = useCallback(() => {
    saveToHistory(layers);
    setLayers([]);
    setSelectedLayerId(null);
  }, [layers, saveToHistory]);

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <StudioContext.Provider value={{
      activeGarment, 
      setActiveGarment,
      layers,
      addLayer,
      updateLayer,
      deleteLayer,
      selectedLayerId,
      selectLayer,
      deselectAll,
      selectedLayer,
      undo,
      redo,
      clearAll,
      canUndo: history.length > 0,
      canRedo: future.length > 0
    }}>
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => useContext(StudioContext);
