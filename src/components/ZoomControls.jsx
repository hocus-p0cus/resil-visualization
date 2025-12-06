import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from './icons';
import { IconButton } from './ui/IconButton';

export const ZoomControls = ({ onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className="absolute top-4 right-4 lg:top-6 lg:right-6 flex flex-col gap-2">
      <IconButton icon={ZoomIn} onClick={onZoomIn} title="Zoom In" />
      <IconButton icon={ZoomOut} onClick={onZoomOut} title="Zoom Out" />
      <IconButton icon={Maximize2} onClick={onReset} title="Reset View" />
    </div>
  );
};