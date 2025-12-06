import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from './icons_index';

export const ZoomControls = ({ onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="p-2 bg-slate-800/80 backdrop-blur rounded hover:bg-slate-700"
        title="Zoom In"
      >
        <ZoomIn size={20} />
      </button>
      <button
        onClick={onZoomOut}
        className="p-2 bg-slate-800/80 backdrop-blur rounded hover:bg-slate-700"
        title="Zoom Out"
      >
        <ZoomOut size={20} />
      </button>
      <button
        onClick={onReset}
        className="p-2 bg-slate-800/80 backdrop-blur rounded hover:bg-slate-700"
        title="Reset View"
      >
        <Maximize2 size={20} />
      </button>
    </div>
  );
};