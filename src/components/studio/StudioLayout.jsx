import React from 'react';
import StudioHeader from './StudioHeader';
import BigCanvas from './BigCanvas';
import FloatingAddButton from './FloatingAddButton';
import './Studio.css';

const StudioLayout = () => {
  return (
    <div className="studio-wrapper">
      <StudioHeader />
      <div className="studio-layout">
        <BigCanvas />
        <FloatingAddButton />
      </div>
    </div>
  );
};

export default StudioLayout;

