import React, { useState } from 'react';
import StudioHeader from './StudioHeader';
import KonvaCanvas from './KonvaCanvas';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import SlashMenu from './SlashMenu';
import CommandPalette from './CommandPalette';
import './Studio.css';

const StudioLayout = () => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false); // Closed by default
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false); // Closed by default

  return (
    <div className="studio-wrapper">
      <StudioHeader />
      <SlashMenu />
      <CommandPalette />
      <div className="studio-layout">
        <LeftSidebar 
          isOpen={leftSidebarOpen} 
          onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)} 
        />
        <KonvaCanvas />
        <RightSidebar 
          isOpen={rightSidebarOpen} 
          onToggle={() => setRightSidebarOpen(!rightSidebarOpen)} 
        />
      </div>
    </div>
  );
};

export default StudioLayout;

