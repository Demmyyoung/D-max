import React, { useState } from 'react';
import StudioHeader from './StudioHeader';
import Canvas from './Canvas';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import SlashMenu from './SlashMenu';
import './Studio.css';

const StudioLayout = () => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false); // Closed by default
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false); // Closed by default

  return (
    <div className="studio-wrapper">
      <StudioHeader />
      <SlashMenu />
      <div className="studio-layout">
        <LeftSidebar 
          isOpen={leftSidebarOpen} 
          onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)} 
        />
        <Canvas />
        <RightSidebar 
          isOpen={rightSidebarOpen} 
          onToggle={() => setRightSidebarOpen(!rightSidebarOpen)} 
        />
      </div>
    </div>
  );
};

export default StudioLayout;
