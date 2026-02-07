import React from 'react';
import { StudioProvider } from '../context/StudioContext';
import StudioLayout from '../components/studio/StudioLayout';

const Studio = () => {
  return (
    <StudioProvider>
       <StudioLayout />
    </StudioProvider>
  );
};

export default Studio;
