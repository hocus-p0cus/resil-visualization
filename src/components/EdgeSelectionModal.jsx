import React from 'react';
import { Button } from './ui/Button';

export const EdgeSelectionModal = ({ 
  edgeOptions, 
  hoveredNode,
  onSelectEdge, 
  onClose
}) => {
  // Don't show if no options or if hovering a node
  if (hoveredNode || edgeOptions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Small centered selection box */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                      bg-slate-800 border border-slate-600 rounded-lg shadow-2xl
                      z-50 max-w-sm w-full mx-4">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Select an edge</h3>
          <Button 
            variant="close" 
            size="icon"
            onClick={onClose}
            className="text-2xl leading-none"
          >
            ×
          </Button>
        </div>

        <div className="p-3 max-h-80 overflow-y-auto">
          {edgeOptions.map((edge, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-3 py-2 mb-2 rounded-md border border-slate-700 hover:border-blue-500 hover:bg-slate-700/40 transition-colors cursor-pointer"
              onClick={() => onSelectEdge(edge)}
            >
              <span className="font-medium">
                {edge.from.split('-')[0]} → {edge.to.split('-')[0]}
              </span>
              <span className="text-xs text-slate-400">
                {edge.type === 'resil' ? 'Resilient' : 'Non-resilient'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};